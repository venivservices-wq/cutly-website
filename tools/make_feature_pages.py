# Writes one page per feature of the Features menu into public/features/.
# Only features the Cutly editor really has are here: when the app loses or gains a feature, change PAGES and run again:
#   python tools/make_feature_pages.py
# (the menu links live in public/content.js; every page here uses the shared header and footer from chrome.js)
from pathlib import Path
from html import escape

OUT = Path(__file__).resolve().parent.parent / 'public' / 'features'

# slug, menu title, one-line summary, picture, [(section heading, paragraph)], [bullets]
PAGES = [
    ('cut-mistakes', 'Cut Mistakes',
     'Cutly automatically cuts retakes, filler words, and long pauses.',
     'feature-1.webp',
     [('Start with a clean first edit',
       'Upload a video of you talking. Cutly cuts out retakes, filler words, and long pauses, then puts the parts you want to keep together.'),
      ('Keep the last complete take',
       'Said the same line a few times? Cutly keeps the last complete take and removes the earlier tries.'),
      ('Make it yours',
       'You can see every cut in the editor. Use the timeline or transcript to bring a part back, cut more, or ask Cutly to make a change.')],
     ['Retakes and false starts', 'Filler words and stutters', 'Pauses and stretches with no speech', 'Smooth J-cuts between clips']),
    ('edit-with-comments', 'Edit with Comments',
     'Leave a comment at any moment in your video, and let AI make the change.',
     'feature-5.webp',
     [('Say what you want, right where it happens',
       'Play your video and pause where you want something changed. Write a comment and Cutly pins it to that moment.'),
      ('One run for all your comments',
       'Add as many comments as you like, then run the AI once. Cutly works through all your open comments and marks each one as done when it makes the change.'),
      ('Commands for quick changes',
       'Make a cut, add a zoom or sound, turn captions on or off, or undo or redo an edit to fine-tune the final edit even further.')],
     ['Comments pinned to a moment', 'Many comments, one AI run', '/ commands for quick changes', 'Undo and redo']),
    ('edit-with-text', 'Edit with Text',
     'Delete or bring back words in your transcript, and the changes are reflected in your video.',
     'feature-6.webp',
     [('Edit your video like a document',
       'The Transcript tab shows everything you say. Select words and delete them, and that part of the video is cut. Bring words back the same way.'),
      ('Style your words',
       'Make a word bold, italic or underlined from the transcript. The styling shows in your captions too.'),
      ('Always in sync',
       'The video, the timeline and the transcript are one edit, so a change in any of them shows in the other two.')],
     ['Delete and restore words', 'Bold, italic and underline', 'Works together with the timeline']),
    ('edit-using-the-timeline', 'Edit Using the Timeline',
     'Take full control of your edits. Drag, trim and fine-tune every clip exactly how you want.',
     'feature-7.webp',
     [('Trim any clip',
       'Double-click a clip to select it, then drag its edges. Drag in to cut more, or drag out to bring back what was cut.'),
      ('Add zooms and sounds where you want',
       'Right-click any spot on the timeline to add a zoom or a sound effect.'),
      ('Check every cut',
       'Select a clip and press Space to play just that part, so you can check each cut before you move on.')],
     ['Drag the edges of a clip to trim', 'Select, move and delete zooms, sounds and pictures', 'Zoom the timeline in and out', 'Basic and Pro views']),
    ('auto-captions', 'Auto Captions',
     'Cutly writes your captions for you, and lets you choose from over 45 styles.',
     'page-editor.webp',
     [('Pick a look',
       'Choose from over 45 caption styles. Filter by category or search by name, and your captions change straight away.'),
      ('Make it your own',
       'Change the font, size, colours, box, outline and shadow, or make single words bold, italic or underlined.'),
      ('Make every word pop',
       'Highlight the word being said with a colour, a box or a bigger size, so viewers keep reading along.')],
     ['Timed to your speech', 'Edit them from the transcript', 'Drag to reposition', 'Burned into the video, or as an SRT file']),
    ('caption-styles', 'Caption Styles',
     'Pick a look for your captions from a library of ready-made styles.',
     'page-captions.webp',
     [('A library of looks',
       'Open the styles window and browse the looks as cards. Filter by category or search by name, then pick one and your captions change.'),
      ('Make it yours',
       'A style sets the look, and the size and position stay yours. Open the advanced settings to change colours, the box, the outline and more.'),
      ('Highlight the word being said',
       'Some styles mark the word that is being said as it is spoken, to keep viewers watching.')],
     ['47 ready-made looks', 'Categories and search', 'Your own size and position', 'Advanced settings for every detail']),
    ('custom-styles', 'Custom Styles',
     'Style your own captions and set your own preferences for cuts, sound effects and more.',
     'feature-4.webp',
     [('Save your style',
       'Choose your caption look, cut style, video length and how many zooms and sound effects you want. Add notes for the AI, and it follows them on every edit.'),
      ('Use your style',
       'New videos are edited with your preset from the very first cut, so there is nothing to set up each time.'),
      ('Change it any time',
       'Update your preset whenever your style changes, or change a single video without touching your preset.')],
     ['Save your caption look', 'Choose your cut style', 'Set zoom and sound amounts', 'Notes for the AI']),
    ('zooms-and-sound-effects', 'Zooms and Sound Effects',
     'AI understands your video and adds zooms and sound effects that keep viewers watching.',
     'feature-2.webp',
     [('Zooms where they count',
       'Cutly zooms in when you show a product or say something important.'),
      ('Sounds that fit',
       'Cutly looks through our sound library and picks the sound that best fits each moment.'),
      ('Adjust the frequency',
       'Adjust how often zooms and sounds appear to better fit your style.')],
     ['Zoom in, zoom out and punch zooms', 'A built-in sound effect library', 'Choose how many you want', 'Add or remove them on the timeline']),
    ('overlays-and-b-roll', 'Overlays and B-roll',
     'Add images and B-roll over your footage, and let AI suggest the moments to place them.',
     'feature-3.webp',
     [('Upload with your video',
       'Upload an overlay or B-roll together with your video.'),
      ('Let AI place them',
       'Let AI choose where to place your overlays.'),
      ('Keep control',
       'Change their position, size and more by hand in seconds.')],
     ['Images and videos over your footage', 'Hook text with your pick of style', 'Move, resize and fade', 'AI suggestions for where to add them']),
]

