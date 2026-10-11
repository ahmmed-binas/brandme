import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the star mark on dark. */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#15140f",
      }}
    >
      <svg viewBox="0 0 48 48" width="132" height="132">
        <rect x="13" y="13" width="22" height="22" fill="none" stroke="#f4f0e8" strokeWidth="3" />
        <rect
          x="13"
          y="13"
          width="22"
          height="22"
          fill="none"
          stroke="#e0a43a"
          strokeWidth="3"
          transform="rotate(45 24 24)"
        />
        <circle cx="24" cy="24" r="2.8" fill="#f4f0e8" />
      </svg>
    </div>,
    size,
  );
}
