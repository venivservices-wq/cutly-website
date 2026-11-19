/* The Vlance v2 slider (horizontalLoop + initOsmoSlider, copied from vlance-v2/vlance.js lines 39-493), run on the example videos (the owner, 2026-11-19). Needs GSAP + Draggable + InertiaPlugin. */
// ─── GSAP Slider (horizontalLoop helper) ──────────────────────────────────────
function horizontalLoop(items, config) {
  let timeline;
  items = gsap.utils.toArray(items);
  config = config || {};
  gsap.context(() => {
    const onChange   = config.onChange;
    let   lastIndex  = 0;
    const tl = gsap.timeline({
      repeat:    config.repeat,
      paused:    config.paused,
      defaults:  { ease: 'none' },
      onUpdate:  onChange && function () {
        const i = tl.closestIndex();
        if (lastIndex !== i) { lastIndex = i; onChange(items[i], i); }
      },
      onReverseComplete: () => tl.totalTime(tl.rawTime() + 100 * tl.duration()),
    });

    const length  = items.length;
    const startX  = items[0].offsetLeft;
    const widths  = [];
    const xPcts   = [];
    const offsets = [];
    const gaps    = [];
    let   totalW  = 0;
    const snap    = config.snap === false ? v => v : gsap.utils.snap(config.snap || 1);
    const center  = config.center;
    const pad     = parseFloat(config.paddingRight) || 0;
    const parentEl = center === true
      ? items[0].parentNode
      : gsap.utils.toArray(center)[0] || items[0].parentNode;

    const measure = () => {
      let prev;
      items.forEach((el, i) => {
        widths[i]  = parseFloat(gsap.getProperty(el, 'width', 'px'));
        xPcts[i]   = snap(parseFloat(gsap.getProperty(el, 'x', 'px')) / widths[i] * 100 + gsap.getProperty(el, 'xPercent'));
        const rect = el.getBoundingClientRect();
        gaps[i]    = rect.left - (i ? prev.right : parentEl.getBoundingClientRect().left);
        prev       = rect;
      });
      gsap.set(items, { xPercent: i => xPcts[i] });
      totalW = items[length - 1].offsetLeft + xPcts[length - 1] / 100 * widths[length - 1]
             - startX + gaps[0] + items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], 'scaleX') + pad;
    };

    const centreOffset = () => center
      ? tl.duration() * (parentEl.offsetWidth / 2) / totalW
      : 0;

    const findNearest = (arr, val, dur) => {
      let dist = 1e10, idx = 0;
      arr.forEach((v, i) => {
        let d = Math.abs(v - val);
        if (d > dur / 2) d = dur - d;
        if (d < dist) { dist = d; idx = i; }
      });
      return idx;
    };

    const build = () => {
      tl.clear();
      const times = [];
      const spd   = config.speed || 100;
      // Centring shift, in px: land the target card in the middle of the
      // viewport rather than flush against its left edge. `centreOffset()` was
      // only ever assigned to an unused local in refresh(), so `center` did
      // nothing and the active card always sat in the leftmost slot. Only the
      // snap targets move — the tween layout below is untouched — and the loop
      // wraps the preceding card in on the left to fill the freed slot.
      const totalDur = totalW / spd;
      const wrapTime = t => ((t % totalDur) + totalDur) % totalDur;
      items.forEach((el, i) => {
        const xPct = xPcts[i];
        const rawX = xPct / 100 * widths[i];
        const left = el.offsetLeft + rawX - startX + gaps[0];
        const right = left + widths[i] * gsap.getProperty(el, 'scaleX');
        tl.to(el, { xPercent: snap((rawX - right) / widths[i] * 100), duration: right / (config.speed || 100) }, 0)
          .fromTo(el, { xPercent: snap((rawX - right + totalW) / widths[i] * 100) },
            { xPercent: xPct, duration: (rawX - right + totalW - rawX) / (config.speed || 100), immediateRender: false }, right / (config.speed || 100))
          .add('label' + i, left / (config.speed || 100));
        // Wrapped here rather than left negative: toIdx() routes out-of-range
        // targets through gsap.utils.wrap(0, 1), which would collapse a
        // negative time into 0–1s instead of the end of the timeline.
        times[i] = wrapTime((left - (center ? parentEl.offsetWidth / 2 - widths[i] / 2 : 0)) / spd);
      });
      tl.times = times;
    };

    const refresh = full => {
      const prog = tl.progress();
      tl.progress(0, true);
      measure();
      if (full) build();
      const co = centreOffset();
      tl.progress(prog, true);
    };

    measure();
    build();

    // Two wrappers, because a single gsap.utils.wrap(0, 1) was being used for
    // both progress (0–1) and timeline *times* (0–duration). The 0–1 range is
    // right for progress but quietly collapsed any time past one second into
    // the first second of the loop — it only ever looked correct because the
    // first card's snap time happened to land under 1s.
    const wrapProg = gsap.utils.wrap(0, 1);
    const wrapTime = t => gsap.utils.wrap(0, tl.duration())(t);
    const toIdx  = (idx, vars) => {
      vars      = vars || {};
      const cur = tl.current();
      if (Math.abs(idx - cur) > length / 2) idx += idx > cur ? -length : length;
      const t = (tl.times || [])[((idx % length) + length) % length];
      if (t === undefined) return;
      let target = t;
      if (target > tl.time() !== idx > cur && idx !== cur) target += tl.duration() * (idx > cur ? 1 : -1);
      if (target < 0 || target > tl.duration()) vars.modifiers = { time: wrapTime };
      lastIndex  = ((idx % length) + length) % length;
      vars.overwrite = true;
      gsap.killTweensOf(draggable);
      return vars.duration === 0 ? tl.time(wrapTime(target)) : tl.tweenTo(target, vars);
    };

    tl.toIndex    = toIdx;
    tl.closestIndex = force => {
      const i = findNearest(tl.times || [], tl.time(), tl.duration());
      if (force) { lastIndex = i; }
      return i;
    };
    tl.current    = () => lastIndex;
    tl.next       = vars => toIdx(tl.current() + 1, vars);
    tl.previous   = vars => toIdx(tl.current() - 1, vars);
    tl.progress(1, true).progress(0, true);
    if (config.reversed) { tl.vars.onReverseComplete(); tl.reverse(); }

    let draggable;
    if (config.draggable && typeof Draggable !== 'undefined') {
      const proxy = document.createElement('div');
      let   startProg, startX2, ratio, snap2, throwing;
      // Drag offset has to come from Draggable's own startX/x pair. This read
      // (startX2 - proxy.x) instead, mixing in the press-init correction that
      // belongs to snap() — harmless on the very first press, when Draggable's
      // x is still 0, but from the second press on it threw the progress off
      // and every later drag snapped straight back to the current card.
      const updateProg = () => tl.progress(wrapProg(startProg + (draggable.startX - draggable.x) * ratio));
      const settle     = () => tl.closestIndex(true);
      draggable = Draggable.create(proxy, {
        trigger:          items[0].parentNode,
        type:             'x',
        overshootTolerance: 0,
        inertia:          true,
        // Cards are video players, and Draggable skips presses that land on
        // "clickable" elements (<video> among them) unless told otherwise — so
        // a grab starting on the video itself, i.e. almost anywhere on a card,
        // would never begin a drag. minimumMovement keeps a stationary tap a
        // click, so the player's own controls still respond.
        dragClickables:   true,
        minimumMovement:  6,
        // Only applied when the caller asks, so desktop keeps Draggable's
        // defaults. These have to be passed at creation: Draggable reads them
        // once in its constructor, which is why the Object.assign onto
        // .vars afterwards never actually took effect.
        ...(config.dragResistance  != null ? { dragResistance:  config.dragResistance  } : {}),
        ...(config.throwResistance != null ? { throwResistance: config.throwResistance } : {}),
        ...(config.maxDuration     != null ? { maxDuration:     config.maxDuration     } : {}),
        ...(config.minDuration     != null ? { minDuration:     config.minDuration     } : {}),
        snap(x) {
          // proxy.x2 was undefined on a plain div, so a barely-moved press
          // returned NaN and killed the snap. startX2 is the press-init offset.
          if (Math.abs(startProg / -ratio - this.x) < 10) return snap2 + startX2;
          const r = -(x * ratio * tl.duration());
          const w = wrapTime(r);
          const nearest = tl.times ? tl.times[findNearest(tl.times, w, tl.duration())] : 0;
          const diff = nearest - w;
          snap2 = (r + (Math.abs(diff) > tl.duration() / 2 ? diff < 0 ? tl.duration() : -tl.duration() : diff)) / tl.duration() / -ratio;
          return snap2;
        },
        onPressInit() {
          const x2 = this.x;
          gsap.killTweensOf(tl);
          throwing = false;
          startProg = tl.progress();
          refresh();
          ratio    = 1 / totalW;
          startX2  = startProg / -ratio - x2;
          gsap.set(proxy, { x: startProg / -ratio });
        },
        onDrag: updateProg,
        onThrowUpdate: updateProg,
        onRelease() { settle(); throwing = this.isThrowing; },
        onThrowComplete: settle,
      })[0];
      tl.draggable = draggable;
    }
    timeline = tl;
    window.addEventListener('resize', () => refresh(true));
    refresh(true);
  });
  return timeline;
}

