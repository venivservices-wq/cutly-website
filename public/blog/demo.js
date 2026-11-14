/* Picks the phone or desktop recording, loads it when it nears the screen, plays it only while visible. */
(function () {
  var mq = matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function phone() { document.documentElement.classList.toggle('m', mq.matches); }
  phone(); if (mq.addEventListener) mq.addEventListener('change', phone);
  function shown(v) { return v.offsetParent !== null; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      [].slice.call(e.target.querySelectorAll('video')).forEach(function (v) {
        if (!shown(v)) { v.pause(); return; }
        if (!v.src && v.getAttribute('data-src')) v.src = v.getAttribute('data-src');
        if (e.isIntersecting && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
      });
    });
  }, { threshold: .35, rootMargin: '200px 0px' });
  document.querySelectorAll('.demo').forEach(function (d) { io.observe(d); });
})();
