// Feste Spielschleife: genau 60 Updates pro Sekunde, egal wie schnell das Gerät zeichnet.
// Gezeichnet wird bei jedem Bildschirm-Bild (requestAnimationFrame).

export const STEP_MS = 1000 / 60;

export function startLoop(update, render) {
  let acc = 0;
  let last = performance.now();
  let running = true;

  function frame(now) {
    if (!running) return;
    let dt = now - last;
    last = now;
    if (dt > 250) dt = STEP_MS;                       // nach Pause/Tab-Wechsel nicht „nachholen“
    // Kleine Zeitschwankungen auf ganze Schritte runden – verhindert Ruckeln bei 60/120 Hz
    const steps = dt / STEP_MS;
    const snapped = Math.round(steps);
    if (snapped > 0 && Math.abs(steps - snapped) < 0.06) dt = snapped * STEP_MS;
    acc += dt;
    let n = 0;
    while (acc >= STEP_MS - 0.01 && n < 5) {
      update();
      acc -= STEP_MS;
      n++;
    }
    if (n === 5) acc = 0;
    render();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { last = performance.now(); acc = 0; }
  });
  return { stop() { running = false; } };
}
