// Fits the editor demo (the real app UI in a frame) to the page, plays it only while it's visible,
// and opens the login window when someone clicks it.
(function () {
  const scaler = document.getElementById('veScaler');
  const frame = document.getElementById('veFrame');
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
  }
  function tell() {
    // The owner (2026-11-14): no animation. The demo stays on its first frame; it is only ever told to pause.
    // Only our own page may receive this (a file:// preview has the origin 'null', which cannot be a target)
    if (frame.contentWindow) frame.contentWindow.postMessage('demo-pause', location.origin === 'null' ? '*' : location.origin);
  }

  document.getElementById('veOpen').addEventListener('click', (e) => { if (window.openAuth) window.openAuth(e.currentTarget); });
  new ResizeObserver(fit).observe(scaler);
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
