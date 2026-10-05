// Die scrollende Welt mit Parallax-Ebenen. Jede Ebene wird einmal als kleines
// Pixel-Bild vorgezeichnet und beim Scrollen unterschiedlich schnell bewegt:
// je weiter hinten, desto langsamer (Faktor < 1); der Vordergrund ist schneller.
(function () {
  const W = 320, H = 180;           // Bildschirm
  const WORLD_W = 960;              // Weltbreite (3 Bildschirme)
  const GROUND = 170;               // Höhe der Füße
  const HORIZON = 164;              // Oberkante der Wiese

  // Ebenen von hinten nach vorn: Faktor = wie viel von der Kamerabewegung mitläuft
  const F = { clouds: 0.12, far: 0.2, mid: 0.4, near: 0.7, ground: 1, fore: 1.35 };

  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const layerWidth = (f) => Math.ceil(W + (WORLD_W - W) * f);

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return [c, x];
  }

  const rect = (x, c, X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), w, h); };

  function disc(x, cx, cy, r, col) {
    x.fillStyle = col;
    for (let dy = -r; dy <= r; dy++) {
      const dx = Math.floor(Math.sqrt(r * r - dy * dy));
      x.fillRect(Math.round(cx - dx), Math.round(cy + dy), dx * 2 + 1, 1);
    }
  }

  // ---------- Ebenen ----------
  function buildSky() {
    const [c, x] = canvas(W, H);
    const top = [27, 76, 180], bot = [127, 178, 242];
    for (let y = 0; y < H; y += 6) {
      const k = Math.min(1, y / HORIZON);
      const col = top.map((t, i) => Math.round(t + (bot[i] - t) * k));
      x.fillStyle = 'rgb(' + col.join(',') + ')';
      x.fillRect(0, y, W, 6);
    }
    x.fillStyle = 'rgba(255,243,196,0.14)'; disc(x, 250, 44, 28, x.fillStyle);
    disc(x, 250, 44, 20, 'rgba(255,243,196,0.22)');
    disc(x, 250, 44, 13, '#fff3c4');
    return c;
  }

  function buildClouds() {
    const [c, x] = canvas(480, 110);
    const r = rng(7);
    const cloud = (X, Y, s) => {
      rect(x, c, X + 6 * s, Y, 14 * s, 4 * s, '#f4f8ff');
      rect(x, c, X + 2 * s, Y + 3 * s, 30 * s, 4 * s, '#f4f8ff');
      rect(x, c, X + 12 * s, Y - 3 * s, 10 * s, 4 * s, '#f4f8ff');
      rect(x, c, X + 2 * s, Y + 6 * s, 30 * s, 2 * s, '#c5d6f5');
    };
    for (let i = 0; i < 5; i++) cloud(20 + i * 92 + r() * 20, 14 + r() * 60, 1 + Math.floor(r() * 2));
    return c;
  }

  function ridge(w, base, col, hi, fn) {
    const [c, x] = canvas(w, H);
    let prev = null;
    for (let X = 0; X < w; X++) {
      const h = Math.round(fn(X));
      rect(x, c, X, base - h, 1, h + (H - base), col);
      rect(x, c, X, base - h, 1, 1, hi);
      if (prev !== null && Math.abs(h - prev) > 1) rect(x, c, X, base - Math.max(h, prev), 1, Math.abs(h - prev), hi);
      prev = h;
    }
    return [c, x];
  }

  function buildFar() {
    const w = layerWidth(F.far);
    const [c, x] = ridge(w, HORIZON, '#4f80d2', '#8fb5ee', (X) =>
      46 + 26 * Math.abs(Math.sin(X * 0.011 + 1)) + 8 * Math.sin(X * 0.047));
    // Schneekappen
    for (let X = 2; X < w - 2; X++) {
      const h = Math.round(46 + 26 * Math.abs(Math.sin(X * 0.011 + 1)) + 8 * Math.sin(X * 0.047));
      if (h > 74) rect(x, c, X, HORIZON - h, 1, Math.min(5, h - 72), '#e8f1ff');
    }
    return c;
  }

  function pine(x, c, cx, base, hgt, col, hi) {
    rect(x, c, cx - 1, base - 3, 2, 3, '#143070');
    for (let i = 0; i < hgt; i += 3) {
      const w = 2 + Math.floor(i * 0.9) * 1;
      rect(x, c, cx - Math.floor(w / 2), base - hgt + i, w, 3, col);
      rect(x, c, cx - Math.floor(w / 2), base - hgt + i, 1, 3, hi);
    }
  }

  function house(x, c, X, base, s) {
    const w = 24 * s, h = 14 * s;
    rect(x, c, X, base - h, w, h, '#2a5199');
    for (let i = 0; i < 8; i++) rect(x, c, X - 2 + i, base - h - 1 - i, w + 4 - i * 2, 1, '#1d3d80');   // Dach
    rect(x, c, X + 4, base - h + 4, 5, 5, '#f0d77a');                                                      // beleuchtete Fenster
    rect(x, c, X + w - 9, base - h + 4, 5, 5, '#f0d77a');
    rect(x, c, X + w / 2 - 2, base - 7, 4, 7, '#16336f');
    rect(x, c, X + w - 5, base - h - 8, 3, 6, '#1d3d80');                                                  // Schornstein
  }

  function buildMid() {
    const w = layerWidth(F.mid);
    const hillH = (X) => 12 + 8 * Math.sin(X * 0.02) + 5 * Math.sin(X * 0.07 + 2);
    const [c, x] = ridge(w, HORIZON, '#3566bd', '#5b8be0', hillH);
    const r = rng(21);
    const base = (X) => HORIZON - Math.round(hillH(X));
    const houses = [60, 235, 420];
    houses.forEach((X, i) => house(x, c, X, base(X + 12) + 1, 1));
    for (let X = 15; X < w - 10; X += 14 + Math.floor(r() * 16)) {
      if (houses.some((hX) => X > hX - 8 && X < hX + 34)) continue;
      pine(x, c, X, base(X) + 2, 20 + Math.floor(r() * 12), '#2a5aae', '#4377d0');
    }
    return c;
  }

  function buildNear() {
    const w = layerWidth(F.near);
    const [c, x] = canvas(w, H);
    const r = rng(99);
    for (let X = 22; X < w - 20; X += 82 + Math.floor(r() * 40)) {
      const top = 112 + Math.floor(r() * 14);
      rect(x, c, X - 3, top, 6, HORIZON - top + 2, '#122c66');
      rect(x, c, X - 3, top, 2, HORIZON - top + 2, '#1b3f86');
      const rad = 22 + Math.floor(r() * 8);
      disc(x, X, top - 6, rad, '#1d4a9d');
      disc(x, X + 3, top - 4, rad - 5, '#1a428d');
      disc(x, X - 7, top - 14, Math.floor(rad / 2.4), '#2c64bf');       // Licht oben links
      for (let i = 0; i < 6; i++) rect(x, c, X - rad + r() * rad * 2, top - 6 + (r() - 0.5) * rad, 2, 1, '#2c64bf');
    }
    // niedrige Büsche
    for (let X = 40; X < w - 20; X += 38 + Math.floor(r() * 30)) {
      disc(x, X, HORIZON + 1, 6 + Math.floor(r() * 3), '#193f88');
      disc(x, X - 2, HORIZON - 1, 4, '#2556a8');
    }
    return c;
  }

  function buildGround() {
    const [c, x] = canvas(WORLD_W, H);
    const r = rng(5);
    rect(x, c, 0, HORIZON, WORLD_W, H - HORIZON, '#2a62bb');
    rect(x, c, 0, HORIZON, WORLD_W, 1, '#5b93ea');
    rect(x, c, 0, HORIZON + 1, WORLD_W, 3, '#3573d1');
    rect(x, c, 0, HORIZON + 4, WORLD_W, H - HORIZON - 4, '#5d8fe0');        // Weg
    rect(x, c, 0, HORIZON + 4, WORLD_W, 1, '#4476cc');
    rect(x, c, 0, H - 3, WORLD_W, 3, '#4a7ccf');
    for (let i = 0; i < 90; i++) rect(x, c, r() * WORLD_W, HORIZON + 6 + r() * 8, 2, 1, r() < 0.5 ? '#7aa6ec' : '#4e80d3');
    for (let i = 0; i < 70; i++) {                                         // Grashalme am Wegrand
      const X = r() * WORLD_W;
      rect(x, c, X, HORIZON - 2, 1, 3, '#4a86e0');
      rect(x, c, X + 2, HORIZON - 3, 1, 4, '#4a86e0');
    }
    return c;
  }

  function buildFore() {
    const w = layerWidth(F.fore);
    const [c, x] = canvas(w, H);
    const r = rng(1234);
    for (let X = 6; X < w; X += 18 + Math.floor(r() * 26)) {
      for (let i = -2; i <= 2; i++) rect(x, c, X + i * 2, H - 4 - Math.floor(r() * 5), 1, 9, '#0f2a62');
    }
    return c;
  }

  // ---------- Aufbau und Zeichnen ----------
  let L = null;
  function build() {
    L = { sky: buildSky(), clouds: buildClouds(), far: buildFar(), mid: buildMid(),
          near: buildNear(), ground: buildGround(), fore: buildFore() };
  }

  const off = (camX, f) => -Math.round(camX * f);

  function drawBack(ctx, camX, clock) {
    ctx.drawImage(L.sky, 0, 0);
    const cw = L.clouds.width;
    const co = ((camX * F.clouds + clock * 3) % cw + cw) % cw;
    for (let X = -co; X < W; X += cw) ctx.drawImage(L.clouds, Math.round(X), 0);
    ctx.drawImage(L.far, off(camX, F.far), 0);
    ctx.drawImage(L.mid, off(camX, F.mid), 0);
    ctx.drawImage(L.near, off(camX, F.near), 0);
    ctx.drawImage(L.ground, off(camX, F.ground), 0);
  }

  function drawFront(ctx, camX) {
    ctx.drawImage(L.fore, off(camX, F.fore), 0);
  }

  window.World = { W: WORLD_W, GROUND, HORIZON, build, drawBack, drawFront };
})();
