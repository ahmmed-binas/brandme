/**
 * fileExtraction.js
 *
 * Utilities for extracting text/data from uploaded files (txt/csv/json, pdf,
 * docx, xlsx, images) and lightly parsing resume-like content out of it.
 *
 * Production notes vs. the original version:
 *  - PDFs try native text extraction first and only fall back to OCR when the
 *    page has no (or negligible) text layer. This avoids running Tesseract on
 *    every page of a normal, text-based PDF.
 *  - A single Tesseract worker is created and reused for all pages/images in
 *    one extraction call, then terminated — instead of spinning up a new
 *    worker per `recognize()` call.
 *  - Debug logging goes through `log()`, which is a no-op unless `DEBUG` is
 *    enabled, instead of raw `console.log`.
 *  - File size/type are validated up front, and every public entry point
 *    throws a typed, descriptive `FileExtractionError` instead of leaking
 *    library-specific errors.
 *  - `extractExcel` can target a specific sheet and can also return all
 *    sheets when needed.
 */

import mammoth from "mammoth";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { createWorker } from "tesseract.js";

import { GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// ---------------------------------------------------------------------------
// Config / logging
// ---------------------------------------------------------------------------

export const CONFIG = {
  DEBUG: false,
  MAX_FILE_SIZE_MB: 25,
  OCR_LANGUAGE: "eng",
  PDF_RENDER_SCALE: 2,
  // A PDF page with fewer than this many non-whitespace characters in its
  // native text layer is treated as "no text" and sent to OCR instead.
  MIN_NATIVE_TEXT_CHARS: 10,
  // Many resume templates put contact info in a dark/colored card with
  // light text. Tesseract is trained mostly on dark-text-on-light-background
  // documents and frequently drops or mangles light-text-on-dark regions.
  // Running OCR a second time on a color-inverted copy of the same image
  // recovers that text, at the cost of roughly doubling OCR time per page.
  OCR_DUAL_PASS_INVERT: true,
};

function log(...args) {
  if (CONFIG.DEBUG) console.log("[fileExtraction]", ...args);
}

export class FileExtractionError extends Error {
  constructor(message, { cause, code } = {}) {
    super(message);
    this.name = "FileExtractionError";
    this.code = code || "EXTRACTION_FAILED";
    if (cause) this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// File type helpers
// ---------------------------------------------------------------------------

const EXTENSION_MAP = {
  txt: "text",
  csv: "text",
  json: "text",
  pdf: "pdf",
  docx: "docx",
  xlsx: "xlsx",
  png: "image",
  jpg: "image",
  jpeg: "image",
};

export function getFileType(file) {
  if (!file || !file.name || !file.name.includes(".")) return "unknown";
  const ext = file.name.split(".").pop().toLowerCase();
  return EXTENSION_MAP[ext] || "unknown";
}

function validateFile(file) {
  if (!(file instanceof File || file instanceof Blob)) {
    throw new FileExtractionError("Expected a File or Blob.", {
      code: "INVALID_INPUT",
    });
  }
  const maxBytes = CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new FileExtractionError(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
        `Max allowed is ${CONFIG.MAX_FILE_SIZE_MB}MB.`,
      { code: "FILE_TOO_LARGE" }
    );
  }
}

// ---------------------------------------------------------------------------
// Plain text files
// ---------------------------------------------------------------------------

export function extractTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(
        new FileExtractionError("Failed to read text file.", {
          cause: reader.error,
          code: "TEXT_READ_FAILED",
        })
      );
    reader.readAsText(file);
  });
}

// ---------------------------------------------------------------------------
// Shared OCR worker management
// ---------------------------------------------------------------------------

/**
 * Creates a Tesseract worker for the given language. Caller is responsible
 * for calling `worker.terminate()` when done.
 */
async function createOcrWorker(language = CONFIG.OCR_LANGUAGE) {
  try {
    return await createWorker(language);
  } catch (err) {
    throw new FileExtractionError("Failed to initialize OCR engine.", {
      cause: err,
      code: "OCR_INIT_FAILED",
    });
  }
}

async function recognizeWithWorker(worker, image, onProgress) {
  const { data } = await worker.recognize(image, {}, { text: true });
  if (typeof onProgress === "function") onProgress(1);
  return data?.text || "";
}

/**
 * Returns a new canvas with inverted colors. Used to recover light-colored
 * text on dark backgrounds (e.g. a resume's contact-info sidebar), which
 * Tesseract otherwise frequently drops or garbles.
 */
