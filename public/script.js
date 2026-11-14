(function () {
  const S = window.SITE;
  const $ = (id) => document.getElementById(id);
  const chevron = '<svg viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

  /* Navigation */
  $('mainNav').innerHTML = S.nav.map((n, i) => `<div class="nav-item">
    <a class="nav-link" href="${n.href}"${n.columns ? ' aria-haspopup="true" aria-expanded="false"' : ''}>${n.label}${n.columns ? chevron : ''}</a>
    ${n.columns ? `<div class="mega"><div class="mega-clip"><div class="page mega-grid">
      ${n.columns.map((c) => `<ul><li class="mega-title">${c.title}</li>${c.links.map((l) => `<li><a href="${n.href}">${l}</a></li>`).join('')}</ul>`).join('')}
      ${n.side ? `<aside class="mega-side">${n.side.map((x) => `<a href="#tools"><span class="mega-side-label">${x.label}</span><img src="${x.img}" alt="" width="1240" height="776"><span class="mega-side-text">${x.text}</span></a>`).join('')}</aside>` : ''}
    </div></div></div>` : ''}
  </div>`).join('');
  const toggle = document.querySelector('.menu-toggle');
  toggle.addEventListener('click', () => {
    const open = $('mainNav').classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  $('mainNav').addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    // In the phone menu, a tab with a dropdown expands instead of navigating.
    if (link.matches('.nav-link[aria-haspopup]') && matchMedia('(max-width: 1040px)').matches) {
      e.preventDefault();
      const open = link.parentElement.classList.toggle('expanded');
      link.setAttribute('aria-expanded', open);
      return;
    }
    $('mainNav').classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
    link.blur();
  });

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

  /* Client videos: a ring of cards seen at an angle. It turns by itself, with the page scroll and when dragged;
     only the cards facing you play, so the whole ring never runs at once. */
  const RING_N = S.showcase.length;
  $('showcaseList').style.setProperty('--n', RING_N);
  $('showcaseList').innerHTML = S.showcase.map((c, i) => `<figure class="showcase-card" style="--i:${i}">
    <video muted loop playsinline preload="none" data-wistia="${c.wistia}"></video>
    <figcaption>${sceneHtml(c.face, i + 70)}<span><strong>${c.client}</strong>${c.followers} followers</span></figcaption>
  </figure>`).join('');
  // Each video's file and cover image come from Wistia's media details, looked up by ID
  const showcaseVideos = [...document.querySelectorAll('#showcaseList video')];
  // Only an https address on Wistia's own hosts may become a video file or a cover picture
  const wistiaUrl = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && /(^|\.)wistia\.(com|net)$/.test(x.hostname) ? x.href : ''; } catch (e) { return ''; } };
  for (const id of new Set(S.showcase.map((c) => c.wistia))) {
    fetch(`https://fast.wistia.com/embed/medias/${id}.json`).then((r) => r.json()).then(({ media }) => {
      const assets = Array.isArray(media && media.assets) ? media.assets : [];
      const mp4s = assets.filter((a) => a.container === 'mp4' && wistiaUrl(a.url)).sort((a, b) => a.height - b.height);
      const file = mp4s.find((a) => a.height >= 960) || mp4s[mp4s.length - 1];
      const still = assets.find((a) => a.type === 'still_image' && wistiaUrl(a.url));
      showcaseVideos.filter((v) => v.dataset.wistia === id).forEach((v) => {
        if (still) v.poster = still.url;
        if (file) v.src = file.url;
      });
    }).catch(() => { /* the dark card stays as it is */ });
  }
  // The ring turns only when the visitor drags it or uses the arrows, and always settles with one card straight in front, playing
  {
    const stage = $('showcaseStage'), ring = $('showcaseList');
    const step = 360 / RING_N;
    let spin = 0, goal = 0, drag = null, raf = 0, shown = -1;
    const mod = (n) => ((n % RING_N) + RING_N) % RING_N;
    // A straight row: the card in front is a little bigger, the others sit beside it at normal size
    const cards = [...ring.children];
    // On a phone only one card shows, full size; its neighbours slide in from off the stage
    const solo = matchMedia('(max-width: 600px)');
    const draw = () => {
      const w = cards[0].offsetWidth, p = spin / step;
      if (solo.matches) {
        const room = stage.offsetWidth;
        cards.forEach((c, i) => {
          const o = ((i - p + RING_N / 2) % RING_N + RING_N) % RING_N - RING_N / 2, a = Math.abs(o);
          c.style.opacity = Math.max(0, 1 - a).toFixed(2);
          c.style.transform = `translateX(${(o * (room + w) / 2).toFixed(1)}px)`;
          c.style.zIndex = Math.round(100 - a * 10);
          c.style.visibility = a >= 1 ? 'hidden' : '';
        });
        return;
      }
      cards.forEach((c, i) => {
        const o = ((i - p + RING_N / 2) % RING_N + RING_N) % RING_N - RING_N / 2, a = Math.abs(o);
        const gap = 20, sc = Math.max(0.88, 1.14 - 0.26 * a);
        // the middle card is bigger, so the first step out is wider; every later step is one side card plus the gap
        const x = Math.sign(o) * (Math.min(a, 1) * (w * 1.01 + gap) + Math.max(a - 1, 0) * (w * 0.88 + gap));
        c.style.opacity = (a <= 1 ? 1 - 0.25 * a : Math.max(0, 0.75 - (a - 1) * 1.5)).toFixed(2);
        c.style.transform = `translateX(${x.toFixed(1)}px) scale(${sc.toFixed(3)})`;
        c.style.zIndex = Math.round(100 - a * 10);
        c.style.visibility = a > 1.5 ? 'hidden' : '';
      });
    };
    addEventListener('resize', draw);
    // Plays only the card in front (with sound once the visitor has tapped it), pauses the rest
    function playFront() {
      const front = mod(Math.round(spin / step));
      if (front === shown) return;
      shown = front;
      showcaseVideos.forEach((v, i) => {
        v.closest('.showcase-card').classList.toggle('front', i === front);
        if (i === front) { v.muted = !stage.classList.contains('sound'); v.play().catch(() => {}); }
        else { v.pause(); v.muted = true; }
      });
    }
    // Glides to the goal angle
    function glide() {
      const d = goal - spin;
      if (Math.abs(d) < 0.05) { spin = goal; draw(); raf = 0; playFront(); return; }
      spin += d * 0.14; draw();
      if (Math.abs(spin / step - Math.round(spin / step)) < 0.04 || Math.abs(d) < step * 0.5) playFront();
      raf = requestAnimationFrame(glide);
    }
    const go = (to) => { goal = to * step; if (matchMedia('(prefers-reduced-motion: reduce)').matches) { spin = goal; draw(); playFront(); } else if (!raf) raf = requestAnimationFrame(glide); };
    const here = () => Math.round(goal / step);
    $('ringPrev').addEventListener('click', () => go(here() - 1));
    $('ringNext').addEventListener('click', () => go(here() + 1));
    stage.parentElement.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { go(here() - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(here() + 1); e.preventDefault(); }
    });
    // Dragging with mouse, finger or pen; up and down still scrolls the page on a phone. Letting go settles on the nearest card.
    let moved = 0;
    stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, spin }; moved = 0; if (raf) { cancelAnimationFrame(raf); raf = 0; } stage.setPointerCapture(e.pointerId); stage.classList.add('grab'); });
    stage.addEventListener('pointermove', (e) => {
      if (!drag) return;
      moved = Math.max(moved, Math.abs(e.clientX - drag.x));
      spin = goal = drag.spin - (e.clientX - drag.x) * 0.13; draw();
    });
    const end = () => { if (!drag) return; drag = null; stage.classList.remove('grab'); go(Math.round(spin / step)); };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    // A tap on the front video turns its sound on or off; a tap on a side card brings it to the front
    stage.addEventListener('click', (e) => {
      if (moved > 6) return;
      const card = e.target.closest('.showcase-card');
      if (!card) return;
      const i = [...ring.children].indexOf(card);
      if (i === shown) { stage.classList.toggle('sound'); const v = showcaseVideos[i]; v.muted = !stage.classList.contains('sound'); v.play().catch(() => {}); }
      else { const d = mod(i - here() ); go(here() + (d > RING_N / 2 ? d - RING_N : d)); }
    });
    // The video file arrives after the first look: start the front one then
    showcaseVideos.forEach((v) => v.addEventListener('loadeddata', () => { shown = -1; playFront(); }));
    draw(); playFront();
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
        preview.innerHTML = `<img class="tool-img" src="assets/features/feature-${i + 1}.webp?v=8" width="1240" height="776" alt="">`;
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

  /* Reviews. The design samples (made up, not real people) show ONLY on a local copy of the site, or through the private review link
     https://cutlyai.app/?preview that the owner sends to the people testing the site; a normal visit shows the plain placeholders.
     Real reviews go in S.reviews (with text, mark, followers) and then show everywhere. Remove sampleReviews before launch. */
  const localCopy = location.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const reviewLink = new URLSearchParams(location.search).has('preview');
  const reviewItems = (localCopy || reviewLink) && S.sampleReviews ? S.sampleReviews : S.reviews;
  $('reviewList').innerHTML = reviewItems.map((r, i) => `<article class="review">
    <p>${r.text ? r.text.replace(r.mark, `<mark>${r.mark}</mark>`) : 'Add a real customer review here, in their own words, about <mark>what they made with Cutly</mark>.'}</p>
    <div class="reviewer">${sceneHtml(r.face, i + 40)}<span>${r.name}<small>${r.followers || '000K'} followers</small></span></div>
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

  /* Footer */
  $('footerGrid').innerHTML = `<div class="footer-brand">
      <a class="logo" href="#top" aria-label="Cutly AI home"><img src="assets/cutly-logo.png?v=2" alt="" width="28" height="28"><span>Cutly AI</span></a>
      ${S.tagline ? `<p>${S.tagline}</p>` : ''}
      <div class="socials"><a href="#" aria-label="Cutly AI on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg></a></div>
    </div>` +
    S.footer.map((c) =>
      `<div><h4>${c.title}</h4><ul>${c.links.map(([label, href]) => `<li><a href="${href}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${label}</a></li>`).join('')}</ul></div>`).join('');
  $('legalLinks').innerHTML = `<span>&copy; ${new Date().getFullYear()} Cutly AI</span><nav>${S.legal.map((l) => `<a href="#">${l}</a>`).join('')}</nav>`;

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
