import type { NextConfig } from "next";

const repo = "ntd-gurd";
const isPages = process.env.GITHUB_PAGES === "true";
const basePath = isPages ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  turbopack: { root: process.cwd() },
  ...(isPages ? { basePath, assetPrefix: `${basePath}/` } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? basePath,
  },
};

export default nextConfig;
