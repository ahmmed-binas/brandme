/** @type {import('next').NextConfig} */
const nextConfig = {
  // A self-contained server build (.next/standalone) for the Docker image and plain-Node hosting.
  output: "standalone",
  // Files read at runtime that the bundler can't see (the social card's font).
  outputFileTracingIncludes: {
    "/opengraph-image": ["./node_modules/@fontsource/fraunces/files/fraunces-latin-400-normal.woff"],
    // Free template downloads are zipped from the templates' own source at request time.
    "/api/templates/[templateId]/download": ["./components/templates/studio/**/*", "./package.json", "./public/samples/**/*"],
  },
  // Security headers on every response. Script-level CSP needs per-request nonces and is
  // left for later; these block framing, MIME sniffing, plugins and cross-site form posts.
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=31536000" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
      ],
    }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
