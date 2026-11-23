(function () {
  const S = window.SITE;
  const $ = (id) => document.getElementById(id);
  const chevron = '<svg viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

  // The main button's hover light follows the mouse, easing towards it instead of jumping
  document.querySelectorAll('.hero-cta .btn-primary').forEach((b) => {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, inside = false;
    const tick = () => {
      cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14;
      b.style.setProperty('--mx', cx.toFixed(1) + 'px'); b.style.setProperty('--my', cy.toFixed(1) + 'px');
      raf = (inside || Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) ? requestAnimationFrame(tick) : 0;
    };
    b.addEventListener('pointerenter', (e) => { const r = b.getBoundingClientRect(); tx = cx = e.clientX - r.left; ty = cy = e.clientY - r.top; inside = true; if (!raf) raf = requestAnimationFrame(tick); });
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; });
    b.addEventListener('pointerleave', () => { inside = false; tx = b.offsetWidth / 2; ty = b.offsetHeight / 2; });
  });

  /* Example videos: one straight row, side by side. Only the ones on screen play (muted, looping); a click turns one's sound on. */
  $('showcaseList').innerHTML = S.showcase.map((c) => `<div data-gsap-slider-item="" class="gsap-slider__item"><div class="product-card"><div class="product-card__before"></div><video muted loop playsinline preload="none" data-wistia="${c.wistia}"></video></div></div>`).join('');
  const showcaseVideos = [...document.querySelectorAll('#showcaseList video')];
  // Only an https address on Wistia's own hosts may become a video file or a cover picture
  const wistiaUrl = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && /(^|\.)wistia\.(com|net)$/.test(x.hostname) ? x.href : ''; } catch (e) { return ''; } };
  for (const id of new Set(S.showcase.map((c) => c.wistia))) {
    fetch(`https://fast.wistia.com/embed/medias/${id}.json`).then((r) => r.json()).then(({ media }) => {
      const assets = Array.isArray(media && media.assets) ? media.assets : [];
      const mp4s = assets.filter((a) => a.container === 'mp4' && wistiaUrl(a.url)).sort((a, b) => a.height - b.height);
      const file = mp4s.find((a) => a.height >= 540) || mp4s[mp4s.length - 1];
      const still = assets.find((a) => a.type === 'still_image' && wistiaUrl(a.url));
      showcaseVideos.filter((v) => v.dataset.wistia === id).forEach((v) => {
        if (still) v.poster = still.url;
        if (file) { v.src = file.url; if (v.dataset.on) v.play().catch(() => {}); }
      });
    }).catch(() => { /* the dark card stays as it is */ });
  }

  /* The site's painted card backgrounds, used by the reviews, the why section and pricing. Each is a small landscape: a sky, a misty band and a wavy hill,
     blurred together so the horizon glows. Colors per card: [sky top, sky bottom, mist, hill]. */
  const SCENES = [
    ['#1d6fe0', '#3b9bea', '#e8f6ff', '#0b6b47'],
    ['#05070d', '#0d1433', '#5b8def', '#1d4ed8'],
    ['#f3f0ff', '#e4dcff', '#ffffff', '#8b5cf6'],
    ['#5b21b6', '#7c3aed', '#f5d0fe', '#2563eb']
  ];
  const WAVES = [
    ['M-40 250C40 205 120 300 200 255S330 215 380 245', 'M-40 288C50 252 130 322 210 287S330 262 380 282'],
    ['M-40 262C60 230 140 290 230 250S340 238 380 252', 'M-40 296C70 270 150 316 240 284S340 276 380 290'],
    ['M-40 246C30 280 120 220 210 258S330 270 380 236', 'M-40 284C40 312 130 262 220 292S330 300 380 272'],
    ['M-40 256C50 222 150 286 230 248S330 230 380 258', 'M-40 290C60 262 160 314 240 280S330 270 380 294']
  ];
  const reviewScene = (i, id = `rv${i}`, blur = 13) => {
    const [top, bottom, mist, hill] = SCENES[i % SCENES.length];
    const [mistPath, hillPath] = WAVES[i % WAVES.length];
    const down = ' L380 460L-40 460Z';
    return `<svg class="review-bg" viewBox="0 0 340 402" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="${id}Sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".6" stop-color="${bottom}"/></linearGradient>
        <filter id="${id}Soft" filterUnits="userSpaceOnUse" x="-120" y="-120" width="580" height="700"><feGaussianBlur stdDeviation="${blur}"/></filter>
      </defs>
      <rect width="340" height="402" fill="url(#${id}Sky)"/>
      <g filter="url(#${id}Soft)"><path d="${mistPath}${down}" fill="${mist}"/><path d="${hillPath}${down}" fill="${hill}"/></g>
    </svg>`;
  };

  /* Features accordion, each feature with a coded mockup of the editor */
  $('toolList').innerHTML = S.tools.map((t, i) => `<div class="tool">
    <div class="tool-main">
      <button class="tool-head" type="button" aria-expanded="false"><span>0${i + 1}</span><span>${t.title}</span><i aria-hidden="true"><svg viewBox="0 0 18 18"><path d="M9 3v12M3 9h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></i></button>
      <div class="tool-reveal tool-copy"><div><p class="tool-text">${t.text}</p></div></div>
    </div>
    <div class="tool-reveal tool-side"><div><div class="tool-shot"><div class="tool-ui fui-fit fui-${t.ui}"></div></div></div></div>
  </div>`).join('');
  const tools = [...$('toolList').children];
  function openTool(i) {
    tools.forEach((t, j) => {
      t.classList.toggle('open', j === i);
      t.querySelector('.tool-head').setAttribute('aria-expanded', j === i);
      // the real editor loads only when its row is opened, once; the hover preview is a plain image
      const box = t.querySelector('.tool-ui');
      if (j === i && !box.firstChild) { box.innerHTML = featureUi(S.tools[j].ui); fitFeatureUi(box); }
    });
  }
  tools.forEach((tool, i) => {
    tool.querySelector('.tool-head').addEventListener('click', () => openTool(i));
  });
  openTool(0);
  // Hovering a closed row shows its preview image next to the cursor (mouse only)
  if (matchMedia('(hover: hover)').matches) {
    const preview = document.createElement('div');
    preview.className = 'tool-preview';
    preview.setAttribute('aria-hidden', 'true');
    document.body.appendChild(preview);
    const hide = () => preview.classList.remove('show');
    tools.forEach((tool, i) => {
      const head = tool.querySelector('.tool-head');
      head.addEventListener('mouseenter', () => {
        if (tool.classList.contains('open')) return;
        // the finished picture of the row, a small image: no live frame is loaded on hover
        preview.innerHTML = `<img class="tool-img" src="assets/features/feature-${i + 1}.webp?v=9" width="1240" height="776" alt="">`;
        preview.classList.add('show');
      });
      head.addEventListener('mousemove', (e) => { preview.style.translate = `${e.clientX + 28}px ${e.clientY - 80}px`; });
      head.addEventListener('mouseleave', hide);
      head.addEventListener('click', hide);
    });
    addEventListener('scroll', hide, { passive: true });
  }

  /* Why creators choose us: stat cards that state the claim then show the two numbers, a "no waiting" card and perk cards */
  const W = S.why;
  const check = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l3.5 3.5L16 5.5"/></svg>';
  $('whyGrid').innerHTML =
    W.stats.map((st) => `<article class="why-stat${st.dark ? ' why-dark' : ''}">${st.dark ? reviewScene(0, 'whyCost', 30) : ''}
      <span class="why-label">${st.label}</span>
      <h3>${st.title}<span>${st.vs}</span></h3>
      <div class="why-vs">
        <div class="was"><span>${st.from.name}</span><strong>${st.from.value}</strong></div>
        <div class="now"><span>${st.to.name}</span><strong>${st.to.value}</strong></div>
      </div>
    </article>`).join('') +
    `<article class="why-wait">
      <div class="why-wait-text"><span class="why-label">${W.wait.label}</span><h3>${W.wait.title}<span>${W.wait.vs}</span></h3></div>
      <div class="why-stage" aria-hidden="true">${reviewScene(3, 'whyWait', 30)}</div>
      <div class="why-chat" aria-hidden="true">
        <div class="why-chat-label"><span>${W.wait.before[0]}</span><b>${W.wait.before[1]}</b></div>
        ${W.wait.chat.map(([who, text, when]) => `<div class="why-msg ${who}"><span>${text}<small>${when}</small></span></div>`).join('')}
        <div class="why-chat-label ours"><span>${W.wait.after[0]}</span><b>${W.wait.after[1]}</b></div>
        <div class="why-ready">${check}<span>${W.wait.ready}</span></div>
      </div>
    </article>` +
    W.perks.map((p) => `<article class="why-perk"><span class="why-label">${p.label}</span><h3>${p.title}<span>${p.vs}</span></h3></article>`).join('');

  /* Reviews: real ones (with text) as written, the rest still placeholders. A follower count shows only when one was given. */
  $('reviewList').innerHTML = S.reviews.map((r, i) => `<article class="review">
    <p>${r.text ? r.text.replace(r.mark, `<mark>${r.mark}</mark>`) : 'Add a real customer review here, in their own words, about <mark>what they made with Cutly</mark>.'}</p>
    <div class="reviewer">${r.photo ? `<img class="art" src="${r.photo}" width="40" height="40" alt="" loading="lazy">` : sceneHtml(r.face, i + 40)}<span>${r.name}${r.followers ? `<small>${r.followers} followers</small>` : r.text ? '' : '<small>000K followers</small>'}</span></div>
  </article>`).join('');

  /* Pricing: a gray card, a split card with a painted top, and a black card. Each lists its credits, then every feature (ticked or greyed), so the rows line up across all three. */
  const tick = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.6"/></svg>';
  const dash = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8"/></svg>';
  $('planList').innerHTML = S.plans.map((p) => `<article class="plan plan-${p.name.toLowerCase()}${p.popular ? ' plan-pop' : ''}">
      <div class="plan-head">${p.popular ? reviewScene(0, 'planPop', 30) : ''}
        <div class="plan-top"><h3>${p.name}</h3>${p.popular ? '<b>Most popular</b>' : ''}</div>
        <div class="plan-price"><strong>$${+(p.aboutVideos * p.perVideo).toFixed(2)}</strong><span>/ month</span></div>
        <p class="plan-videos">${p.credits} credits a month</p>
      </div>
      <div class="plan-body">
        <a class="btn btn-lg plan-btn" href="#try">Choose ${p.name}</a>
        <ul><li>${tick}${p.credits} credits (around ${p.aboutVideos} videos)</li>${S.planFeatures.map((f, n) => (n < p.level ? `<li>${tick}${f}</li>` : `<li class="off">${dash}${f}</li>`)).join('')}</ul>
      </div>
    </article>`).join('');

  /* FAQ: opening one question closes the others */
  const plus = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 3v12M3 9h12"/></svg>';
  $('faqList').innerHTML = S.faq.map(([q, a]) => `<div class="faq-item">
      <button class="faq-q" type="button" aria-expanded="false">${q}${plus}</button>
      <div class="faq-a"><div><p>${a}</p></div></div>
    </div>`).join('');
  $('faqList').addEventListener('click', (e) => {
    const button = e.target.closest('.faq-q');
    if (!button) return;
    const item = button.parentElement;
    const opening = !item.classList.contains('open');
    $('faqList').querySelectorAll('.faq-item').forEach((other) => {
      const open = opening && other === item;
      other.classList.toggle('open', open);
      other.querySelector('.faq-q').setAttribute('aria-expanded', open);
    });
  });

  /* The header gets its scrolled look once the page moves */
  const siteHeader = document.querySelector('.site-header');
  const onScroll = () => {
    siteHeader.classList.toggle('scrolled', scrollY > 8);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Sections fade in as they arrive */
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        seen.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.fade-in').forEach((el) => seen.observe(el));
})();

