// Shared sign-in for the Search Console scripts in this folder.
//
// Uses a Google service account (read-only "Restricted" user in Search Console).
// The key file is NOT in the repo: C:\Users\binas\.fuccura\gsc-key.json (or set
// GSC_KEY_FILE).
import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const KEY_FILE = process.env.GSC_KEY_FILE || join(homedir(), ".fuccura", "gsc-key.json");
// A Domain property (verified by DNS) or a URL-prefix property; the first that answers is used.
export const PROPERTIES = ["sc-domain:fuccura.com", "https://fuccura.com/"];

const base64url = (value) => Buffer.from(value).toString("base64url");

export const readKey = async () => JSON.parse(await readFile(KEY_FILE, "utf8"));

/** An access token from the service account key (signed JWT, OAuth 2.0). */
export async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(key.private_key, "base64url");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Google sign-in failed: ${body.error_description ?? body.error}`);
  return body.access_token;
}

/** Calls a Search Console API and returns its JSON, or throws with Google's message. */
export async function call(token, url, body) {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(json.error?.message ?? response.statusText), { status: response.status });
  return json;
}
