// The features list shows the real editor: the page of the home page demo (app-demo/index.html?feature=...) laid out to fill the card,
// at the card's own size, showing the one part of the editor that belongs to the feature (see the demo-feature rules in app-demo/demo-only.css).
(function () {
  window.featureUi = (name) => `<iframe class="fui-real" src="app-demo/index.html?feature=${name}" title="" tabindex="-1" scrolling="no" aria-hidden="true"></iframe>`;

  // The frame is laid out at the card's size (at least 480 px wide, as on a wide screen), then scaled to the card, so text keeps its proportions
  function place(box) {
    const frame = box.querySelector('.fui-real');
    if (!frame || !box.clientWidth) return;
    const w = Math.max(480, box.clientWidth);
    const h = box.clientHeight * w / box.clientWidth;
    frame.style.width = w + 'px';
    frame.style.height = h + 'px';
    frame.style.transform = `scale(${box.clientWidth / w})`;
  }
  const fit = new ResizeObserver((entries) => entries.forEach(({ target }) => place(target)));
  window.fitFeatureUi = (box) => { fit.observe(box); place(box); };
})();
