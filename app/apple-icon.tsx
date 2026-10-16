import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the kite mark on dark (same drawing as components/common/Logo.tsx). */
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
      <svg viewBox="0 0 48 48" width="140" height="140">
        <path
          d="M24 1.6 L37.6 15 L24 33.4 L10.4 15 Z"
          fill="none"
          stroke="#f4f0e8"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path d="M23.2 4.4 L13.2 14.2 L23.2 14.2 Z" fill="#e0a43a" />
        <path d="M24.8 4.4 L34.8 14.2 L24.8 14.2 Z" fill="#f4f0e8" />
        <path d="M13.2 15.8 L23.2 15.8 L23.2 30 Z" fill="#f4f0e8" />
        <path d="M24.8 15.8 L34.8 15.8 L24.8 30 Z" fill="#a8742a" />
        <circle cx="24" cy="15" r="1.5" fill="#e0a43a" />
        <path
          d="M24 33.4 C 20.6 36.4, 27.6 38.6, 24.2 41.6 S 27 45, 25.4 47.4"
          fill="none"
          stroke="#f4f0e8"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path d="M20.8 35.6 L23.3 36.9 L20.8 38.2 Z M25.8 35.6 L23.3 36.9 L25.8 38.2 Z" fill="#e0a43a" />
        <path d="M22.1 39.9 L24.6 41.2 L22.1 42.5 Z M27.1 39.9 L24.6 41.2 L27.1 42.5 Z" fill="#a8742a" />
        <path d="M23.7 43.9 L26.1 45.1 L23.7 46.3 Z M28.5 43.9 L26.1 45.1 L28.5 46.3 Z" fill="#e0a43a" />
      </svg>
    </div>,
    size,
  );
}
