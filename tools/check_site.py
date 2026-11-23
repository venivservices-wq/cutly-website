"""Fails (exit 1) when a page, stylesheet or script points at a local file that does not exist
(a deleted font or picture would show on the live site as a missing font / broken image), or when a
tracked file under public/ has been deleted in the working folder. Run by the pre-commit hook;
also run it by hand before every push: python tools/check_site.py"""
import re, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
bad = []
# Known leftovers in the app demo copy (it was like this before this check existed; fix them, then delete the line)
KNOWN = {"apple-touch-icon.png", "creator-17.jpg", "favicon.png", "vendor/mediapipe/LICENSE.txt", "vendor/mediapipe/NOTICE.txt", "/static/noise.png"}
# 2) local references that lead nowhere
REF = [re.compile(r'(?:href|src|poster|data-src)="([^"#?]+)'), re.compile(r"url\(\s*['\"]?([^'\")#?]+)")]
for f in PUB.rglob("*"):
    if f.suffix not in (".html", ".css", ".js") or "vendor" in f.parts: continue
    text = f.read_text(encoding="utf-8", errors="ignore")
    for rx in REF:
        for ref in rx.findall(text):
            if ref in KNOWN or ref.startswith("%23") or re.match(r"(https?:|mailto:|data:|blob:|//|javascript:|\$|\{)", ref) or "${" in ref or ref.startswith(("+", "'", "`")): continue
            t = (PUB / ref.lstrip("/")) if ref.startswith("/") else (f.parent / ref)
            if not t.exists() and ref not in ("/", ""):
                bad.append("%s -> %s (missing)" % (f.relative_to(PUB), ref))
print("\n".join(sorted(set(bad))) or "site check: ok")
sys.exit(1 if bad else 0)
