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

  function fit() {
    const narrow = innerWidth <= 760;
    const w = narrow ? 1100 : 1440;
    const h = narrow ? 800 : 860;
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
    const open = !auth.hidden;
    // Only our own page may receive this (a file:// preview has the origin 'null', which cannot be a target)
    if (frame.contentWindow) frame.contentWindow.postMessage(onScreen && !open ? 'demo-play' : 'demo-pause', location.origin === 'null' ? '*' : location.origin);
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
  }, { threshold: 0.3 }).observe(scaler);
})();
