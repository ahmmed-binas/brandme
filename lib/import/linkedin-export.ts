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
const WANTED = /^(?:.*\/)?(profile|positions|skills|projects|email addresses)\.csv$/i;

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

/** LinkedIn dates look like "Mar 2021" or "2021". */
const year = (value?: string) => value?.match(/\d{4}/)?.[0] ?? value ?? "";

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
  const websites = profile?.Websites ?? "";
  const github = websites.match(/https?:\/\/(www\.)?github\.com\/[^\s,\]]+/i)?.[0];
  const summary = profile?.Summary?.split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s+/g, " ").trim()).filter(Boolean);

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
      start_date: year(row["Started On"]),
      end_date: row["Finished On"] ? year(row["Finished On"]) : "Present",
      description: row.Description,
      technologies: [],
    })),
    projects: projects.map((row) => ({ title: row.Title, description: row.Description, live_url: row.Url, technologies: [] })),
  };
}
