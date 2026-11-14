// The login window, on every page that has the header: any Log in button opens it.
// Built here (not in each page) so a change shows everywhere. Needs auth.css (chrome.js adds it).
(function () {
  const BASE = window.NAV_BASE || '';
  document.body.insertAdjacentHTML('beforeend', `<div class="auth" id="auth" role="dialog" aria-modal="true" aria-labelledby="authTitle" hidden>
  <div class="auth-box">
    <div class="auth-left" aria-hidden="true"><div class="auth-scaler" id="authScaler"><img class="auth-pic" src="${BASE}assets/auth-editor.jpg?v=2" alt="" width="674" height="536"><iframe class="ve-frame" id="authFrame" title="Cutly AI editor demo" tabindex="-1" scrolling="no"></iframe></div></div>
    <div class="auth-right">
      <button class="auth-close" id="authClose" type="button" aria-label="Close"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      <img class="auth-logo" src="${BASE}assets/cutly-logo.png?v=3" alt="" width="44" height="44">
      <h2 id="authTitle">Welcome to Cutly AI</h2>
      <div class="auth-options">
        <a class="auth-btn primary" href="https://app.cutlyai.app/?signin=google" rel="noopener">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.6l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6.1-4.5H2.3v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.9 14.2a6.6 6.6 0 0 1 0-4.3V7H2.3a11 11 0 0 0 0 9.9l3.6-2.7z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 2.3 7l3.6 2.8C6.8 7.3 9.2 5.4 12 5.4z"/></svg>
          <span>Continue with Google</span>
        </a>
      </div>
      <p class="auth-legal">By continuing, you accept our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></p>
    </div>
  </div>
</div>`);
  const auth = document.getElementById('auth');
  const authScaler = document.getElementById('authScaler');
  const authFrame = document.getElementById('authFrame');
  const closeBtn = document.getElementById('authClose');
  let returnFocus = null;

  // The whole editor fits inside the black border, nothing cropped (on phones it is a short strip from the top)
  function fitAuth() {
    const width = 820;
    const boxWidth = authScaler.offsetWidth; // layout size: the window is scaled while it animates open
    if (!boxWidth) return;
    const scale = boxWidth / width;
    authFrame.style.width = width + 'px';
    authFrame.style.height = Math.ceil(authScaler.offsetHeight / scale) + 'px';
    authFrame.style.transform = `scale(${scale})`;
  }
  function openAuth(from) {
    returnFocus = from && from.focus ? from : null;
    auth.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    fitAuth();
    if (!authFrame.getAttribute('src') && authScaler.offsetWidth && !matchMedia('(max-width: 860px)').matches) authFrame.src = BASE + 'app-demo/index.html?still';
    closeBtn.focus();
  }
  function closeAuth() {
    auth.hidden = true;
    document.documentElement.style.overflow = '';
    if (returnFocus) returnFocus.focus();
  }
  window.openAuth = openAuth;

  const login = document.getElementById('openLogin');
  if (login) login.addEventListener('click', (e) => openAuth(e.currentTarget));
  closeBtn.addEventListener('click', closeAuth);
  auth.addEventListener('click', (e) => { if (e.target === auth) closeAuth(); });
  addEventListener('keydown', (e) => {
    if (auth.hidden) return;
    if (e.key === 'Escape') closeAuth();
    if (e.key === 'Tab') { // keep the keyboard inside the window
      const items = [...auth.querySelectorAll('button, a')];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  new ResizeObserver(fitAuth).observe(authScaler);
})();
