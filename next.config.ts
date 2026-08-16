import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "minio.aymahajan.in" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "172.19.0.3" },
    ],
  },
  allowedDevOrigins: ["localhost", "kinds-aluminium-rebecca-gmbh.trycloudflare.com"],
};

export default nextConfig;
