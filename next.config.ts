import type { NextConfig } from "next";
import path from "path";

// When built by the GitHub Actions workflow, GITHUB_REPOSITORY is set to
// "owner/repo". GitHub Pages serves project sites at
// https://owner.github.io/repo/, so every asset URL needs that "/repo"
// prefix baked in at build time. Locally (npm run dev / npm run build
// without that env var) basePath is empty, so the app still works normally.
// If you deploy to a repo named "owner.github.io" (a user/org site served at
// the domain root), GitHub Pages needs no prefix — this is handled below too.
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserOrgPagesRepo = repo.endsWith(".github.io");
const basePath = repo && !isUserOrgPagesRepo ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  // Exposes basePath to client-side code (see src/lib/basePath.ts) — Next
  // only rewrites basePath into framework-generated URLs automatically, not
  // into plain strings your own code uses to fetch public/ files directly.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      "@mediapipe/pose": "./src/stubs/empty.js",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@mediapipe/pose": path.resolve(__dirname, "src/stubs/empty.js"),
    };
    return config;
  },
};

export default nextConfig;