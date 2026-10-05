// Pixel-Art-Figur (64x64) nach Foto: Beanie, runde Brille, leichter Bart,
// schwarzes T-Shirt, schwarze Hose mit Gürtel, dunkle Socken.
// Alles wird per Code gezeichnet, es werden keine Bilddateien gebraucht.
(function () {
  const SIZE = 64;
  const WALK_FRAMES = 8;

  // Figur ist 20x61 Pixel groß, links oben bei (OX, OY) im 64x64-Sprite
  const OX = 22, OY = 2;

  const C = {
    skin: '#e6c4a8', skinShade: '#c9a284', ear: '#d4aa8a',
    brow: '#8a6a50', beard: '#b09a7a', mouth: '#9a6e55',
    beanie: '#6b5a4a', beanieLight: '#7f6c5a', beanieDark: '#4a3b30', beanieShade: '#54443a',
    hair: '#6e5a48',
    frame: '#b5a583', white: '#f3f3f3', pupil: '#222226',
    tee: '#202024', teeLight: '#35353d', teeDark: '#0b0b0f',
    pants: '#1a1b20', pantsLight: '#2b2f38', pantsDark: '#0a0a0e',
    belt: '#0b0b0e', buckle: '#d8d8d8',
    sock: '#20263c', sockLight: '#333c5c',
    gold: '#d4b050',
  };

  function makeCanvas() {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    return c;
  }

  // r(col, row, breite, höhe, farbe) – Koordinaten relativ zur Figur
  function painter(ctx) {
    return {
      r(c, r, w, h, col) {
        ctx.fillStyle = col;
        ctx.fillRect(OX + Math.round(c), OY + Math.round(r), w, h);
      },
    };
  }

  // Gehzyklus: s = Beinschwung (-1..1), lift = angehobener Fuß in Pixeln
  function cycle(frame, stand) {
    if (stand) return { s: 0, liftA: 0, liftB: 0, bob: 0 };
    const t = (frame / WALK_FRAMES) * Math.PI * 2;
    return {
      s: Math.sin(t),
      liftA: Math.round(Math.max(0, Math.cos(t)) * 3),
      liftB: Math.round(Math.max(0, -Math.cos(t)) * 3),
      bob: Math.abs(Math.sin(t)) > 0.7 ? 0 : -1,
    };
  }

  // Beanie-Rand mit Rippenstreifen
  function band(p, c0, c1, row, h, b) {
    p.r(c0, row + b, c1 - c0 + 1, h, C.beanie);
    for (let c = c0 + 1; c <= c1; c += 2) p.r(c, row + b, 1, h, C.beanieDark);
  }

  // ---------- Vorder- und Rückansicht ----------
  function drawFrontBack(p, cy, back) {
    const { s, liftA, liftB, bob: b } = cy;
    const bottomY = 55;

    // Hosenbund-Block + Beine
    p.r(4, 34 + b, 12, 8 - b, C.pants);
    p.r(4, 36 + b, 2, 6 - b, C.pantsLight);
    p.r(9, 38 + b, 2, 4 - b, C.pantsDark);
    const leg = (c0, lift, light) => {
      const bot = bottomY - lift;
      p.r(c0, 42, 5, bot - 42, C.pants);
      p.r(light ? c0 : c0 + 4, 42, 1, bot - 42, light ? C.pantsLight : C.pantsDark);
      p.r(c0, bot, 5, 6, C.sock);                  // Socke / Fuß
      p.r(c0, bot, 1, 4, C.sockLight);
      p.r(light ? c0 - 1 : c0, bot + 4, 6, 2, C.sock);   // Fuß nach außen
    };
    leg(4, liftA, true);
    leg(11, liftB, false);

    // Arme (Länge wechselt gegengleich = Armschwung)
    const arm = (c0, off, shadeCol, left) => {
      const len = 15 + off;
      p.r(c0, 25 + b, 2, len, C.skin);
      p.r(shadeCol, 25 + b, 1, len, C.skinShade);
      p.r(c0, 25 + b + len - 3, 2, 2, C.skin);     // Hand
      p.r(c0, 25 + b + len - 1, 2, 1, C.skinShade);
      if (!left) p.r(c0, 35 + b + off, 2, 1, C.gold);   // Armband
    };
    arm(0, Math.round(-s * 2), 1, true);
    arm(18, Math.round(s * 2), 18, false);

    // Oberkörper
    p.r(2, 19 + b, 16, 1, C.tee);
    p.r(1, 20 + b, 18, 5, C.tee);
    p.r(3, 25 + b, 14, 7, C.tee);
    p.r(2, 20 + b, 3, 2, C.teeLight);
    p.r(1, 21 + b, 1, 3, C.teeLight);
    p.r(18, 21 + b, 1, 3, C.teeLight);
    p.r(7, 25 + b, 1, 4, C.teeLight);
    p.r(8, 26 + b, 1, 3, C.teeDark);
    p.r(12, 29 + b, 1, 3, C.teeDark);
    p.r(13, 29 + b, 1, 2, C.teeLight);
    // Gürtel
    p.r(4, 32 + b, 12, 2, C.belt);
    if (!back) p.r(9, 32 + b, 2, 1, C.buckle);

    // Hals
    p.r(7, 17 + b, 6, 2, C.skinShade);
    if (!back) p.r(8, 19 + b, 4, 1, C.skinShade);
    else p.r(8, 19 + b, 4, 1, C.tee);

    drawHeadFront(p, b, back);
  }

  function drawBeanieTop(p, b) {
    p.r(6, 0 + b, 8, 1, C.beanie);
    p.r(5, 1 + b, 10, 1, C.beanie);
    p.r(4, 2 + b, 12, 2, C.beanie);
    p.r(5, 1 + b, 4, 2, C.beanieLight);            // Glanzfleck
    p.r(13, 2 + b, 3, 2, C.beanieShade);           // Schatten rechts
    p.r(14, 1 + b, 1, 1, C.beanieShade);
  }

  function drawHeadFront(p, b, back) {
    drawBeanieTop(p, b);
    band(p, 3, 16, 4, 2, b);
    p.r(14, 4 + b, 3, 2, C.beanieShade);
    for (let c = 14; c <= 16; c += 2) p.r(c, 4 + b, 1, 2, C.beanieDark);
    if (back) {
      // Hinterkopf: Beanie weiter runter, darunter Haaransatz
      p.r(3, 4 + b, 14, 6, C.beanie);
      band(p, 3, 16, 8, 2, b);
      p.r(4, 6 + b, 12, 2, C.beanie);
      p.r(4, 10 + b, 12, 6, C.hair);
      p.r(5, 16 + b, 10, 1, C.skinShade);
      p.r(3, 9 + b, 1, 3, C.ear);
      p.r(16, 9 + b, 1, 3, C.ear);
      return;
    }
    // Gesicht
    p.r(4, 6 + b, 12, 11, C.skin);
    p.r(3, 9 + b, 1, 3, C.ear);                    // Ohren
    p.r(16, 9 + b, 1, 3, C.ear);
    p.r(5, 8 + b, 4, 1, C.brow);                   // Augenbrauen
    p.r(11, 8 + b, 4, 1, C.brow);
    // Brille
    p.r(4, 9 + b, 12, 3, C.frame);
    p.r(5, 10 + b, 4, 1, C.skin);
    p.r(11, 10 + b, 4, 1, C.skin);
    p.r(6, 10 + b, 1, 1, C.white);  p.r(7, 10 + b, 1, 1, C.pupil);
    p.r(12, 10 + b, 1, 1, C.white); p.r(13, 10 + b, 1, 1, C.pupil);
    p.r(9, 11 + b, 2, 2, C.skinShade);             // Nase
    // Bart + Mund
    p.r(4, 13 + b, 2, 3, C.beard);
    p.r(14, 13 + b, 2, 3, C.beard);
    p.r(5, 15 + b, 10, 2, C.beard);
    p.r(8, 14 + b, 4, 1, C.mouth);
  }

  // ---------- Seitenansicht (nach rechts) ----------
  function drawSide(p, cy) {
    const { s, liftA, liftB, bob: b } = cy;
    const HIP = 34 + b;
    const CX = 9;

    const leg = (swing, lift, far) => {
      const bot = 55 - lift;
      for (let y = HIP; y < bot; y++) {
        const f = (y - HIP) / (bot - HIP);
        const bend = lift > 0 ? -Math.sin(f * Math.PI) * lift * 0.8 : 0;
        const c = CX + swing * f + bend;
        p.r(c - 2, y, 5, 1, far ? C.pantsDark : C.pants);
        if (!far) p.r(c - 2, y, 1, 1, C.pantsLight);
      }
      const c = CX + swing;
      const col = far ? '#161a2a' : C.sock;
      p.r(c - 2, bot, 5, 4, col);
      p.r(c - 2, bot + 4, 9, 2, col);              // Fuß nach vorn
    };

    const arm = (swing, far) => {
      const top = 21 + b, bottom = 40 + b;
      for (let y = top; y < bottom; y++) {
        const f = (y - top) / (bottom - top);
        const c = CX + swing * f * f * 1.2;
        const sleeve = y < top + 5;
        const col = sleeve ? (far ? C.teeDark : C.tee) : (far ? C.skinShade : C.skin);
        p.r(c - 1, y, 4, 1, col);
      }
      const hc = CX + swing * 1.2;
      p.r(hc - 1, bottom - 3, 4, 3, far ? C.skinShade : C.skin);
      if (far) p.r(hc - 1, 35 + b, 4, 1, C.gold);
    };

    // hinten -> vorne
    arm(Math.round(s * 7), true);
    leg(Math.round(-s * 7), liftB, true);

    p.r(6, 19 + b, 8, 1, C.tee);
    p.r(5, 20 + b, 10, 12, C.tee);
    p.r(5, 20 + b, 2, 11, C.teeDark);
    p.r(6, 20 + b, 4, 2, C.teeLight);
    p.r(11, 25 + b, 1, 4, C.teeDark);
    p.r(5, 32 + b, 10, 2, C.belt);
    p.r(13, 32 + b, 2, 1, C.buckle);
    p.r(7, 17 + b, 5, 2, C.skinShade);              // Hals

    leg(Math.round(s * 7), liftA, false);
    arm(Math.round(-s * 7), false);

    drawHeadSide(p, b);
  }

  function drawHeadSide(p, b) {
    // Gesicht + Nase
    p.r(7, 6 + b, 8, 11, C.skin);
    p.r(15, 11 + b, 2, 2, C.skin);
    p.r(8, 9 + b, 2, 3, C.ear);                     // Ohr
    p.r(11, 8 + b, 4, 1, C.brow);
    // Brille
    p.r(11, 9 + b, 5, 3, C.frame);
    p.r(12, 10 + b, 3, 1, C.skin);
    p.r(13, 10 + b, 1, 1, C.white); p.r(14, 10 + b, 1, 1, C.pupil);
    p.r(7, 9 + b, 4, 1, C.frame);                   // Bügel
    // Bart
    p.r(8, 12 + b, 5, 4, C.beard);
    p.r(7, 15 + b, 8, 2, C.beard);
    p.r(12, 14 + b, 3, 1, C.mouth);
    // Hinterkopf
    p.r(4, 6 + b, 4, 7, C.hair);
    // Beanie
    p.r(6, 0 + b, 8, 1, C.beanie);
    p.r(5, 1 + b, 10, 1, C.beanie);
    p.r(4, 2 + b, 12, 2, C.beanie);
    p.r(5, 1 + b, 4, 2, C.beanieLight);
    band(p, 3, 15, 4, 2, b);
    p.r(4, 6 + b, 3, 3, C.beanie);                  // Nacken-Teil
  }

  // ---------- Frames erzeugen ----------
  function render(dir, frame, stand) {
    const c = makeCanvas();
    const ctx = c.getContext('2d');
    const p = painter(ctx);
    const cy = cycle(frame, stand);
    if (dir === 'down') drawFrontBack(p, cy, false);
    else if (dir === 'up') drawFrontBack(p, cy, true);
    else drawSide(p, cy);
    return c;
  }

  function mirror(src) {
    const c = makeCanvas();
    const ctx = c.getContext('2d');
    ctx.translate(SIZE, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
    return c;
  }

  function buildSprites() {
    const sheets = {};
    for (const dir of ['down', 'up', 'right']) {
      const walk = [];
      for (let f = 0; f < WALK_FRAMES; f++) walk.push(render(dir, f, false));
      sheets[dir] = { idle: render(dir, 0, true), walk };
    }
    sheets.left = {
      idle: mirror(sheets.right.idle),
      walk: sheets.right.walk.map(mirror),
    };
    return sheets;
  }

  window.Sprite = { SIZE, WALK_FRAMES, buildSprites };
})();
