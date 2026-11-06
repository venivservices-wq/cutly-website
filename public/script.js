(function () {
  const S = window.SITE;
  const $ = (id) => document.getElementById(id);
  const chevron = '<svg viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

  /* Navigation */
  $('mainNav').innerHTML = S.nav.map((n, i) => `<div class="nav-item">
    <a class="nav-link" href="${n.href}"${n.columns ? ' aria-haspopup="true" aria-expanded="false"' : ''}>${n.label}${n.columns ? chevron : ''}</a>
    ${n.columns ? `<div class="mega"><div class="mega-clip"><div class="page mega-grid">
      ${n.columns.map((c) => `<ul><li class="mega-title">${c.title}</li>${c.links.map((l) => `<li><a href="${n.href}">${l}</a></li>`).join('')}</ul>`).join('')}
      <a class="mega-promo" href="#try">${sceneHtml('neon', i + 95)}<img src="assets/cutly-logo.png" alt="" width="34" height="28"><span>${n.promo}</span></a>
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

  /* Client videos: plain looping muted videos, so all three can play at once */
  $('showcaseList').innerHTML = S.showcase.map((c, i) => `<figure class="showcase-card">
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
  // Plays while on screen and pauses once scrolled away
  const watch = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
  }, { threshold: 0.25 });
  showcaseVideos.forEach((v) => {
    watch.observe(v);
    // A video that comes into view before its file is set starts once it can
    v.addEventListener('canplay', () => { if (v.getBoundingClientRect().bottom > 0 && v.getBoundingClientRect().top < innerHeight) v.play().catch(() => {}); });
  });

  /* Features accordion, each feature with a coded mockup of the editor */
  $('toolList').innerHTML = S.tools.map((t, i) => `<div class="tool">
    <div class="tool-main">
      <button class="tool-head" type="button" aria-expanded="false"><span>0${i + 1}</span><span>${t.title}</span><i aria-hidden="true"><svg viewBox="0 0 18 18"><path d="M9 3v12M3 9h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></i></button>
      <div class="tool-reveal tool-copy"><div><p class="tool-text">${t.text}</p></div></div>
    </div>
    <div class="tool-reveal tool-side"><div><div class="tool-shot fui-fit">${featureUi(t.ui)}</div></div></div>
  </div>`).join('');
  const tools = [...$('toolList').children];
  document.querySelectorAll('#toolList .fui-fit').forEach(fitFeatureUi);
  function openTool(i) {
    tools.forEach((t, j) => {
      t.classList.toggle('open', j === i);
      t.querySelector('.tool-head').setAttribute('aria-expanded', j === i);
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
        preview.innerHTML = featureUi(S.tools[i].ui);
        preview.classList.add('show');
      });
      head.addEventListener('mousemove', (e) => { preview.style.translate = `${e.clientX + 28}px ${e.clientY - 80}px`; });
      head.addEventListener('mouseleave', hide);
      head.addEventListener('click', hide);
    });
    addEventListener('scroll', hide, { passive: true });
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

  /* Reviews */
  $('reviewList').innerHTML = S.reviews.map((r, i) => `<article class="review">${reviewScene(i)}
    <b aria-hidden="true">&ldquo;</b>
    <p>Add a real customer review here, in their own words, about what they made with Cutly.</p>
    <div class="reviewer">${sceneHtml(r.face, i + 40)}<span>${r.name}</span></div>
  </article>`).join('');

  /* Pricing: a gray card, a split card with a painted top, and a black card. The feature rows line up across all three. */
  const tick = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.6"/></svg>';
  const dash = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8"/></svg>';
  $('planList').innerHTML = S.plans.map((p) => `<article class="plan plan-${p.name.toLowerCase()}${p.popular ? ' plan-pop' : ''}">
      <div class="plan-head">${p.popular ? reviewScene(0, 'planPop', 30) : ''}
        <div class="plan-top"><h3>${p.name}</h3>${p.popular ? '<b>Most popular</b>' : ''}</div>
        <div class="plan-price"><strong>$${p.videos * p.perVideo}</strong><span>/ month</span></div>
        <p class="plan-videos">${p.videos} videos a month</p>
      </div>
      <div class="plan-body">
        <a class="btn btn-lg plan-btn" href="#try">Choose ${p.name}</a>
        <ul>${S.planFeatures.map((f, n) => (n < p.level ? `<li>${tick}${f}</li>` : `<li class="off">${dash}${f}</li>`)).join('')}</ul>
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
      <a class="logo" href="#top" aria-label="Cutly AI home"><img src="assets/cutly-logo.png" alt="" width="29" height="24"><span>Cutly AI</span></a>
      <p>${S.tagline}</p>
      <div class="socials"><a href="#" aria-label="Cutly AI on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg></a></div>
    </div>` +
    S.footer.map((c) =>
      `<div><h4>${c.title}</h4><ul>${c.links.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul></div>`).join('');
  $('legalLinks').innerHTML = `<span>&copy; ${new Date().getFullYear()} Cutly AI</span><nav>${S.legal.map((l) => `<a href="#">${l}</a>`).join('')}</nav>`;

  /* Floating call to action appears once the editor demo has scrolled away */
  const floatCta = $('floatCta');
  const demoShell = document.querySelector('.ve-shell');
  const siteHeader = document.querySelector('.site-header');
  const pricing = $('pricing');
  const onScroll = () => {
    // Shows once the editor demo has scrolled off the top, and hides again once pricing comes into view
    floatCta.classList.toggle('show', demoShell.getBoundingClientRect().bottom < 0 && pricing.getBoundingClientRect().top > innerHeight);
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
