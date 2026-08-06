import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001",
    NEXT_PUBLIC_TWOGIS_API_KEY: process.env.NEXT_PUBLIC_TWOGIS_API_KEY ?? "",
  },
};

export default nextConfig;
