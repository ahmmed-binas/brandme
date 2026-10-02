import localFont from "next/font/local";

/*
 * Self-hosted variable fonts (from @fontsource-variable): no requests to
 * third-party font CDNs, and next/font adds size-matched fallbacks so text
 * doesn't jump when the fonts arrive.
 */

/** Fraunces — display serif with optical sizing; large settings get finer detail automatically. */
export const display = localFont({
  src: [
    { path: "../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2", style: "normal", weight: "100 900" },
    { path: "../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-italic.woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--ff-display",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/** Hanken Grotesk — text face. */
export const sans = localFont({
  src: [{ path: "../node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2", style: "normal", weight: "100 900" }],
  variable: "--ff-text",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});

/** JetBrains Mono — labels, addresses, numbers. */
export const mono = localFont({
  src: [{ path: "../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2", style: "normal", weight: "100 800" }],
  variable: "--ff-code",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});