# Pages kept here but not made or linked for now (the owner, 2026-11-22). Also take them out of the menu in public/content.js.
HIDDEN = {'caption-styles'}

CATEGORY = {
    'cut-mistakes': 'Cut', 'edit-with-comments': 'Cut', 'edit-with-text': 'Cut', 'edit-using-the-timeline': 'Cut',
    'auto-captions': 'Style', 'caption-styles': 'Style', 'custom-styles': 'Style',
    'zooms-and-sound-effects': 'Polish', 'overlays-and-b-roll': 'Polish',
}

# What you get (bullets) and More from Cutly were taken off the pages for now (owner, 2026-11-22); the bullets stay in PAGES.
# A feature page is its own landing page, like the home page: the hero (text left, the picture right, near its home-page size), how it works in
# three cards, what you get as chips, and the other features.
TEMPLATE = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} | Cutly AI</title>
  <meta name="description" content="{summary}">
  <link rel="icon" href="../favicon.ico" sizes="any"><link rel="icon" type="image/png" href="../favicon.png"><link rel="apple-touch-icon" href="../apple-touch-icon.png">
  <link rel="stylesheet" href="../inter.css">
  <link rel="stylesheet" href="../styles.css?v=228">
  <link rel="stylesheet" href="../decor.css?v=9">
  <link rel="stylesheet" href="feature.css?v=3">
</head>
<body>

<header class="site-header" id="top"></header>

<main>
  <div class="page-clip">
  <div class="hero-wash">
    <div class="hero-flow" aria-hidden="true"><div class="aurora"></div></div>
    <div class="hero-glow" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="deco" aria-hidden="true"><i class="deco-shape t-mid soft d-hero-a"></i><i class="deco-shape s-tri t-faint d-hero-b wide-only"></i><i class="deco-shape s-pill t-strong d-hero-c wide-only"></i><i class="deco-plus d-hero-plus"></i></div>
    <section class="hero page fp-hero">
      <div class="fp-copy">
      <p class="hero-badge"><b>{category}</b></p>
      <h1>{title}</h1>
      <p class="hero-sub"><span>{summary}</span></p>
      <div class="hero-cta">
        <a class="btn btn-lg btn-primary btn-go" href="../index.html#pricing">Start today<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
        <a class="btn btn-lg btn-ghost btn-go" href="../index.html#tools">All features<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
      </div>
      </div>
      <div class="fp-shot"><img src="../assets/features/{picture}" alt="" width="1240" height="776"></div>
    </section>
  </div>

  <section class="block page fp-how">
    <div class="center-head"><h2>How it works.</h2></div>
    <div class="fp-steps">
{steps}
    </div>
  </section>

  <section class="block page" id="start">
    <div class="cta-band">
      <div class="cta-glow" aria-hidden="true"><i></i><i></i><i></i></div>
      <h2>Stop editing.<span>Start posting.</span></h2>
      <a class="btn btn-lg cta-main" href="../index.html#pricing">Get started<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M8.5 4l4 4-4 4"/></svg></a>
    </div>
  </section>
  </div>
</main>

<footer class="site-footer" id="siteFooter"></footer>

<script>window.NAV_BASE = '../';</script>
<script src="../content.js?v=86"></script>
<script src="../chrome.js?v=11"></script>
<script>
  var h = document.querySelector('.site-header');
  function s() {{ h.classList.toggle('scrolled', window.scrollY > 8); }}
  addEventListener('scroll', s, {{ passive: true }}); s();
</script>
</body>
</html>
'''


def main():
    OUT.mkdir(exist_ok=True)
    PAGES[:] = [pg for pg in PAGES if pg[0] not in HIDDEN]
    for n, (slug, title, summary, picture, sections, bullets) in enumerate(PAGES):
        steps = '\n'.join(
            f'      <article class="fp-step"><span class="fp-num">0{i + 1}</span><h3>{escape(h)}</h3><p>{escape(p)}</p></article>'
            for i, (h, p) in enumerate(sections))
        chips = '\n'.join(f'      <li>{escape(b)}</li>' for b in bullets)
        others = [PAGES[(n + k) % len(PAGES)] for k in (1, 2, 3)]
        more = '\n'.join(
            f'      <a class="fp-card" href="{o[0]}.html"><span>{CATEGORY[o[0]]}</span><b>{escape(o[1])}</b><p>{escape(o[2])}</p></a>'
            for o in others)
        page = TEMPLATE.format(title=escape(title), summary=escape(summary, quote=True), picture=picture, category=CATEGORY[slug],
                               steps=steps, bullets=chips, more=more)
        (OUT / f'{slug}.html').write_text(page, encoding='utf-8')
        print('wrote', slug)


main()