function invertCanvasColors(sourceCanvas) {
  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(sourceCanvas, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Runs OCR on an image, and optionally a second pass on a color-inverted
 * copy, concatenating both results. The inverted pass recovers light text
 * on dark backgrounds that the normal pass tends to miss.
 */async function recognizeWithDualPass(worker, canvas, onProgress) {
  const normalText = await recognizeWithWorker(worker, canvas);

  if (!CONFIG.OCR_DUAL_PASS_INVERT) {
    if (onProgress) onProgress(1);
    return normalText;
  }

  const invertedCanvas = invertCanvasColors(canvas);

  let invertedText = "";
  try {
    invertedText = await recognizeWithWorker(worker, invertedCanvas);
  } finally {
    invertedCanvas.width = 0;
    invertedCanvas.height = 0;
  }

  if (onProgress) onProgress(1);

  return [normalText, invertedText].filter(Boolean).join("\n");
}

// ---------------------------------------------------------------------------
// PDF extraction (native text first, OCR fallback)
// ---------------------------------------------------------------------------

/**
 * Attempts to read the native text layer of a single PDF page.
 * Returns "" if the page has no usable text layer.
 */
async function extractNativePageText(page) {
  const content = await page.getTextContent();
  const items = content.items;
  if (!items.length) return "";

  // pdf.js gives each text fragment with no inherent line breaks. Group
  // fragments into lines by y-coordinate (item.transform[5]) so that
  // downstream logic that depends on "first line = name" etc. actually works.
  const Y_TOLERANCE = 2;
  const lines = [];
  let currentLine = [];
  let lastY = null;

  for (const item of items) {
    const y = item.transform[5];
    if (lastY !== null && Math.abs(y - lastY) > Y_TOLERANCE) {
      lines.push(currentLine.join(" ").replace(/\s+/g, " ").trim());
      currentLine = [];
    }
    currentLine.push(item.str);
    lastY = y;
  }
  if (currentLine.length) {
    lines.push(currentLine.join(" ").replace(/\s+/g, " ").trim());
  }

  return lines.filter(Boolean).join("\n");
}

/**
 * Renders a PDF page to a canvas and returns it, for OCR fallback.
 * Cleans itself up (caller should also null out references after use).
 */
async function renderPageToCanvas(page, scale) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

/**
 * Extracts text from a PDF, using the native text layer where available and
 * falling back to OCR page-by-page otherwise. A single OCR worker is reused
 * across all pages that need it.
 *
 * @param {File|Blob} file
 * @param {(progress: number) => void} [onProgress] progress in [0, 1]
 */
export async function extractPDF(file, onProgress) {
  validateFile(file);

  let pdf;
  try {
    const arrayBuffer = await file.arrayBuffer();
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    throw new FileExtractionError("Failed to open PDF.", {
      cause: err,
      code: "PDF_OPEN_FAILED",
    });
  }

  const totalPages = pdf.numPages;
  const pageTexts = new Array(totalPages).fill("");
  let ocrWorker = null;

  try {
    for (let i = 0; i < totalPages; i++) {
      const page = await pdf.getPage(i + 1);
      const nativeText = await extractNativePageText(page);

      if (nativeText.replace(/\s/g, "").length >= CONFIG.MIN_NATIVE_TEXT_CHARS) {
        pageTexts[i] = nativeText;
        log(`Page ${i + 1}: used native text layer`);
      } else {
        log(`Page ${i + 1}: no usable text layer, falling back to OCR`);
        if (!ocrWorker) ocrWorker = await createOcrWorker();

        const canvas = await renderPageToCanvas(page, CONFIG.PDF_RENDER_SCALE);
        try {
          pageTexts[i] = await recognizeWithDualPass(ocrWorker, canvas);
        } finally {
          // Free canvas memory promptly instead of waiting on GC.
          canvas.width = 0;
          canvas.height = 0;
        }
      }

      if (typeof onProgress === "function") {
        onProgress((i + 1) / totalPages);
      }
    }
  } catch (err) {
    if (err instanceof FileExtractionError) throw err;
    throw new FileExtractionError("Failed to extract text from PDF.", {
      cause: err,
      code: "PDF_EXTRACTION_FAILED",
    });
  } finally {
    if (ocrWorker) await ocrWorker.terminate();
  }

  return pageTexts.join("\n");
}

// Backward-compatible name, in case other code imports this directly.
// Now goes through the native-text-first path instead of forcing OCR always.
export const extractPDFWithOCR = extractPDF;

// ---------------------------------------------------------------------------
// DOCX / XLSX
// ---------------------------------------------------------------------------

/**
 * mammoth.extractRawText only converts the main document body — it does not
 * read headers or footers. Many Word CV templates put the name/contact
 * block (email, phone, LinkedIn) in a header so it repeats on every page,
 * which means that info can be silently missing from mammoth's output.
 *
 * This pulls the raw <w:t> text out of every header*.xml and footer*.xml
 * part in the .docx (which is just a zip archive), so that content isn't
 * lost even though mammoth doesn't see it.
 */
async function extractHeaderFooterText(arrayBuffer) {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);

    const partNames = Object.keys(zip.files).filter((name) =>
      /^word\/(header|footer)\d*\.xml$/i.test(name)
    );
    if (partNames.length === 0) return "";

    const xmlParts = await Promise.all(
      partNames.map((name) => zip.file(name).async("text"))
    );

    return xmlParts.map(extractTextFromDocxXml).filter(Boolean).join("\n");
  } catch (err) {
    // Best-effort supplement only — never fail the whole extraction because
    // of this.
    log("Header/footer extraction skipped:", err.message);
    return "";
  }
}

