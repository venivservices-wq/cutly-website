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
shutil.copy(app / 'static' / 'panel-style.css', out / 'panel-style.css')   # the right-hand panels' look
# The demo is always the desktop editor, scaled down (the login window shows it 820 px wide, exactly where the app's phone
# layout starts). mobile.css still holds desktop rules (it hides the phone pieces), so it is copied with its phone-width
# rules switched off: every "@media (max-width: ...)" becomes one no window matches.
phone = (app / 'static' / 'mobile.css').read_text(encoding='utf-8')
phone = re.sub(r'@media \(max-width: \d+px\)', '@media (max-width: 0px)', phone)
(out / 'mobile.css').write_text(phone, encoding='utf-8')
# The hero on phones (demo.js ?phone) loads the app's real phone layout on top: the unchanged copy
shutil.copy(app / 'static' / 'mobile.css', out / 'mobile-phone.css')
shutil.copy(app / 'static' / 'cutly-logo.png', out / 'cutly-logo.png')
shutil.copy(app / 'static' / 'help-lauren.jpg', out / 'help-lauren.jpg')   # the picture in the New project page's blog cards
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
# The app's version on every local file, so a visitor's browser fetches the new copy after a refresh, never an old cached one
ver = (app / 'VERSION').read_text(encoding='utf-8').strip()
html = re.sub(r'(href|src)="([a-z0-9-]+\.(?:css|js))(?:\?v=[^"]*)?"', rf'\1="\2?v={ver}"', html)
# the demo script changes on its own schedule (not with the app), so it has its own cache number
html = html.replace(f'demo.js?v={ver}', f'demo.js?v={ver}-w18').replace(f'demo-only.css?v={ver}', f'demo-only.css?v={ver}-w9')
(out / 'index.html').write_text(html, encoding='utf-8')

# The caption looks (the Captions style window's cards) as data: the app's own list, run once here, so the demo draws the same looks
import json, subprocess
js = (app / 'static' / 'app.js').read_text(encoding='utf-8').splitlines()
base = next(i for i, l in enumerate(js) if l.startswith('const LOOK_BASE ='))
base_end = next(i for i in range(base, base + 8) if js[i].rstrip().endswith('};'))
first = next(i for i, l in enumerate(js) if l.startswith('const SOFT ='))
last = next(i for i in range(first, len(js)) if js[i].startswith('].map(') and 'values' in js[i])
src = chr(10).join(js[base:base_end + 1] + js[first:last + 1]) + chr(10) + 'process.stdout.write(JSON.stringify({ base: LOOK_BASE, looks: CAPTION_TEMPLATES.filter((t) => !t.hidden) }));'
out_json = subprocess.run(['node', '-e', src], capture_output=True, text=True, check=True).stdout
(out / 'caption-looks.json').write_text(out_json, encoding='utf-8')
shutil.copy(app / 'fonts' / 'TikTokSans-SemiBold.ttf', out / 'fonts' / 'TikTokSans-SemiBold.ttf')   # the sample text in the style window
print('copied the app UI')
