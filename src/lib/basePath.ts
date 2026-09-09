// Next.js automatically rewrites basePath into framework-generated URLs
// (page routes, next/image, next/script, JS/CSS chunks) — but it does NOT
// rewrite plain strings in your own code, like the "/models/foo.stl" paths
// used to fetch files from public/ directly (fetch(), STLLoader, useGLTF,
// <img src>, etc). Those need the prefix added manually, which is what this
// helper is for.
//
// NEXT_PUBLIC_BASE_PATH is set from next.config.ts's `env` field, so its
// value is baked into the client bundle at build time and matches whatever
// basePath GitHub Pages needs for the current repo.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}