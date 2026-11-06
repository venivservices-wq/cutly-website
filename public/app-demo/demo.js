// Plays a scripted session on the real editor UI: a cursor sets up an edit, the AI cuts it,
// the user plays it, asks for a change, edits the words and renders. Then it loops.
// The timeline and caption drawing follow app.js in the Video Editor, so they look the same.
(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = (s) => {
    s = Math.max(0, s || 0);
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;
  };
  const credits = (n) => `${n} credit${n === 1 ? '' : 's'}`;
  const PRICES = { edit: 2, ask: 1 };
  const AI_STEPS = ['Watching your video', 'Finding retakes and mistakes', 'Cutting pauses', 'Placing zooms and sounds', 'Checking every cut'];
  const NOTE = 'use the wow sound for the hook';
  const COMMENT = 'Zoom in when she says chopping up clips';
  const PAUSE_AT = 8.6;
  const REPLAY_FROM = 6.6;
  const REPLAY_TO = 10;
  const WISTIA_ID = 'xyco9e53i1';

  // The finished video is 40.4s. Its parts sit in a longer raw take, in source seconds.
  const DURATION = 63.2;
  const KEPT = [[3, 8.6], [11, 17], [19.5, 26.3], [28.8, 33.6], [36, 43.4], [46, 53], [56.2, 59]];
  const ZOOMS = [
    { start: 4.2, end: 6.8, type: 'push', scale: 118 },
    { start: 22.2, end: 24.8, type: 'push', scale: 118 },
    { start: 38.4, end: 41, type: 'push', scale: 115 },
    { start: 48.4, end: 51, type: 'push', scale: 115 }
  ];
  const NEW_ZOOM = { start: 12.6, end: 15, type: 'push', scale: 118 };
  const SOUNDS = [4, 11.6, 22.4, 29.4, 37, 47, 56.8];
  // What's said in the video: [seconds, word]
  const SPOKEN = [[0.4, "Editing"], [0.85, "your"], [1.13, "own"], [1.35, "videos"], [1.75, "is"], [1.92, "probably"], [2.42, "the"], [2.65, "exact"], [2.98, "reason"], [3.38, "you"], [3.6, "aren't"], [4.01, "posting"], [4.47, "consistently."], [5.28, "Doing"], [5.65, "it"], [5.83, "yourself"], [6.39, "takes"], [6.76, "hours"], [7.13, "of"], [7.31, "chopping"], [7.86, "up"], [8.05, "clips,"], [8.48, "and"], [8.68, "paying"], [9.04, "a"], [9.14, "freelancer"], [9.7, "is"], [9.86, "way"], [10.06, "too"], [10.27, "expensive"], [10.78, "when"], [11.03, "you"], [11.23, "are"], [11.44, "trying"], [11.8, "to"], [11.95, "grow."], [12.26, "Just"], [12.59, "throw"], [12.99, "your"], [13.32, "raw"], [13.59, "footage"], [14.12, "into"], [14.46, "Cutly"], [14.86, "instead."], [15.46, "It"], [15.64, "is"], [15.83, "an"], [16.01, "AI"], [16.2, "video"], [16.57, "editor"], [17.0, "that"], [17.31, "does"], [17.62, "the"], [17.86, "entire"], [18.29, "job"], [18.54, "for"], [18.79, "you"], [19.03, "in"], [19.22, "seconds."], [19.77, "You"], [19.99, "need"], [20.26, "zero"], [20.53, "actual"], [20.91, "editing"], [21.35, "skills"], [21.73, "because"], [22.16, "the"], [22.38, "AI"], [22.54, "handles"], [22.98, "all"], [23.19, "the"], [23.41, "annoying"], [23.9, "parts"], [24.23, "automatically."], [25.05, "It"], [25.24, "gives"], [25.63, "you"], [25.89, "perfect"], [26.41, "auto"], [26.73, "cuts,"], [27.12, "adds"], [27.44, "captions,"], [28.09, "throws"], [28.63, "in"], [28.86, "dynamic"], [29.47, "zooms,"], [30.01, "and"], [30.2, "even"], [30.43, "layers"], [30.75, "in"], [30.89, "sound"], [31.17, "effects"], [31.55, "without"], [31.92, "you"], [32.1, "having"], [32.43, "to"], [32.57, "do"], [32.88, "anything."], [33.93, "It"], [34.12, "is"], [34.31, "ridiculously"], [35.14, "cheaper"], [35.65, "than"], [35.97, "hiring"], [36.41, "a"], [36.54, "real"], [36.86, "person."], [37.37, "Get"], [37.6, "your"], [37.89, "weekend"], [38.35, "back"], [38.64, "and"], [38.87, "let"], [39.1, "the"], [39.33, "AI"], [39.5, "do"], [39.68, "the"], [39.91, "heavy"], [40.25, "lifting."]];
  const TAKES_CUT = ['So', 'um', 'Editing', 'your', 'own'];
  const DRAG_WORDS = 1;
  const DRAG_FROM = SPOKEN.findIndex(([, w]) => w === 'actual');

  // The waveform: speech in bursts, quieter inside the parts the AI cuts
  const WAVE = (() => {
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const out = [];
    let burst = 0;
    for (let i = 0; i < DURATION * 50; i++) {
      if (i % 11 === 0) burst = 0.3 + rand() * 0.7;
      if (i % 37 === 0 && rand() < 0.22) burst = 0.05;
      const t = i / 50;
      const kept = KEPT.some(([a, b]) => t >= a && t < b);
      out.push(Math.min(1, burst * (0.55 + rand() * 0.45) * (kept ? 1 : 0.5)));
    }
    return out;
  })();

  const S = { edited: false, zooms: [], sfx: [], kept: [[0, DURATION]], head: 0, pxPerSec: 1, extraCut: 0 };
  // The same sample footage in each, so moving to the next project continues the loop without a jump
  const PROJECTS = ['Cutly promo', 'Cutly promo 2', 'Cutly promo 3'];
  let activeProject = 0;
  let paused = true;
  let cursor;

  /* Time on the edited timeline */
  const editedLength = () => S.kept.reduce((sum, [a, b]) => sum + b - a, 0);
  function srcToTl(sec) {
    let t = 0;
    for (const [a, b] of S.kept) {
      if (sec <= a) return t;
      if (sec < b) return t + sec - a;
      t += b - a;
    }
    return t;
  }
  function tlToSrc(t) {
    let left = t;
    for (const [a, b] of S.kept) {
      if (left < b - a) return a + left;
      left -= b - a;
    }
    return DURATION;
  }

  /* The timeline, as drawTimelineBase in the app */
  const LANE = 36;
  const RULER = 18;
  const canvas = $('timeline');
  const base = document.createElement('canvas');
  const cssColor = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#0a0a0a';

  function drawTimeline() {
    const wrap = $('timelineScroll');
    canvas.style.width = '0';   // so the old drawing can't hold the area open while measuring
    if (!wrap.clientWidth) return;
    const len = editedLength();
    S.pxPerSec = Math.max(4, (wrap.clientWidth - 2 - 32) / len);
    const dpr = window.devicePixelRatio || 1;
    const w = Math.ceil(len * S.pxPerSec);
    const h = Math.max(70, Math.floor(wrap.clientHeight - 14));
    for (const c of [canvas, base]) { c.width = w * dpr; c.height = h * dpr; }
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const g = base.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = cssColor('--track');
    g.fillRect(0, 0, w, h);
    const x = (sec) => srcToTl(sec) * S.pxPerSec;

    const blocks = [];
    let at = 0;
    for (const [a, b] of S.kept) {
      blocks.push([at * S.pxPerSec, (at + b - a) * S.pxPerSec]);
      at += b - a;
    }
    const GAPW = 3;
    blocks.forEach(([a, b], n) => {
      const first = n === 0;
      const last = n === blocks.length - 1;
      const x0 = a + (first ? 1 : GAPW);
      const x1 = b - (last ? 1 : GAPW);
      g.beginPath();
      g.roundRect(x0, LANE + 3, Math.max(2, x1 - x0), h - LANE - RULER - 6, 5);
      g.fillStyle = n % 2 ? 'rgba(255,255,255,0.085)' : 'rgba(255,255,255,0.045)';
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.12)';
      g.lineWidth = 1;
      g.stroke();
      if (!first) {
        g.fillStyle = cssColor('--bg');
        g.fillRect(a - GAPW + 1, LANE, GAPW * 2 - 2, h - LANE - RULER);
      }
    });
    const inGap = (px) => blocks.length > 1 && !blocks.some(([a, b]) => px >= a + GAPW + 1 && px + 2 <= b - GAPW - 1);

    const mid = LANE + (h - LANE - RULER) / 2;
    const amp = (h - LANE - RULER) / 2 - 6;
    const per = WAVE.length / DURATION;
    const BAR = 2;
    const GAP = 1;
    for (let px = 0; px < w; px += BAR + GAP) {
      if (inGap(px)) continue;
      const i0 = Math.floor(tlToSrc(px / S.pxPerSec) * per);
      const i1 = Math.max(i0 + 1, Math.floor(tlToSrc((px + BAR + GAP) / S.pxPerSec) * per));
      let peak = 0;
      for (let i = i0; i < i1 && i < WAVE.length; i++) peak = Math.max(peak, WAVE[i]);
      const hh = Math.max(1, peak * amp);
      g.fillStyle = 'rgba(226,228,233,0.72)';
      g.beginPath();
      g.roundRect(px, mid - hh, BAR, hh * 2, 1);
      g.fill();
    }

    g.fillStyle = cssColor('--bg');
    g.fillRect(0, h - RULER, w, RULER);
    g.fillStyle = 'rgba(255,255,255,0.06)';
    g.fillRect(0, h - RULER, w, 1);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    for (const [a] of blocks.slice(1)) {
      g.beginPath();
      g.moveTo(a - 4, h - RULER);
      g.lineTo(a + 4, h - RULER);
      g.lineTo(a, h - RULER + 5);
      g.closePath();
      g.fill();
    }

    g.fillStyle = cssColor('--bg');
    g.fillRect(0, 0, w, LANE);
    g.fillStyle = 'rgba(255,255,255,0.06)';
    g.fillRect(0, LANE - 1, w, 1);

    g.font = '600 11px Inter, Segoe UI';
    g.textBaseline = 'middle';
    let labelEnd = -1;
    for (const z of [...S.zooms].sort((p, q) => p.start - q.start)) {
      const x0 = x(z.start) + 1;
      const wz = Math.max(4, x(z.end) - x(z.start) - 2);
      const y0 = 5;
      const hz = LANE - 10;
      g.beginPath();
      g.roundRect(x0, y0, wz, hz, 7);
      g.fillStyle = 'rgba(245,165,36,0.14)';
      g.fill();
      g.strokeStyle = 'rgba(245,165,36,0.7)';
      g.lineWidth = 1;
      g.stroke();
      const label = `${Math.round(z.scale)}%`;
      const lw = 30 + g.measureText(label).width + 9;
      const cx = x0 + 15;
      const ay = y0 + hz / 2;
      if (wz >= 24 && x0 >= labelEnd) {
        const R = 5;
        g.strokeStyle = '#ffcf7a';
        g.lineWidth = 1.5;
        g.lineCap = 'round';
        g.beginPath();
        g.arc(cx - 1, ay - 1, R, 0, Math.PI * 2);
        g.moveTo(cx - 1 + R * 0.72, ay - 1 + R * 0.72);
        g.lineTo(cx + 5.5, ay + 5.5);
        if (z.type !== 'punch') { g.moveTo(cx - 3.5, ay - 1); g.lineTo(cx + 1.5, ay - 1); }
        if (z.type === 'push') { g.moveTo(cx - 1, ay - 3.5); g.lineTo(cx - 1, ay + 1.5); }
        g.stroke();
        g.lineCap = 'butt';
        if (z.type === 'punch') {
          g.beginPath();
          g.arc(cx - 1, ay - 1, 1.6, 0, Math.PI * 2);
          g.fillStyle = '#ffcf7a';
          g.fill();
        }
        if (lw <= wz) {
          g.fillStyle = '#ffd89a';
          g.fillText(label, x0 + 27, ay + 0.5);
          labelEnd = x0 + lw;
        } else labelEnd = x0 + 24;
      }
    }

    for (const sec of S.sfx) {
      const sx = Math.round(x(sec)) + 0.5;
      const B = 20;
      const by = LANE + 5;
      const bx = sx - B / 2;
      g.fillStyle = 'rgba(179,136,255,0.45)';
      g.fillRect(sx - 0.5, by + B, 1, h - RULER - 10 - by - B);
      g.beginPath();
      g.roundRect(bx, by, B, B, 6);
      g.fillStyle = '#2a2238';
      g.fill();
      g.strokeStyle = 'rgba(179,136,255,0.75)';
      g.lineWidth = 1;
      g.stroke();
      const cx = bx + 6.5;
      const cy = by + B / 2;
      g.beginPath();
      g.moveTo(cx - 2.5, cy - 2);
      g.lineTo(cx, cy - 2);
      g.lineTo(cx + 3, cy - 4.5);
      g.lineTo(cx + 3, cy + 4.5);
      g.lineTo(cx, cy + 2);
      g.lineTo(cx - 2.5, cy + 2);
      g.closePath();
      g.fillStyle = '#d9c6ff';
      g.fill();
      g.strokeStyle = '#d9c6ff';
      g.lineWidth = 1.3;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(cx + 3.5, cy, 3, -0.8, 0.8);
      g.stroke();
      g.beginPath();
      g.arc(cx + 3.5, cy, 5.5, -0.8, 0.8);
      g.stroke();
      g.lineCap = 'butt';
    }
    g.textBaseline = 'alphabetic';

    const step = S.pxPerSec > 60 ? 1 : S.pxPerSec > 15 ? 5 : 10;
    const minor = step / 5;
    g.font = '500 10px Inter, Segoe UI';
    g.textBaseline = 'middle';
    for (let k = 0; k * minor < len; k++) {
      const t = k * minor;
      const major = k % 5 === 0;
      const tx = t * S.pxPerSec;
      g.fillStyle = major ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)';
      g.fillRect(Math.round(tx), h - RULER + 1, 1, major ? 6 : 3);
      if (major) {
        g.fillStyle = '#6c6c71';
        g.fillText(fmt(Math.round(t * 1000) / 1000).replace(/\.\d$/, ''), tx + 4, h - RULER / 2 + 2);
      }
    }
    g.textBaseline = 'alphabetic';
    drawPlayhead();
  }

  function drawPlayhead() {
    const dpr = window.devicePixelRatio || 1;
    const g = canvas.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(base, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const px = S.head * S.pxPerSec;
    const H = canvas.height / dpr;
    g.fillStyle = '#ffffff';
    g.fillRect(px - 0.75, 0, 1.5, H);
    g.beginPath();
    g.roundRect(px - 5, 0, 10, 9, [0, 0, 4, 4]);
    g.fill();
  }

  /* The picture: the video in the animation, a still in the login window. It has its own captions. */
  // Same as the editor: every frame is drawn on the canvas at its exact zoom, timed by the
  // video's own frame clock. Zooming the player with CSS shook from pixel snapping.
  const ZOOM_RAMP = 1.2;
  const smoother = (t) => {
    const x = Math.min(1, Math.max(0, t));
    return x * x * x * (x * (6 * x - 15) + 10);
  };
  // A push that doesn't end on a cut: in and back out, both eased, with a soft turn at the top
  function zoomAt(t) {
    if (!S.edited) return 1;
    const src = tlToSrc(t);
    const z = S.zooms.find((zz) => src >= zz.start && src < zz.end);
    if (!z) return 1;
    const shown = z.end - z.start;
    const at = src - z.start;
    const back = Math.max(ZOOM_RAMP, shown * 0.4);
    const glide = Math.max(0.03, shown - back);
    const k = at <= glide ? smoother(at / glide) : smoother((shown - at) / back);
    return 1 + (z.scale / 100 - 1) * k;
  }
  function drawFrame(el, time) {
    if (!el.videoWidth) return;
    const view = $('view');
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(view.clientWidth * dpr);
    const h = Math.round(view.clientHeight * dpr);
    if (!w || !h) return;
    if (view.width !== w || view.height !== h) { view.width = w; view.height = h; }
    const vw = el.videoWidth;
    const vh = el.videoHeight;
    const cover = Math.max(w / vw, h / vh) * zoomAt(time);
    const sw = w / cover;
    const sh = h / cover;
    const ctx = view.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(el, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h);
  }
  // Follows the video element inside the Wistia player, which appears once it has loaded
  function followVideo() {
    const player = wistia();
    const el = player && player.shadowRoot ? player.shadowRoot.querySelector('video') : null;
    if (!el || el === S.video) return;
    S.video = el;
    const onFrame = (now, info) => {
      if (el !== S.video) return;
      drawFrame(el, info.mediaTime);
      el.requestVideoFrameCallback(onFrame);
    };
    if (el.requestVideoFrameCallback) {
      el.requestVideoFrameCallback(onFrame);
    } else {
      // Browsers without a frame clock: draw on every screen refresh instead
      (function onRefresh() {
        if (el !== S.video) return;
        if (!el.paused) drawFrame(el, el.currentTime);
        requestAnimationFrame(onRefresh);
      })();
    }
    for (const event of ['seeked', 'loadeddata']) {
      el.addEventListener(event, () => { if (el === S.video) drawFrame(el, el.currentTime); });
    }
    videoCall((v) => { v.videoQuality = 720; });
    drawFrame(el, el.currentTime);
  }
  const wistia = () => document.querySelector('wistia-player');
  function videoCall(act) {
    const player = wistia();
    if (!player) return;
    try {
      const result = act(player);
      if (result && result.catch) result.catch(() => {});
    } catch (e) { /* the still underneath stays visible */ }
  }
  function playVideo() { S.playing = true; videoCall((v) => { v.muted = true; return v.play(); }); }
  function pauseVideo() { S.playing = false; videoCall((v) => v.pause()); }
  function buildVideo() {
    const box = document.createElement('div');
    box.className = 'demo-video';
    box.id = 'demoVideo';
    box.innerHTML = '<img id="demoStill" src="video-start.jpg" alt="">';
    $('frame').prepend(box);
  }
  function loadWistia() {
    for (const [src, module] of [['https://fast.wistia.com/player.js'], [`https://fast.wistia.com/embed/${WISTIA_ID}.js`, true]]) {
      const tag = document.createElement('script');
      tag.src = src;
      tag.async = true;
      if (module) tag.type = 'module';
      document.head.appendChild(tag);
    }
    const player = document.createElement('wistia-player');
    player.setAttribute('media-id', WISTIA_ID);
    player.setAttribute('aspect', '0.5625');
    for (const off of ['controls-visible-on-load', 'big-play-button', 'play-bar', 'play-pause-control', 'volume-control', 'settings-control', 'fullscreen-control', 'playback-rate-control']) {
      player.setAttribute(off, 'false');
    }
    player.setAttribute('muted', 'true');
    $('demoVideo').appendChild(player);
    setInterval(followVideo, 400);
  }

  /* Timing: everything waits while the demo is off screen */
  function sleep(ms) {
    return new Promise((done) => {
      let left = ms;
      let last = performance.now();
      (function tick() {
        const now = performance.now();
        if (!paused) left -= now - last;
        last = now;
        if (left <= 0) done();
        else setTimeout(tick, 16);
      })();
    });
  }
  async function tween(ms, draw) {
    let at = 0;
    let last = performance.now();
    while (at < ms) {
      await sleep(16);
      const now = performance.now();
      if (!paused) at += now - last;
      last = now;
      draw(Math.min(at / ms, 1));
    }
  }

  /* The cursor */
  async function moveTo(el, ms) {
    const time = ms || 650;
    const box = el.getBoundingClientRect();
    cursor.style.transition = `transform ${time}ms cubic-bezier(.22,.61,.36,1), opacity .3s`;
    cursor.style.transform = `translate(${box.left + box.width * 0.55}px, ${box.top + box.height * 0.6}px)`;
    await sleep(time + 60);
  }
  async function click(el, ms) {
    await moveTo(el, ms);
    cursor.classList.add('clicking');
    el.classList.add('demo-press');
    await sleep(130);
    cursor.classList.remove('clicking');
    el.classList.remove('demo-press');
    await sleep(110);
  }
  async function type(el, text) {
    for (let i = 1; i <= text.length; i++) {
      el.value = text.slice(0, i);
      await sleep(38);
    }
  }

  /* Setting up the real elements */
  function buildProjects() {
    const list = $('videoList');
    list.innerHTML = '';
    PROJECTS.forEach((name, i) => {
      const el = document.createElement('div');
      el.className = 'video-item' + (i === activeProject ? ' on' : '');
      el.innerHTML = `<div class="thumb"><img src="video-thumb.jpg" alt=""></div><div class="item-text"><div class="name"><span>${name}</span><em></em></div><div class="state">${fmt(DURATION).slice(0, -2)}<span class="ready-tag" data-s="ready">Ready</span></div></div>`;
      list.appendChild(el);
    });
    $('projectsEmpty').classList.add('hidden');
  }
  function buildRenderSelect() {
    const sel = $('renderFmt');
    sel.classList.add('hidden');
    if (sel.nextElementSibling && sel.nextElementSibling.classList.contains('dd')) return;
    const dd = document.createElement('div');
    dd.className = 'dd';
    dd.innerHTML = '<button type="button" class="dd-btn"><span>MP4 - 1080p</span><svg viewBox="0 0 16 16"><path d="M4 6l4 4 4-4"/></svg></button>';
    sel.after(dd);
  }
  function buildTemplates() {
    const grid = $('suTemplates');
    grid.innerHTML = '';
    [
      { id: 'clean', color: '#111111', box: true },
      { id: 'shadow', color: '#ffffff' }
    ].forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'tpl' + (i === 0 ? ' on' : '');
      b.innerHTML = '<span class="tpl-view"><span class="tpl-text">Your caption</span></span>';
      const txt = b.querySelector('.tpl-text');
      txt.style.fontFamily = '"TikTok Sans Bold", "Segoe UI", sans-serif';
      txt.style.color = t.color;
      if (t.box) {
        txt.style.background = '#ffffff';
        txt.style.padding = '5px 9px';
        txt.style.borderRadius = '5px';
      } else {
        txt.style.webkitTextStroke = '3.15px #000000';
        txt.style.paintOrder = 'stroke fill';
        txt.style.filter = 'drop-shadow(1.8px 1.8px 0 #000000)';
      }
      grid.appendChild(b);
    });
  }
  function buildTranscript() {
    const box = $('transcript');
    box.innerHTML = '';
    const add = (text, cls, drag) => {
      const el = document.createElement('span');
      el.className = 'w' + (cls ? ' ' + cls : '');
      if (drag) el.dataset.drag = '1';
      el.textContent = text;
      box.appendChild(el);
      box.appendChild(document.createTextNode(' '));
    };
    TAKES_CUT.forEach((w) => add(w, 'cut'));
    SPOKEN.forEach(([, w], i) => add(w, /^Cutly\b/.test(w) ? 'hl' : '', i >= DRAG_FROM && i < DRAG_FROM + DRAG_WORDS));
  }
  function setPlayIcon(state) { $('play').dataset.state = state; }
  function setLengths() {
    $('lengths').innerHTML = S.edited
      ? `Original ${fmt(DURATION)}<span class="dot">·</span><span class="edited">Edited ${fmt(editedLength() - S.extraCut)}</span>`
      : `Original ${fmt(DURATION)}`;
  }
  function setTime(t) {
    const len = S.edited ? editedLength() - S.extraCut : DURATION;
    $('time').textContent = `${fmt(t)} / ${fmt(len)}`;
    $('aiStamp').textContent = fmt(t);
  }
  function showTab(name) {
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
    document.querySelectorAll('#panel .tab').forEach((t) => t.classList.toggle('on', t.id === 'tab-' + name));
  }
  function addMessage(kind, text, stamp) {
    const el = document.createElement('div');
    if (kind === 'me') {
      el.className = 'msg me';
      el.innerHTML = '<div class="bubble"><div class="ai-text"></div></div><div class="msg-meta"><button class="ai-stamp"></button></div>';
      el.querySelector('.ai-text').textContent = text;
      el.querySelector('.ai-stamp').textContent = stamp;
    } else if (kind === 'typing') {
      el.className = 'msg ai';
      el.innerHTML = '<div class="ai-say"><span class="typing"><i></i><i></i><i></i></span></div>';
    } else {
      el.className = 'msg ai';
      el.innerHTML = '<div class="ai-say"></div>';
      el.querySelector('.ai-say').textContent = text;
    }
    $('aiList').appendChild(el);
    $('aiEmpty').classList.add('hidden');
    return el;
  }
  function setRun(html, opts) {
    const run = $('aiRun');
    run.innerHTML = html;
    run.disabled = !!(opts && opts.disabled);
    run.classList.toggle('running', !!(opts && opts.running));
  }
  const RUNNING = '<span class="ai-spin"></span><span>AI is editing</span>';

  function reset() {
    Object.assign(S, { edited: false, zooms: [], sfx: [], kept: [[0, DURATION]], head: 0, extraCut: 0 });
    document.body.classList.remove('no-project', 'ai-busy');
    ['player', 'panel', 'timelineWrap'].forEach((id) => $(id).classList.remove('hidden'));
    ['empty', 'analyzing', 'projectsEmpty', 'toast'].forEach((id) => $(id).classList.add('hidden'));
    $('storageBtn').classList.add('hidden');
    $('previewEdit').checked = true;
    showTab('ai');
    $('aiSetup').classList.remove('hidden');
    document.querySelector('.ai-foot').classList.add('pre-edit');
    $('aiEmpty').classList.add('hidden');
    $('aiList').innerHTML = '';
    $('aiCount').textContent = '';
    $('aiText').value = '';
    $('suBrief').value = '';
    $('suLen').value = 60;
    $('suLenV').textContent = '60s';
    ['suFirst', 'suZooms', 'suSfx', 'suCaps', 'suHl'].forEach((id) => { $(id).checked = false; });
    document.querySelectorAll('.su-caps-only').forEach((el) => el.classList.add('hidden'));
    $('render').textContent = 'Render video';
    $('render').disabled = false;
    setRun(`Edit with AI · ${credits(PRICES.edit)}`);
    setPlayIcon('play');
    setLengths();
    setTime(0);
    buildTranscript();
    $('demoVideo').classList.add('raw');   // before the edit: the still without captions
    S.playing = false;
    videoCall((v) => { v.pause(); v.currentTime = 0; });
    drawTimeline();
  }

  // Runs one edit from setup to render, then opens the next project, which is where the next run starts
  async function story() {
    /* Set up the edit */
    for (const id of ['suFirst', 'suZooms', 'suSfx', 'suCaps']) {
      await click($(id).closest('label'), 480);
      $(id).checked = true;
      if (id === 'suCaps') document.querySelectorAll('.su-caps-only').forEach((el) => el.classList.remove('hidden'));
      await sleep(130);
    }
    await click($('suBrief'));
    await type($('suBrief'), NOTE);
    await sleep(350);
    await click($('aiRun'));

    /* The AI edits */
    setRun(RUNNING, { disabled: true, running: true });
    document.body.classList.add('ai-busy');
    cursor.classList.remove('on');
    $('aiWorkTitle').textContent = 'AI is editing';
    await tween(5600, (p) => {
      $('aiWorkPct').textContent = Math.round(p * 100) + '%';
      $('aiWorkBar').firstElementChild.style.width = Math.round(p * 100) + '%';
      $('aiWorkStep').textContent = AI_STEPS[Math.min(Math.floor(p * AI_STEPS.length), AI_STEPS.length - 1)] + '...';
    });
    document.body.classList.remove('ai-busy');
    $('demoVideo').classList.remove('raw');   // the edit is done: the video with its captions
    S.edited = true;
    S.kept = KEPT;
    S.zooms = ZOOMS.slice();
    S.sfx = SOUNDS.slice();
    $('aiSetup').classList.add('hidden');
    document.querySelector('.ai-foot').classList.remove('pre-edit');
    addMessage('ai', "Done. I cut the retakes and long pauses, then added zooms, sounds and captions. It's now 0:40.");
    setRun('Run AI', { disabled: true });
    setLengths();
    setTime(0);
    drawTimeline();
    cursor.classList.add('on');
    await sleep(1400);

    /* Play the result */
    await click($('play'));
    setPlayIcon('pause');
    playVideo();
    await tween(PAUSE_AT * 1000, (p) => {
      const t = p * PAUSE_AT;
      S.head = t;
      setTime(t);
      drawPlayhead();
    });
    pauseVideo();
    await click($('play'), 450);
    setPlayIcon('play');
    await sleep(400);

    /* Ask for a change */
    await click($('aiText'));
    await type($('aiText'), COMMENT);
    await sleep(250);
    await click($('aiAdd'), 420);
    $('aiText').value = '';
    const bubble = addMessage('me', COMMENT, fmt(PAUSE_AT));
    $('aiCount').textContent = '1';
    setRun(`Run AI on 1 comment · ${credits(PRICES.ask)}`);
    await sleep(450);
    await click($('aiRun'));
    setRun(RUNNING, { disabled: true, running: true });
    const typing = addMessage('typing');
    await sleep(1800);
    typing.remove();
    bubble.classList.add('done');
    bubble.querySelector('.msg-meta').insertAdjacentHTML('beforeend', '<span class="ai-done">· Done</span>');
    $('aiCount').textContent = '';
    addMessage('ai', 'Added a zoom in on "chopping up clips" at 0:07.');
    setRun('Run AI', { disabled: true });
    S.zooms = ZOOMS.concat(NEW_ZOOM);
    drawTimeline();
    videoCall((v) => { v.currentTime = REPLAY_FROM; });
    S.head = REPLAY_FROM;
    setTime(REPLAY_FROM);
    drawPlayhead();
    await sleep(350);
    setPlayIcon('pause');
    playVideo();
    await tween((REPLAY_TO - REPLAY_FROM) * 1000, (p) => {
      S.head = REPLAY_FROM + p * (REPLAY_TO - REPLAY_FROM);
      setTime(S.head);
      drawPlayhead();
    });
    pauseVideo();
    setPlayIcon('play');
    await sleep(500);

    /* Edit the words */
    const tabTranscript = document.querySelector('.tabs button[data-tab="transcript"]');
    await click(tabTranscript);
    showTab('transcript');
    await sleep(800);
    const drag = [...document.querySelectorAll('[data-drag]')];
    await moveTo(drag[0]);
    for (const word of drag) {
      await moveTo(word, 260);
      word.classList.add('sel');
    }
    await sleep(500);
    const del = document.querySelector('.tr-keys kbd');
    del.classList.add('demo-lit');
    await sleep(240);
    del.classList.remove('demo-lit');
    drag.forEach((w) => { w.classList.remove('sel'); w.classList.add('cut'); });
    S.extraCut = 1;
    setLengths();
    setTime(REPLAY_TO);
    await sleep(1300);

    /* Render */
    const render = $('render');
    await click(render);
    render.disabled = true;
    document.body.classList.add('ai-busy');
    $('aiWorkTitle').textContent = 'Rendering';
    $('aiWorkStep').textContent = "You can switch tabs. Don't close this page.";
    await tween(2400, (p) => {
      const pct = Math.round(p * 100);
      render.textContent = `Rendering ${pct}%`;
      $('aiWorkPct').textContent = pct + '%';
      $('aiWorkBar').firstElementChild.style.width = pct + '%';
    });
    document.body.classList.remove('ai-busy');
    render.textContent = 'Render video';
    render.disabled = false;
    const toast = $('toast');
    toast.textContent = `Rendered "${PROJECTS[activeProject]} - edit.mp4" (24 MB). It's in your downloads.`;
    toast.classList.remove('hidden');
    await sleep(2200);
    toast.classList.add('hidden');

    /* Open the next project */
    activeProject = (activeProject + 1) % PROJECTS.length;
    const items = [...document.querySelectorAll('.video-item')];
    await click(items[activeProject], 800);
    items.forEach((el, i) => el.classList.toggle('on', i === activeProject));
    const swapping = document.querySelectorAll('.stage, .panel, .timeline-wrap');
    swapping.forEach((el) => el.classList.add('demo-swap'));
    await sleep(280);
    reset();
    swapping.forEach((el) => el.classList.remove('demo-swap'));
    await sleep(600);
  }

  /* Start */
  cursor = document.createElement('div');
  cursor.className = 'demo-cursor';
  cursor.innerHTML = '<svg viewBox="0 0 20 24" width="20" height="24" aria-hidden="true"><path d="M2 2v17.5l5-4.6 3.3 7.3 3.2-1.4-3.3-7.2H17z" fill="#fff" stroke="#0a0a0a" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  document.body.appendChild(cursor);
  buildProjects();
  buildRenderSelect();
  buildTemplates();
  buildVideo();
  reset();
  document.body.classList.add('demo-ready');
  // Redraws once the layout settles, so the timeline always fits its area
  let redraw = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(redraw);
    redraw = requestAnimationFrame(drawTimeline);
  }).observe($('timelineScroll'));

  /* The Pro timeline, as drawProBase in the app: captions, picture, two voice tracks, sounds */
  const PRO = { label: 92, ruler: 22, row: 32 };
  const PRO_ROWS = [
    { id: 'V2', name: 'Captions', gap: 4 },
    { id: 'V1', name: 'Video', gap: 4 },
    { id: 'A1', name: 'Voice', gap: 14 },
    { id: 'A2', name: 'Voice', gap: 10 },
    { id: 'A3', name: 'Sounds', gap: 10 }
  ];
  const COLORS = {
    caption: ['rgba(155,105,235,0.30)', 'rgba(175,135,245,0.85)'],
    video: ['rgba(70,140,200,0.30)', 'rgba(95,160,215,0.85)'],
    voice: ['rgba(56,160,210,0.28)', 'rgba(80,180,225,0.85)'],
    sound: ['rgba(70,180,120,0.30)', 'rgba(95,200,140,0.85)'],
    text: '#e8e8ea'
  };
  const SOUND_NAMES = ['WOW', 'Cute pop', 'HUH', 'Glitter', 'AWH', 'Cute pop', 'WOW'];
  const proRowY = (k) => PRO_ROWS.slice(0, k + 1).reduce((y, r, i) => y + r.gap + (i < k ? PRO.row : 0), PRO.ruler);

  function drawPro() {
    const wrap = $('proScroll');
    const proCanvas = $('proTimeline');
    proCanvas.style.width = '0';
    if (!wrap.clientWidth) return;
    const total = editedLength();
    const px = Math.max(6, (wrap.clientWidth - PRO.label - 4) / Math.max(1, total));
    const gaps = PRO_ROWS.reduce((n, r) => n + r.gap, PRO.ruler + 6 + 10);
    PRO.row = Math.max(20, Math.min(44, Math.floor((wrap.clientHeight - gaps) / PRO_ROWS.length)));
    const dpr = window.devicePixelRatio || 1;
    const w = Math.ceil(PRO.label + total * px + 4);
    const h = proRowY(PRO_ROWS.length - 1) + PRO.row + 6;
    proCanvas.width = w * dpr;
    proCanvas.height = h * dpr;
    proCanvas.style.width = w + 'px';
    proCanvas.style.height = h + 'px';
    const g = proCanvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = cssColor('--bg');
    g.fillRect(0, 0, w, h);
    const X = (sec) => PRO.label + sec * px;

    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.fillRect(PRO.label, PRO.ruler - 1, w - PRO.label, 1);
    const step = px > 60 ? 1 : px > 20 ? 2 : 5;
    g.font = '10px Inter, Segoe UI';
    for (let t = 0; t <= total; t += step) {
      const tx = PRO.label + t * px;
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.fillRect(tx, PRO.ruler - 6, 1, 5);
      g.fillStyle = '#6b6e76';
      g.fillText(fmt(t).replace(/\.\d$/, ''), tx + 4, 12);
    }
    PRO_ROWS.forEach((r, k) => {
      const y = proRowY(k);
      g.beginPath();
      g.roundRect(PRO.label, y, w - PRO.label - 2, PRO.row, 6);
      g.fillStyle = cssColor('--track');
      g.fill();
      g.beginPath();
      g.roundRect(8, y + PRO.row / 2 - 9, 24, 18, 4);
      g.fillStyle = 'rgba(255,255,255,0.06)';
      g.fill();
      g.font = '600 10px Inter, Segoe UI';
      g.textAlign = 'center';
      g.fillStyle = '#c9cbd1';
      g.fillText(r.id, 20, y + PRO.row / 2 + 3.5);
      g.textAlign = 'left';
      g.font = '11px Inter, Segoe UI';
      g.fillStyle = '#8b8d94';
      g.fillText(r.name, 38, y + PRO.row / 2 + 4);
    });

    const block = (k, t0, t1, [fill, line], label, top) => {
      const x0 = X(t0) + 0.5;
      const x1 = Math.max(X(t1) - 0.5, x0 + 2);
      const y = proRowY(k);
      g.beginPath();
      g.roundRect(x0, y + 2.5, x1 - x0, PRO.row - 5, Math.min(5, (x1 - x0) / 2));
      g.fillStyle = fill;
      g.fill();
      g.strokeStyle = line;
      g.lineWidth = 1;
      g.stroke();
      if (label && x1 - x0 > 24) {
        g.save();
        g.beginPath();
        g.rect(x0 + 4, y, x1 - x0 - 8, PRO.row);
        g.clip();
        g.font = '500 11px Inter, Segoe UI';
        g.fillStyle = COLORS.text;
        g.fillText(label, x0 + 6, top ? y + 14 : y + PRO.row / 2 + 4);
        g.restore();
      }
      return [x0, x1, y];
    };

    // V2 captions
    for (let i = 0; i < SPOKEN.length; i += 4) {
      const end = i + 4 < SPOKEN.length ? SPOKEN[i + 4][0] : total;
      block(0, SPOKEN[i][0], Math.min(total, end) - 0.05, COLORS.caption, SPOKEN.slice(i, i + 4).map(([, w]) => w).join(' '));
    }

    let at = 0;
    S.kept.forEach(([a, b], n) => {
      const len = b - a;
      // V1 picture: the zoom as a line, higher = closer
      const [, , vy] = block(1, at, at + len, COLORS.video, fmt(a), true);
      g.strokeStyle = '#f5a524';
      g.lineWidth = 1.5;
      g.beginPath();
      for (let t = 0; t <= len; t += 0.1) {
        const kx = X(at + t);
        const ky = vy + PRO.row - 6 - Math.min(1, (zoomAt(Math.min(at + t, total - 0.01)) * 100 - 100) / 40) * (PRO.row - 18);
        if (t) g.lineTo(kx, ky); else g.moveTo(kx, ky);
      }
      g.stroke();

      // A1 / A2 voice: alternating, each clip starting a little early (the J-cut)
      const pre = n ? 0.25 : 0;
      const [x0, x1, y] = block(2 + (n % 2), at - pre, at + len, COLORS.voice, '');
      const per = WAVE.length / DURATION;
      const mid = y + PRO.row / 2;
      const amp = PRO.row / 2 - 6;
      g.fillStyle = 'rgba(170,225,250,0.8)';
      for (let p = Math.ceil(x0); p < x1; p++) {
        const srcT = a - pre + (p - x0) / px;
        const i = Math.floor(srcT * per);
        const j = Math.max(i + 1, Math.floor((srcT + 1 / px) * per));
        let peak = 0;
        for (let q = i; q < j && q < WAVE.length; q++) peak = Math.max(peak, WAVE[q] || 0);
        const hh = Math.max(0.5, peak * amp);
        g.fillRect(p, mid - hh, 1, hh * 2);
      }
      at += len;
    });

    // A3 sound effects
    S.sfx.forEach((sec, i) => {
      const t = srcToTl(sec);
      block(4, t, t + 1.6, COLORS.sound, SOUND_NAMES[i % SOUND_NAMES.length]);
    });

    g.fillStyle = '#ffffff';
    g.fillRect(PRO.label + S.head * px, 0, 1.5, h);
  }

  // ?still: a single finished frame with no animation (used in the login window)
  if (location.search.includes('still')) {
    document.body.classList.add('demo-still');
    $('demoStill').src = 'video-still.jpg';
    S.edited = true;
    S.kept = KEPT;
    S.zooms = ZOOMS.concat(NEW_ZOOM);
    S.sfx = SOUNDS.slice();
    S.head = PAUSE_AT;
    $('aiSetup').classList.add('hidden');
    document.querySelector('.ai-foot').classList.remove('pre-edit');
    addMessage('ai', "Done. I cut the retakes and long pauses, then added zooms, sounds and captions. It's now 0:40.");
    setRun('Run AI', { disabled: true });
    setLengths();
    setTime(PAUSE_AT);
    document.querySelectorAll('.viewtoggle button').forEach((b) => b.classList.toggle('on', b.dataset.view === 'pro'));
    $('timelineScroll').classList.add('hidden');
    $('proScroll').classList.remove('hidden');
    drawPro();
    let proRedraw = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(proRedraw);
      proRedraw = requestAnimationFrame(drawPro);
    }).observe($('proScroll'));
    return;
  }

  loadWistia();
  let started = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  addEventListener('message', (e) => {
    // Only the page that frames us may control the demo
    if (e.source !== window.parent || (location.origin !== 'null' && e.origin !== location.origin)) return;
    if (e.data !== 'demo-play' && e.data !== 'demo-pause') return;
    paused = e.data === 'demo-pause';
    if (S.playing) videoCall((v) => (paused ? v.pause() : v.play()));
    if (!paused && !started && !reduced) {
      started = true;
      (async () => {
        cursor.style.transition = 'none';
        cursor.style.transform = 'translate(46vw, 60vh)';
        await sleep(60);
        cursor.classList.add('on');
        await sleep(800);
        for (;;) await story();
      })();
    }
  });
  if (window.parent !== window) window.parent.postMessage('demo-ready', location.origin === 'null' ? '*' : location.origin);
})();
