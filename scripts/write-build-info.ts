import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const pkgPath = path.join(rootDir, "package.json");

const readPackageVersion = () => {
  try {
    const raw = fs.readFileSync(pkgPath, "utf8");
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? null;
  } catch {
    return null;
  }
};

const resolveCommit = () => {
  const envCommit = process.env.GIT_COMMIT?.trim() || process.env.GIT_SHA?.trim();
  if (envCommit) return envCommit;
  try {
    return execSync("git rev-parse HEAD", {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
};

const version = readPackageVersion();
const commit = resolveCommit();

const buildInfo = {
  version,
  commit,
  builtAt: new Date().toISOString(),
};

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(
  path.join(distDir, "build-info.json"),
  `${JSON.stringify(buildInfo, null, 2)}\n`,
);

// Ensure entry.js exists (tsdown generates entry.mjs, but openclaw.mjs expects entry.js)
const entryMjs = path.join(distDir, "entry.mjs");
const entryJs = path.join(distDir, "entry.js");
if (fs.existsSync(entryMjs) && !fs.existsSync(entryJs)) {
  fs.copyFileSync(entryMjs, entryJs);
  fs.chmodSync(entryJs, 0o755);
}
