import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Free AI voice clone: text to speech in your own voice";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Bar heights for the drawn waveform (a fixed pattern, so the card is the same every time). */
const WAVE = [
  18, 34, 52, 30, 70, 44, 88, 60, 96, 72, 50, 82, 40, 64, 92, 56, 36, 74, 48, 28, 58, 80, 42, 24, 46, 66, 32,
  20,
];

/** The card shown when /tools/voice is shared on WhatsApp, X, LinkedIn or Facebook. */
export default async function VoiceOpenGraphImage() {
  // Satori needs a static (non-variable) font; the same Fraunces cut as the site's main card.
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
        background: "#15140f",
        color: "#f4f0e8",
        padding: "64px 80px",
        fontFamily: font ? "Fraunces" : "serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 34 }}>
        <span>kitefolio</span>
        <span
          style={{
            display: "flex",
            fontSize: 26,
            background: "#10b981",
            color: "#06281d",
            padding: "8px 22px",
            borderRadius: 999,
          }}
        >
          Free
        </span>
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1, letterSpacing: -2 }}
      >
        <span>Clone your voice.</span>
        <span style={{ color: "#10b981", fontStyle: "italic" }}>Type anything.</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 100 }}>
          {WAVE.map((height, index) => (
            <div
              key={index}
              style={{ width: 12, height, background: "#f4f0e8", opacity: 0.85, borderRadius: 6 }}
            />
          ))}
        </div>
        <span style={{ fontSize: 30, opacity: 0.75 }}>kitefolio.com/tools/voice</span>
      </div>
    </div>,
    {
      ...size,
      fonts: font ? [{ name: "Fraunces", data: font, style: "normal", weight: 400 }] : [],
    },
  );
}
