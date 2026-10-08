// Leerer Testraum (Meilenstein 1): Die Figur läuft hin und her, die Kamera folgt.
// Jeder Abschnitt benutzt ihn vorerst als Platzhalter – in seiner eigenen Farbpalette.
// Am rechten Rand geht es weiter zum nächsten Abschnitt.

import { Walker } from '../engine/physics.js';
import { Camera } from '../engine/camera.js';
import { palette } from '../assets/loader.js';

const ROOM_W = 560;
const FLOOR = 148;
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

// Himmel/Wand als Verlauf zwischen zwei Palettenfarben, mit Pixel-Raster statt weichem Übergang
function backdrop(pal) {
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 180;
  const ctx = c.getContext('2d');
  const top = pal[10], bottom = pal[11];          // Slot a (oben) → b (unten)
  for (let y = 0; y < 180; y++) {
    for (let x = 0; x < 320; x++) {
      // oben einfarbig, unten einfarbig, nur dazwischen ein schmaler gerasterter Übergang
      const t = Math.min(1, Math.max(0, (y / FLOOR - 0.5) / 0.3));
      ctx.fillStyle = t * 16 > BAYER[y & 3][x & 3] + 0.5 ? bottom : top;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

function disc(r, cx, cy, rad, color) {
  for (let dy = -rad; dy <= rad; dy++) {
    const w = Math.floor(Math.sqrt(rad * rad - dy * dy));
    r.rect(cx - w, cy + dy, w * 2 + 1, 1, color);
  }
}

export function createTestRoom(game, { section, paletteId, next, note }) {
  const level = { ground: [{ x: 0, y: FLOOR }, { x: ROOM_W, y: FLOOR }], minX: 8, maxX: ROOM_W - 6 };
  const player = new Walker(40, FLOOR);
  const cam = new Camera(320, 180);
  cam.setBounds(0, 0, ROOM_W, 180);
  const pal = palette(paletteId);
  const bg = backdrop(pal);
  let tick = 0;
  let leaving = false;

  return {
    controls: true,
    pauseable: true,

    enter() {
      game.save.setSection(section);
      game.scenes.caption(game.texts[section] ? game.texts[section].intro : '');
      cam.snap(player.x, 90);
    },

    update() {
      tick++;
      player.update(game.input, level);
      cam.follow(player.x, 90, { lerp: 0.12, lookAhead: player.facing * 28 });
      if (next && !leaving && player.x >= level.maxX - 0.5) {
        leaving = true;
        game.scenes.go(next);
      }
    },

    render(r) {
      r.ctx.drawImage(bg, 0, 0);
      // Sonne / Licht (Slot e), leicht verschoben zur Kamera (Tiefe)
      const sx = Math.round(230 - cam.ix * 0.15);
      disc(r, sx, 40, 16, pal[14] + '44');
      disc(r, sx, 40, 11, pal[14]);

      r.push(cam.ix, cam.iy);
      // Boden aus Kacheln
      for (let x = 0; x < ROOM_W; x += 16) {
        const v = (x / 16) % 2;
        r.sprite('ground_top', v, x, FLOOR, { palette: paletteId });
        for (let y = FLOOR + 16; y < 180; y += 16) r.sprite('ground_fill', v, x, y, { palette: paletteId });
      }
      // Ausgang rechts
      if (next && Math.floor(tick / 30) % 2) r.text('>', ROOM_W - 14, FLOOR - 16, { color: pal[9], shadow: pal[0] });
      // Figur
      const anim = !player.onGround ? ['teen_walk', 0] :
        Math.abs(player.vx) > 0.1 ? ['teen_walk', Math.floor(player.walked / 6) % 4] :
        ['teen_idle', Math.floor(tick / 40) % 2];
      r.sprite(anim[0], anim[1], player.x - 8, player.y - 32, { palette: paletteId, flip: player.facing < 0 });
      r.pop();

      if (note) r.text(note, 4, 4, { color: pal[9], shadow: pal[0], alpha: 0.75 });
    },

    // Für automatische Tests
    debug: { player, cam },
  };
}
