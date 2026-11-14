"""Local preview that behaves like Cloudflare Pages: /blog/x opens blog/x.html, /blog/ opens blog/index.html.
Run from the website folder:  python tools/serve.py   (http://localhost:5600)"""
import http.server, os, functools
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
class H(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = super().translate_path(path)
        if not os.path.exists(p) and os.path.exists(p + '.html'):
            return p + '.html'
        return p
http.server.ThreadingHTTPServer(('127.0.0.1', 5600), functools.partial(H, directory=ROOT)).serve_forever()
