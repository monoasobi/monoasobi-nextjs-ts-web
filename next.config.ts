import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const nextConfigDir = dirname(fileURLToPath(import.meta.url));

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
