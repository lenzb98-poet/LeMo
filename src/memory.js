// Overlay für eine Erinnerung: Foto-Ausschnitt aus dem Zimmer + Text, der getippt erscheint.
(function () {
  const el = document.getElementById('memory');
  const pic = document.getElementById('memoryPic');
  const titleEl = document.getElementById('memoryTitle');
  const textEl = document.getElementById('memoryText');
  const hintEl = document.getElementById('memoryHint');

  let isOpen = false, full = '', shown = 0, timer = null, onClose = null;

  function finishTyping() {
    clearInterval(timer);
    shown = full.length;
    textEl.textContent = full;
    hintEl.textContent = 'Klick = schließen';
  }

  function show(m, snapshot, cb) {
    isOpen = true;
    onClose = cb;
    titleEl.textContent = m.title;
    full = m.text.join('\n\n');
    shown = 0;
    textEl.textContent = '';
    hintEl.textContent = 'Klick = überspringen';
    const pctx = pic.getContext('2d');
    pctx.imageSmoothingEnabled = false;
    pctx.clearRect(0, 0, pic.width, pic.height);
    pctx.drawImage(snapshot, 0, 0);
    el.classList.remove('hidden');
    clearInterval(timer);
    timer = setInterval(() => {
      shown++;
      textEl.textContent = full.slice(0, shown);
      if (shown >= full.length) finishTyping();
    }, 28);
  }

  function hide(silent) {
    if (!isOpen) return;
    isOpen = false;
    clearInterval(timer);
    el.classList.add('hidden');
    const cb = onClose;
    onClose = null;
    if (!silent && cb) cb();
  }

  el.addEventListener('pointerdown', () => {
    if (shown < full.length) finishTyping();
    else hide(false);
  });

  // Escape schließt nur die Erinnerung, nicht das ganze Spiel (läuft vor home.js)
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopImmediatePropagation();
      hide(false);
    }
  });

  window.MemoryUI = { show, hide, get isOpen() { return isOpen; } };
})();
