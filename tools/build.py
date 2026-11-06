# Copies the real editor UI into public/app-demo, so the demo on the site always looks exactly like the app.
# Run again after the app's design changes:  python tools/build.py
# (it reads the app from the sibling folder "Cutly Video Editor" on the owner's PC; the result is committed like any other change)
import re
import shutil
from pathlib import Path

here = Path(__file__).parent
out = here.parent / 'public' / 'app-demo'
app = here.parent.parent / 'Cutly Video Editor' / 'app'

shutil.copy(app / 'static' / 'style.css', out / 'style.css')
shutil.copy(app / 'static' / 'vlance-logo.png', out / 'cutly-logo.png')
shutil.copy(app / 'static' / 'cutly-logo.svg', out / 'cutly-logo.svg')
(out / 'fonts').mkdir(exist_ok=True)
for name in ('TikTokSans-Bold.ttf', 'TikTokSans-OFL.txt'):
    shutil.copy(app / 'fonts' / name, out / 'fonts' / name)

html = (app / 'static' / 'index.html').read_text(encoding='utf-8')
html = re.sub(r'<link rel="icon"[^>]*>\n', '', html)
html = html.replace('/static/', '').replace('Vlance', 'Cutly')
html = re.sub(r'<script src="[^"]*"></script>\n', '', html)
# Admin-only button: never part of the public demo
html = re.sub(r'  <button class="train-btn[^\n]*\n', '', html)
html = html.replace('</head>', '<link rel="stylesheet" href="demo-only.css">\n</head>')
html = html.replace('</body>', '<script src="demo.js"></script>\n</body>')
(out / 'index.html').write_text(html, encoding='utf-8')
print('copied the app UI')
