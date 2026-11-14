# Remakes the features list's hover images (public/assets/features/feature-N.webp, 1240 x 776) from the real opened rows,
# so the hover preview always matches the picture in the open row. Run after any change to a feature picture:
#   1. serve the site:   python -m http.server 5590 --bind 127.0.0.1   (from public/)
#   2. run:              python tools/hover_images.py
#   3. bump the ?v= number on the image link in public/script.js (and script.js's own ?v= in index.html)
# Needs: pip install playwright pillow, then: python -m playwright install chromium
import asyncio, io
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parent.parent / 'public' / 'assets' / 'features'
URL = 'http://127.0.0.1:5590/'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=3)
        await pg.goto(URL, wait_until='networkidle')
        for i in range(await pg.locator('.tool').count()):
            tool = pg.locator('.tool').nth(i)
            await tool.locator('.tool-head').click()
            await tool.scroll_into_view_if_needed()
            await pg.wait_for_timeout(2500)   # the row opens and its frame loads
            png = await tool.locator('.tool-shot').screenshot()
            Image.open(io.BytesIO(png)).convert('RGB').resize((1240, 776), Image.LANCZOS).save(OUT / f'feature-{i + 1}.webp', quality=82, method=6)
            print('feature', i + 1)
        await b.close()

asyncio.run(main())
