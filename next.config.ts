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
