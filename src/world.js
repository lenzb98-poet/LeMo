// Dein Zimmer nach dem Foto, als scrollende Welt mit Parallax-Ebenen.
// Jede Ebene wird einmal als Pixel-Bild vorgezeichnet. Beim Scrollen bewegen
// sich die Ebenen unterschiedlich schnell:
//   draußen (Hecke, Himmel) langsam -> sieht man nur durchs Fenster
//   Wand + Boden + Möbel          -> gehen 1:1 mit
//   Vordergrund (Pflanzen, Efeu)  -> schneller als alles andere
(function () {
  const VW = 192, VH = 144;          // Bildschirm (4:3)
  const WORLD_W = 640;               // Zimmerbreite
  const WALL_BASE = 104;             // Wand trifft Boden
  const FURN_BASE = 114;             // Möbel stehen hier
  const GROUND = 130;                // Lenz' Füße
  const F = { outside: 0.25, fore: 1.35 };
  const WIN = { x: 290, y: 26, w: 64, h: 52 };

  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const layerWidth = (f) => Math.ceil(VW + (WORLD_W - VW) * f);

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return [c, x];
  }
  const R = (x, X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), w, h); };
  function ellipse(x, cx, cy, rx, ry, col) {
    x.fillStyle = col;
    for (let dy = -ry; dy <= ry; dy++) {
      const dx = Math.floor(rx * Math.sqrt(1 - (dy * dy) / (ry * ry + 0.0001)));
      x.fillRect(Math.round(cx - dx), Math.round(cy + dy), dx * 2 + 1, 1);
    }
  }
  function line(x, x0, y0, x1, y1, col) {
    x.fillStyle = col;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      x.fillRect(Math.round(x0 + ((x1 - x0) * i) / (n || 1)), Math.round(y0 + ((y1 - y0) * i) / (n || 1)), 1, 1);
    }
  }
  const shadow = (x, X, w) => R(x, X - 2, FURN_BASE, w + 4, 3, 'rgba(50,25,10,0.35)');

  // ---------- draußen: Hecke und Himmel (nur durchs Fenster sichtbar) ----------
  function buildOutside() {
    const [c, x] = canvas(layerWidth(F.outside), VH);
    const top = [156, 200, 238], bot = [227, 241, 251];
    for (let y = 0; y < VH; y += 4) {
      const k = Math.min(1, y / 80);
      x.fillStyle = 'rgb(' + top.map((t, i) => Math.round(t + (bot[i] - t) * k)).join(',') + ')';
      x.fillRect(0, y, c.width, 4);
    }
    const r = rng(11);
    R(x, 0, 44, c.width, VH - 44, '#245a28');
    for (let i = 0; i < 150; i++) {
      const cx = r() * c.width, cy = 36 + r() * 70;
      ellipse(x, cx, cy, 5 + r() * 6, 4 + r() * 4, r() < 0.5 ? '#2d6a2e' : '#397a37');
    }
    for (let i = 0; i < 90; i++) {
      const cx = r() * c.width, cy = 34 + r() * 60;
      ellipse(x, cx, cy, 2 + r() * 3, 2 + r() * 2, r() < 0.6 ? '#5aa84a' : '#79c25e');
    }
    for (let i = 0; i < 160; i++) R(x, r() * c.width, 34 + r() * 70, 1, 1, '#a6df7e');
    return c;
  }

  // ---------- Wand mit Fensterausschnitt und Zweig ----------
  function buildWall() {
    const [c, x] = canvas(WORLD_W, VH);
    const r = rng(3);
    R(x, 0, 0, WORLD_W, WALL_BASE, '#f3f1ea');
    R(x, 0, 0, WORLD_W, 14, '#ebe9e2');
    R(x, 0, 14, WORLD_W, 6, '#efede6');
    R(x, 0, 0, 40, WALL_BASE, 'rgba(120,110,90,0.07)');
    for (let i = 0; i < 220; i++) R(x, r() * WORLD_W, r() * 96, 1, 1, r() < 0.5 ? '#faf9f4' : '#e6e4dc');
    // Fußleiste
    R(x, 0, 97, WORLD_W, 7, '#fbfbf9');
    R(x, 0, 97, WORLD_W, 1, '#e0ded6');
    R(x, 0, WALL_BASE, WORLD_W, 1, '#c3c0b4');
    // Fenster
    R(x, WIN.x, WIN.y, WIN.w, WIN.h, '#fcfcfa');
    R(x, WIN.x, WIN.y + WIN.h - 2, WIN.w, 2, '#e4e2da');
    const gx = WIN.x + 4, gy = WIN.y + 4, gw = WIN.w - 8, gh = WIN.h - 8;
    x.clearRect(gx, gy, gw, gh);                         // Loch für die Außenwelt
    R(x, gx - 1, gy - 1, gw + 2, 1, '#d9d7cf');
    R(x, gx - 1, gy, 1, gh, '#d9d7cf');
    // halb heruntergelassenes Plissee
    R(x, gx, gy, gw, 15, '#f1f1ee');
    for (let y = gy + 3; y < gy + 15; y += 4) R(x, gx, y, gw, 1, '#d9d9d5');
    R(x, gx, gy + 15, gw, 2, '#c8c8c4');
    R(x, gx + gw - 6, gy + 17, 1, 7, '#c8c8c4');
    // Fensterbank
    R(x, WIN.x - 4, WIN.y + WIN.h, WIN.w + 8, 3, '#f7f6f1');
    R(x, WIN.x - 4, WIN.y + WIN.h + 3, WIN.w + 8, 1, '#cfcdc4');
    // Zweig mit Wollfäden über dem Bett
    const tw = '#1e1a19';
    const main = [[10, 76], [24, 66], [36, 62], [48, 56], [60, 58], [72, 48], [84, 44], [96, 38], [112, 34]];
    for (let i = 0; i < main.length - 1; i++) line(x, ...main[i], ...main[i + 1], tw);
    [[[48, 56], [44, 46], [40, 40]], [[60, 58], [66, 66], [64, 74]], [[72, 48], [70, 38], [74, 32]],
     [[84, 44], [92, 50], [100, 52]], [[96, 38], [98, 28]], [[36, 62], [28, 56], [22, 48]]]
      .forEach((p) => { line(x, ...p[0], ...p[1], tw); if (p[2]) line(x, ...p[1], ...p[2], tw); });
    line(x, 62, 60, 64, 80, '#8a8680');
    line(x, 88, 46, 86, 70, '#8a8680');
    for (let i = 0; i < 14; i++) R(x, 58 + r() * 10, 74 + r() * 8, 1, 1, '#6d6a66');
    return c;
  }

  // ---------- Holzboden mit Teppich und Sonnenfleck ----------
  function buildFloor() {
    const [c, x] = canvas(WORLD_W, VH);
    const r = rng(8);
    const shades = ['#b57c46', '#a9703c', '#bd8450'];
    let y = WALL_BASE + 1, row = 0, h = 4;
    while (y < VH) {
      R(x, 0, y, WORLD_W, h, shades[row % 3]);
      R(x, 0, y, WORLD_W, 1, '#8f5b2f');
      for (let sx = (row * 37) % 64; sx < WORLD_W; sx += 56 + Math.floor(r() * 20)) R(x, sx, y, 1, h, '#8f5b2f');
      for (let i = 0; i < WORLD_W / 18; i++) R(x, r() * WORLD_W, y + 1 + r() * (h - 1), 3, 1, r() < 0.5 ? '#c99358' : '#9c6634');
      y += h; row++; h = Math.min(8, 4 + Math.floor(row / 2));
    }
    R(x, 0, WALL_BASE + 1, WORLD_W, 2, 'rgba(60,30,10,0.35)');
    // Sonnenfleck vom Fenster
    for (let yy = 108; yy < 142; yy++) {
      const t = (yy - 108) / 34;
      const x0 = 300 - t * 52, x1 = 352 - t * 32;
      R(x, x0, yy, x1 - x0, 1, 'rgba(255,236,176,0.26)');
      R(x, x0 + 10, yy, x1 - x0 - 22, 1, 'rgba(255,244,200,0.14)');
    }
    // weißer Webteppich mit Fransen
    for (let yy = 124; yy < 143; yy++) {
      const inset = Math.round((143 - yy) * 0.25);
      const x0 = 150 + inset, x1 = 264 - inset;
      R(x, x0, yy, x1 - x0, 1, (yy % 4 < 2) ? '#f0eadb' : '#e2dac4');
      R(x, x0, yy, 1, 1, '#c9c0a8'); R(x, x1 - 1, yy, 1, 1, '#c9c0a8');
    }
    R(x, 150 + 5, 124, 109 - 10, 1, '#c9c0a8');
    for (let xx = 156; xx < 258; xx += 3) { R(x, xx, 143, 1, 1, '#d8cfb8'); }
    return c;
  }

  // ---------- Möbel (Stuhl, Säule, Fensterschmuck, Heizkörper, Kommode) ----------
  function buildFurniture() {
    const [c, x] = canvas(WORLD_W, VH);

    // braune Säule (hinter dem Bett)
    shadow(x, 140, 14);
    R(x, 140, 70, 14, 44, '#5c2c24');
    R(x, 141, 70, 2, 44, '#7a4034');
    [145, 149, 152].forEach((sx) => R(x, sx, 70, 1, 44, '#3f1c18'));
    R(x, 139, 68, 16, 3, '#4a2119');
    R(x, 139, 71, 16, 1, '#2f1410');

    // geschnitzter Stuhl
    shadow(x, 162, 28);
    R(x, 164, 68, 3, 34, '#7b4b29'); R(x, 183, 68, 3, 34, '#7b4b29');           // Pfosten
    R(x, 165, 66, 20, 3, '#6a3e20'); R(x, 167, 64, 16, 2, '#6a3e20');           // gewölbte Krone
    R(x, 167, 72, 16, 24, '#6a3e20');
    for (let i = 0; i < 4; i++) {                                              // Schnitzerei
      R(x, 172, 76 + i * 5, 6, 1, '#9a6a3d'); R(x, 174, 74 + i * 5, 2, 5, '#9a6a3d');
    }
    R(x, 160, 98, 30, 5, '#7b4b29'); R(x, 160, 98, 30, 1, '#9a6a3d');           // Sitz
    R(x, 162, 103, 3, 11, '#6a3e20'); R(x, 185, 103, 3, 11, '#6a3e20');

    // Vorhangstange + Vorhänge
    R(x, 260, 12, 124, 2, '#1c1c1c'); R(x, 258, 11, 3, 4, '#1c1c1c'); R(x, 383, 11, 3, 4, '#1c1c1c');
    const curtain = (cx) => {
      for (let i = 0; i < 20; i += 1) {
        const col = (Math.floor(i / 2) % 2) ? '#8794ab' : '#97a4ba';
        R(x, cx + i, 15, 1, 96, col);
      }
      R(x, cx, 15, 20, 5, '#6e7a91');
      R(x, cx, 107, 20, 4, '#6e7a91');
      for (let i = 0; i < 20; i += 5) R(x, cx + i, 12, 2, 6, '#2a2a2a');         // Ringe
    };
    curtain(268); curtain(356);

    // Heizkörper unter dem Fenster
    R(x, 298, 86, 48, 24, '#efe8b4');
    for (let fx = 300; fx < 346; fx += 4) R(x, fx, 89, 1, 18, '#d5ce98');
    R(x, 298, 84, 48, 3, '#e2dba2'); R(x, 298, 108, 48, 2, '#c8c18a');
    R(x, 344, 86, 2, 24, '#cfc88e');
    R(x, 296, 108, 3, 4, '#d6d0a0'); R(x, 345, 108, 3, 4, '#d6d0a0');
    R(x, 298, FURN_BASE - 1, 48, 2, 'rgba(50,25,10,0.3)');

    // hängende Pflanze (Begonie) vor dem Fenster
    R(x, 322, 0, 1, 38, '#d8d0c0');
    R(x, 311, 38, 23, 12, '#4a3a34');
    R(x, 311, 38, 23, 2, '#5d4a42');
    for (let i = 0; i < 12; i += 3) R(x, 311 + i * 2, 41, 1, 8, '#392b27');
    R(x, 311, 46, 23, 1, '#392b27');
    [[316, 36, 8, 5], [329, 35, 9, 5], [322, 30, 7, 6], [312, 44, 4, 7], [334, 43, 4, 7], [322, 27, 5, 4], [318, 50, 4, 6], [328, 51, 4, 5]]
      .forEach(([cx, cy, rx, ry]) => {
        ellipse(x, cx, cy, rx, ry, '#8e1f33');
        ellipse(x, cx - 1, cy - 1, Math.max(1, rx - 2), Math.max(1, ry - 1), '#b32a42');
        R(x, cx - rx + 2, cy - 1, rx, 1, '#e87a86');
      });
    for (let i = 0; i < 8; i++) R(x, 312 + i * 3, 33 + (i % 3) * 5, 2, 1, '#e04a5a');

    // Kommode mit Marmor, Spiegel, Bild
    const cx = 440, top = 78, cw = 56;
    shadow(x, cx, cw);
    R(x, cx, top, cw, FURN_BASE - top, '#a96b3a');
    R(x, cx, top, 2, FURN_BASE - top, '#c07f4a');
    R(x, cx + cw - 3, top, 3, FURN_BASE - top, '#8b552c');
    R(x, cx + 2, FURN_BASE - 2, 6, 2, '#2a2018'); R(x, cx + cw - 8, FURN_BASE - 2, 6, 2, '#2a2018');
    const drawer = (dx, dy, dw, dh) => {
      R(x, dx, dy, dw, dh, '#7a4824');
      R(x, dx + 1, dy + 1, dw - 2, dh - 2, '#b57842');
      R(x, dx + 1, dy + 1, dw - 2, 1, '#c98d55');
      R(x, dx + dw / 2 - 4, dy + dh / 2 - 1, 8, 2, '#c8a040');                  // Messinggriff
      R(x, dx + dw / 2 - 4, dy + dh / 2 + 1, 8, 1, '#8c6a24');
    };
    drawer(cx + 3, top + 2, 24, 8); drawer(cx + 29, top + 2, 24, 8);
    drawer(cx + 3, top + 11, 50, 8); drawer(cx + 3, top + 20, 50, 8);
    drawer(cx + 3, top + 29, 50, 6);
    // Marmorplatte + Rückwand
    R(x, cx - 2, top - 4, cw + 4, 4, '#ecece9'); R(x, cx - 2, top - 1, cw + 4, 1, '#c8c8c5');
    R(x, cx, top - 18, cw, 14, '#e6e6e3'); R(x, cx, top - 18, cw, 2, '#f6f6f4');
    [[6, 6, 14, 3], [24, 10, 12, -2], [40, 4, 10, 4], [30, 12, 8, 1]].forEach(([vx, vy, vl, vd]) => line(x, cx + vx, top - 18 + vy, cx + vx + vl, top - 18 + vy + vd, '#c4c4c0'));
    // Spiegel mit Holzrahmen
    R(x, cx + 4, 26, 48, 32, '#a0703a');
    R(x, cx + 7, 29, 42, 26, '#151515');
    R(x, cx + 9, 31, 38, 22, '#dce6e4');
    line(x, cx + 14, 52, cx + 24, 32, '#f2f7f6'); line(x, cx + 18, 52, cx + 28, 32, '#f2f7f6');
    R(x, cx + 4, 26, 48, 1, '#c28a50');
    // Bild (türkis mit Blütenkreis) und kleine Sachen auf dem Marmor
    R(x, cx + 32, 61, 22, 13, '#1e3a38');
    R(x, cx + 33, 62, 20, 11, '#2f706b');
    ellipse(x, cx + 43, 67, 5, 4, '#d6bcaa'); ellipse(x, cx + 43, 67, 2, 2, '#8f4f55');
    R(x, cx + 6, 69, 11, 5, '#141414'); R(x, cx + 7, 69, 6, 1, '#2d2d2d');
    R(x, cx + 21, 72, 7, 2, '#d8d0b8');
    return c;
  }

  // ---------- Vordergrund: Efeu von der Decke, Topfpflanzen ----------
  function buildFore() {
    const w = layerWidth(F.fore);
    const [c, x] = canvas(w, VH);
    const r = rng(77);
    [40, 215, 395, 560, 740].forEach((sx, k) => {
      const len = 22 + Math.floor(r() * 22);
      R(x, sx, 0, 1, len, '#1d4a2a');
      for (let y = 4, i = 0; y < len; y += 5, i++) {
        const side = i % 2 ? 1 : -3;
        R(x, sx + side, y, 3, 2, '#1f5a30'); R(x, sx + side, y, 2, 1, '#3c8a4a');
      }
    });
    [95, 470, 650].forEach((px) => {
      R(x, px, 134, 14, 10, '#3a2a22'); R(x, px, 134, 14, 2, '#54403a');
      for (let i = 0; i < 6; i++) {
        const lx = px + 2 + i * 2, lh = 6 + Math.floor(r() * 7);
        R(x, lx, 134 - lh, 2, lh, i % 2 ? '#1d4a2a' : '#2c6a3c');
        R(x, lx, 134 - lh, 2, 1, '#4c9a56');
      }
    });
    return c;
  }

  // ---------- Aufbau und Zeichnen ----------
  let L = null;
  function build() {
    L = { outside: buildOutside(), wall: buildWall(), floor: buildFloor(), furn: buildFurniture(), fore: buildFore() };
  }
  const off = (camX, f) => -Math.round(camX * f);

  function drawBack(ctx, camX) {
    ctx.drawImage(L.outside, off(camX, F.outside), 0);
    ctx.drawImage(L.wall, off(camX, 1), 0);
    ctx.drawImage(L.floor, off(camX, 1), 0);
    ctx.drawImage(L.furn, off(camX, 1), 0);
  }

  // Lichtstrahl vom Fenster, Staubkörner darin (Weltkoordinaten)
  function drawLight(ctx, clock) {
    ctx.fillStyle = 'rgba(255,240,190,0.07)';
    ctx.beginPath();
    ctx.moveTo(296, 34); ctx.lineTo(348, 34); ctx.lineTo(336, 140); ctx.lineTo(250, 140);
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 16; i++) {
      const t = (clock * 0.05 + i * 0.173) % 1;
      const x = 300 + ((i * 53) % 46) - t * 40 + Math.sin(clock * 0.7 + i) * 3;
      const y = 40 + t * 90;
      ctx.fillStyle = 'rgba(255,250,225,' + (0.55 * Math.sin(t * Math.PI)).toFixed(2) + ')';
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }

  function drawFront(ctx, camX) {
    ctx.drawImage(L.fore, off(camX, F.fore), 0);
    // weiche Ecken (Vignette) in groben Pixelstufen
    ctx.fillStyle = 'rgba(30,15,5,0.10)';
    ctx.fillRect(0, 0, VW, 2); ctx.fillRect(0, 0, 2, VH); ctx.fillRect(VW - 2, 0, 2, VH);
    ctx.fillStyle = 'rgba(30,15,5,0.07)';
    ctx.fillRect(0, 2, VW, 2); ctx.fillRect(2, 0, 2, VH); ctx.fillRect(VW - 4, 0, 2, VH);
  }

  window.World = { VW, VH, W: WORLD_W, GROUND, FURN_BASE, WALL_BASE, build, drawBack, drawLight, drawFront };
})();