/**
 * Extracts readable text from a raw docx XML part (header/footer/etc).
 * Runs (<w:t>) within the same paragraph (<w:p>) are concatenated with NO
 * separator, since Word frequently splits a single word — including emails
 * and phone numbers — across multiple runs (e.g. due to spellcheck or
 * manual formatting). Only paragraph boundaries introduce a line break.
 */
function extractTextFromDocxXml(xml) {
  const paragraphs = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
  return paragraphs
    .map((p) =>
      [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
        .map((m) => decodeXmlEntities(m[1]))
        .join("")
    )
    .filter(Boolean)
    .join("\n");
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export async function extractDocx(file) {
  validateFile(file);
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const bodyText = result.value;

    // Supplement with header/footer text, which mammoth doesn't include.
    // Re-read the file for this since some environments detach/consume the
    // buffer passed into mammoth.
    const headerFooterBuffer = await file.arrayBuffer();
    const headerFooterText = await extractHeaderFooterText(headerFooterBuffer);

    if (headerFooterText) {
      return `${bodyText}\n\n${headerFooterText}`;
    }
    return bodyText;
  } catch (err) {
    throw new FileExtractionError("Failed to extract DOCX content.", {
      cause: err,
      code: "DOCX_EXTRACTION_FAILED",
    });
  }
}

/**
 * @param {File|Blob} file
 * @param {{ sheet?: string|number, allSheets?: boolean }} [options]
 *   sheet: sheet name or 0-based index to read (defaults to the first sheet)
 *   allSheets: if true, returns { [sheetName]: rows[] } for every sheet
 */
export async function extractExcel(file, options = {}) {
  validateFile(file);
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    if (options.allSheets) {
      const result = {};
      for (const name of workbook.SheetNames) {
        result[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
          header: 1,
        });
      }
      return result;
    }

    const sheetName =
      typeof options.sheet === "string"
        ? options.sheet
        : workbook.SheetNames[options.sheet ?? 0];

    if (!sheetName || !workbook.Sheets[sheetName]) {
      throw new FileExtractionError(`Sheet not found: ${options.sheet}`, {
        code: "SHEET_NOT_FOUND",
      });
    }

    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
    });
  } catch (err) {
    if (err instanceof FileExtractionError) throw err;
    throw new FileExtractionError("Failed to extract XLSX content.", {
      cause: err,
      code: "XLSX_EXTRACTION_FAILED",
    });
  }
}

// ---------------------------------------------------------------------------
// Images (OCR)
// ---------------------------------------------------------------------------

