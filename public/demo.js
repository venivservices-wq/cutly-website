// Fits the editor demo (the real app UI in a frame) to the page, plays it only while it's visible,
// and opens the login window when someone clicks it.
(function () {
  const scaler = document.getElementById('veScaler');
  const frame = document.getElementById('veFrame');
  const auth = document.getElementById('auth');
  const authScaler = document.getElementById('authScaler');
  const authFrame = document.getElementById('authFrame');
  const closeBtn = document.getElementById('authClose');
  let onScreen = false;
  let returnFocus = null;

  // Phones get the editor's phone layout in a phone-sized frame; wider screens the desktop editor
  const PHONE = '(max-width: 600px)';
  function fit() {
    const phone = matchMedia(PHONE).matches;
    const src = 'app-demo/index.html?v=hero2' + (phone ? '&phone' : '');
    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    const narrow = innerWidth <= 760;
    const w = phone ? 390 : narrow ? 1100 : 1440;
    const h = phone ? 720 : narrow ? 800 : 860;
    const scale = scaler.clientWidth / w;
    frame.style.width = w + 'px';
    frame.style.height = h + 'px';
    frame.style.transform = `scale(${scale})`;
    scaler.style.height = h * scale + 'px';
    fitAuth();
  }
  // In the login window the whole editor fits inside the black border, with nothing cropped
  function fitAuth() {
    const width = 820;
    // Layout size, not on-screen size: the window is still scaled down while it animates open
    const boxWidth = authScaler.offsetWidth;
    if (!boxWidth) return;
    const scale = boxWidth / width;
    authFrame.style.width = width + 'px';
    authFrame.style.height = Math.ceil(authScaler.offsetHeight / scale) + 'px';
    authFrame.style.transform = `scale(${scale})`;
  }

  function tell() {
    // The owner (2026-11-14): no animation. The demo stays on its first frame; it is only ever told to pause.
    // Only our own page may receive this (a file:// preview has the origin 'null', which cannot be a target)
    if (frame.contentWindow) frame.contentWindow.postMessage('demo-pause', location.origin === 'null' ? '*' : location.origin);
  }

  function openAuth(e) {
    returnFocus = e.currentTarget;
    auth.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    fitAuth();
    if (!authFrame.getAttribute('src') && authScaler.offsetWidth) authFrame.src = 'app-demo/index.html?still';
    tell();
    closeBtn.focus();
  }
  function closeAuth() {
    auth.hidden = true;
    document.documentElement.style.overflow = '';
    tell();
    if (returnFocus) returnFocus.focus();
  }

  document.getElementById('veOpen').addEventListener('click', openAuth);
  document.getElementById('openLogin').addEventListener('click', openAuth);
  closeBtn.addEventListener('click', closeAuth);
  auth.addEventListener('click', (e) => { if (e.target === auth) closeAuth(); });
  addEventListener('keydown', (e) => {
    if (auth.hidden) return;
    if (e.key === 'Escape') closeAuth();
    // Keep the keyboard inside the window while it's open
    if (e.key === 'Tab') {
      const items = [...auth.querySelectorAll('button, a')];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  new ResizeObserver(fit).observe(scaler);
  new ResizeObserver(fitAuth).observe(authScaler);
  addEventListener('resize', fit);
  fit();
  // Only the demo frame (same origin) may say it is ready
  addEventListener('message', (e) => { if (e.source === frame.contentWindow && (location.origin === 'null' || e.origin === location.origin) && e.data === 'demo-ready') tell(); });
  new IntersectionObserver((entries) => {
    onScreen = entries[0].isIntersecting;
    tell();
  }, { threshold: 0.05 }).observe(scaler);
  // Backup in case the observer is late or the frame was still loading: look at the position directly
  frame.addEventListener('load', tell);
  setInterval(() => {
    const r = scaler.getBoundingClientRect();
    // plays as soon as a strip of it shows above the fold (a big window shows only the top of it at first)
    const seen = r.top < innerHeight - 60 && r.bottom > 60 && document.visibilityState === 'visible';
    if (seen !== onScreen) { onScreen = seen; tell(); }
  }, 500);
})();
