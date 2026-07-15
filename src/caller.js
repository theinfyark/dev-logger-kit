import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_SRC = path.dirname(fileURLToPath(import.meta.url));

/**
 * Find the first caller frame outside this package.
 * @param {number} [offset=0]
 * @returns {{ file: string, line: number | null, column: number | null, raw: string }}
 */
export function getCaller(offset = 0) {
  const err = new Error();
  const lines = (err.stack || "").split("\n").slice(1);

  let skipped = 0;
  for (const line of lines) {
    const match =
      line.match(/\((.*):(\d+):(\d+)\)/) ||
      line.match(/at (.*):(\d+):(\d+)/);

    if (!match) continue;

    let file = match[1];
    if (file.startsWith("file://")) {
      try {
        file = fileURLToPath(file);
      } catch {
        // keep as-is
      }
    }

    // Skip Node internals and this package's own source files.
    if (
      file.startsWith("node:") ||
      file.includes(`${path.sep}node:`) ||
      file.startsWith(PACKAGE_SRC + path.sep) ||
      file === PACKAGE_SRC
    ) {
      continue;
    }

    if (skipped < offset) {
      skipped += 1;
      continue;
    }

    return {
      file: path.basename(file),
      line: Number(match[2]),
      column: Number(match[3]),
      raw: file,
    };
  }

  return { file: "unknown", line: null, column: null, raw: "unknown" };
}

/**
 * Format an Error stack, optionally colored/dimmed.
 * @param {unknown} err
 * @returns {string}
 */
export function formatStack(err) {
  if (!err) return "";
  if (err instanceof Error) return err.stack || err.message;
  if (typeof err === "object" && err && "stack" in err) {
    return String(/** @type {{ stack?: string }} */ (err).stack);
  }
  return "";
}
