import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

  // ✅ ESLintエラーをビルド時に無視する
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone",   
};



export default nextConfig;


