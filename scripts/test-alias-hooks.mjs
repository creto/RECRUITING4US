import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function resolveTs(base) {
  if (isFile(base)) return base;
  for (const ext of [".ts", ".tsx", ".mjs", ".js"]) {
    if (isFile(base + ext)) return base + ext;
  }
  if (isFile(join(base, "index.ts"))) return join(base, "index.ts");
  return "";
}

export async function resolve(specifier, context, nextResolve) {
  const relative = specifier.startsWith("./") || specifier.startsWith("../");
  const bareTs = relative && !/\.(tsx?|mjs|cjs|js|json)$/.test(specifier);
  if (!specifier.startsWith("@/") && !bareTs) return nextResolve(specifier, context);
  const parent = context.parentURL ? fileURLToPath(context.parentURL) : src;
  const base = specifier.startsWith("@/") ? join(src, specifier.slice(2)) : join(dirname(parent), specifier);
  const found = resolveTs(base);
  if (!found) return nextResolve(specifier, context);
  return nextResolve(pathToFileURL(found).href, context);
}
