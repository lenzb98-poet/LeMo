// Erste Szene beim Öffnen: Lenz steht im Klinikraum. Antippen auf den Boden = dorthin gehen,
// Antippen auf den Stuhl mit dem iPad (oder das iPad/den Tisch) = hingehen, hinsetzen → Levelauswahl.
// Das Raumbild (144×84) wird 2-fach gezeichnet, die Figur ist dieselbe 64er-Figur wie in der Demo.

import { buildLenz, LENZ_SIZE, LENZ_WALK_FRAMES, LENZ_FEET } from '../assets/lenz64.js';

const ROOM_SCALE = 2;
const ROOM_X = 16, ROOM_Y = 6;           // Raum mittig im 320×180-Bild
const FLOOR = 148;                       // Fußlinie (Spielpixel)
const MIN_X = 82, MAX_X = 232;           // zwischen den Betten
const SPEED = 1.5;                       // Pixel pro Update (= 90 px/s)
const PX_PER_FRAME = 4;                  // Schrittweite pro Animationsbild (kein Rutschen)
const SEAT_X = 139;                      // Mitte der Figur, wenn sie auf dem linken Stuhl sitzt
const CHAIR = { x: 126, y: 104, w: 22, h: 46 };        // linker Stuhl (antippbar)
const DESK = { x: 140, y: 100, w: 32, h: 50 };         // Tisch mit iPad (antippbar)
const SPARK = { x: 154, y: 104 };                      // Funkeln über dem iPad

let lenz = null;                         // Figurenbilder einmal bauen
let room = null;

function loadRoom() {
  if (room) return room;
  room = new Image();
  room.src = 'assets/raeume/klinikraum.png';
  return room;
}

const inside = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export default function start(game) {
  if (!lenz) lenz = buildLenz();
  const img = loadRoom();
  const t = game.texts.ui;
  const p = { x: 196, dir: 'left', tx: null, walked: 0, mode: 'free', timer: 0, onArrive: null };
  let tick = 0;
  let marker = null;

  function walkTo(x, onArrive = null, showMarker = false) {
    p.tx = Math.min(MAX_X, Math.max(MIN_X, Math.round(x)));
    p.onArrive = onArrive;
    marker = showMarker ? { x: p.tx, t: 0 } : null;
    if (p.tx !== p.x) p.dir = p.tx < p.x ? 'left' : 'right';
  }

  function sitDown() {
    p.dir = 'right';
    p.mode = 'sitting';
    p.timer = 90;                        // kurz sitzen bleiben, dann Levelauswahl
  }

  function tap(pt) {
    if (p.mode !== 'free') return;
    if (inside(pt, CHAIR) || inside(pt, DESK)) walkTo(SEAT_X, sitDown);
    else if (pt.y >= FLOOR - 70) walkTo(pt.x, null, true);
  }

  return {
    controls: false,
    pauseable: false,

    enter() {
      game.scenes.caption(t.startHint, { hold: 240, y: 172 });
    },

    update() {
      tick++;
      const input = game.input;
      for (const pt of input.taps) tap(pt);
      if (p.mode === 'free') {
        const ax = input.axisX();
        if (ax) walkTo(p.x + ax * 12);
        if (input.pressed('a') || input.pressed('b')) walkTo(SEAT_X, sitDown);
      }
      if (marker) marker.t++;

      if (p.tx !== null) {
        const dx = p.tx - p.x;
        if (Math.abs(dx) <= SPEED) {
          p.x = p.tx;
          p.tx = null;
          p.walked = 0;
          marker = null;
          const cb = p.onArrive;
          p.onArrive = null;
          if (cb) cb();
        } else {
          p.x += Math.sign(dx) * SPEED;
          p.walked += SPEED;
        }
      }

      if (p.mode === 'sitting' && --p.timer <= 0) {
        p.mode = 'done';
        game.scenes.go('menu', { frames: 30 });
      }
    },

    render(r) {
      const ctx = r.ctx;
      r.clear('#05060c');
      if (img.complete && img.naturalWidth) {
        ctx.drawImage(img, ROOM_X, ROOM_Y, img.naturalWidth * ROOM_SCALE, img.naturalHeight * ROOM_SCALE);
      }

      // Zielmarke auf dem Boden
      if (marker) {
        const k = 3 + (Math.floor(marker.t / 10) % 2);
        const x = marker.x, y = FLOOR + 3;
        r.rect(x - k, y, 2, 1, '#ffffff');
        r.rect(x + k - 1, y, 2, 1, '#ffffff');
        r.rect(x, y - 2, 1, 2, '#ffffff');
        r.rect(x, y + 1, 1, 2, '#ffffff');
      }

      // Funkeln über dem iPad: hier geht es weiter
      if (p.mode === 'free' && Math.floor(tick / 24) % 2 === 0) {
        r.rect(SPARK.x - 1, SPARK.y, 3, 1, '#ffe9a0');
        r.rect(SPARK.x, SPARK.y - 1, 1, 3, '#ffe9a0');
        r.rect(SPARK.x, SPARK.y, 1, 1, '#ffffff');
      }

      // Figur mit weichem Bodenschatten
      const x = Math.round(p.x);
      const sitting = p.mode !== 'free';
      ctx.globalAlpha = 0.3;
      r.rect(x - 10, FLOOR - 1, 20, 2, '#1c1d22');
      r.rect(x - 7, FLOOR - 2, 14, 4, '#1c1d22');
      ctx.globalAlpha = 1;
      let frame;
      if (sitting) frame = lenz.sit.right;
      else if (p.tx !== null) frame = lenz[p.dir].walk[Math.floor(p.walked / PX_PER_FRAME) % LENZ_WALK_FRAMES];
      else frame = lenz[p.dir].idle;
      ctx.drawImage(frame, x - LENZ_SIZE / 2, FLOOR - LENZ_FEET);
    },

    debug: { p },
  };
}