export async function extractImageText(file, onProgress) {
  validateFile(file);
  let worker;
  try {
    worker = await createOcrWorker();
    const canvas = await fileToCanvas(file);
    try {
      return await recognizeWithDualPass(worker, canvas, onProgress);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  } catch (err) {
    if (err instanceof FileExtractionError) throw err;
    throw new FileExtractionError("Failed to OCR image.", {
      cause: err,
      code: "IMAGE_OCR_FAILED",
    });
  } finally {
    if (worker) await worker.terminate();
  }
}

async function fileToCanvas(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  return canvas;
}

// ---------------------------------------------------------------------------
// Top-level dispatcher
// ---------------------------------------------------------------------------

/**
 * @param {File|Blob} file
 * @param {(progress: number) => void} [onProgress]
 */
export async function extractFileContent(file, onProgress) {
  validateFile(file);
  const type = getFileType(file);

  log(`Detected file type: ${type}`);

  switch (type) {
    case "text":
      return extractTextFile(file);
    case "pdf":
      return extractPDF(file, onProgress);
    case "docx":
      return extractDocx(file);
    case "xlsx":
      return extractExcel(file);
    case "image":
      return extractImageText(file, onProgress);
    default:
      throw new FileExtractionError(
        `Unsupported file type for "${file.name}".`,
        { code: "UNSUPPORTED_FILE_TYPE" }
      );
  }
}

// ---------------------------------------------------------------------------
// OCR text cleanup
// ---------------------------------------------------------------------------

const SECTION_HEADINGS = [
  "NAME",
  "DOB",
  "EMAIL",
  "PHONE",
  "SUMMARY",
  "TECHNICAL SKILLS",
  "PROFESSIONAL EXPERIENCE",
  "EDUCATION",
  "ADDITIONAL INFORMATION",
  "CERTIFICATIONS",
];

export function cleanOCRText(rawText) {
  if (!rawText) return "";
  let text = rawText;

  // Remove common scanner/OCR artifacts.
  text = text.replace(/scanned with\s*[@\w]+/gi, "");
  text = text.replace(/[|\\•*]+/g, " ");
  text = text.replace(/[@©]/g, " ");

  // Normalize line breaks & whitespace.
  text = text.replace(/\r\n?/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/[ \t]+/g, " ");

  // Fix common OCR ligatures.
  text = text
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/ﬀ/g, "ff")
    .replace(/ﬃ/g, "ffi")
    .replace(/ﬄ/g, "ffl");

  // Recover missing spaces.
  text = text.replace(/([a-z])([A-Z])/g, "$1 $2");
  text = text.replace(/([a-zA-Z])(\d)/g, "$1 $2");
  text = text.replace(/(\d)([a-zA-Z])/g, "$1 $2");

  // Normalize section headings (attach a missing space after them).
  for (const heading of SECTION_HEADINGS) {
    const re = new RegExp(`${heading}([A-Z0-9])`, "gi");
    text = text.replace(re, `${heading} $1`);
  }

  text = text.replace(/ *\n */g, "\n");
  return text.trim();
}

// ---------------------------------------------------------------------------
// Section chunking
// ---------------------------------------------------------------------------

const SECTION_KEYWORDS = {
  personal: ["personal details", "bio", "about"],
  education: ["education", "educational background"],
  experience: ["experience", "employment", "work history"],
  skills: ["skills", "strengths", "abilities"],
  references: ["references", "referees"],
};

export function chunkIntoSections(cleanedText) {
  if (!cleanedText) return {};

  const lines = cleanedText.split("\n").map((l) => l.trim().toLowerCase());
  const sections = { misc: [] };
  let currentSection = "misc";

  for (const rawLine of lines) {
    let line = rawLine;

    for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
      if (keywords.some((k) => line.includes(k))) {
        currentSection = section;
        if (!sections[currentSection]) sections[currentSection] = [];
        line = ""; // drop the header itself
      }
    }

    if (line) sections[currentSection].push(line);
  }

  const joined = {};
  for (const key in sections) {
    joined[key] = sections[key].join(" ");
  }
  return joined;
}

// ---------------------------------------------------------------------------
// Contact / section extraction (regex-based, best-effort)
// ---------------------------------------------------------------------------

const CATEGORY_HEADINGS = {
  name: ["name", "applicant", "full name"],
  email: ["email"],
  phone: ["phone", "contact"],
  skills: ["skills", "technical skills", "special abilities"],
  education: ["education", "education background", "training courses"],
  experience: ["experience", "employment record", "professional experience"],
};