// ─── GSAP Osmo Slider ─────────────────────────────────────────────────────────
function initOsmoSlider() {
  const DURATION = 1.5;
  const EASE     = 'expo.out';

  document.querySelectorAll('[data-gsap-slider-init]').forEach(wrap => {
    const collection = wrap.querySelector('[data-gsap-slider-collection]');
    const listEl     = wrap.querySelector('[data-gsap-slider-list]');
    const slides     = Array.from(wrap.querySelectorAll('[data-gsap-slider-item]'));
    const controls   = Array.from(wrap.querySelectorAll('[data-gsap-slider-control]'));
    if (!slides.length) return;

    const rotate = parseFloat(wrap.getAttribute('data-gsap-slider-rotate')) || 0;
    const style  = getComputedStyle(wrap);
    const status = style.getPropertyValue('--slider-status').trim();
    let   spv    = parseFloat(style.getPropertyValue('--slider-spv'));

    const rect = slides[0].getBoundingClientRect();
    const gap  = parseFloat(getComputedStyle(slides[0]).marginRight) || 0;
    const W    = rect.width;
    const H    = rect.height;
    const step = rotate > 0 ? W : W + gap;

    if (isNaN(spv)) spv = collection.clientWidth / (W + gap);
    const visible = Math.max(1, Math.min(spv, slides.length));
    const shown   = Math.ceil(visible);

    if (!(status === 'on' && visible < slides.length)) {
      wrap.removeAttribute('data-gsap-drag-status');
      return;
    }
    wrap.setAttribute('data-gsap-drag-status', 'grab');

    const mod       = (v, n) => ((v % n) + n) % n;
    const centered  = wrap.getAttribute('data-gsap-slider-center') === 'true';

    // Update active/inview status and control highlights
    const setActive = (idx, total) => {
      const half = Math.floor((shown - 1) / 2);
      const rest = shown - 1 - half;
      slides.forEach(s => s.setAttribute('data-gsap-slider-item-status', 'not-active'));
      slides[mod(idx, total)].setAttribute('data-gsap-slider-item-status', 'active');
      for (let i = 1; i <= rest; i++)
        slides[mod(idx + i, total)].setAttribute('data-gsap-slider-item-status', 'inview');
      for (let i = 1; i <= half; i++)
        slides[mod(idx - i, total)].setAttribute('data-gsap-slider-item-status', 'inview');

      controls.forEach(btn => {
        const v = btn.getAttribute('data-gsap-slider-control');
        if (/^\d+$/.test(v)) {
          const n = Math.max(0, Math.min(total - 1, parseInt(v, 10) - 1));
          btn.setAttribute('data-gsap-slider-control-status', n === mod(idx, total) ? 'active' : 'not-active');
        }
      });
    };

    // ── Rotating fan layout (data-gsap-slider-rotate > 0) ──
    if (rotate > 0) {
      const total = slides.length;
      gsap.set(slides, { clearProps: 'position,top,left,marginRight,transform' });
      slides.forEach(s => s.removeAttribute('data-gsap-slider-item-status'));
      listEl.style.position = 'relative';
      listEl.style.height   = H + 'px';
      slides.forEach(s => gsap.set(s, { xPercent: -50 }));

      // Rotated side cards swing below the centered card's bounding box (the
      // fan pivot sits far under the cards), so a height based on the
      // unrotated card (H) is too short and the last stretch of every side
      // card gets left outside listEl's box. Measure actual rendered edges —
      // but only of the cards actually in view; off-screen ones sit at much
      // steeper angles and would inflate the height far more than needed.
      const syncHeight = () => {
        const top = listEl.getBoundingClientRect().top;
        let maxBottom = 0;
        slides.forEach(s => {
          if (s.getAttribute('data-gsap-slider-item-status') === 'not-active') return;
          maxBottom = Math.max(maxBottom, s.getBoundingClientRect().bottom - top);
        });
        listEl.style.height = maxBottom + 'px';
      };
      window.addEventListener('resize', syncHeight);

      const setters = slides.map(s => gsap.quickSetter(s, 'rotate', 'deg'));
      const proxy   = document.createElement('div');
      gsap.set(proxy, { x: 0 });

      const getIdx   = () => -gsap.getProperty(proxy, 'x') / step;
      const wrapDiff = (v, cur, n) => v - (cur - Math.round((cur - v) / n) * n);

      const render = () => {
        const idx = getIdx();
        setters.forEach((set, i) => set(wrapDiff(i, idx, total) * rotate));

        const active = mod(Math.round(idx), total);
        const h2     = Math.floor((shown - 1) / 2);
        const r2     = shown - 1 - h2;
        slides.forEach(s => s.setAttribute('data-gsap-slider-item-status', 'not-active'));
        slides[active].setAttribute('data-gsap-slider-item-status', 'active');
        for (let i = 1; i <= r2; i++)
          slides[mod(active + i, total)].setAttribute('data-gsap-slider-item-status', 'inview');
        for (let i = 1; i <= h2; i++)
          slides[mod(active - i, total)].setAttribute('data-gsap-slider-item-status', 'inview');

        controls.forEach(btn => {
          const v = btn.getAttribute('data-gsap-slider-control');
          if (/^\d+$/.test(v)) {
            const n = Math.max(0, Math.min(total - 1, parseInt(v, 10) - 1));
            btn.setAttribute('data-gsap-slider-control-status', n === active ? 'active' : 'not-active');
          }
        });
      };

      controls.forEach(btn => {
        btn.disabled = false;
        const v = btn.getAttribute('data-gsap-slider-control');
        if (/^\d+$/.test(v)) {
          const target = Math.max(0, Math.min(total - 1, parseInt(v, 10) - 1));
          btn.onclick = () => {
            gsap.killTweensOf(proxy);
            const cur = getIdx();
            const dest = -(cur + wrapDiff(target, cur, total)) * step;
            gsap.to(proxy, { x: dest, duration: DURATION, ease: EASE, onUpdate: render });
          };
        } else if (v === 'prev' || v === 'next') {
          btn.onclick = () => {
            gsap.killTweensOf(proxy);
            const cur    = getIdx();
            const target = mod(Math.round(cur) + (v === 'next' ? 1 : -1), total);
            const dest   = -(cur + wrapDiff(target, cur, total)) * step;
            gsap.to(proxy, { x: dest, duration: DURATION, ease: EASE, onUpdate: render });
          };
        }
      });

      wrap._sliderDraggable = Draggable.create(proxy, {
        type:            'x',
        trigger:         collection,
        inertia:         true,
        maxDuration:     1,
        minDuration:     0.5,
        dragResistance:  0.025,
        throwResistance: 2000,
        bounds:          null,
        edgeResistance:  0,
        snap:            x => Math.round(x / step) * step,
        onDrag:          render,
        onThrowUpdate:   render,
        onThrowComplete: render,
        onPress:         () => wrap.setAttribute('data-gsap-drag-status', 'grabbing'),
        onDragStart:     () => wrap.setAttribute('data-gsap-drag-status', 'grabbing'),
        onRelease:       () => wrap.setAttribute('data-gsap-drag-status', 'grab'),
        onThrowComplete: () => wrap.setAttribute('data-gsap-drag-status', 'grab'),
      })[0];

      render();
      syncHeight();
      return;
    }

    // ── Horizontal loop layout ──
    // Touch used to go through GSAP's Draggable + InertiaPlugin, same as
    // desktop, just with heavier resistance dialed in. Two problems with
    // that in practice: (1) InertiaPlugin estimates release velocity from
    // recent pointer samples, and the very first drag of a page load has
    // too few of them — an erratic estimate could fling the loop all the
    // way around before settling back near card 1, which is exactly the
    // "goes fast and janky, scrolls through everything, lands back on 1"
    // bug. (2) updateProg() maps drag distance to progress using a ratio
    // over the FULL loop width (every card, not just one), so with heavy
    // resistance on top, a whole screen-width swipe barely dented the
    // progress needed to reach the next card.
    // Mobile now skips Draggable entirely and instead treats a swipe as a
    // simple, discrete "go to next/previous card" gesture — the same
    // toIndex() the arrow buttons already use, so it's exactly one card
    // per swipe no matter how far or fast you drag. Desktop keeps the
    // free-drag behavior, untouched.
    const isTouch = window.innerWidth <= 768;
    const loop = horizontalLoop(slides, {
      draggable:    !isTouch,
      snap:         1,
      paused:       true,
      center:       centered ? collection : false,
      paddingRight: gap,
      onChange(el, idx) { setActive(idx, slides.length); },
    });
    if (!isTouch && loop && loop.draggable) {
      Object.assign(loop.draggable.vars, {
        maxDuration:     1,
        minDuration:     0.5,
        dragResistance:  0.025,
        throwResistance: 2000,
      });
    }
    loop && loop.toIndex(0, { duration: 0 });
    setActive(0, slides.length);

    if (isTouch && loop && collection) {
      const SWIPE_PX = 30; // minimum horizontal travel to count as an intentional swipe
      let startX = 0, startY = 0, axis = null;

      const touchStart = e => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        axis = null;
      };
      const touchMove = e => {
        const t = e.touches[0];
        if (axis === null) {
          const dx = t.clientX - startX;
          const dy = t.clientY - startY;
          if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; // ignore jitter
          axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        }
        // Horizontal gesture: own it so the page doesn't scroll along with it.
        // Vertical: do nothing and let the page scroll normally (touch-action:
        // pan-y on .gsap-slider__list handles the rest).
        if (axis === 'x') e.preventDefault();
      };
      const touchEnd = e => {
        if (axis !== 'x') return;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) < SWIPE_PX) return; // too small to count as a swipe
        const opts = { duration: DURATION, ease: EASE };
        dx < 0 ? loop.next(opts) : loop.previous(opts);
      };

      collection.addEventListener('touchstart', touchStart, { passive: true });
      collection.addEventListener('touchmove',  touchMove,  { passive: false });
      collection.addEventListener('touchend',   touchEnd,   { passive: true });
    }

    controls.forEach(btn => {
      btn.disabled = false;
      const v = btn.getAttribute('data-gsap-slider-control');
      if (/^\d+$/.test(v)) {
        const idx = Math.max(0, Math.min(slides.length - 1, parseInt(v, 10) - 1));
        btn.onclick = () => loop && loop.toIndex(idx, { duration: DURATION, ease: EASE });
      } else if (v === 'prev' || v === 'next') {
        // Only numeric controls were wired here, so the prev/next arrows this
        // layout actually ships with were inert — the rotate branch above
        // handles them, this one never did.
        btn.onclick = () => {
          if (!loop) return;
          const opts = { duration: DURATION, ease: EASE };
          v === 'next' ? loop.next(opts) : loop.previous(opts);
        };
      }
    });
  });
}

// ─── CSS marquee (under-nav bar) ──────────────────────────────────────────────


// The active card plays (muted, looping), the others pause
function syncSliderVideos() {
  document.querySelectorAll('[data-gsap-slider-item]').forEach((it) => {
    const v = it.querySelector('video'); if (!v) return;
    if (it.getAttribute('data-gsap-slider-item-status') !== 'not-active') { v.dataset.on = '1'; v.play().catch(() => {}); }
    else { delete v.dataset.on; v.pause(); }
  });
}
if (window.gsap && window.Draggable) {
  gsap.registerPlugin(Draggable, window.InertiaPlugin);
  initOsmoSlider();
  syncSliderVideos();
  new MutationObserver(syncSliderVideos).observe(document.getElementById('showcaseList'), { subtree: true, attributes: true, attributeFilter: ['data-gsap-slider-item-status'] });
  document.querySelectorAll('.gsap-slider video').forEach((v) => v.addEventListener('loadeddata', syncSliderVideos));
}
