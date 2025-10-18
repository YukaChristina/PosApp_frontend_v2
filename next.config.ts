import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  // ✅ ESLintエラーをビルド時に無視
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",   
};



export default nextConfig;


