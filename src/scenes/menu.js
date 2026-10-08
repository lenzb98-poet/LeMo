// Levelauswahl (ersetzt den Kartenturm): Porträt links, rechts Titel und eine einfache Liste.
// Bedienung: antippen – oder Steuerkreuz hoch/runter + A. B = zurück.

import { PORTRAIT_PAL, PORTRAIT_EYES } from '../assets/sprites.js';

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const PS = 2, PX = 6, PY = 52;            // Porträt: Vergrößerung und Position

// Dunkler Hintergrund mit kühlem Schein hinter dem Kopf und warmem Schein rechts – einmal vorgezeichnet
function backdrop() {
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 180;
  const ctx = c.getContext('2d');
  const ramp = ['#05060c', '#0a0e1a', '#101828', '#16233a'];
  const warm = ['#05060c', '#140c10', '#26140f', '#3a1d10'];
  for (let y = 0; y < 180; y++) {
    for (let x = 0; x < 320; x++) {
      const cool = Math.max(0, 1 - Math.hypot((x - 58) / 1.2, y - 92) / 120);
      const hot = Math.max(0, 1 - Math.hypot((x - 250) / 1.4, (y - 175) * 1.2) / 150);
      const d = (BAYER[y & 3][x & 3] + 0.5) / 16;
      const useWarm = hot > cool;
      const v = Math.min(0.999, (useWarm ? hot : cool) * 1.15 + y / 900);
      const p = v * 3, i = Math.floor(p);
      const col = (useWarm ? warm : ramp)[Math.min(3, i + (p - i > d ? 1 : 0))];
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

export default function menu(game) {
  const t = game.texts.ui;
  const bg = backdrop();
  const motes = Array.from({ length: 22 }, () => ({ x: Math.random() * 320, y: Math.random() * 180, s: 0.1 + Math.random() * 0.25, warm: Math.random() < 0.5 }));
  let tick = 0;
  let sel = 0;
  let sub = null;              // Untermenü „Weiter / Von vorn“
  let blink = -1, nextBlink = 150;

  function mainItems() {
    return [
      { label: t.level1, info: t.level1Info, run: startLevel },
      { label: t.prototype, info: t.prototypeInfo, run: () => { location.href = 'legacy/?demo'; } },
    ];
  }

  function startLevel() {
    const saved = game.save.section();
    if (saved && saved !== 'A') {
      const name = t.sections[saved] || saved;
      sub = [
        { label: t.continueAt, info: name, run: () => game.scenes.go(saved) },
        { label: t.restart, info: t.sections.A, run: () => { game.save.reset(); game.scenes.go('A'); } },
      ];
      sel = 0;
    } else {
      game.scenes.go('A');
    }
  }

  function layout() {
    const items = sub || mainItems();
    return items.map((it, i) => ({ ...it, x: 132, y: 70 + i * 32, w: 180, h: 26 }));
  }

  return {
    controls: false,
    pauseable: false,

    update() {
      tick++;
      const input = game.input;
      const items = layout();
      if (input.pressed('up')) sel = (sel + items.length - 1) % items.length;
      if (input.pressed('down')) sel = (sel + 1) % items.length;
      if (sub && input.pressed('b')) { sub = null; sel = 0; }
      for (const tap of input.taps) {
        const hit = items.findIndex((it) => tap.x >= it.x && tap.x <= it.x + it.w && tap.y >= it.y && tap.y <= it.y + it.h);
        if (hit >= 0) { sel = hit; items[hit].run(); return; }
      }
      if (input.pressed('a')) items[sel].run();

      for (const m of motes) {
        m.y -= m.s;
        m.x += Math.sin((tick + m.y) * 0.02) * 0.08;
        if (m.y < -2) { m.y = 182; m.x = Math.random() * 320; }
      }
      if (blink >= 0) { if (++blink > 9) blink = -1; }
      else if (--nextBlink <= 0) { blink = 0; nextBlink = 150 + Math.floor(Math.random() * 200); }
    },

    render(r) {
      r.ctx.drawImage(bg, 0, 0);
      for (const m of motes) r.rect(m.x, m.y, 1, 1, m.warm ? '#ffcf7a' : '#6fd6d6');

      // Porträt (2-fach) mit Augen, die zur gewählten Zeile schauen
      r.sprite('portrait', 0, PX, PY, { scale: PS });
      const cell = (gx, gy, col) => r.rect(PX + gx * PS, PY + gy * PS, PS, PS, col);
      for (const e of PORTRAIT_EYES) {
        if (blink >= 0 && blink < 8) {
          for (let i = 0; i < e.w; i++) { cell(e.x0 + i, e.y0, PORTRAIT_PAL.d); cell(e.x0 + i, e.y0 + 1, PORTRAIT_PAL.K); }
          continue;
        }
        const ix = e.irisX[2];
        cell(ix, e.y0, PORTRAIT_PAL.i); cell(ix + 1, e.y0, PORTRAIT_PAL.K);
        cell(ix, e.y0 + 1, PORTRAIT_PAL.i); cell(ix + 1, e.y0 + 1, PORTRAIT_PAL.I);
      }

      // Titel
      r.text(t.title, 222, 14, { align: 'center', color: '#ffc75a', shadow: '#3a1608', scale: 3 });
      r.text(t.subtitle, 222, 44, { align: 'center', color: '#7fe0de', shadow: '#05060c' });

      // Liste
      layout().forEach((it, i) => {
        const on = i === sel;
        r.rect(it.x, it.y, it.w, it.h, on ? '#1c1626' : '#0c0d16');
        r.rect(it.x, it.y, it.w, 1, on ? '#ffc75a' : '#2a2a3a');
        r.rect(it.x, it.y + it.h - 1, it.w, 1, on ? '#ffc75a' : '#2a2a3a');
        r.rect(it.x, it.y, 1, it.h, on ? '#ffc75a' : '#2a2a3a');
        r.rect(it.x + it.w - 1, it.y, 1, it.h, on ? '#ffc75a' : '#2a2a3a');
        if (on && Math.floor(tick / 20) % 2 === 0) r.text('▶', it.x + 6, it.y + 9, { color: '#ffc75a' });
        r.text(it.label, it.x + 16, it.y + 4, { color: on ? '#fff3c4' : '#b8b2c8', shadow: '#000' });
        r.text(it.info, it.x + 16, it.y + 15, { color: on ? '#c9a46a' : '#6c6880' });
      });
    },
  };
}
