// Coded mockups of the Cutly editor for the features accordion (styles in feature-ui.css).
(function () {
  const tabs = (on) => `<div class="fui-tabs">${['Ask AI', 'Transcript', 'Captions', 'Cuts', 'Presets']
    .map((t) => `<span${t === on ? ' class="on"' : ''}>${t}</span>`).join('')}</div>`;
  const range = (pct) => `<div class="fui-range"><i style="width:${pct}%"></i></div>`;
  const field = (label, value, pct) => `<div class="fui-field"><div class="fui-field-top"><span>${label}</span><span class="fui-val">${value}</span></div>${range(pct)}</div>`;
  const toggle = (label, on = true) => `<div class="fui-row"><span>${label}</span><i class="fui-knob${on ? ' on' : ''}"></i></div>`;

  const UI = {
    cuts: () => `
      <div class="fui-card">
        <p class="fui-words"><s>So um</s> <s>editing your own</s> Editing your own videos is <s>uh</s> probably the exact reason you <s>like</s> aren&rsquo;t posting consistently.</p>
        <div class="fui-clips"><b></b><i style="flex:1.6"></i><b></b><i style="flex:1.2"></i><b style="flex:.35"></b><i></i></div>
        <div class="fui-note">4 mistakes cut &middot; 1:01 &rarr; 0:34</div>
      </div>`,

    captions: () => `
      <div class="fui-split">
        <div class="fui-frame"><span class="fui-cap">chopping <em>up clips</em></span></div>
        <div>
          <div class="fui-head" style="margin-top:6px">Captions</div>
          ${toggle('Show captions')}
          <div class="fui-sub" style="margin:16px 0 8px">STYLE</div>
          <div class="fui-tpls">
            <div class="fui-tpl on"><span style="padding:4px 7px;border-radius:4px;background:#fff;color:#111">Your caption</span></div>
            <div class="fui-tpl"><span style="color:#fff;-webkit-text-stroke:2.6px #000;paint-order:stroke fill">Your caption</span></div>
            <div class="fui-tpl"><span style="padding:4px 7px;border-radius:4px;background:#ffd60a;color:#111">Your caption</span></div>
            <div class="fui-tpl"><span style="color:#ffd60a">Your caption</span></div>
          </div>
        </div>
      </div>`,

    zooms: () => `
      <div class="fui-split">
        <div class="fui-frame"><span class="fui-zoom"></span></div>
        <div class="fui-card" style="align-self:center">
          <div class="fui-head">Zoom on every cut</div>
          <div class="fui-seg"><span class="on">Ease out</span><span>Punch</span><span>Off</span></div>
          <p class="fui-desc">Starts zoomed in on each cut, then eases back out.</p>
          ${field('Starts at', '112%', 40)}
          ${field('Zooms back out over', '1.5s', 29).replace('fui-field"', 'fui-field" style="margin:0"')}
        </div>
      </div>`,

    sfx: () => `
      <div class="fui-tl">
        <span></span><div class="fui-ruler"><span>0:00</span><span>0:02</span><span>0:04</span><span>0:06</span><span>0:08</span><span>0:10</span></div>
        <span><b>V1</b>Video</span><div class="fui-track"><i class="v" style="left:0;width:34%"></i><i class="v" style="left:35%;width:30%"></i><i class="v" style="left:66%;width:34%"></i></div>
        <span><b>A1</b>Voice</span><div class="fui-track"><i class="a" style="left:0;width:34%"></i><i class="a" style="left:66%;width:30%"></i></div>
        <span><b>A2</b>Voice</span><div class="fui-track"><i class="a" style="left:31%;width:36%"></i></div>
        <span><b>A3</b>Sounds</span><div class="fui-track"><i class="s" style="left:6%;width:16%">WOW</i><i class="s" style="left:39%;width:20%">Cute pop</i><i class="s" style="left:74%;width:16%">HUH</i></div>
        <span class="fui-head-line"></span>
      </div>`,

    ai: () => `
      <p class="fui-say">Done. I cut the retakes and long pauses, then added zooms, sounds and captions.</p>
      <div class="fui-me">
        <div class="fui-bubble">Zoom in when I say &ldquo;chopping up clips&rdquo;</div>
        <div class="fui-meta"><span class="fui-stamp">0:06.2</span><span class="fui-done">&#10003;</span>Done</div>
      </div>
      <div class="fui-compose"><span class="fui-stamp">0:07.5</span><span>Write a change...</span><span class="fui-send">&uarr;</span></div>`,

    transcript: () => `
      ${tabs('Transcript')}
      <div class="fui-keys"><span class="lit"><kbd>Del</kbd>Cut</span><span><kbd>R</kbd>Undo cut</span><span><kbd>H</kbd>Highlight</span><span><kbd>Z</kbd>Zoom</span></div>
      <p class="fui-words"><s>So um</s> Editing your own videos is probably the exact reason you aren&rsquo;t posting consistently. <span class="sel">Doing it yourself takes hours</span> of chopping up clips. Just throw your raw footage into <span class="hl">Cutly</span> instead.</p>`,

    presets: () => `
      <div class="fui-card">
        <div class="fui-preset"><span class="fui-select">UGC ad</span><span class="fui-sq">+</span></div>
        <div class="fui-sub">AI EDIT</div>
        ${toggle('Cut retakes and mistakes')}
        ${toggle('Zooms on key moments')}
        ${toggle('Sound effects')}
        ${toggle('Highlight key words')}
        ${toggle('Mute swear words', false)}
      </div>`
  };

  window.featureUi = (name) => `<div class="fui fui-${name}" aria-hidden="true">${UI[name] ? UI[name]() : ''}</div>`;

  // Scales each mockup from its 400 x 250 design to the width of its box
  const fit = new ResizeObserver((entries) => entries.forEach(({ target, contentRect }) => {
    const ui = target.querySelector('.fui');
    if (ui && contentRect.width) ui.style.transform = `scale(${contentRect.width / 400})`;
  }));
  window.fitFeatureUi = (box) => fit.observe(box);
})();
