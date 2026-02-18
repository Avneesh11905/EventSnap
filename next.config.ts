import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "minio.aymahajan.in" },
    ],
  },
  allowedDevOrigins: ["localhost", "kinds-aluminium-rebecca-gmbh.trycloudflare.com"],
};

export default nextConfig;