export function categorizeOCRText(ocrText) {
  if (!ocrText) return {};

  if (typeof ocrText === "object") {
    const result = {};
    for (const key in ocrText) {
      result[key] = String(ocrText[key]);
    }
    return result;
  }

  if (typeof ocrText !== "string") {
    throw new TypeError("Invalid OCR text type");
  }

  const text = ocrText.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ");

  const extractSection = (heading, nextHeadings = []) => {
    const nextRegex = nextHeadings.length
      ? `(?=${nextHeadings.join("|")})`
      : "(?=$)";
    const re = new RegExp(`${heading}:?\\s*([\\s\\S]*?)${nextRegex}`, "i");
    return text.match(re)?.[1]?.trim() || null;
  };

  const result = { raw: ocrText };

  for (const key in CATEGORY_HEADINGS) {
    const nextKeys = Object.keys(CATEGORY_HEADINGS)
      .filter((k) => k !== key)
      .flatMap((k) => CATEGORY_HEADINGS[k]);
    result[key] = extractSection(CATEGORY_HEADINGS[key].join("|"), nextKeys);
  }

  result.name = result.name
    ? result.name.split("\n")[0].trim()
    : extractName(text);

  result.email =
    text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] || null;
  result.phone = extractPhoneNumber(text);
  result.linkedin = extractLinkedIn(text);
  result.github = extractGithub(text);

  return result;
}

/**
 * LinkedIn (and sometimes GitHub) slugs often end in a numeric ID that gets
 * appended automatically when the plain vanity name is taken, e.g.
 * "ahmmed-binas-832616221". That trailing "-<digits>" is not part of the
 * person's name, so it's stripped before turning the slug into a display name.
 */
function slugToName(slug) {
  const withoutTrailingId = slug.replace(/(-\d+)+$/, "");
  return withoutTrailingId
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractName(text) {
  const signals = [];

  // 1. Email signal (strong).
  const email = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0];
  if (email) {
    const emailName = email
      .split("@")[0]
      .replace(/[0-9]/g, "")
      .replace(/[._-]+/g, " ")
      .trim();
    if (emailName.length >= 3) signals.push(emailName);
  }

  // 2. LinkedIn signal (strongest human identifier).
  const linkedin = text.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
  if (linkedin) {
    const name = slugToName(linkedin[1]);
    if (name) signals.push(name);
  }

  // 3. GitHub signal.
  const github = text.match(/github\.com\/([a-zA-Z0-9-]+)/i);
  if (github) {
    const name = slugToName(github[1]);
    if (name) signals.push(name);
  }

  // 4. Header lines heuristic (first few non-email, non-numeric lines).
  const lines = text.split("\n");
  for (const line of lines.slice(0, 8)) {
    if (line.includes("@") || /\d{3,}/.test(line)) continue;
    const cleaned = line
      .replace(/[^a-zA-Z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.split(" ").length >= 2 && cleaned.length < 40) {
      signals.push(cleaned);
    }
  }

  const normalized = signals.map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (normalized.length === 0) return "";

  // Priority: LinkedIn > email > best cleaned header line.
  const emailSig = normalized.find((s) => s.includes(" "));
  const linkedinSig = normalized.find((s) => !s.includes("@") && s.length > 2);
  return linkedinSig || emailSig || normalized[0];
}

/**
 * Removes URLs and email addresses from text. LinkedIn/GitHub URLs in
 * particular often contain long digit runs (auto-appended numeric IDs) that
 * would otherwise get misread as phone numbers.
 */
function stripUrlsAndEmails(text) {
  return text
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/(?:www\.)?linkedin\.com\/\S+/gi, " ")
    .replace(/(?:www\.)?github\.com\/\S+/gi, " ")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi, " ");
}

