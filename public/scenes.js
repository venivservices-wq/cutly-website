// Draws the placeholder cinematic artwork as SVG, so the site has no third-party media.
// To use real media, replace a scene with an <img> or <video> in the same container.
(function () {
  const PALETTES = {
    canyon:  { sky: ['#1b2a4a', '#b5532a', '#f0a55c'], glow: '#ffd9a0', land: ['#7a2f1b', '#55200f', '#2c1009'], kind: 'ridges' },
    storm:   { sky: ['#05090f', '#1b3142', '#51717f'], glow: '#b8d4dd', land: ['#172a35', '#0d1b23', '#050b10'], kind: 'sea' },
    dusk:    { sky: ['#180f33', '#6d2a6b', '#f06e5e'], glow: '#ffc08a', land: ['#3a1a4d', '#231038', '#0e0719'], kind: 'ridges' },
    neon:    { sky: ['#06080f', '#10204a', '#2563eb'], glow: '#34d399', land: ['#0b1433', '#080e24', '#040712'], kind: 'city' },
    amber:   { sky: ['#080a14', '#1e2a6b', '#4f46e5'], glow: '#a5b4fc', land: ['#131a45', '#0d1230', '#060818'], kind: 'city' },
    pine:    { sky: ['#0a1a1c', '#1f4a44', '#a7bb8e'], glow: '#e6edb8', land: ['#17392f', '#0e2620', '#061410'], kind: 'forest' },
    frost:   { sky: ['#0f1a2e', '#3b5a8c', '#dbe4ff'], glow: '#ffffff', land: ['#2d4670', '#1a2c4a', '#0c1626'], kind: 'ridges' },
    orbit:   { sky: ['#020308', '#0a1024', '#1a2a4a'], glow: '#d7e5ff', land: ['#10141f', '#090c14', '#04050a'], kind: 'space' },
    sunrise: { sky: ['#0b1a2a', '#0e9f6e', '#7dd3fc'], glow: '#ecfeff', land: ['#0c4a3a', '#0a3029', '#06181a'], kind: 'sea' },
    ember:   { sky: ['#0d0504', '#47150e', '#d14d1e'], glow: '#ffb35e', land: ['#2a0d08', '#190705', '#090302'], kind: 'forest' },
    studio:  { sky: ['#0a0a0d', '#1c1c24', '#3c3a48'], glow: '#ffc9a3', land: [], kind: 'portrait' },
    teal:    { sky: ['#06141a', '#0b5b52', '#0e9f6e'], glow: '#bbf7d0', land: [], kind: 'portrait' },
    rose:    { sky: ['#120a2a', '#5b21b6', '#7c3aed'], glow: '#ddd6fe', land: [], kind: 'portrait' },
    gold:    { sky: ['#140e05', '#4f3711', '#b98a33'], glow: '#fff0b8', land: [], kind: 'portrait' },
    lilac:   { sky: ['#2563eb', '#6d5bea', '#c4b5fd'], glow: '#f5f3ff', land: [], kind: 'portrait' },
    peach:   { sky: ['#7c3aed', '#a78bfa', '#e0e7ff'], glow: '#ffffff', land: [], kind: 'portrait' },
    mint:    { sky: ['#0e9f6e', '#5eead4', '#d1fae5'], glow: '#ffffff', land: [], kind: 'portrait' }
  };

  function rng(seed) {
    let s = seed >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  }
  const hash = (t) => [...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

  function ridges(p, r) {
    return p.land.map((fill, i) => {
      const base = 520 + i * 130;
      let d = `M0 900L0 ${base}`;
      for (let x = 0; x <= 1600; x += 80) d += `L${x} ${(base + (r() - .5) * (190 - i * 30)).toFixed(0)}`;
      return `<path d="${d}L1600 900Z" fill="${fill}"/>`;
    }).join('');
  }
  function sea(p, r) {
    let out = '';
    p.land.forEach((fill, i) => {
      const base = 500 + i * 130, amp = 26 + i * 26, len = 180 + r() * 90, off = r() * 300;
      let d = `M0 900L0 ${base}`;
      for (let x = -40; x <= 1680; x += 40) d += `L${x} ${(base + Math.sin((x + off) / len * 6.28) * amp).toFixed(0)}`;
      out += `<path d="${d}L1600 900Z" fill="${fill}"/>`;
    });
    for (let i = 0; i < 70; i++) out += `<rect x="${(r() * 1600).toFixed(0)}" y="${(520 + r() * 340).toFixed(0)}" width="${(20 + r() * 90).toFixed(0)}" height="1.5" fill="${p.glow}" opacity="${(r() * .28).toFixed(2)}"/>`;
    return out;
  }
  function city(p, r) {
    let out = '';
    p.land.forEach((fill, i) => {
      for (let x = -30; x < 1620;) {
        const w = 60 + r() * 110, h = 210 + r() * (430 - i * 110), top = 900 - h;
        out += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${fill}"/>`;
        for (let wy = top + 16; wy < 880; wy += 24) for (let wx = x + 9; wx < x + w - 10; wx += 18) {
          if (r() > .72) out += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="8" height="12" fill="${p.glow}" opacity="${(.2 + r() * .55).toFixed(2)}"/>`;
        }
        x += w + 4;
      }
    });
    return out;
  }
  function forest(p, r) {
    let out = '';
    p.land.forEach((fill, i) => {
      const ground = 640 + i * 90;
      out += `<rect y="${ground}" width="1600" height="${900 - ground}" fill="${fill}"/>`;
      for (let x = -20; x < 1620; x += 34 + r() * 46) {
        const h = 170 + r() * (170 + i * 90), w = 44 + r() * 44;
        out += `<path d="M${x.toFixed(0)} ${(ground - h).toFixed(0)}L${(x + w).toFixed(0)} ${ground + 4}L${(x - w).toFixed(0)} ${ground + 4}Z" fill="${fill}"/>`;
      }
    });
    return out;
  }
  function space(p, r) {
    let out = '';
    for (let i = 0; i < 240; i++) out += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 640).toFixed(0)}" r="${(r() * 1.7 + .3).toFixed(1)}" fill="#fff" opacity="${(r() * .9).toFixed(2)}"/>`;
    out += `<path d="M710 900 L770 430 Q800 290 830 430 L890 900Z" fill="#c7ccd6" opacity=".9"/><path d="M800 300 Q830 430 830 900 L890 900 L830 430 Q816 340 800 300Z" fill="#555c6b"/>`;
    return out + `<path d="M0 900L0 790Q800 700 1600 790L1600 900Z" fill="${p.land[2]}"/>`;
  }
  function portrait(p, r) {
    const x = 800 + (r() - .5) * 200;
    return `<g><ellipse cx="${x}" cy="400" rx="130" ry="168" fill="#08080b"/><path d="M${x - 330} 900Q${x - 300} 610 ${x} 590Q${x + 300} 610 ${x + 330} 900Z" fill="#08080b"/><path d="M${x + 128} 390Q${x + 118} 250 ${x + 30} 233Q${x + 96} 300 ${x + 106} 400Q${x + 112} 500 ${x + 62} 556Q${x + 132} 490 ${x + 128} 390Z" fill="${p.glow}" opacity=".85"/><path d="M${x + 320} 900Q${x + 300} 640 ${x + 110} 600Q${x + 262} 660 ${x + 286} 900Z" fill="${p.glow}" opacity=".5"/></g>`;
  }
  const DRAW = { ridges, sea, city, forest, space, portrait };

  // Returns the SVG markup for a palette name; the variant changes the random layout.
  window.sceneSvg = function (name, variant) {
    const p = PALETTES[name] || PALETTES.canyon;
    const key = name + (variant || 0);
    const id = 's' + hash(key).toString(36);
    const r = rng(hash(key));
    const gx = 15 + r() * 70, gy = 28 + r() * 26;
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset=".55" stop-color="${p.sky[1]}"/><stop offset="1" stop-color="${p.sky[2]}"/></linearGradient>
        <radialGradient id="${id}b" cx="${gx}%" cy="${gy}%" r="48%"><stop offset="0" stop-color="${p.glow}" stop-opacity=".85"/><stop offset=".2" stop-color="${p.glow}" stop-opacity=".3"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}d" cx="50%" cy="50%" r="72%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".68"/></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#${id}a)"/>
      <rect width="1600" height="900" fill="url(#${id}b)"/>
      ${DRAW[p.kind](p, r)}
      <rect width="1600" height="900" fill="url(#${id}d)"/>
    </svg>`;
  };

  // Wrapper element with the scene inside.
  window.sceneHtml = function (name, variant, opts) {
    const o = opts || {};
    return `<div class="art${o.cls ? ' ' + o.cls : ''}">${window.sceneSvg(name, variant)}${o.inner || ''}</div>`;
  };
})();
