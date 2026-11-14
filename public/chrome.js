// The header (with the navigation) and the footer, written ONCE here and used by every page (the owner, 2026-11-14): change content.js or this file and every page changes.
// A page only has <header class="site-header" id="top"></header> and <footer class="site-footer" id="siteFooter"></footer>.
// Pages in a sub folder set window.NAV_BASE = '../' before loading this file.
(function () {
  const S = window.SITE;
  const BASE = window.NAV_BASE || '';
  const $ = (id) => document.getElementById(id);
  const chevron = '<svg viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
  // A link inside the site: '#x' means the home page's section; other paths are from the site root
  const fix = (h) => !BASE || /^(https?:|mailto:)/.test(h) ? h : h === '#' ? h : h.startsWith('#') ? BASE + 'index.html' + h : BASE + h;
  /* Header: the same markup on every page */
  const headerEl = $('top');
  if (headerEl) headerEl.innerHTML = `<div class="page header-row">
    <a class="logo" href="${BASE ? BASE + 'index.html' : '#top'}" aria-label="Cutly AI home">
      <img src="${BASE}assets/cutly-logo.png?v=3" alt="" width="28" height="28">
      <span>Cutly AI</span>
    </a>
    <nav class="main-nav" id="mainNav"></nav>
    <div class="header-actions">
      <button class="btn btn-soft" id="openLogin" type="button">Log in</button>
    </div>
    <button class="menu-toggle" type="button" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span></button>
  </div>`;

  $('mainNav').innerHTML = S.nav.map((n, i) => `<div class="nav-item">
    <a class="nav-link" href="${fix(n.href)}"${n.columns ? ' aria-haspopup="true" aria-expanded="false"' : ''}>${n.label}${n.columns ? chevron : ''}</a>
    ${n.columns ? `<div class="mega"><div class="mega-clip"><div class="page mega-grid">
      ${n.columns.map((c) => `<ul><li class="mega-title">${c.title}</li>${c.links.map((l) => { const [t, h] = Array.isArray(l) ? l : [l, n.href]; return `<li><a href="${fix(h)}">${t}</a></li>`; }).join('')}</ul>`).join('')}
      ${n.side ? `<aside class="mega-side">${n.side.map((x) => `<a href="${fix(x.href || '#tools')}"><span class="mega-side-label">${x.label}</span><img src="${fix(x.img)}" alt="" width="1240" height="776"><span class="mega-side-text">${x.text}</span></a>`).join('')}</aside>` : ''}
    </div></div></div>` : ''}
  </div>`).join('');
  // Phone menu (the owner picked option 6, 2026-11-14): a sheet with a Log in button at its bottom; it clicks the header's own Log in button
  const loginRow = document.createElement('div');
  loginRow.className = 'nav-login';
  loginRow.innerHTML = '<button class="btn" type="button">Log in</button>';
  $('mainNav').appendChild(loginRow);
  loginRow.querySelector('button').addEventListener('click', () => {
    $('mainNav').classList.remove('open');
    document.querySelector('.menu-toggle').setAttribute('aria-expanded', false);
    const b = $('openLogin'); if (b) b.click();
  });
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


  /* Footer: the same markup on every page */
  const footerEl = $('siteFooter');
  if (footerEl) {
    footerEl.innerHTML = `<div class="footer-glow" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
  <div class="page footer-grid"><div class="footer-brand">
      <a class="logo" href="${BASE ? BASE + 'index.html' : '#top'}" aria-label="Cutly AI home"><img src="${BASE}assets/cutly-logo.png?v=3" alt="" width="28" height="28"><span>Cutly AI</span></a>
      ${S.tagline ? `<p>${S.tagline}</p>` : ''}
      <div class="socials"><a href="#" aria-label="Cutly AI on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg></a></div>
    </div>${S.footer.map((c) =>
      `<div><h4>${c.title}</h4><ul>${c.links.map(([label, href]) => `<li><a href="${fix(href)}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${label}</a></li>`).join('')}</ul></div>`).join('')}</div>
  <div class="page legal"><span>&copy; ${new Date().getFullYear()} Cutly AI</span><nav>${S.legal.map((l) => `<a href="#">${l}</a>`).join('')}</nav></div>
  <div class="wordmark" aria-hidden="true">Cutly AI</div>`;
  }

  /* The login window (auth.css + auth.js): every Log in button, on every page, opens it */
  const authCss = document.createElement('link');
  authCss.rel = 'stylesheet'; authCss.href = BASE + 'auth.css?v=6';
  document.head.appendChild(authCss);
  const authJs = document.createElement('script');
  authJs.src = BASE + 'auth.js?v=4';
  document.body.appendChild(authJs);
})();
