import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const alt = `${brand.name}: portfolios at your own address`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The social card shown when the site is shared, set in the same type as the site. */
export default async function OpenGraphImage() {
  // Satori needs static (non-variable) TTF/OTF/WOFF; Fraunces' static WOFF cut ships in the same package.
  const font = await readFile(join(process.cwd(), "node_modules/@fontsource/fraunces/files/fraunces-latin-400-normal.woff")).catch(() => null);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f4f0e8", color: "#15140f", padding: "72px 80px", fontFamily: font ? "Fraunces" : "serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40 }}><svg viewBox="0 0 48 48" width="56" height="56"><rect x="12" y="12" width="24" height="24" fill="none" stroke="#15140f" strokeWidth="3" /><rect x="12" y="12" width="24" height="24" fill="none" stroke="#c4851c" strokeWidth="3" transform="rotate(45 24 24)" /><circle cx="24" cy="24" r="3" fill="#15140f" /></svg>fuccura</div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 104, lineHeight: 0.95, letterSpacing: -3 }}>
        <span>Your work,</span>
        <span style={{ display: "flex" }}>at&nbsp;<span style={{ color: "#2338e0", fontStyle: "italic" }}>your own</span></span>
        <span>address.</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#57534a", borderTop: "1px solid rgba(21,20,15,0.18)", paddingTop: 24 }}><span>Portfolio builder</span><span>35+ templates · free to start</span></div>
    </div>,
    { ...size, fonts: font ? [{ name: "Fraunces", data: font, style: "normal", weight: 400 }] : [] },
  );
}
