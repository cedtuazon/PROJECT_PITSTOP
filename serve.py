#!/usr/bin/env python3
"""No-cache static file server for local dev (plain http.server caches stale HTML/JS)."""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = HTTPServer(("127.0.0.1", port), NoCacheHandler)
    print(f"Serving on http://localhost:{port} (no-cache)")
    server.serve_forever()