function extractLinkedIn(text) {
  const m = text.match(/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
  return m ? `linkedin.com/in/${m[1]}` : null;
}

function extractGithub(text) {
  const m = text.match(/(?:www\.)?github\.com\/([a-zA-Z0-9-]+)/i);
  return m ? `github.com/${m[1]}` : null;
}



/**
 * Extracts a phone number with label-anchoring first (much higher
 * precision than a blind global scan), falling back to a scored search
 * over the whole text only if no labeled number is found.
 */
function extractPhoneNumber(rawText) {
  const text = stripUrlsAndEmails(rawText);

  // 1. Label-anchored search — "Phone:", "Mobile:", "Contact:", "Tel:", "Cell:"
  //    This is where a real phone number lives on almost every resume, so
  //    check it before ever touching the rest of the document.
  const labelRegex = /(?:phone|mobile|contact(?:\s*(?:no|number))?|tel|cell)\s*[:.\-]?\s*(\+?\d[\d\s\-().]{7,18}\d)/gi;
  const labeled = [...text.matchAll(labelRegex)]
    .map((m) => normalizePhone(m[1]))
    .filter(isPlausiblePhone);
  if (labeled.length) return labeled[0];

  // 2. Fallback: scan all digit runs in the document, score candidates,
  //    and only accept ones that plausibly look like phone numbers.
  const candidates = [...text.matchAll(/(\+?\d{1,3}[-\s]?)?\d{9,12}/g)]
    .map((m) => normalizePhone(m[0]))
    .filter(isPlausiblePhone);

  if (!candidates.length) return null;

  // Prefer numbers with an explicit country code (+...) — far less likely
  // to be a coincidental ID/zip/date-range match.
  candidates.sort((a, b) => (b.startsWith("+") ? 1 : 0) - (a.startsWith("+") ? 1 : 0));
  return candidates[0];
}

/**
 * Rejects digit sequences that are shaped like a phone number but are
 * almost certainly something else — e.g. two years glued together from a
 * stripped date range ("2020" + "2024" -> "20202024"), or a run of
 * identical/sequential digits that's more likely an ID or placeholder.
 */
function isPlausiblePhone(str) {
  if (!str) return false;
  const digits = str.replace(/[^\d]/g, "");
  if (digits.length < 9 || digits.length > 15) return false;

  // Two 4-digit years back-to-back, e.g. "20202024", "20182022".
  if (/^(19|20)\d{2}(19|20)\d{2}$/.test(digits)) return false;

  // All identical digits ("0000000000") or a simple ascending/descending
  // run ("123456789") — essentially never a real phone number.
  if (/^(\d)\1+$/.test(digits)) return false;
  if ("0123456789".includes(digits) || "9876543210".includes(digits)) return false;

  return true;
}


export function extractOCRJSON(ocrText) {
  if (!ocrText) return {};

  const text = ocrText.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();

  let email = null;
  const emailMatches = text.match(
    /\b[A-Za-z0-9._%+-]+\s*@?\s*[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
  );
  if (emailMatches?.length) email = normalizeEmail(emailMatches[0]);

  const linkedin = extractLinkedIn(text);
  const github = extractGithub(text);

  // Search for the phone number in a copy of the text with URLs and emails
  // removed, so digit runs from a LinkedIn/GitHub slug (or an email like
  // "user123@...") can't be mistaken for a phone number.
  const phone = extractPhoneNumber(text);

let name = null;
for (const line of text.split("\n")) {
  const cleanLine = line.trim();

  // Title Case: "Haris Kaliyanathoppu"
  if (/^([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})$/.test(cleanLine)) {
    name = cleanLine;
    break;
  }

  // ALL CAPS: "HARIS KALIYANATHOPPU PARAMBU" — common resume header style
  if (/^([A-Z]+(?:\s[A-Z]+){1,3})$/.test(cleanLine) && cleanLine.length <= 40) {
    name = cleanLine
      .split(" ")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ");
    break;
  }
}

  const skillsMatch = text.match(
    /(skills|technical skills|special abilities)\s*[:\n]\s*([\s\S]*?)(?=(education|experience|$))/i
  );
  const skills = skillsMatch ? skillsMatch[2].trim() : null;

  const educationMatch = text.match(
    /(education|education background|training courses)\s*[:\n]\s*([\s\S]*?)(?=(experience|skills|$))/i
  );
  const education = educationMatch ? educationMatch[2].trim() : null;

  let institutions = null;
  if (education) {
    const instRegex =
      /\b(?:University|College|Institute|School|Academy)\s+of\s+[A-Z][A-Za-z]+|\b[A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*\s+(University|College|Institute|School|Academy)\b/g;
    const matches = education.match(instRegex);
    if (matches?.length) institutions = matches;
  }

  const experienceMatch = text.match(
    /(experience|employment record|professional experience)\s*[:\n]\s*([\s\S]*?)(?=(education|skills|$))/i
  );
  const experience = experienceMatch ? experienceMatch[2].trim() : null;

  return {
    name,
    email,
    phone,
    linkedin,
    github,
    address: null, // no reliable pattern to extract this yet
    skills,
    education,
    institutions,
    experience,
    raw: ocrText,
  };
}

function normalizeEmail(text) {
  if (!text) return null;
  const t = text.toLowerCase().trim();

  let m = t.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
  if (m) return m[0];

  m = t.match(/([a-z0-9._%+-]+)\s+([a-z0-9.-]+\.[a-z]{2,})/);
  if (m) return `${m[1]}@${m[2]}`;

  m = t.match(/([a-z0-9._%+-]+)(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)/);
  if (m) return `${m[1]}@${m[2]}`;

  return null;
}

function normalizePhone(text) {
  if (!text) return null;
  const m = text.match(/\+?\d[\d\s-]{7,}/);
  return m ? m[0].replace(/[^\d+]/g, "") : null;
}