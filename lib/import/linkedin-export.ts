import { unzipSync, strFromU8 } from "fflate";
import type { ImportedProfile } from "./profile";

/**
 * Reads LinkedIn's "Get a copy of your data" archive in the browser.
 *
 * LinkedIn's API only exposes name, email and photo to apps without a partner
 * agreement, but every member can download their own data as a ZIP of CSV
 * files. That archive has the profile, positions, skills and projects, so it
 * is the reliable, terms-compliant way to import a LinkedIn profile.
 */

const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024;
const WANTED = /^(?:.*\/)?(profile|positions|skills|projects|email addresses|education|certifications|honors|publications)\.csv$/i;

/** RFC 4180 CSV parsing: quoted fields may contain commas, quotes ("") and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((cells) => cells.some((cell) => cell.trim()));
}

/** Turns CSV rows into objects. Some exports start with a "Notes:" preamble, so the header is found by a known column. */
function records(text: string, headerColumn: string): Array<Record<string, string>> {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  const headerIndex = rows.findIndex((cells) => cells.some((cell) => cell.trim().toLowerCase() === headerColumn.toLowerCase()));
  if (headerIndex < 0) return [];
  const header = rows[headerIndex].map((cell) => cell.trim());
  return rows.slice(headerIndex + 1).map((cells) => Object.fromEntries(header.map((name, index) => [name, (cells[index] ?? "").trim()])));
}

/** LinkedIn dates look like "Mar 2021", "2021" or "03/2021"; kept as month and year when given. */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function linkedInDate(value?: string): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  const numeric = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (numeric) return `${MONTHS[Number(numeric[1]) - 1] ?? ""} ${numeric[2]}`.trim();
  const named = raw.match(/^([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{4})$/);
  if (named) return `${named[1]![0]!.toUpperCase()}${named[1]!.slice(1).toLowerCase()} ${named[2]}`;
  return raw.match(/\d{4}/)?.[0] ?? raw;
}
/** For sorting: "Mar 2021" → 2021.17. */
const when = (value?: string) => { const date = linkedInDate(value); const y = Number(date.match(/\d{4}/)?.[0] ?? 0); const m = MONTHS.indexOf(date.slice(0, 3)); return y + (m >= 0 ? (m + 1) / 13 : 0); };

/** Profile.csv "Websites" looks like "[PORTFOLIO:https://ada.dev,OTHER:https://x.y]" (or plain URLs). */
function websites(value: string): { label: string; url: string }[] {
  const LABEL: Record<string, string> = { PORTFOLIO: "Portfolio", PERSONAL: "Website", COMPANY: "Company", BLOG: "Blog", RSS: "Feed", OTHER: "Website" };
  return [...value.matchAll(/(?:([A-Z]+):)?(https?:\/\/[^\s,\]]+)/g)].map((match) => ({ label: LABEL[match[1] ?? ""] ?? "Website", url: match[2]! }));
}

export async function readLinkedInExport(file: File): Promise<ImportedProfile> {
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error("That archive is larger than 50 MB. Request just Profile, Positions and Skills from LinkedIn.");
  const isZip = file.name.toLowerCase().endsWith(".zip");
  const files: Record<string, string> = {};
  if (isZip) {
    const archive = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter: (entry) => WANTED.test(entry.name) });
    for (const [name, bytes] of Object.entries(archive)) files[name.split("/").pop()!.toLowerCase()] = strFromU8(bytes);
  } else if (WANTED.test(file.name)) {
    files[file.name.toLowerCase()] = await file.text();
  } else {
    throw new Error("Choose the ZIP file LinkedIn emailed you (or one of its CSV files).");
  }
  if (!Object.keys(files).length) throw new Error("This doesn’t look like a LinkedIn data export. It should contain Profile.csv and Positions.csv.");

  const profile = records(files["profile.csv"] ?? "", "First Name")[0];
  const positions = records(files["positions.csv"] ?? "", "Company Name");
  const skills = records(files["skills.csv"] ?? "", "Name").map((row) => row.Name).filter(Boolean);
  const projects = records(files["projects.csv"] ?? "", "Title");
  const emails = records(files["email addresses.csv"] ?? "", "Email Address");
  const email = emails.find((row) => row.Primary?.toLowerCase() === "yes")?.["Email Address"] ?? emails[0]?.["Email Address"];
  const sites = websites(profile?.Websites ?? "");
  const github = sites.find((site) => /github\.com\//i.test(site.url))?.url;
  const summary = profile?.Summary?.split(/\n\s*\n|\n(?=\s*[•\-–]\s)/).map((paragraph) => paragraph.replace(/\s+/g, " ").trim()).filter(Boolean);
  const education = records(files["education.csv"] ?? "", "School Name");
  const certifications = records(files["certifications.csv"] ?? "", "Name");
  const honors = records(files["honors.csv"] ?? "", "Title");
  const publications = records(files["publications.csv"] ?? "", "Name");
  // Current roles first, then newest start date.
  positions.sort((a, b) => Number(Boolean(a["Finished On"])) - Number(Boolean(b["Finished On"])) || when(b["Started On"]) - when(a["Started On"]));

  return {
    name: [profile?.["First Name"], profile?.["Last Name"]].filter(Boolean).join(" "),
    professional_title: profile?.Headline,
    location: profile?.["Geo Location"],
    summary,
    email,
    github,
    skills,
    experience: positions.map((row) => ({
      job_title: row.Title,
      company: row["Company Name"],
      location: row.Location,
      start_date: linkedInDate(row["Started On"]),
      end_date: row["Finished On"] ? linkedInDate(row["Finished On"]) : "Present",
      description: row.Description,
      technologies: [],
    })),
    projects: projects.map((row) => ({ title: row.Title, description: row.Description, live_url: row.Url, technologies: [] })),
    education: education.map((row) => ({ school: row["School Name"], degree: row["Degree Name"], start_date: linkedInDate(row["Start Date"]), end_date: linkedInDate(row["End Date"]), description: [row.Notes, row.Activities].filter(Boolean).join(" ") })),
    highlights: [
      ...certifications.map((row) => ({ title: row.Name, detail: row.Authority ?? "", year: linkedInDate(row["Started On"]).match(/\d{4}/)?.[0] ?? "", url: row.Url ?? "" })),
      ...honors.map((row) => ({ title: row.Title, detail: row.Description ?? "", year: linkedInDate(row["Issued On"]).match(/\d{4}/)?.[0] ?? "", url: "" })),
      ...publications.map((row) => ({ title: row.Name, detail: row.Publisher ?? "", year: linkedInDate(row["Published On"]).match(/\d{4}/)?.[0] ?? "", url: row.Url ?? "" })),
    ].filter((item) => item.title),
    links: sites.filter((site) => site.url !== github),
  };
}
