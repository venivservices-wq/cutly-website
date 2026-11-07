// Plays a scripted session on the real editor UI (copied from the app by tools/build.py), the way the app works today,
// all in the open editor with its timeline open: the cursor asks the AI to edit the open video, the AI edits it, the
// user plays the result, asks for a change, cuts words in the transcript and exports. Then the next project opens.
// The timeline, chat and screens follow app.js in the Video Editor (Version 250), so they look the same.
(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = (s) => {
    s = Math.max(0, s || 0);
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;
  };
  const credits = (n) => `${n} credit${n === 1 ? '' : 's'}`;
  const PRICES = { edit: 2, ask: 1 };
  const START_CREDITS = 48;
  const WORK_WORDS = ['Thinking', 'Working', 'Placing', 'Timing', 'Polishing'];
  // The chat's answers are fixed lines in the app too (cloud.READY_LINES), never AI text
  const READY = ['Your video is ready to preview.', 'Editing complete! You can take a look!', 'Your latest edit is waiting for you.', "I've finished working on your video. Have a look!"];
  const COMMENT = 'Zoom in when she says chopping up clips';
  const COMMENT_2 = 'Add a whoosh sound here';
  const PAUSE_AT = 8.6;    // edited seconds: where the first comment is written
  const SECOND_AT = 12;    // ...and the second
  const REPLAY_FROM = 6.6;
  const REPLAY_TO = 13;
  const WISTIA_ID = 'xyco9e53i1';

  // The finished video is 40.4s. Its parts sit in a longer raw take, in source seconds.
  const DURATION = 63.2;
  const KEPT = [[3, 8.6], [11, 17], [19.5, 26.3], [28.8, 33.6], [36, 43.4], [46, 53], [56.2, 59]];
  // What the AI adds (source seconds, inside the kept parts): a zoom on every key line, a sound on every beat, pictures on top
  const ZOOMS = [
    { start: 3.6, end: 5.4, type: 'push', scale: 115 },
    { start: 6.4, end: 8.4, type: 'push', scale: 125 },
    { start: 11.2, end: 12.4, type: 'punch', scale: 112 },
    { start: 14.4, end: 16.6, type: 'push', scale: 120 },
    { start: 20.2, end: 22, type: 'punch', scale: 112 },
    { start: 23.4, end: 26, type: 'push', scale: 118 },
    { start: 32, end: 33.4, type: 'punch', scale: 110 },
    { start: 36.6, end: 38.6, type: 'punch', scale: 115 },
    { start: 39.8, end: 42.6, type: 'push', scale: 122 },
    { start: 47, end: 49.4, type: 'push', scale: 118 },
    { start: 50.6, end: 52.6, type: 'punch', scale: 112 },
    { start: 56.6, end: 58.6, type: 'push', scale: 125 }
  ];
  const NEW_ZOOM = { start: 12.6, end: 14.2, type: 'push', scale: 118 };   // the one asked for in the chat ("chopping up clips")
  const SOUNDS = [3.4, 6.2, 8.1, 11.4, 13.1, 15.6, 22.4, 25.2, 29, 31.2, 33, 36.4, 39, 41.8, 46.4, 48.8, 51.6, 56.6, 58.2];
  const NEW_SOUND = 19.9;   // the one asked for in the chat (edited 0:12.0)
  const SOUND_NAMES = ['Wow', 'Cute pop', 'Ding', 'Huh', 'Glitter', 'Cash', 'Swoosh', 'Click', 'Bling'];
  const soundName = (sec, i) => (S.whoosh && sec === S.whoosh ? 'Whoosh' : SOUND_NAMES[i % SOUND_NAMES.length]);
  // Pictures over the video (Track 1): [source start, end, name]
  const OVERLAYS = [[3.2, 5.6, 'Hook text'], [14.6, 16.9, 'Product shot'], [24, 26.2, 'Screenshot'], [29.2, 32.4, 'Logo'], [39.6, 42.8, 'B-roll'], [47, 50.2, 'Price tag'], [56.4, 58.9, 'Follow me']];
  // What the AI suggests adding next (Ask AI chat): [kind's text, edited seconds]
  const SUGGESTIONS = [['Add hook text at', 0], ['Add a zoom-in at', 19]];
  const SUG_ZOOM = { start: 29.4, end: 31.6, type: 'push', scale: 120 };   // what the zoom suggestion adds (edited 0:19.0)
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

  const S = { edited: false, zooms: [], sfx: [], overlays: [], kept: [[0, DURATION]], zoomAt: 0.32, sel: null, drag: null, whoosh: 0, head: 0, pxPerSec: 1, extraCut: 0, credits: START_CREDITS };
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

  /* The Basic timeline, as drawTimelineBase in the app: a ruler, lanes for the tracks (Track 1 pictures, Track 2 zooms,
     the clips, Track 3 sounds), each clip = its picture as a strip of frames with its sound under it */
  const TL = { RULER: 20, GAPY: 6, LANE: 22, CLIPH: 84, CLIPMAX: 128, SPLIT: 5 };
  const TL_PAD = 0.2;
  const TRACKS = [{ id: 'o1' }, { id: 'z1' }, { id: 'v', video: true }, { id: 's1' }];
  const canvas = $('timeline');
  const base = document.createElement('canvas');
  const thumb = new Image();
  thumb.src = 'video-thumb.jpg';
  thumb.onload = () => drawTimeline();

  function layout(clipH) {
    const lanes = {};
    const order = [];
    let y = TL.RULER + TL.GAPY;
    let clipY = y;
    for (const t of TRACKS) {
      const l = { id: t.id, video: !!t.video, y, h: t.video ? clipH : TL.LANE };
      lanes[t.id] = l;
      order.push(l);
      if (t.video) clipY = y;
      y += l.h + TL.GAPY;
    }
    return { lanes, order, clipY, contentEnd: y, clipH };
  }
  // The zoom, as the app's slider sets it: S.zoomAt (0-1) along a log scale from "fits the width" (45 px a second at least)
  // to the most the canvas can show; the app opens a third of the way along (0.32)
  function zoomPx(width, len) {
    const dpr = window.devicePixelRatio || 1;
    const lo = Math.max(45, (width - 66) / (Math.max(1, len) * (1 + TL_PAD)));
    const hi = Math.max(lo * 2, Math.min(2000, (30000 / dpr - 200) / (Math.max(1, len) * (1 + TL_PAD))));
    return lo * Math.pow(hi / lo, S.zoomAt);
  }
  const axisLength = () => (S.edited ? editedLength() - S.extraCut : DURATION);
  const xToSrc = (px) => (S.edited ? tlToSrc(px / S.pxPerSec) : px / S.pxPerSec);
  const srcToX = (sec) => (S.edited ? srcToTl(sec) : sec) * S.pxPerSec;

  function drawTimeline() {
    const wrap = $('timelineScroll');
    if (!wrap.clientWidth || document.body.classList.contains('tl-closed') && !document.body.classList.contains('ai-busy')) return;
    const len = axisLength();
    S.pxPerSec = zoomPx(wrap.clientWidth, len);
    if ($('tlZoomBar')) $('tlZoomBar').value = Math.round(S.zoomAt * 100);
    const dpr = window.devicePixelRatio || 1;
    const room = Math.floor(wrap.clientHeight - 20);
    const spare = room - (layout(TL.CLIPH).contentEnd + TL.LANE + TL.GAPY * 2);
    const lay = layout(Math.max(TL.CLIPH, Math.min(TL.CLIPMAX, TL.CLIPH + spare)));
    const w = Math.ceil(len * (1 + TL_PAD) * S.pxPerSec);
    const h = Math.max(lay.contentEnd + TL.LANE + TL.GAPY * 2, room);
    for (const c of [canvas, base]) { c.width = w * dpr; c.height = h * dpr; }
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const g = base.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#040404';
    g.fillRect(0, 0, w, h);
    const { RULER, GAPY, SPLIT } = TL;
    const { clipY, clipH } = lay;
    const SFXH = TL.LANE;
    const ZH = TL.LANE;
    const sndH = Math.max(20, Math.round((clipH - SPLIT) * 0.3));
    const picH = clipH - SPLIT - sndH;
    const sndY = clipY + picH + SPLIT;
    const xEnd = len * S.pxPerSec;
    const toEnd = (x0, wdt, least) => Math.max(Math.min(least, wdt), Math.min(wdt, xEnd - x0));

    for (const l of lay.order) {
      if (l.video) continue;
      g.beginPath();
      g.roundRect(0, l.y, w, l.h, 4);
      g.fillStyle = 'rgba(255,255,255,0.035)';
      g.fill();
    }

    // clips: the edited view = one block per kept clip, 6px apart; the original = one block
    const GAPW = 3;
    const blocks = [];
    if (S.edited) {
      let at = 0;
      for (const [a, b] of S.kept) { blocks.push([at * S.pxPerSec, (at + b - a) * S.pxPerSec]); at += b - a; }
      blocks[blocks.length - 1][1] -= S.extraCut * S.pxPerSec;
    } else blocks.push([0, DURATION * S.pxPerSec]);
    const spans = blocks.map(([a, b], n) => [a + (n === 0 ? 0 : GAPW), b - (n === blocks.length - 1 ? 0 : GAPW)]);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    spans.forEach(([x0, x1]) => {
      const cw = Math.max(2, x1 - x0);
      g.save();
      g.beginPath(); g.roundRect(x0, sndY, cw, sndH, 4);
      g.fillStyle = 'rgba(255,255,255,0.07)'; g.fill();
      g.beginPath(); g.roundRect(x0, clipY, cw, picH, 4); g.clip();
      g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x0, clipY, cw, picH);
      if (thumb.complete && thumb.naturalWidth) {   // the picture: frames at their own shape, left to right
        const dw = thumb.naturalWidth * picH / thumb.naturalHeight;
        for (let px = x0; px < x1; px += dw) g.drawImage(thumb, px, clipY, dw, picH);
      }
      g.restore();
    });
    // the sound: separate mirrored bars on a dark green block, brighter where it's louder
    const per = WAVE.length / DURATION;
    const mid = sndY + sndH / 2;
    const ampW = sndH / 2 - 2;
    spans.forEach(([x0, x1]) => {
      const cw = Math.max(2, x1 - x0);
      g.save();
      g.beginPath(); g.roundRect(x0, sndY, cw, sndH, 4); g.clip();
      g.fillStyle = '#0c2a22'; g.fillRect(x0, sndY, cw, sndH);
      for (let px = x0 + 3; px + 2 < x1 - 2; px += 4) {
        const i0 = Math.floor(xToSrc(px) * per);
        const i1 = Math.max(i0 + 1, Math.floor(xToSrc(px + 4) * per));
        let peak = 0;
        for (let i = i0; i < i1 && i < WAVE.length; i++) peak = Math.max(peak, WAVE[i]);
        const v = Math.pow(Math.min(1, peak * 1.15), 0.8);
        const hh = Math.max(1, v * ampW);
        g.fillStyle = `rgba(76,193,150,${(0.3 + 0.7 * Math.min(1, v * 1.4)).toFixed(2)})`;
        g.fillRect(px, mid - hh, 2, hh * 2);
      }
      g.restore();
    });

    // zooms: yellow chips in their own track, as long as the zoom
    g.font = '600 11px Inter, Segoe UI';
    g.textBaseline = 'middle';
    for (const z of [...S.zooms].sort((p, q) => p.start - q.start)) {
      const x0 = srcToX(z.start) + 1;
      const wz = toEnd(x0, Math.max(8, srcToX(z.end) - srcToX(z.start) - 2), 8);
      const y0 = lay.lanes.z1.y;
      const hot = S.drag === z;   // held / just added: bright, like the app's chip while it is dragged
      g.beginPath(); g.roundRect(x0, y0, wz, ZH, 4);
      g.fillStyle = hot ? '#facc15' : 'rgba(250,204,21,0.18)'; g.fill();
      const ink = hot ? '#422006' : '#facc15';
      const label = `${Math.round(z.scale)}%`;
      const tw = g.measureText(label).width;
      if (wz < 24 + tw + 8 && wz >= tw + 12) {
        g.fillStyle = ink; g.fillText(label, x0 + (wz - tw) / 2, y0 + ZH / 2 + 0.5);
      } else if (wz >= 24) {
        const cx = x0 + 12;
        const cy = y0 + ZH / 2;
        const R = 4.4;
        g.strokeStyle = ink; g.lineWidth = 1.5; g.lineCap = 'round';
        g.beginPath(); g.arc(cx - 1, cy - 1, R, 0, Math.PI * 2);
        g.moveTo(cx - 1 + R * 0.72, cy - 1 + R * 0.72); g.lineTo(cx + 4.2, cy + 4.2);
        if (z.type !== 'punch') { g.moveTo(cx - 3.4, cy - 1); g.lineTo(cx + 1.4, cy - 1); }
        if (z.type === 'push') { g.moveTo(cx - 1, cy - 3.4); g.lineTo(cx - 1, cy + 1.4); }
        g.stroke(); g.lineCap = 'butt';
        if (z.type === 'punch') { g.beginPath(); g.arc(cx - 1, cy - 1, 1.5, 0, Math.PI * 2); g.fillStyle = ink; g.fill(); }
        if (wz >= 24 + tw + 8) { g.fillStyle = ink; g.fillText(label, x0 + 22, cy + 0.5); }
      }
    }

    // overlays (pictures over the video): blue-violet chips in the top track, as long as they show
    for (const [a, b, name] of S.overlays) {
      const x0 = srcToX(a) + 1;
      const wo = toEnd(x0, Math.max(8, srcToX(b) - srcToX(a) - 2), 8);
      const y0 = lay.lanes.o1.y;
      g.beginPath(); g.roundRect(x0, y0, wo, TL.LANE, 4);
      g.fillStyle = 'rgba(139,92,246,0.32)'; g.fill();
      const ink = '#c3a6ff';
      const cx = x0 + 12;
      const cy = y0 + TL.LANE / 2;
      g.save(); g.beginPath(); g.rect(x0, y0, wo - 4, TL.LANE); g.clip();
      if (wo >= 22) {   // a small picture icon: frame, sun, hill
        g.strokeStyle = ink; g.lineWidth = 1.3; g.lineJoin = 'round';
        g.beginPath(); g.roundRect(cx - 5, cy - 4.5, 10, 9, 2); g.stroke();
        g.beginPath(); g.moveTo(cx - 4.5, cy + 4); g.lineTo(cx - 1, cy + 0.5); g.lineTo(cx + 1.5, cy + 3); g.lineTo(cx + 5, cy); g.stroke();
        g.beginPath(); g.arc(cx - 1.6, cy - 1.6, 1.1, 0, Math.PI * 2); g.fillStyle = ink; g.fill();
      }
      if (wo >= 40) { g.fillStyle = ink; g.fillText(name, x0 + 23, cy + 0.5); }
      g.restore();
    }

    // sound effects: a soft green pill with a mini waveform and the name, a line from it through the clip at the moment
    const sfxXs = S.sfx.map((sec) => Math.round(srcToX(sec)) + 0.5).sort((p, q) => p - q);
    S.sfx.forEach((sec, i) => {
      const sx = Math.round(srcToX(sec)) + 0.5;
      const name = soundName(sec, i);
      // a pill never runs into the next sound: it gets shorter instead (and the name is clipped to it)
      const next = sfxXs.find((x) => x > sx + 0.5);
      const room = next === undefined ? Infinity : Math.max(SFXH, next - sx - 3);
      const cw = Math.min(room, toEnd(sx - SFXH / 2, Math.min(150, 32 + g.measureText(name).width + 14), SFXH));
      const by = lay.lanes.s1.y;
      const bx = sx - SFXH / 2;
      g.fillStyle = 'rgba(74,222,128,0.8)';
      g.fillRect(sx - 0.75, clipY + clipH, 1.5, by - clipY - clipH);
      g.beginPath(); g.arc(sx, clipY + clipH - 0.5, 2.6, 0, Math.PI * 2); g.fill();
      const hot = S.drag === 'sound' && sec === S.whoosh;
      g.beginPath(); g.roundRect(bx, by, cw, SFXH, 4);
      g.fillStyle = hot ? '#4ade80' : 'rgba(34,197,94,0.2)'; g.fill();
      const cy = by + SFXH / 2;
      g.fillStyle = hot ? '#052e16' : '#6ee7a0';
      [[0, 4], [4, 10], [8, 6], [12, 2.5]].forEach(([dx, hh]) => { g.beginPath(); g.roundRect(bx + 11 + dx, cy - hh / 2, 2, hh, 1); g.fill(); });
      g.save(); g.beginPath(); g.rect(bx, by, cw - 8, SFXH); g.clip();
      g.fillText(name, bx + 32, cy + 0.5); g.restore();
    });
    if (S.sel !== null && spans[S.sel]) {
      const [sx, ex] = spans[S.sel];
      const sw = ex - sx;
      const top = clipY - 3;
      const hgt = clipH + 6;
      g.fillStyle = 'rgba(0,0,0,0.62)';
      g.fillRect(0, clipY, Math.max(0, sx), clipH);
      g.fillRect(sx + sw, clipY, Math.max(0, w - sx - sw), clipH);
      g.strokeStyle = '#ffffff'; g.lineWidth = 2.5;
      g.beginPath(); g.roundRect(sx, top, sw, hgt, 5); g.stroke();
      g.fillStyle = '#ffffff';
      for (const gx of [sx, sx + sw]) { g.beginPath(); g.roundRect(gx - 3, clipY + clipH / 2 - 12, 6, 24, 3); g.fill(); }
      const [a, b] = S.kept[S.sel];
      const label = `${(b - a).toFixed(1)}s`;
      g.font = '600 11px Inter, Segoe UI';
      const lw = g.measureText(label).width + 16;
      const zoomY = clipY - GAPY - ZH;
      g.beginPath(); g.roundRect(sx, zoomY, lw, ZH, 7); g.fillStyle = '#ffffff'; g.fill();
      g.fillStyle = '#0a0a0a'; g.fillText(label, sx + 8, zoomY + ZH / 2 + 0.5);
      S.selBox = { x0: sx, x1: ex, y: clipY + clipH / 2 };
    }
    g.textBaseline = 'alphabetic';

    // ruler on top: a few clear time labels, small ticks
    g.fillStyle = '#040404'; g.fillRect(0, 0, w, RULER);
    const step = S.pxPerSec > 60 ? 1 : S.pxPerSec > 15 ? 5 : 10;
    const minor = step / 5;
    g.font = '500 11px Inter, Segoe UI';
    g.textBaseline = 'middle';
    for (let k = 0; k * minor < len * (1 + TL_PAD); k++) {
      const t = k * minor;
      const major = k % 5 === 0;
      const tx = t * S.pxPerSec;
      g.fillStyle = major ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)';
      g.fillRect(Math.round(tx), RULER - (major ? 7 : 4), 1, major ? 7 : 4);
      if (major) { g.fillStyle = '#8a8a8a'; g.fillText(fmt(Math.round(t * 1000) / 1000).replace(/\.\d$/, ''), tx + 5, RULER / 2 - 1); }
    }
    g.textBaseline = 'alphabetic';
    S.lay = lay;
    placeGutter();
    drawPlayhead();
  }

  // The track controls in the left gutter: a grip, a + and the track's name; the gray + below the last track
  const GRIP_SVG = '<svg viewBox="0 0 8 14" aria-hidden="true"><circle cx="2" cy="3" r="1"/><circle cx="6" cy="3" r="1"/><circle cx="2" cy="7" r="1"/><circle cx="6" cy="7" r="1"/><circle cx="2" cy="11" r="1"/><circle cx="6" cy="11" r="1"/></svg>';
  const PLUS_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>';
  function placeGutter() {
    const box = $('tlCtls');
    const sc = $('timelineScroll');
    if (!box || !S.lay) return;
    if (!box.dataset.built) {
      box.dataset.built = '1';
      box.innerHTML = '';
      let num = 0;
      for (const t of TRACKS) {
        if (t.video) continue;
        num++;
        const c = document.createElement('div');
        c.className = 'tl-ctl';
        c.dataset.id = t.id;
        c.innerHTML = `<button class="tl-grip" type="button" tabindex="-1">${GRIP_SVG}</button><button class="tl-add gen" type="button" tabindex="-1">${PLUS_SVG}</button><span class="tl-name">Track ${num}</span>`;
        box.appendChild(c);
      }
      const n = document.createElement('button');
      n.id = 'tlNewTrack';
      n.className = 'tl-newtrack';
      n.type = 'button';
      n.tabIndex = -1;
      n.innerHTML = PLUS_SVG;
      box.appendChild(n);
    }
    const top = sc.offsetTop - sc.scrollTop;
    for (const c of box.querySelectorAll('.tl-ctl')) c.style.top = top + S.lay.lanes[c.dataset.id].y + 'px';
    $('tlNewTrack').style.top = top + S.lay.contentEnd + 'px';
  }

  function drawPlayhead() {
    if (!canvas.width) return;
    const dpr = window.devicePixelRatio || 1;
    const g = canvas.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(base, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const px = S.head * S.pxPerSec;
    const H = canvas.height / dpr;
    // while it plays, a timeline wider than its window turns a whole page when the playhead reaches the right edge
    const sc = $('timelineScroll');
    if (S.playing && (px > sc.scrollLeft + sc.clientWidth - 6 || px < sc.scrollLeft)) sc.scrollLeft = Math.max(0, px - 8);
    g.fillStyle = '#ffffff';
    g.fillRect(px - 1, 0, 2, H);
    g.beginPath();
    g.roundRect(px - 6, 0, 12, 15, [0, 0, 5, 5]);
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
  async function type(el, text, after) {
    for (let i = 1; i <= text.length; i++) {
      el.value = text.slice(0, i);
      if (after) after();
      await sleep(38);
    }
  }

  /* The screens, as the app switches them (showStage): the New project page, or a project in the editor */
  function showStage(which) {
    $('newPage').classList.remove('hidden');
    $('needVideo').classList.add('hidden');
    $('empty').classList.toggle('hidden', which !== 'empty');
    $('analyzing').classList.add('hidden');
    for (const id of ['player', 'panel', 'timelineWrap']) $(id).classList.toggle('hidden', which !== 'player');
    document.body.classList.toggle('no-project', which !== 'player');
  }
  function setCredits(n) {
    S.credits = n;
    for (const id of ['npCredits', 'drCredits']) {
      const el = $(id);
      if (!el) continue;
      el.classList.remove('hidden');
      el.dataset.level = 'ok';
      el.textContent = credits(n) + ' left';
    }
  }

  /* Setting up the real elements */
  // The project list: the open one is "Uploaded" until the AI edits it, then "AI is editing", then "Edited", like the app's tags
  function buildProjects(state) {
    const list = $('videoList');
    list.innerHTML = '';
    PROJECTS.forEach((name, i) => {
      const el = document.createElement('div');
      const mine = i === activeProject;
      el.className = 'video-item' + (mine && state ? ' on' : '');
      const busy = mine && state === 'busy';
      const tag = mine && state === 'new' ? '<span class="ready-tag" data-s="new">Uploaded</span>' : '<span class="ready-tag" data-s="ready">Edited</span>';
      el.innerHTML = `<div class="thumb"><img src="video-thumb.jpg" alt=""></div><div class="item-text"><div class="name"><span>${name}</span><em>${busy ? '' : fmt(DURATION).replace(/\.\d$/, '')}</em></div>`
        + (busy ? '<div class="state" data-s="busy">AI is editing</div>' : `<div class="state" data-s="ready">${tag}</div>`) + '</div>'
        + '<button class="item-del item-more" aria-label="More" tabindex="-1"><svg viewBox="0 0 16 16"><circle cx="3.5" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="12.5" cy="8" r="1.2"/></svg></button>';
      list.appendChild(el);
    });
    $('projectsEmpty').classList.add('hidden');
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
    SPOKEN.forEach(([, w], i) => add(w, '', i >= DRAG_FROM && i < DRAG_FROM + DRAG_WORDS));
  }
  function setPlayIcon(state) { $('play').dataset.state = state; }
  function setLengths() {
    $('lengths').innerHTML = `<b class="len-now" id="lenNow">0:00.0</b><span class="len-of">/ ${fmt(axisLength())}</span>`;
  }
  function setTime(t) {
    $('time').textContent = `${fmt(t)} / ${fmt(axisLength())}`;
    $('aiStamp').textContent = fmt(t);
    if ($('lenNow')) $('lenNow').textContent = fmt(t);
  }
  function showTab(name) {
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
    document.querySelectorAll('#panel .tab').forEach((t) => t.classList.toggle('on', t.id === 'tab-' + name));
  }
  const AI_MARK = '<span class="ai-mark" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M7 2l1.5 4.5L13 8l-4.5 1.5L7 14l-1.5-4.5L1 8l4.5-1.5zM12.5 1l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z"/></svg></span>';
  const TICK = '<svg class="ai-tick" viewBox="0 0 16 16" aria-label="Done"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  function addMessage(kind, text, stamp) {
    const el = document.createElement('div');
    if (kind === 'me') {
      el.className = 'msg me';
      el.innerHTML = '<div class="bubble"><div class="ai-text"></div></div><div class="msg-meta"><button class="ai-stamp" type="button" tabindex="-1"></button></div>';
      el.querySelector('.ai-text').textContent = text;
      el.querySelector('.ai-stamp').textContent = stamp;
    } else if (kind === 'working') {
      el.className = 'msg ai';
      el.innerHTML = '<div class="ai-progress"><span class="typing"><i></i><i></i><i></i></span><span class="ai-progress-word"></span></div>';
      el.querySelector('.ai-progress-word').textContent = WORK_WORDS[0];
    } else {
      el.className = 'msg ai';
      el.innerHTML = `${AI_MARK}<div class="ai-card"><div class="ai-say"></div></div>`;
      el.querySelector('.ai-say').textContent = text;
    }
    $('aiList').appendChild(el);
    $('aiEmpty').classList.add('hidden');
    chatToEnd();
    return el;
  }
  // the chat's own box scrolls to the newest message, now and once the layout has settled (scrollIntoView would scroll the
  // website around the demo too)
  function chatToEnd() {
    const box = $('aiScroll');
    if (!box) return;
    box.scrollTop = box.scrollHeight;
    requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
    setTimeout(() => { box.scrollTop = box.scrollHeight; }, 450);   // after the suggestions have slid open (the chat got shorter)
  }
  function showSuggestions(on, list = SUGGESTIONS) {
    const box = $('aiSugs');
    if (!box) return;
    $('aiSugsIn').innerHTML = !on ? '' : '<div class="ai-sugs-title">Suggestions</div>' + list.map(([text, at]) =>
      `<div class="ai-sug"><span class="ai-sug-text"><span>${text}</span> <span class="ai-stamp">${fmt(at)}</span></span><button class="ai-sug-plus" type="button" aria-label="Add" tabindex="-1">${PLUS_SVG}</button></div>`).join('');
    box.classList.toggle('sugs-off', !on);
  }
  // The button under the chat, as the app labels it
  // (state "edit": a video the AI hasn't edited yet - the button edits it, the comment box stays hidden: .ai-foot.pre-edit)
  function setRun(state, n) {
    const run = $('aiRun');
    document.querySelector('.ai-foot').classList.toggle('pre-edit', state === 'edit' || state === 'running' && !S.edited);
    run.classList.toggle('idle', state === 'idle');
    run.classList.toggle('running', state === 'running');
    run.disabled = state !== 'ready' && state !== 'edit';
    if (state === 'running') run.innerHTML = '<span class="ai-spin"></span><span>AI is editing</span>';
    else if (state === 'edit') run.textContent = `Edit with AI · ${credits(PRICES.edit)}`;
    else run.textContent = state === 'ready' ? `Run AI on ${n} comment${n > 1 ? 's' : ''} · ${credits(PRICES.ask * n)}` : 'Add a comment to run the AI';
  }
  function setTimeline(open) {
    document.body.classList.toggle('tl-closed', !open);
    $('tlToggleText').textContent = 'Open timeline';
    if (open) { drawTimeline(); requestAnimationFrame(drawTimeline); }   // now, and again once the layout has settled
  }
  // The Export video window, filled the way the app fills it
  function fillExport() {
    $('xpName').value = PROJECTS[activeProject] + ' - edit';
    const seg = (id, names, on) => {
      $(id).innerHTML = names.map((n, i) => `<button type="button" tabindex="-1" aria-pressed="${i === on}"${i === on ? ' class="on"' : ''}>${n}</button>`).join('');
    };
    seg('xpSize', ['720p', '1080p', 'Original'], 1);
    seg('xpQuality', ['30 MB', 'High', 'Best'], 0);
    $('xpCaptions').checked = true;
    $('xpSummary').innerHTML = `<b>~24 MB</b>1080 × 1920 · ${fmt(axisLength()).replace(/\.\d$/, '')}`;
  }

  // The chat so far: the video was edited by the AI once and two changes were asked for and done
  const HISTORY = [['ai', 'Your video is ready to preview.'], ['me', 'Cut the part where I stumble', 2.4], ['me', 'Make the captions a bit bigger', 5.1], ['ai', 'Editing complete! You can take a look!']];
  function edited() {
    Object.assign(S, { edited: true, kept: KEPT.map((k) => k.slice()), zooms: ZOOMS.slice(), sfx: SOUNDS.slice(), overlays: OVERLAYS.slice(),
      zoomAt: 0.32, sel: null, drag: null, whoosh: 0, head: 0, extraCut: 0 });
  }

  function reset() {
    edited();
    document.body.classList.remove('ai-busy', 'first-edit');
    ['projectsEmpty', 'toast', 'exportDlg'].forEach((id) => $(id).classList.add('hidden'));
    // the demo stays in the open editor: a project the AI has edited once, its timeline open, its chat so far
    showStage('player');
    buildProjects('ready');
    setCredits(START_CREDITS);
    $('previewEdit').checked = true;
    showTab('ai');
    $('aiDisclaimer').classList.remove('hidden');
    $('aiEmpty').classList.add('hidden');
    $('aiList').innerHTML = '';
    for (const [kind, text, at] of HISTORY) {
      const el = addMessage(kind, text, fmt(at));
      if (kind === 'me') { el.classList.add('done'); el.querySelector('.msg-meta').insertAdjacentHTML('beforeend', TICK); }
    }
    showSuggestions(true);
    chatToEnd();
    $('aiCount').textContent = '';
    $('aiText').value = '';
    $('render').textContent = 'Export video';
    $('render').disabled = false;
    setRun('idle');
    setPlayIcon('play');
    $('timelineScroll').scrollLeft = 0;
    setTimeline(true);
    setLengths();
    setTime(0);
    buildTranscript();
    $('demoVideo').classList.remove('raw');   // the edited video, with its captions
    S.playing = false;
    videoCall((v) => { v.pause(); v.currentTime = 0; });
  }

  // Plays the edit from one moment to another on the timeline (the video, the playhead and the time follow)
  async function playTo(from, to) {
    await click($('play'));
    setPlayIcon('pause');
    playVideo();
    await tween((to - from) * 1000, (p) => {
      S.head = from + p * (to - from);
      setTime(S.head);
      drawPlayhead();
    });
    pauseVideo();
    await click($('play'), 450);
    setPlayIcon('play');
    await sleep(350);
  }
  /* Working on the timeline with the cursor: points are canvas pixels (x along the time, y down the tracks) */
  function canvasPoint(x, y) {
    const r = canvas.getBoundingClientRect();
    return [r.left + x, r.top + y];
  }
  async function cursorTo(x, y, ms) {
    const [px, py] = canvasPoint(x, y);
    cursor.style.transition = `transform ${ms}ms cubic-bezier(.22,.61,.36,1), opacity .3s`;
    cursor.style.transform = `translate(${px}px, ${py}px)`;
    await sleep(ms + 40);
  }
  // The cursor held down while something follows it: draw(p) moves the thing, follow(p) says where the cursor is
  async function drag(ms, draw, follow) {
    cursor.classList.add('clicking');
    cursor.style.transition = 'opacity .3s';
    await sleep(120);
    await tween(ms, (p) => {
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   // eased like a hand
      draw(e);
      drawTimeline();
      const [x, y] = canvasPoint(...follow(e));
      cursor.style.transform = `translate(${x}px, ${y}px)`;
    });
    await sleep(120);
    cursor.classList.remove('clicking');
  }
  async function pressAt(x, y, ms) {
    await cursorTo(x, y, ms || 600);
    cursor.classList.add('clicking');
    await sleep(130);
    cursor.classList.remove('clicking');
    await sleep(110);
  }
  // Glides the timeline sideways so a moment shows, like scrolling it by hand
  async function scrollTimelineTo(left, ms) {
    const sc = $('timelineScroll');
    const from = sc.scrollLeft;
    const to = Math.max(0, Math.min(sc.scrollWidth - sc.clientWidth, left));
    await tween(ms || 700, (p) => { sc.scrollLeft = from + (to - from) * (1 - Math.pow(1 - p, 3)); placeGutter(); });
  }

  // Writes a comment pinned to the playhead's moment and adds it to the chat
  async function comment(text, open) {
    await click($('aiText'));
    await type($('aiText'), text);
    await sleep(250);
    await click($('aiAdd'), 420);
    $('aiText').value = '';
    showSuggestions(false);
    const bubble = addMessage('me', text, fmt(S.head));
    $('aiCount').textContent = String(open);
    setRun('ready', open);
    await sleep(450);
    return bubble;
  }

  // One project in the open editor: watch, comment, run the AI, cut words, export. Then the next project opens.
  async function story() {
    await sleep(900);

    /* Watch, and write what to change at two moments */
    await playTo(0, PAUSE_AT);
    const first = await comment(COMMENT, 1);
    await playTo(PAUSE_AT, SECOND_AT);
    const second = await comment(COMMENT_2, 2);

    /* Run the AI on both comments */
    await click($('aiRun'));
    setCredits(S.credits - PRICES.ask * 2);
    setRun('running');
    const working = addMessage('working');
    await tween(2600, (p) => {
      working.querySelector('.ai-progress-word').textContent = WORK_WORDS[Math.min(WORK_WORDS.length - 1, Math.floor(p * WORK_WORDS.length))];
    });
    working.remove();
    for (const bubble of [first, second]) {
      bubble.classList.add('done');
      bubble.querySelector('.msg-meta').insertAdjacentHTML('beforeend', TICK);
    }
    $('aiCount').textContent = '';
    addMessage('ai', READY[(activeProject + 3) % READY.length]);
    setRun('idle');
    S.zooms = ZOOMS.concat(NEW_ZOOM);
    S.sfx = SOUNDS.concat(NEW_SOUND);
    S.whoosh = NEW_SOUND;
    drawTimeline();
    showSuggestions(true);

    /* Watch the change */
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

    /* Nudge the new whoosh a little later: grab it and drag it along its track */
    const lanes = () => S.lay.lanes;
    const pillX = () => srcToX(S.whoosh) + 28;
    await cursorTo(pillX(), lanes().s1.y + TL.LANE / 2, 700);
    const from = S.whoosh;
    const sfxAt = S.sfx.indexOf(S.whoosh);
    S.drag = 'sound';
    await drag(900, (p) => { S.whoosh = S.sfx[sfxAt] = from + 0.45 * p; }, () => [pillX(), lanes().s1.y + TL.LANE / 2]);
    S.drag = null;
    drawTimeline();
    await sleep(400);

    /* Scroll to the last clip, pick it and trim its end: the part dragged over is cut */
    const clip = S.kept.length - 1;
    const clipX = () => srcToTl(S.kept[clip][0]) * S.pxPerSec;
    const clipMid = () => (srcToTl(S.kept[clip][0]) + (S.kept[clip][1] - S.kept[clip][0]) / 2) * S.pxPerSec;
    const clipY = () => S.lay.clipY + S.lay.clipH / 2;
    // the clip's end (where the trim happens) always in view, its start too when the timeline is wide enough
    const view = $('timelineScroll').clientWidth - canvas.offsetLeft;
    const clipEnd = () => (srcToTl(S.kept[clip][0]) + S.kept[clip][1] - S.kept[clip][0]) * S.pxPerSec;
    await scrollTimelineTo(Math.max(clipX() - 24, clipEnd() - view + 70), 900);
    await pressAt(clipMid(), clipY(), 650);
    S.sel = clip;
    drawTimeline();
    await sleep(600);
    const edgeX = () => (srcToTl(S.kept[clip][0]) + S.kept[clip][1] - S.kept[clip][0]) * S.pxPerSec - 3;
    await cursorTo(edgeX(), clipY(), 500);
    const end0 = S.kept[clip][1];
    await drag(1000, (p) => { S.kept[clip][1] = end0 - 0.7 * p; }, () => [edgeX(), clipY()]);
    setLengths();
    setTime(S.head);
    await sleep(700);
    await pressAt(edgeX() + 60, S.lay.contentEnd + 8, 500);   // a click on the empty area lets go of the clip
    S.sel = null;
    drawTimeline();
    await sleep(400);

    /* Take the AI's suggestion: one click on + and the zoom is on the timeline */
    showTab('ai');
    const sugs = [...document.querySelectorAll('#aiSugsIn .ai-sug-plus')];
    await click(sugs[sugs.length - 1], 700);
    showSuggestions(true, SUGGESTIONS.slice(0, 1));
    const added = { ...SUG_ZOOM };
    S.zooms.push(added);
    S.drag = added;   // bright for a moment, so it's clear what just landed
    drawTimeline();
    await scrollTimelineTo(srcToX(added.start) - 160, 800);
    await sleep(900);
    S.drag = null;
    drawTimeline();
    await sleep(500);

    /* Zoom the timeline out with the slider to see the whole edit, then play it from the start */
    const bar = $('tlZoomBar');
    const knob = () => {
      const r = bar.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      return [r.left - c.left + r.width * S.zoomAt, r.top - c.top + r.height / 2];
    };
    await cursorTo(...knob(), 800);
    const sc = $('timelineScroll');
    const left0 = sc.scrollLeft;
    await drag(1100, (p) => { S.zoomAt = 0.32 * (1 - p); sc.scrollLeft = left0 * (1 - p); }, knob);
    await sleep(500);
    videoCall((v) => { v.currentTime = 0; });
    S.head = 0;
    setTime(0);
    drawPlayhead();
    await playTo(0, 6);

    /* Edit the words */
    const tabTranscript = document.querySelector('.tabs button[data-tab="transcript"]');
    await click(tabTranscript);
    showTab('transcript');
    await sleep(800);
    const picked = [...document.querySelectorAll('[data-drag]')];
    await moveTo(picked[0]);
    for (const word of picked) {
      await moveTo(word, 260);
      word.classList.add('sel');
    }
    await sleep(500);
    const del = document.querySelector('.tr-keys kbd');
    if (del) {
      del.classList.add('demo-lit');
      await sleep(240);
      del.classList.remove('demo-lit');
    }
    picked.forEach((w) => { w.classList.remove('sel'); w.classList.add('cut'); });
    S.extraCut = 1;
    setLengths();
    setTime(REPLAY_TO);
    drawTimeline();
    await sleep(1300);

    /* Export */
    const render = $('render');
    await click(render);
    fillExport();
    $('exportDlg').classList.remove('hidden');
    await sleep(900);
    await click($('xpGo'), 600);
    $('exportDlg').classList.add('hidden');
    render.disabled = true;
    document.body.classList.add('ai-busy');
    $('aiWorkTitle').textContent = 'Exporting';
    $('aiWorkBar').classList.remove('busy');
    $('aiWorkTime').textContent = '';
    $('aiWorkStep').textContent = "You can switch tabs. Don't close this page.";
    await tween(2600, (p) => {
      const pct = Math.round(p * 100);
      render.textContent = `Exporting ${pct}%`;
      $('aiWorkPct').textContent = pct + '%';
      $('aiWorkBar').firstElementChild.style.width = pct + '%';
      const ring = $('aiWorkRing');
      ring.classList.add('det');
      ring.querySelector('.a').style.strokeDasharray = `${Math.round(p * 157)} 157`;
    });
    document.body.classList.remove('ai-busy');
    $('aiWorkPct').textContent = '';
    $('aiWorkBar').firstElementChild.style.width = '0%';
    render.textContent = 'Export video';
    render.disabled = false;
    const toast = $('toast');
    toast.textContent = `Exported "${PROJECTS[activeProject]} - edit.mp4" (24 MB). It's in Downloads.`;
    toast.classList.remove('hidden');
    await sleep(2400);
    toast.classList.add('hidden');

    /* Start the next project */
    await click($('videoList').children[(activeProject + 1) % PROJECTS.length], 800);   // the next project opens, uploaded and not edited yet
    const swapping = document.querySelectorAll('.stage, .panel, .timeline-wrap');
    swapping.forEach((el) => el.classList.add('demo-swap'));
    await sleep(280);
    activeProject = (activeProject + 1) % PROJECTS.length;
    reset();
    swapping.forEach((el) => el.classList.remove('demo-swap'));
    await sleep(700);
  }

  /* Start */
  cursor = document.createElement('div');
  cursor.className = 'demo-cursor';
  cursor.innerHTML = '<svg viewBox="0 0 20 24" width="20" height="24" aria-hidden="true"><path d="M2 2v17.5l5-4.6 3.3 7.3 3.2-1.4-3.3-7.2H17z" fill="#fff" stroke="#0a0a0a" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  document.body.appendChild(cursor);
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
    voice: ['rgba(60,190,150,0.26)', 'rgba(80,205,165,0.85)'],
    sound: ['rgba(70,180,120,0.30)', 'rgba(95,200,140,0.85)'],
    text: '#e8e8ea'
  };
  const proRowY = (k) => PRO_ROWS.slice(0, k + 1).reduce((y, r, i) => y + r.gap + (i < k ? PRO.row : 0), PRO.ruler);
  const cssColor = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#0a0a0a';

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
      g.fillStyle = 'rgba(160,235,205,0.8)';
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

    // A3 sound effects (never past the end of the video)
    S.sfx.forEach((sec, i) => {
      const t = srcToTl(sec);
      block(4, t, Math.min(total, t + 0.7), COLORS.sound, soundName(sec, i));   // short hits, so many sounds never overlap
    });

    g.fillStyle = '#ffffff';
    g.fillRect(PRO.label + S.head * px, 0, 1.5, h);
  }

  // One look as a sample of "Hello there!", the way the app's picker draws it (always in TikTok Sans SemiBold)
  function lookSample(base, values, px) {
    const c = { ...base, ...values };
    const size = px * c.font_scale;
    const em = (n) => (n / 45).toFixed(3) + 'em';
    const said = c.max_words > 1 ? ['Hello', 'there!'] : ['Hello there!'];
    const word = (t, on) => {
      const w = document.createElement('span');
      w.textContent = c.uppercase ? t.toUpperCase() : t;
      w.style.display = 'inline-block';
      if (on && c.active_mode === 'color') w.style.color = c.active_color;
      if (on && c.active_mode === 'box') { w.style.background = c.active_end_color ? `linear-gradient(90deg, ${c.active_color}, ${c.active_end_color})` : c.active_color; w.style.color = c.active_text_color; w.style.padding = '0 .25em'; w.style.borderRadius = em(c.box_radius); }
      if (on && c.active_scale > 1) w.style.fontSize = c.active_scale + 'em';
      return w;
    };
    const inner = document.createElement('span');
    inner.className = 'inner';
    inner.style.color = c.text_color;
    said.forEach((t, i) => { if (i) inner.append(' '); inner.append(word(t, c.active_mode !== 'off' && i === said.length - 1)); });
    if (c.style === 'box') {
      inner.style.background = c.box_end_color ? `linear-gradient(90deg, ${c.box_color}, ${c.box_end_color})` : c.box_color;
      inner.style.padding = `${em(c.box_pad_y)} ${em(c.box_pad_x)}`;
      inner.style.borderRadius = em(c.box_radius);
    }
    if (c.style === 'outline') { inner.style.webkitTextStroke = (c.outline_width * size / 45 * 2).toFixed(1) + 'px ' + c.outline_color; inner.style.paintOrder = 'stroke fill'; }
    const shadows = [];
    if (c.glow) shadows.push(`0 0 ${c.glow * size / 45}px ${c.glow_color}`, `0 0 ${c.glow * size / 45}px ${c.glow_color}`);
    if (c.shadow) shadows.push(`0 ${c.shadow * size / 45}px 0 ${c.shadow_color || '#000'}`);
    if (shadows.length) inner.style.textShadow = shadows.join(', ');
    const sample = document.createElement('div');
    sample.className = 'cs-sample';
    sample.style.cssText = `font: 600 ${size}px/1 "TikTok Sans SemiBold", Inter, sans-serif`;
    const row = document.createElement('div');
    row.className = 'row-line';
    row.append(inner);
    sample.append(row);
    return { sample, tilt: c.tilt };
  }
  function buildLooks(data) {
    const cats = ['All', 'Simple', 'Colorful', 'Active', 'Hook'];
    $('capPicker').classList.add('open');
    $('capPicker').setAttribute('aria-hidden', 'false');
    $('csPills').innerHTML = cats.map((c, i) => `<button${c === 'Simple' ? ' class="on"' : ''}>${c}</button>`).join('');
    data.looks = data.looks.filter((t) => t.cats.includes('simple'));   // the Simple tab
    $('csCount').textContent = `${data.looks.length} styles`;
    $('csList').innerHTML = '';
    for (const t of data.looks) {
      const v = { ...data.base, ...t.values };
      const card = document.createElement('div');
      card.className = 'cs-card' + (t.id === 'clean' ? ' on' : '');
      card.innerHTML = '<div class="cs-card-view cs-look"></div><div class="cs-card-foot"><span class="cs-card-name"></span><span class="cs-swatches"></span></div>';
      card.querySelector('.cs-card-name').textContent = t.name;
      const colors = [v.text_color, v.active_mode !== 'off' && v.active_color, v.style === 'box' && v.box_color, v.box_end_color, v.style === 'outline' && v.outline_width && v.outline_color, v.glow && v.glow_color];
      for (const color of [...new Set(colors.filter(Boolean))].slice(0, 3)) { const dot = document.createElement('i'); dot.style.background = color; card.querySelector('.cs-swatches').appendChild(dot); }
      $('csList').appendChild(card);
      const host = card.querySelector('.cs-card-view');
      const { sample, tilt } = lookSample(data.base, t.values, 26);
      host.replaceChildren(sample);
      const fit = Math.min(1, (host.clientWidth - 28) / sample.offsetWidth, (host.clientHeight - 24) / sample.offsetHeight);
      sample.style.transform = `translate(-50%, -50%) scale(${fit}) rotate(${tilt}deg)`;
    }
  }
  // ?feature=<name>: the real editor frozen on one moment, for the features list on the home page (the page crops to the part it shows)
  const FEATURE = (location.search.match(/[?&]feature=([a-z]+)/) || [])[1];
  if (FEATURE) {
    document.body.classList.add('demo-feature');
    document.body.dataset.feature = FEATURE;
    $('demoStill').src = 'video-still.jpg';
    $('demoVideo').classList.remove('raw');
    reset();
    const tab = { transcript: 'transcript', ai: 'ai' }[FEATURE];
    if (tab) showTab(tab);
    S.head = { zooms: 12.2, sfx: 19.9 }[FEATURE] || PAUSE_AT;
    setTime(S.head);
    setTimeline(true);
    if (FEATURE !== 'ai') showSuggestions(false);
    if (FEATURE === 'ai') {
      $('aiDisclaimer').classList.add('hidden');
      $('aiList').firstElementChild.style.display = 'none';   // the first line, so both comments and the answer fit
      $('aiScroll').scrollTop = 0;
    }
    if (FEATURE === 'cuts') {
      // zoomed out so two cuts show (the first and second clip, the second and third), the playhead on the first
      S.zoomAt = 0.28;
      S.head = KEPT[0][1] - KEPT[0][0];
      setTime(S.head);
      setTimeline(true);
      $('timelineScroll').scrollLeft = Math.max(0, S.head * S.pxPerSec - 190);
      drawTimeline();
      requestAnimationFrame(() => { $('timelineScroll').scrollLeft = Math.max(0, S.head * S.pxPerSec - 190); drawTimeline(); drawPlayhead(); });
    }
    // a panel card shows just the card it is about (siblings hidden)
    const only = (id) => { const card = $(id).closest('.ps-card'); [...card.parentElement.children].forEach((e) => { if (e !== card) e.style.display = 'none'; }); card.style.margin = '0 16px'; };
    if (FEATURE === 'zooms') {
      // the zoom's settings panel, as the app builds it for a zoom chip (type, level, length; the delete button)
      const pop = $('pop');
      pop.className = 'pop pop-zoom';
      pop.innerHTML = `<div class="pop-head zp-head"><button class="pop-when zp-when" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.2"/><path d="m10.2 10.2 3.3 3.3M5 7h4M7 5v4"/></svg><span class="zt">0:12.2 – 0:13.8</span><i class="zd">1.6s</i></button>
        <button class="row-del" aria-label="Delete zoom"><svg viewBox="0 0 16 16"><path class="bin" d="M2.75 4.25h10.5M6.25 4.25V3c0-.55.45-1 1-1h1.5c.55 0 1 .45 1 1v1.25M4 4.25l.6 8.35c.06.8.72 1.4 1.5 1.4h3.8c.78 0 1.44-.6 1.5-1.4L12 4.25M6.75 6.75v4.5M9.25 6.75v4.5"/></svg></button></div>
        <div class="zp-seg" role="radiogroup" aria-label="Type">${[['push', 'Zoom in'], ['pull', 'Zoom out'], ['punch', 'Punch']].map(([v, l]) => `<button data-v="${v}" class="${v === 'push' ? 'on' : ''}" type="button">${l}</button>`).join('')}</div>
        <div class="zp-tile field zscale"><div class="field-top"><span>Level</span><label class="zp-lvl"><input type="number" value="125"><span>%</span></label></div><input type="range" min="100" max="150" step="1" value="125" style="--p:50%"></div>
        <div class="zp-tile zp-row zlen"><span class="zp-label">Length</span><div class="zp-input"><button class="zp-step" type="button">−</button><label class="zp-num"><input type="number" value="1.6"><span>s</span></label><button class="zp-step" type="button">+</button></div></div>`;
    }
    if (FEATURE === 'sfx') {
      // the Pro view: every track, with the sound effects on the bottom one
      document.querySelectorAll('.viewtoggle button').forEach((b) => b.classList.toggle('on', b.dataset.view === 'pro'));
      document.body.classList.add('view-pro');
      $('timelineScroll').classList.add('hidden');
      $('proScroll').classList.remove('hidden');
      drawPro();
    }
    if (FEATURE === 'presets') {
      showTab('settings');
      $('creator').innerHTML = '<option>UGC ad</option>';
      $('presetTitle').value = 'UGC ad';
      ['pcEnabled', 'pa_ai_first_edit', 'pa_ai_zooms', 'pa_ai_sfx', 'pa_ai_highlights'].forEach((id) => { $(id).checked = true; });
      only('pa_ai_first_edit');
    }
    if (FEATURE === 'captions') {
      // the Captions style window, with the app's own list of looks (caption-looks.json, made by tools/build.py)
      fetch('caption-looks.json').then((r) => r.json()).then(buildLooks);
    }
    return;
  }

  // ?still: a single finished frame with no animation (used in the login window)
  if (location.search.includes('still')) {
    document.body.classList.add('demo-still');
    $('demoStill').src = 'video-still.jpg';
    showStage('player');
    buildProjects('ready');
    S.edited = true;
    S.kept = KEPT;
    S.zooms = ZOOMS.concat(NEW_ZOOM);
    S.sfx = SOUNDS.concat(NEW_SOUND);
    S.whoosh = NEW_SOUND;
    S.overlays = OVERLAYS.slice();
    S.head = PAUSE_AT;
    $('render').disabled = false;
    $('aiDisclaimer').classList.remove('hidden');
    addMessage('ai', READY[0]);
    setRun('idle');
    setLengths();
    setTime(PAUSE_AT);
    setTimeline(true);
    // the Pro view, switched on the way the app's setView does it
    document.querySelectorAll('.viewtoggle button').forEach((b) => b.classList.toggle('on', b.dataset.view === 'pro'));
    document.body.classList.add('view-pro');
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
  // The demo is a product film the visitor chose to open the page for, so it plays even with the system's reduced-motion setting on
  addEventListener('message', (e) => {
    // Only the page that frames us may control the demo
    if (e.source !== window.parent || (location.origin !== 'null' && e.origin !== location.origin)) return;
    if (e.data !== 'demo-play' && e.data !== 'demo-pause') return;
    paused = e.data === 'demo-pause';
    if (S.playing) videoCall((v) => (paused ? v.pause() : v.play()));
    if (!paused && !started) {
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
