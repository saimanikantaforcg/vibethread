const http = require("http");
const fs = require("fs");
const path = require("path");

/* ── Security headers sent on every response ─────────────────────────────── */
// Note: 'unsafe-inline' in script-src is required because pages use inline
// tailwind.config blocks. Move those to a separate JS file to harden further.
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.c360a.salesforce.com https://cdn.evergage.com https://*.evergage.com",
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "connect-src 'self' https://*.salesforce.com https://*.c360a.salesforce.com https://*.evergage.com",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const SITE_ROOT = path.join(__dirname, "site");

const server = http.createServer((req, res) => {
  let pathname;
  try {
    /* Use WHATWG URL — url.parse() is deprecated and has security implications.
       .pathname keeps percent-encoding (e.g. %20), so we decode it so that
       filenames with spaces (e.g. "VibeThread Logo.jpg") resolve correctly. */
    pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
  } catch (_) {
    res.writeHead(400, {
      "Content-Type": "text/plain; charset=utf-8",
      ...SECURITY_HEADERS,
    });
    res.end("400 Bad Request");
    return;
  }

  /* Resolve and guard against path traversal ─────────────── */
  const filePath = path.normalize(
    path.join(SITE_ROOT, pathname === "/" ? "index.html" : pathname),
  );

  if (!filePath.startsWith(SITE_ROOT + path.sep) && filePath !== SITE_ROOT) {
    res.writeHead(403, {
      "Content-Type": "text/plain; charset=utf-8",
      ...SECURITY_HEADERS,
    });
    res.end("403 Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "text/plain; charset=utf-8";
    res.writeHead(200, { "Content-Type": contentType, ...SECURITY_HEADERS });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
      ...SECURITY_HEADERS,
    });
    res.end("404 Not Found");
  }
});

server.listen(8000, () => {
  console.log("Server running at http://localhost:8000");
});
