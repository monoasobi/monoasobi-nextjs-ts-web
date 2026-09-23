import type { NextConfig } from "next";
import { realpathSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Canonicalize symlinked checkout paths so Turbopack uses one filesystem root.
const nextConfigDir = realpathSync(dirname(fileURLToPath(import.meta.url)));

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: {
    compilationMode: "infer",
  },
  turbopack: {
    root: nextConfigDir,
  },
};

export default nextConfig;
