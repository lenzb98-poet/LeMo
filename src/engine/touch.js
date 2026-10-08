// Touch-Steuerung fürs iPad: Steuerkreuz links unten, A/B rechts unten (halbtransparent),
// Pause-Knopf oben rechts, unsichtbares Debug-Feld oben links.
// Mehrere Finger gleichzeitig gehen (z. B. laufen + springen).

export function setupTouch(root, input, renderer, { onPause, onDebug }) {
  let isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  let mode = { controls: false, pause: false };

  const ui = document.createElement('div');
  ui.id = 'touch';
  ui.innerHTML =
    '<div class="dpad"><i class="arm up"></i><i class="arm down"></i><i class="arm left"></i><i class="arm right"></i><i class="hub"></i></div>' +
    '<div class="btn btn-b" data-action="b"><span>B</span></div>' +
    '<div class="btn btn-a" data-action="a"><span>A</span></div>';
  root.appendChild(ui);

  const pauseBtn = document.createElement('button');
  pauseBtn.id = 'pauseBtn';
  pauseBtn.type = 'button';
  pauseBtn.setAttribute('aria-label', 'Pause');
  pauseBtn.innerHTML = '<i></i><i></i>';
  root.appendChild(pauseBtn);

  const debugZone = document.createElement('div');
  debugZone.id = 'debugZone';
  root.appendChild(debugZone);

  // ---------- Steuerkreuz: Richtung aus der Fingerposition (Finger darf rutschen) ----------
  const dpad = ui.querySelector('.dpad');
  const arms = {};
  for (const d of ['up', 'down', 'left', 'right']) arms[d] = dpad.querySelector('.' + d);
  const dpadPointers = new Set();

  function setDirs(state) {
    for (const d of ['left', 'right', 'up', 'down']) {
      input.set(d, 'touch-dpad', !!state[d]);
      arms[d].classList.toggle('on', !!state[d]);
    }
  }
  function dirsFrom(e) {
    const r = dpad.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    // Waagerecht reagiert schnell, senkrecht erst bei deutlicher Bewegung (kein ungewolltes „unten“)
    return { left: dx < -0.28, right: dx > 0.28, up: dy < -0.5, down: dy > 0.5 };
  }
  dpad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    dpad.setPointerCapture(e.pointerId);
    dpadPointers.add(e.pointerId);
    setDirs(dirsFrom(e));
  });
  dpad.addEventListener('pointermove', (e) => {
    if (dpadPointers.has(e.pointerId)) setDirs(dirsFrom(e));
  });
  const dpadEnd = (e) => {
    if (!dpadPointers.delete(e.pointerId)) return;
    if (!dpadPointers.size) setDirs({});
  };
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) dpad.addEventListener(t, dpadEnd);

  // ---------- A / B ----------
  for (const btn of ui.querySelectorAll('.btn')) {
    const action = btn.dataset.action;
    const pointers = new Set();
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      pointers.add(e.pointerId);
      input.set(action, 'touch-' + action, true);
      btn.classList.add('on');
    });
    const end = (e) => {
      if (!pointers.delete(e.pointerId)) return;
      if (!pointers.size) {
        input.set(action, 'touch-' + action, false);
        btn.classList.remove('on');
      }
    };
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) btn.addEventListener(t, end);
  }

  // ---------- Antippen aufs Spielbild (Menüs), Pause, Debug ----------
  renderer.canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const p = renderer.toGame(e.clientX, e.clientY);
    input.addTap(p.x, p.y);
  });
  pauseBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); onPause(); });
  debugZone.addEventListener('pointerdown', (e) => { e.preventDefault(); onDebug(); });

  // Erst bei der ersten echten Berührung auf Touch umschalten (z. B. Laptop mit Touchscreen)
  addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' && !isTouch) { isTouch = true; apply(); }
  }, true);

  // iOS: kein Scrollen, kein Zoomen, kein Lupen-Menü beim langen Drücken
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());

  function apply() {
    ui.classList.toggle('hidden', !(isTouch && mode.controls));
    pauseBtn.classList.toggle('hidden', !mode.pause);
    if (!mode.controls) setDirs({});
  }

  return {
    get isTouch() { return isTouch; },
    setMode(m) { mode = { ...mode, ...m }; apply(); },
  };
}

// Kleines Debug-Menü (nur zum Testen): Knöpfe zum direkten Springen in einen Abschnitt
export function createDebugMenu(root, items) {
  const box = document.createElement('div');
  box.id = 'debugMenu';
  box.className = 'hidden';
  for (const it of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = it.label;
    b.addEventListener('click', () => { box.classList.add('hidden'); it.run(); });
    box.appendChild(b);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '×';
  close.className = 'close';
  close.addEventListener('click', () => box.classList.add('hidden'));
  box.appendChild(close);
  root.appendChild(box);
  return { toggle() { box.classList.toggle('hidden'); } };
}
