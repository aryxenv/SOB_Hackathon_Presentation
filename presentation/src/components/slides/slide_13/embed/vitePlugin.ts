import { createReadStream, statSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const PHONE_APP_URL_PREFIX = "/phone-app/";
const PHONE_APP_OUTPUT_DIR = "phone-app";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_DIST_DIR = path.resolve(__dirname, "web-dist");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function safeJoin(root: string, requestedRelative: string): string | null {
  const normalized = path.normalize(requestedRelative).replace(/^[/\\]+/, "");
  const resolved = path.resolve(root, normalized);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
    return null;
  }
  return resolved;
}

function resolveFile(targetPath: string): string | null {
  try {
    const stat = statSync(targetPath);
    if (stat.isDirectory()) {
      const indexPath = path.join(targetPath, "index.html");
      const indexStat = statSync(indexPath);
      if (indexStat.isFile()) return indexPath;
      return null;
    }
    if (stat.isFile()) return targetPath;
    return null;
  } catch {
    return null;
  }
}

async function walk(dir: string, base: string = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full, base)));
    } else if (entry.isFile()) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

export function phoneAppPlugin(): Plugin {
  return {
    name: "slide-13-phone-app",
    apply: () => true,

    configureServer(server) {
      server.middlewares.use(PHONE_APP_URL_PREFIX, (req, res, next) => {
        if (!req.url) return next();

        // Strip query string and decode.
        const rawUrl = req.url.split("?")[0];
        let requested: string;
        try {
          requested = decodeURIComponent(rawUrl);
        } catch {
          requested = rawUrl;
        }

        const relative = requested === "" || requested === "/" ? "" : requested;
        const candidate = safeJoin(WEB_DIST_DIR, relative);
        if (!candidate) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        const resolved = resolveFile(candidate);
        if (!resolved) return next();

        const ext = path.extname(resolved).toLowerCase();
        const mime = MIME_TYPES[ext] ?? "application/octet-stream";
        res.statusCode = 200;
        res.setHeader("Content-Type", mime);
        // The vendored snapshot is static; bust cache on every dev request so
        // refreshing the snapshot on disk is visible after a reload.
        res.setHeader("Cache-Control", "no-cache");
        createReadStream(resolved).pipe(res);
      });
    },

    async generateBundle() {
      const files = await walk(WEB_DIST_DIR);
      for (const rel of files) {
        const abs = path.join(WEB_DIST_DIR, rel);
        const source = await readFile(abs);
        // Normalize separators to forward slash for the bundle output path.
        const outPath = path.posix.join(PHONE_APP_OUTPUT_DIR, rel.split(path.sep).join("/"));
        this.emitFile({
          type: "asset",
          fileName: outPath,
          source,
        });
      }
    },
  };
}