// Hero flow: a fluid gradient drawn by the graphics card. The picture is a warped colour field (a new random one each visit); the pointer swirls it and
// pushes it along, and it keeps flowing for a moment after the pointer stops, then settles (the loop stops itself). Scrolling pushes it too (phones).
(() => {
  const box = document.querySelector('.hero-flow'), cv = box && box.querySelector('canvas');
  if (!cv) return;
  const calm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;
  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `precision mediump float;
uniform vec2 uRes, uM; uniform float uV, uT, uS;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0) * 2.1;
  vec2 m = (uM - 0.5) * vec2(asp, 1.0) * 2.1;
  vec2 d = p - m; float inf = exp(-dot(d, d) * 1.5);
  p += vec2(-d.y, d.x) * inf * 0.45;
  float s = uS, T = uT;
  vec2 q = p;
  q += 0.60 * vec2(sin(q.y * 1.6 + T * 0.9 + s * 6.0), cos(q.x * 1.4 - T * 0.7 + s * 3.0));
  q += 0.34 * vec2(sin(q.y * 3.0 - T * 0.6 + s * 2.0), cos(q.x * 2.6 + T * 0.8 + s * 5.0));
  q += 0.15 * vec2(sin(q.y * 5.1 + T * 0.5 + s), cos(q.x * 4.5 - T * 0.4 + s * 4.0));
  float f1 = sin(q.x * 1.25 + q.y * 0.85 + s) * 0.5 + 0.5;
  float f2 = sin(q.x * 0.95 - q.y * 1.35 + s * 2.0 + 1.7) * 0.5 + 0.5;
  float f3 = sin(length(q - vec2(0.5 * sin(s * 4.0), 0.25)) * 2.0 + s * 3.0) * 0.5 + 0.5;
  vec3 base = vec3(0.965, 0.968, 0.99);
  vec3 c = base;
  c = mix(c, vec3(0.74, 0.68, 1.00), smoothstep(0.28, 0.78, f2));               // lavender (soft but defined edge)
  c = mix(c, vec3(0.16, 0.70, 1.00), smoothstep(0.50, 0.92, f3) * 0.92);        // sky
  c = mix(c, vec3(0.16, 0.36, 1.00), smoothstep(0.40, 0.88, f1) * 0.7);               // electric blue
  c = mix(c, vec3(0.07, 0.17, 0.80), smoothstep(0.66, 1.00, f1) * 0.4);        // deep royal blue core
  c = mix(c, vec3(0.52, 0.26, 0.96), smoothstep(0.55, 1.00, f2 * f3 + 0.12) * 0.5);   // violet where they overlap
  float veil = smoothstep(1.05, 0.12, length((uv - vec2(0.5, 0.40)) * vec2(0.8, 1.25)));   // the colour thins out behind the headline so the text stays easy to read
  c = mix(c, base, veil * 0.94);
  c = mix(base, c, 0.78);   // one overall softness so no part is much stronger than the rest
  gl_FragColor = vec4(c, 1.0);
}`;
  const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; };
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uM = U('uM'), uV = U('uV'), uT = U('uT'), uS = U('uS');
  const seed = (typeof window.__hfSeed === 'number') ? window.__hfSeed : 5.8;   // fixed: the same shape on every visit
  let T = seed * 2.3, mx = 0.5, my = 0.6, tx = 0.5, ty = 0.6, V = 0, push = 0, raf = 0, last = 0, lastY = scrollY;
  const size = () => {
    const w = Math.max(2, Math.ceil(box.clientWidth * 0.5)), h = Math.max(2, Math.ceil(box.clientHeight * 0.5));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
  };
  const draw = () => {
    size();
    gl.uniform2f(uRes, cv.width, cv.height); gl.uniform2f(uM, mx, my); gl.uniform1f(uV, 0); gl.uniform1f(uT, T % 200); gl.uniform1f(uS, seed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  // Everything is eased by TIME (not per frame), so a fast or slow screen moves the same, and nothing follows the raw pointer jumps:
  // the pointer's place glides to the target (about a third of a second), the flow speed rises slowly with how fast it glides and fades out over ~2 seconds.
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    const px = mx, py = my, k = 1 - Math.exp(-dt / 0.35);
    mx += (tx - mx) * k; my += (ty - my) * k;
    push *= Math.exp(-dt / 1.1);
    const want = Math.min(0.8, Math.hypot(mx - px, my - py) / dt * 1.2 + push);
    V += (want - V) * (1 - Math.exp(-dt / (want > V ? 0.7 : 2.0)));
    T += V * dt;
    draw();
    if (V > 0.004 || push > 0.004 || Math.abs(tx - mx) + Math.abs(ty - my) > 0.0006) raf = requestAnimationFrame(frame); else last = 0;
  };
  const kick = () => { if (!calm && !raf) raf = requestAnimationFrame(frame); };
  window.addEventListener('pointermove', (e) => {
    const r = box.getBoundingClientRect();
    tx = Math.max(-0.2, Math.min(1.2, (e.clientX - r.left) / r.width)); ty = Math.max(-0.2, Math.min(1.2, 1 - (e.clientY - r.top) / r.height)); kick();
  }, { passive: true });
  window.addEventListener('scroll', () => { const y = scrollY; push = Math.min(0.3, push + Math.abs(y - lastY) * 0.0015); lastY = y; kick(); }, { passive: true });
  window.addEventListener('resize', () => { draw(); }, { passive: true });
  draw();
  box.classList.add('hf-on');
})();
