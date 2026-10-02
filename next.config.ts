/** @type {import('next').NextConfig} */
const nextConfig = {
  // A self-contained server build (.next/standalone) for the Docker image and plain-Node hosting.
  output: "standalone",
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
