// Pixel-Art-Figur (64x64) nach Foto: Beanie, runde Brille, leichter Bart,
// schwarzes T-Shirt, schwarze Hose mit Gürtel, dunkle Socken.
// Alles wird per Code gezeichnet, es werden keine Bilddateien gebraucht.
(function () {
  const SIZE = 64;
  const WALK_FRAMES = 8;

  const C = {
    skin: '#e9c3a5', skinShade: '#d3a98d', stubble: '#c29a82',
    beanie: '#6e5d52', beanieShade: '#584a41', beanieLight: '#85746a',
    frame: '#d6c593', eye: '#2a2420', mouth: '#b5826f',
    tee: '#25252a', teeShade: '#17171b', teeLight: '#38383f',
    pants: '#1f1f24', pantsShade: '#131316', pantsLight: '#303037',
    belt: '#0d0d10', buckle: '#c3c6ce',
    sock: '#1d1d2e', sockShade: '#11111b',
    outline: '#0a0e2c',
  };

  function makeCanvas() {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    return c;
  }

  function painter(ctx) {
    return {
      rect(x, y, w, h, col) {
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(x), Math.round(y), w, h);
      },
    };
  }

  // 1px dunkle Kontur um alle gefüllten Pixel
  function addOutline(ctx) {
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    const d = img.data;
    const filled = (x, y) =>
      x >= 0 && y >= 0 && x < SIZE && y < SIZE && d[(y * SIZE + x) * 4 + 3] > 0;
    const out = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (filled(x, y)) continue;
        if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) {
          out.push([x, y]);
        }
      }
    }
    ctx.fillStyle = C.outline;
    for (const [x, y] of out) ctx.fillRect(x, y, 1, 1);
  }

  // Gehzyklus: s = Beinschwung (-1..1), lift = angehobener Fuß in Pixeln
  function cycle(frame, stand) {
    if (stand) return { s: 0, liftA: 0, liftB: 0, bob: 0 };
    const t = (frame / WALK_FRAMES) * Math.PI * 2;
    return {
      s: Math.sin(t),
      liftA: Math.round(Math.max(0, Math.cos(t)) * 2.5),
      liftB: Math.round(Math.max(0, -Math.cos(t)) * 2.5),
      bob: Math.abs(Math.sin(t)) > 0.7 ? 0 : -1,
    };
  }

  // ---------- Vorder- und Rückansicht ----------
  function drawFrontBack(p, cy, back) {
    const { s, liftA, liftB, bob } = cy;
    const b = bob;

    // Beine (A = linkes im Bild)
    const leg = (x, lift, light) => {
      const top = 40 + b;
      const bottom = 58 - lift;
      p.rect(x, top, 8, bottom - top, C.pants);
      p.rect(light ? x : x + 6, top, 2, bottom - top, light ? C.pantsLight : C.pantsShade);
      p.rect(x - 1, bottom, 9, 4, C.sock);          // Socke / Fuß
      p.rect(x - 1, bottom + 3, 9, 1, C.sockShade);
    };
    leg(23, liftA, true);
    leg(33, liftB, false);
    p.rect(31, 46 + b, 2, 8, C.outline);            // Spalt zwischen den Beinen

    // Arme (schwingen gegengleich)
    const armOff = (v) => Math.round(v * 2);
    const arm = (x, off) => {
      p.rect(x, 22 + b + off, 5, 6, C.tee);         // Ärmel
      p.rect(x, 22 + b + off, 5, 1, C.teeLight);
      p.rect(x + 1, 28 + b + off, 3, 11, C.skin);   // Unterarm
      p.rect(x + 3, 28 + b + off, 1, 11, C.skinShade);
      p.rect(x + 1, 39 + b + off, 3, 3, C.skin);    // Hand
    };
    arm(18, armOff(-s));
    arm(41, armOff(s));

    // Oberkörper
    p.rect(25, 21 + b, 15, 1, C.tee);
    p.rect(23, 22 + b, 19, 17, C.tee);
    p.rect(23, 22 + b, 19, 1, C.teeLight);
    p.rect(23, 22 + b, 2, 16, C.teeLight);
    p.rect(40, 24 + b, 2, 14, C.teeShade);
    p.rect(26, 30 + b, 1, 7, C.teeShade);           // Falten
    p.rect(37, 28 + b, 1, 8, C.teeShade);

    // Gürtel
    p.rect(23, 38 + b, 19, 2, C.belt);
    if (!back) p.rect(31, 38 + b, 3, 2, C.buckle);

    // Hals
    p.rect(29, 19 + b, 7, 3, C.skinShade);
    if (!back) p.rect(29, 21 + b, 7, 1, C.tee);

    drawHeadFront(p, b, back);
  }

  function drawHeadFront(p, b, back) {
    // Ohren
    p.rect(25, 12 + b, 2, 4, C.skinShade);
    p.rect(38, 12 + b, 2, 4, C.skinShade);
    if (back) {
      // Hinterkopf: Beanie bis in den Nacken, darunter Haaransatz
      p.rect(26, 4 + b, 13, 14, C.beanie);
      p.rect(25, 7 + b, 15, 9, C.beanie);
      p.rect(26, 15 + b, 13, 2, C.beanieShade);
      p.rect(27, 17 + b, 11, 2, C.skinShade);
      p.rect(26, 4 + b, 13, 1, C.beanieLight);
      for (let y = 6; y < 15; y += 2) p.rect(27, y + b, 11, 1, C.beanieShade);
      return;
    }
    // Gesicht
    p.rect(26, 9 + b, 13, 10, C.skin);
    p.rect(27, 19 + b, 11, 1, C.skin);
    p.rect(26, 16 + b, 13, 3, C.stubble);           // Bart-Schatten
    p.rect(28, 19 + b, 9, 1, C.stubble);
    p.rect(30, 17 + b, 5, 1, C.mouth);              // Mund
    p.rect(32, 14 + b, 1, 2, C.skinShade);          // Nase
    // Brille: runde Gläser
    p.rect(27, 11 + b, 5, 4, C.frame);
    p.rect(33, 11 + b, 5, 4, C.frame);
    p.rect(28, 12 + b, 3, 2, '#f4ede0');
    p.rect(34, 12 + b, 3, 2, '#f4ede0');
    p.rect(32, 12 + b, 1, 1, C.frame);              // Steg
    p.rect(29, 12 + b, 1, 2, C.eye);
    p.rect(35, 12 + b, 1, 2, C.eye);
    // Beanie
    p.rect(26, 3 + b, 13, 7, C.beanie);
    p.rect(25, 5 + b, 15, 5, C.beanie);
    p.rect(26, 3 + b, 13, 1, C.beanieLight);
    p.rect(25, 9 + b, 15, 2, C.beanieShade);        // Umschlag unten
    p.rect(35, 8 + b, 3, 1, C.beanieLight);         // kleines Label
    for (let y = 4; y < 9; y += 2) p.rect(27, y + b, 11, 1, C.beanieShade);
  }

  // ---------- Seitenansicht (nach rechts) ----------
  function drawSide(p, cy) {
    const { s, liftA, liftB, bob } = cy;
    const b = bob;
    const HIP = 40 + b;

    const leg = (swing, lift, far) => {
      const bottom = 58 - lift;
      for (let y = HIP; y < bottom; y++) {
        const f = (y - HIP) / (bottom - HIP);
        // Knie knickt beim angehobenen Bein leicht nach hinten ein
        const bend = lift > 0 ? -Math.sin(f * Math.PI) * lift * 0.9 : 0;
        const cx = 32 + swing * f + bend;
        p.rect(cx - 3, y, 7, 1, far ? C.pantsShade : C.pants);
        if (!far) p.rect(cx - 3, y, 2, 1, C.pantsLight);
      }
      const cx = 32 + swing;
      const sock = far ? C.sockShade : C.sock;
      p.rect(cx - 3, bottom, 7, 3, sock);
      p.rect(cx - 3, bottom + 3, 11, 1, sock);      // Fußsohle nach vorn
      p.rect(cx + 2, bottom + 1, 6, 2, sock);       // Zehen
    };

    const arm = (swing, far) => {
      const top = 23 + b;
      const bottom = 40 + b;
      for (let y = top; y < bottom; y++) {
        const f = (y - top) / (bottom - top);
        const cx = 32 + swing * f * f * 1.2;
        const sleeve = y < top + 6;
        const col = sleeve ? (far ? C.teeShade : C.tee) : (far ? C.skinShade : C.skin);
        p.rect(cx - 2, y, 5, 1, col);
      }
      p.rect(32 + swing * 1.2 - 2, bottom, 5, 3, far ? C.skinShade : C.skin);
    };

    // hinten -> vorne
    arm(Math.round(s * 7), true);
    leg(Math.round(-s * 7), liftB, true);

    // Oberkörper (schmal)
    p.rect(28, 21 + b, 10, 1, C.tee);
    p.rect(27, 22 + b, 12, 17, C.tee);
    p.rect(27, 22 + b, 12, 1, C.teeLight);
    p.rect(27, 22 + b, 2, 16, C.teeShade);          // Rücken im Schatten
    p.rect(36, 26 + b, 1, 9, C.teeShade);
    p.rect(27, 38 + b, 12, 2, C.belt);
    p.rect(37, 38 + b, 2, 2, C.buckle);
    p.rect(30, 19 + b, 5, 3, C.skinShade);          // Hals

    leg(Math.round(s * 7), liftA, false);
    arm(Math.round(-s * 7), false);

    drawHeadSide(p, b);
  }

  function drawHeadSide(p, b) {
    // Gesicht + Nase
    p.rect(28, 9 + b, 11, 10, C.skin);
    p.rect(39, 14 + b, 2, 2, C.skin);               // Nase
    p.rect(28, 16 + b, 11, 3, C.stubble);           // Bart
    p.rect(29, 19 + b, 9, 1, C.stubble);
    p.rect(36, 17 + b, 3, 1, C.mouth);
    // Ohr
    p.rect(30, 12 + b, 3, 4, C.skinShade);
    // Brille
    p.rect(34, 11 + b, 5, 4, C.frame);
    p.rect(35, 12 + b, 3, 2, '#f4ede0');
    p.rect(37, 12 + b, 1, 2, C.eye);
    p.rect(30, 12 + b, 5, 1, C.frame);              // Bügel
    // Beanie (hinten tiefer)
    p.rect(27, 3 + b, 12, 7, C.beanie);
    p.rect(26, 5 + b, 14, 5, C.beanie);
    p.rect(27, 3 + b, 12, 1, C.beanieLight);
    p.rect(26, 9 + b, 14, 2, C.beanieShade);
    p.rect(26, 10 + b, 5, 5, C.beanie);             // Nacken-Teil
    p.rect(26, 14 + b, 5, 1, C.beanieShade);
    p.rect(35, 8 + b, 3, 1, C.beanieLight);
    for (let y = 4; y < 9; y += 2) p.rect(28, y + b, 10, 1, C.beanieShade);
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
    addOutline(ctx);
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
