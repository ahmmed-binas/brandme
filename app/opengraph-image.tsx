import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ROLES } from "@/lib/templates/roles";
import { brand } from "@/lib/brand";

export const alt = `${brand.name}: portfolios at your own address`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The social card shown when the site is shared, set in the same type as the site. */
export default async function OpenGraphImage() {
  // Satori needs static (non-variable) TTF/OTF/WOFF; Fraunces' static WOFF cut ships in the same package.
  const font = await readFile(
    join(process.cwd(), "node_modules/@fontsource/fraunces/files/fraunces-latin-400-normal.woff"),
  ).catch(() => null);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f4f0e8",
        color: "#15140f",
        padding: "72px 80px",
        fontFamily: font ? "Fraunces" : "serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40 }}>
        <svg viewBox="0 0 48 48" width="64" height="64">
          <path
            d="M24 1.6 L37.6 15 L24 33.4 L10.4 15 Z"
            fill="none"
            stroke="#15140f"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          <path d="M23.2 4.4 L13.2 14.2 L23.2 14.2 Z" fill="#c4851c" />
          <path d="M24.8 4.4 L34.8 14.2 L24.8 14.2 Z" fill="#15140f" />
          <path d="M13.2 15.8 L23.2 15.8 L23.2 30 Z" fill="#15140f" />
          <path d="M24.8 15.8 L34.8 15.8 L24.8 30 Z" fill="#e8c27a" />
          <circle cx="24" cy="15" r="1.5" fill="#c4851c" />
          <path
            d="M24 33.4 C 20.6 36.4, 27.6 38.6, 24.2 41.6 S 27 45, 25.4 47.4"
            fill="none"
            stroke="#15140f"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path d="M20.8 35.6 L23.3 36.9 L20.8 38.2 Z M25.8 35.6 L23.3 36.9 L25.8 38.2 Z" fill="#c4851c" />
          <path d="M22.1 39.9 L24.6 41.2 L22.1 42.5 Z M27.1 39.9 L24.6 41.2 L27.1 42.5 Z" fill="#e8c27a" />
          <path d="M23.7 43.9 L26.1 45.1 L23.7 46.3 Z M28.5 43.9 L26.1 45.1 L28.5 46.3 Z" fill="#c4851c" />
        </svg>
        kitefolio
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 104,
          lineHeight: 0.95,
          letterSpacing: -3,
        }}
      >
        <span>Your website,</span>
        <span style={{ display: "flex" }}>
          made for&nbsp;<span style={{ color: "#2338e0", fontStyle: "italic" }}>your</span>
        </span>
        <span>job.</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 26,
          color: "#57534a",
          borderTop: "1px solid rgba(21,20,15,0.18)",
          paddingTop: 24,
        }}
      >
        <span>Website builder for professionals</span>
        <span>{ROLES.length} job titles · free to start</span>
      </div>
    </div>,
    { ...size, fonts: font ? [{ name: "Fraunces", data: font, style: "normal", weight: 400 }] : [] },
  );
}
