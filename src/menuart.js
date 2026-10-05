// Hauptmenü-Grafik im Stil von Dead Cells: dunkle Welt, warmes Hauptlicht vom Kartenturm,
// kühles Türkis als Kantenlicht von hinten, Nebel, Funken und schwebende Karten.
// Alles wird per Code gemalt (384x216 Pixel): Formen bekommen Höhen/Normalen, werden
// beleuchtet und über Farbrampen mit leichtem Dithering in Pixel verwandelt.
// Der Kartenturm ist ein echtes Kartenhaus aus Λ-Paaren und flachen Karten.
(function () {
  const W = 384, H = 216;

  // ---------- Helfer ----------
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const pack = (c, a = 255) => ((a << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
  const ramp = (arr) => arr.map((h) => pack(hex(h)));
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const fract = (v) => v - Math.floor(v);
  const hash = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y) => vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.15;
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => (v + 0.5) / 16));
  // Wert 0..1 -> Rampenfarbe; nur an den Stufenkanten wird gedithert (sauberer Look)
  function pick(r, v, x, y) {
    v = clamp(v);
    const p = v * (r.length - 1);
    const i = Math.floor(p);
    if (i >= r.length - 1) return r[r.length - 1];
    const f = clamp((p - i - 0.5) * 2.2 + 0.5);
    return f > BAYER[y & 3][x & 3] ? r[i + 1] : r[i];
  }
  const norm3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
  const KEY = norm3(0.8, -0.28, 0.55);          // warmes Licht vom Kartenturm (rechts)
  function inPoly(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function segInfo(x, y, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, t = clamp(((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy));
    return [Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t)), t];
  }
  function canvasOf(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return [c, x];
  }
  function bufCanvas(buf, w, h) {
    const [c, x] = canvasOf(w, h);
    x.putImageData(new ImageData(new Uint8ClampedArray(buf.buffer.slice(0)), w, h), 0, 0);
    return c;
  }
  // Randlicht (türkis) – stark an Kanten, die nach links/hinten zeigen
  const rimOf = (n) => clamp((1 - n[2]) * 1.9 - 0.55) * clamp(-n[0] * 1.2 - n[1] * 0.25 + 0.05);

  // ---------- Paletten ----------
  const P = {
    skin: ramp(['#14091a', '#2c1226', '#52202e', '#86363a', '#bc5a46', '#e48a5c', '#ffbf86']),
    hair: ramp(['#120a14', '#2e1a1c', '#5c3a1e', '#9a6c24', '#d4a234', '#f6d264', '#fff1b0']),
    shirt: ramp(['#080a18', '#141a32', '#283252', '#4a5578', '#7e88a8', '#b8bfd2']),
    navy: ramp(['#04050e', '#0a0f26', '#141e48', '#22336e']),
    sand: ramp(['#14140c', '#2e2c16', '#5a5628', '#8a843c']),
    rim: ramp(['#163c4a', '#23707e', '#41b4bc', '#8ff0ea', '#d8fff8']),
    sclera: ramp(['#1e1622', '#4a3a48', '#8a7a80', '#c2b2ae']),
    iris: ramp(['#0a2a36', '#145a6a', '#2c98a6', '#6fe0e6']),
  };
  const OUT = pack(hex('#04030a'));

  // ---------- Hintergrund (abstrakt) ----------
  function buildBg() {
    const px = new Uint32Array(W * H);
    const bgR = ramp(['#030409', '#060a14', '#0a1220', '#0e1c2c', '#122636', '#1a3442']);
    const warmR = ramp(['#0a0a12', '#1c1018', '#341a1a', '#5a2a1c', '#8a421e', '#c4682a', '#f09a44']);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // kühler Schein hinter dem Kopf, warmer Schein hinter dem Turm
      const cool = clamp(1 - Math.hypot((x - 70) / 1.15, y - 62) / 150) ** 1.6;
      const warm = clamp(1 - Math.hypot((x - 298) / 1.15, (y - 168) * 1.3) / 125) ** 1.8;
      const n = (fbm(x * 0.02, y * 0.03) - 0.5) * 0.12;
      let c;
      if (warm * 1.1 > cool && warm > 0.08) c = pick(warmR, warm * 1.05 + n, x, y);
      else c = pick(bgR, 0.12 + cool * 0.9 + (y / H) * 0.12 + n, x, y);
      px[y * W + x] = c;
    }
    // große, schwache Splitterformen (abstrakte Architektur)
    const shard = pack(hex('#0b1522')), shardHi = pack(hex('#13283a'));
    const shards = [
      [[150, 0], [196, 0], [176, 120], [160, 130]],
      [[0, 150], [40, 120], [60, 216], [0, 216]],
      [[212, 0], [236, 0], [226, 60]],
      [[350, 0], [384, 0], [384, 90], [368, 70]],
    ];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      for (const s of shards) if (inPoly(s, x, y)) {
        const edge = !inPoly(s, x - 1, y) || !inPoly(s, x, y - 1);
        px[y * W + x] = edge ? shardHi : shard;
      }
    }
    // Boden unter dem Turm (glänzend)
    for (let y = 200; y < H; y++) for (let x = 0; x < W; x++) {
      const warm = clamp(1 - Math.abs(x - 296) / 120);
      const v = y === 200 ? 0.45 + warm * 0.5 : 0.12 + warm * 0.3 * (1 - (y - 200) / 16);
      px[y * W + x] = pick(warmR, v, x, y);
    }
    return bufCanvas(px, W, H);
  }

  // Nebel als Pixel-Textur mit gestuftem Alpha (wird gescrollt)
  function buildFog(seed, rgb, yc, spread, strength) {
    const w = W * 2, buf = new Uint32Array(w * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < w; x++) {
      const band = Math.exp(-Math.pow((y - yc) / spread, 2));
      const n = (fbm((x % w) * 0.012 + seed, y * 0.05) + fbm(((x + W) % w) * 0.012 + seed, y * 0.05)) * 0.5;
      const a = clamp((n - 0.42) * 2.4) * band * strength;
      const lvl = a > 0.66 ? 3 : a > 0.4 ? 2 : a > 0.16 ? 1 : 0;
      const d = a * 3 - Math.floor(a * 3) > BAYER[y & 3][x & 3] ? 1 : 0;
      const L = Math.min(3, lvl + (lvl > 0 ? 0 : d * 0));
      if (L) buf[y * w + x] = pack(rgb, [0, 22, 40, 62][L]);
    }
    return bufCanvas(buf, w, H);
  }

  function buildBeams() {
    const buf = new Uint32Array(W * H);
    const beams = [[392, -10, 250, 216, 12], [372, -10, 300, 216, 6], [410, -10, 210, 216, 4]];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let a = 0;
      for (const [x1, y1, x2, y2, wd] of beams) {
        const [d, t] = segInfo(x, y, x1, y1, x2, y2);
        const ww = wd * (0.5 + t);
        if (d < ww) a = Math.max(a, (1 - d / ww) * (1 - t * 0.6));
      }
      if (a > 0 && a * 0.5 > BAYER[y & 3][x & 3] * 0.9) buf[y * W + x] = pack(hex('#ffb060'), 26);
    }
    return bufCanvas(buf, W, H);
  }

  function buildVignette() {
    const buf = new Uint32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const vv = Math.pow((x - 192) / 200, 2) + Math.pow((y - 108) / 118, 2);
      const a = clamp((vv - 0.45) * 1.6);
      if (a > 0) buf[y * W + x] = pack([2, 2, 6], a > 0.6 ? 170 : a > 0.3 ? 110 : 60);
    }
    return bufCanvas(buf, W, H);
  }

  // ---------- Die Figur ----------
  // 3/4-Ansicht nach rechts: fernes Auge nah an der Kontur, Nase ragt über die Wange hinaus.
  const EYES = [
    { cx: 94, cy: 106, hw: 8.5, hh: 3.7, ir: 3.1, pr: 1.3, maxX: 4.5, maxY: 1.4 },
    { cx: 126, cy: 105, hw: 5.6, hh: 3.4, ir: 2.6, pr: 1.1, maxX: 2.6, maxY: 1.2 },
  ];
  const NOSE = [[132, 103], [146, 121], [143, 124], [136, 124], [133, 121]];
  const V_NECK = [[91, 146], [121, 146], [106, 172]];

  // Unterkante des Ponys: unregelmäßige, nach rechts gekämmte Strähnenspitzen
  function bangEdge(x) {
    const base = 100 - (x - 56) * 0.1;
    const sx = x + (x - 56) * 0.12;
    const wdt = 6 + Math.floor(hash(Math.floor(sx / 7), 2) * 4);
    const k = Math.floor(sx / wdt), f = sx / wdt - k;
    const tip = Math.pow(Math.max(0, 1 - Math.abs(2 * f - 0.8) * 1.1), 1.4);
    const len = 2 + hash(k, 5) * 7 + (k === 14 ? 7 : 0);
    return base - 4 + tip * len;
  }
  const ell = (x, y, cx, cy, rx, ry) => Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2);
  const smax = (a, b, k) => { const h = clamp(0.5 + 0.5 * (a - b) / k); return a * h + b * (1 - h) + k * h * (1 - h); };

  // Haar: Krone mit fransiger Kante + seitlich herabfallende Strähnen (ein Stück)
  function crownR(x, y) {
    const ang = Math.atan2(y - 70, x - 100);
    return ell(x, y, 100, 70, 55, 48) * (1 + 0.035 * Math.sin(ang * 23) + 0.025 * Math.sin(ang * 41 + 1));
  }
  function sideBottom(x) {
    const k = Math.floor(x / 5), f = x / 5 - k;
    return 150 + (x - 44) * 0.25 + hash(k, 8) * 10 * (1 - Math.abs(2 * f - 1));
  }
  function inHair(x, y) {
    if (crownR(x, y) < 1 && y <= bangEdge(x)) return true;
    const left = 45 - 3 * Math.sin(clamp((y - 60) / 100) * Math.PI);
    return y > 60 && x >= left && x <= 80 - Math.max(0, y - 120) * 0.12 && y <= sideBottom(x);
  }

  function faceMask(x, y) {
    return ell(x, y, 100, 92, 40, 52) < 1 || ell(x, y, 110, 118, 28, 28) < 1 || inPoly(NOSE, x, y);
  }
  function faceHeight(x, y) {
    const zA = 40 * Math.sqrt(Math.max(0, 1 - ell(x, y, 100, 92, 40, 52)));
    const zB = 32 * Math.sqrt(Math.max(0, 1 - ell(x, y, 110, 118, 28, 28)));
    let z = smax(zA, zB, 5);
    z -= 4 * Math.exp(-(Math.pow(x - 94, 2) / 70 + Math.pow(y - 105, 2) / 18));     // Augenhöhlen
    z -= 3 * Math.exp(-(Math.pow(x - 126, 2) / 35 + Math.pow(y - 104, 2) / 16));
    z += 3 * Math.exp(-(Math.pow(x - 121, 2) / 45 + Math.pow(y - 114, 2) / 30));    // Wangenknochen
    z += 2 * Math.exp(-(Math.pow(x - 116, 2) / 40 + Math.pow(y - 141, 2) / 12));    // Kinn
    return z;
  }

  function eyeShape(e, x, y) {
    const u = (x - e.cx) / e.hw, v = (y - e.cy) / e.hh;
    if (Math.abs(u) > 1) return null;
    const lim = Math.pow(1 - u * u, 0.7);
    if (Math.abs(v) > lim) return null;
    return { u, v, lim };
  }

  function buildBoy() {
    const px = new Uint32Array(W * H);
    const mat = new Uint8Array(W * H);          // 1 Hemd 2 Hals 3 Haar 4 Gesicht 6 Augenweiß 8 Wimpern 9 Unterlid
    const set = (x, y, c, m) => { const i = y * W + x; px[i] = c; mat[i] = m; };
    const lit = (n) => Math.max(0, n[0] * KEY[0] + n[1] * KEY[1] + n[2] * KEY[2]);
    const faceN = (x, y) => {
      const zx = (faceHeight(x + 1, y) - faceHeight(x - 1, y)) / 2;
      const zy = (faceHeight(x, y + 1) - faceHeight(x, y - 1)) / 2;
      return norm3(-zx, -zy, 1.2);
    };

    for (let y = 18; y < H; y++) for (let x = 0; x < 214; x++) {
      // ---- Haar ----
      if (inHair(x, y)) {
        const inCrown = crownR(x, y) < 1 && y <= bangEdge(x);
        let n;
        if (inCrown) {
          const u = clamp((x - 100) / 55, -1, 1), v = clamp((y - 70) / 48, -1, 1);
          n = norm3(u, v * 0.8, Math.sqrt(Math.max(0, 1 - u * u - v * v)) + 0.15);
        } else {                                                             // Seitensträhnen: senkrechter Zylinder
          const u = clamp((x - 70) / 26, -1, 1);
          n = norm3(u * 0.95, 0.15, Math.sqrt(1 - u * u) + 0.15);
        }
        const ang = Math.atan2(y - 24, x - 100);
        const k = ang * 7 + (vnoise(x * 0.05, y * 0.05) - 0.5) * 0.6;
        const idx = Math.floor(k), f = k - idx;
        const prof = 1 - Math.pow(Math.abs(2 * f - 1), 2);                  // Bündel: Mitte hell
        const gap = f < 0.07 || f > 0.93 ? 0.12 : 0;                         // feine Fuge
        const r = Math.sqrt(ell(x, y, 100, 70, 55, 48));
        const sheen = r > 0.52 && r < 0.63 && x > 84 && y < 90 ? 0.2 : 0;    // Glanzring
        const val = clamp(0.1 + lit(n) * 0.72 + (prof - 0.5) * 0.22 + (hash(idx, 3) - 0.5) * 0.1 + sheen - gap - Math.max(0, y - 92) * 0.009);
        const rim = rimOf(n);
        set(x, y, rim > 0.5 ? pick(P.rim, rim * 1.1, x, y) : pick(P.hair, val, x, y), 3);
        continue;
      }

      // ---- Augen (mandelförmig) ----
      let isEye = false;
      for (const e of EYES) {
        const s = eyeShape(e, x, y);
        if (!s) continue;
        isEye = true;
        if (s.v < -s.lim + 0.75) set(x, y, OUT, 8);                          // kräftige Oberlidlinie
        else if (s.v > s.lim - 0.42) set(x, y, P.skin[2], 9);                // Unterlid
        else set(x, y, pick(P.sclera, 0.62 - Math.max(0, -s.v) * 0.25 + s.u * 0.12, x, y), 6);
        break;
      }
      if (isEye) continue;

      // ---- Gesicht ----
      if (faceMask(x, y)) {
        const n = faceN(x, y);
        let v = clamp(0.16 + 0.85 * Math.pow(lit(n), 0.85) + 0.06 * n[2]);
        const be = bangEdge(x);
        if (y > be) v *= 0.35 + 0.65 * clamp((y - be) / 7);                  // Pony wirft Schatten
        if (x < 84) v *= 0.6;
        if (inPoly(NOSE, x, y)) v = y < 120 - (x - 133) * 0.2 ? 0.86 : 0.55; // Nasenkeil: oben Licht
        const nsh = Math.hypot((x - 130) / 4, (y - 120) / 5);                // Nase wirft Schatten nach links
        if (nsh < 1 && !inPoly(NOSE, x, y)) v *= 0.72;
        set(x, y, pick(P.skin, v, x, y), 4);
        continue;
      }

      // ---- Hemd ----
      const u = (x - 104) / 102;
      const shirtTop = 146 + 72 * u * u;
      if (y >= shirtTop && Math.abs(u) <= 1) {
        if (inPoly(V_NECK, x, y)) {
          const v = 0.12 + (y - 146) * 0.004 + (x > 106 ? 0.12 : 0);
          set(x, y, pick(P.skin, v, x, y), 2); continue;
        }
        const nz = Math.sqrt(Math.max(0, 1 - u * u));
        const wr = (fbm(x * 0.05, y * 0.08) - 0.5) * 0.5;
        const n = norm3(u * 0.9 + wr * 0.6, -0.3 + Math.max(0, 158 - y) * 0.03, nz + 0.1);
        const val = clamp(0.05 + lit(n) * 0.95 + wr * 0.25);
        const rim = rimOf(n);
        const vx = (x + (y - 190) * 0.1 + 900) % 9, vy = (y + (x - 104) * 0.04 + 900) % 11;
        const hrow = Math.floor((y + (x - 104) * 0.04 + 900) / 11);
        let c;
        if (rim > 0.22) c = pick(P.rim, rim * 0.9, x, y);
        else if (vx < 1.3) c = pick(P.navy, val + 0.1, x, y);
        else if (vy < 1.3) c = pick(hrow % 2 ? P.sand : P.navy, val + 0.1, x, y);
        else c = pick(P.shirt, val, x, y);
        const [dl1] = segInfo(x, y, 91, 146, 106, 172), [dl2] = segInfo(x, y, 121, 146, 106, 172);
        const dl = Math.min(dl1, dl2);
        if (dl < 4.5) c = pick(P.shirt, val + 0.22, x, y);
        else if (dl < 5.6) c = OUT;
        set(x, y, c, 1); continue;
      }
      // ---- Hals ----
      if (y >= 126 && x >= 92 && x <= 122) {
        const uu = (x - 107) / 15;
        const n = norm3(uu, 0.1, Math.sqrt(Math.max(0, 1 - uu * uu)) + 0.1);
        const v = clamp(0.04 + lit(n) * 0.7) * clamp((y - 136) / 14 + 0.25);
        set(x, y, pick(P.skin, v, x, y), 2);
      }
    }

    // ---- Brauen, Nasenloch, Mund ----
    for (let x = 120; x <= 132; x++) { const y = Math.round(99.5 - (x - 120) * 0.1); if (mat[y * W + x] === 4) set(x, y, P.hair[1], 4); }
    for (let x = 85; x <= 102; x++) { const y = 100; if (mat[y * W + x] === 4) set(x, y, P.hair[1], 4); }
    set(138, 123, P.skin[1], 4); set(139, 123, P.skin[1], 4);
    for (let t = 0; t <= 1; t += 0.01) {
      const a = 1 - t;
      const mx = Math.round(a * a * 113 + 2 * a * t * 121 + t * t * 130);
      const my = Math.round(a * a * 133 + 2 * a * t * 135 + t * t * 130.5);
      set(mx, my, pack(hex('#2a0c16')), 4);
      if (t > 0.2 && t < 0.7) set(mx, my + 1, P.skin[4], 4);                  // Unterlippe im Licht
    }
    set(131, 130, P.skin[2], 4);                                              // Mundwinkel (Grinsen)

    // ---- Konturen ----
    const snap = px.slice(), ms = mat.slice();
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < 214; x++) {
      const i = y * W + x;
      if (snap[i] === 0) {
        if (snap[i - 1] || snap[i + 1] || snap[i - W] || snap[i + W]) px[i] = OUT;
      } else if (ms[i] === 4 && (ms[i - W] === 3 || ms[i - 1] === 3 || ms[i + 1] === 3)) {
        px[i] = P.skin[0];
      }
    }
    return { px, mat, canvas: bufCanvas(px, W, H) };
  }

  // ---------- Karten ----------
  const CW = 20, CHh = 30;                     // Kartengröße im Turm
  const FONT = {
    I: ['#', '#', '#', '#', '#'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  };
  const ICONS = {
    star: ['.....##.....', '.....##.....', '....#++#....', '....#++#....', '############', '.##++++++##.', '..##++++##..', '...#++++#...', '..##+##+##..', '..#+#..#+#..', '.##......##.', '.#........#.'],
    bolt: ['......####..', '.....####...', '....####....', '...####.....', '..#######...', '.....####...', '....####....', '...####.....', '..####......', '..###.......', '.###........', '.#..........'],
    book: ['............', '.####..####.', '#++++##++++#', '#+..+##+..+#', '#++++##++++#', '#+..+##+..+#', '#++++##++++#', '#+..+##+..+#', '#++++##++++#', '#++++##++++#', '.####..####.', '.....##.....'],
    key: ['............', '............', '.####.......', '#++++#......', '#+..+#######', '#+..+#+++++#', '#++++###.#.#', '.####.......', '............', '............', '............', '............'],
    flame: ['.....#......', '....##......', '....#+#.....', '...#++#.....', '...#++##....', '..#++++#....', '..#+++++#...', '.#++##++#...', '.#+#..#+#...', '.#+#..#+#...', '..#+..+#....', '...####.....'],
    bed: ['............', '#...........', '#...........', '#.##........', '#####.......', '#++++#######', '#+++++++++++', '############', '#..........#', '#..........#', '............', '............'],
  };

  function lighten(c, f) { const [r, g, b] = hex(c); return pack([Math.min(255, r + (255 - r) * f), Math.min(255, g + (255 - g) * f), Math.min(255, b + (255 - b) * f)]); }
  function darken(c, f) { const [r, g, b] = hex(c); return pack([r * f, g * f, b * f]); }

  // Rückseite (im Turm). Kapitelkarten haben ein farbiges Emblem.
  function buildBack(color, glow) {
    const buf = new Uint32Array(CW * CHh);
    const gold = pack(hex('#c49a46')), goldD = pack(hex('#7a5a24')), field = pack(hex('#101a2e')), lat = pack(hex('#1b2b48'));
    const em = color ? pack(hex(color)) : pack(hex('#2f8a96')), emL = color ? lighten(color, 0.45) : pack(hex('#8ff0ea'));
    for (let y = 0; y < CHh; y++) for (let x = 0; x < CW; x++) {
      let c;
      if (x === 0 || y === 0 || x === CW - 1 || y === CHh - 1) c = glow ? pack(hex('#ffd27a')) : OUT;
      else if (x === 1 || y === 1 || x === CW - 2 || y === CHh - 2) c = x > CW / 2 ? gold : goldD;
      else {
        c = (x + y) % 4 === 0 || (x - y + 100) % 4 === 0 ? lat : field;
        const d = Math.abs(x - (CW - 1) / 2) + Math.abs(y - (CHh - 1) / 2);
        if (d <= 6) c = d <= 2 ? emL : d <= 5 ? em : OUT;
      }
      buf[y * CW + x] = c;
    }
    return bufCanvas(buf, CW, CHh);
  }

  // Vorderseite in Groß (54x78) – wird gezeigt, wenn die Karte gezogen ist
  function buildFace(ch) {
    const w = 60, h = 90, buf = new Uint32Array(w * h);
    const col = ch.color, colP = pack(hex(col)), colL = lighten(col, 0.5), colD = darken(col, 0.45);
    const cream = pack(hex('#efe2c2')), creamD = pack(hex('#bfa77a')), gold = pack(hex('#d8b25a')), goldD = pack(hex('#7a5a24'));
    const S = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) buf[y * w + x] = c; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = cream;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) c = OUT;
      else if (x <= 2 || y <= 2 || x >= w - 3 || y >= h - 3) c = (x + y) % 2 ? gold : goldD;
      else if (y >= 5 && y <= 15 && x >= 5 && x <= w - 6) c = y === 5 ? colL : colP;                  // Kopfband
      else if (y >= 18 && y <= 70 && x >= 5 && x <= w - 6) {                                         // Bildfeld
        const g = clamp(1 - Math.hypot(x - 30, y - 44) / 29);
        c = pick([pack(hex('#060912')), pack(hex('#0c1424')), colD, colP], 0.1 + g * 0.85, x, y);
        if (y === 18 || y === 70 || x === 5 || x === w - 6) c = OUT;
      } else if (y >= 74 && y <= 84 && x >= 5 && x <= w - 6) c = (y === 74 || y === 84) ? creamD : cream;
      buf[y * w + x] = c;
    }
    // Römische Ziffer im Kopfband
    let gx = 30 - Math.floor(ch.numeral.length * 2 - 1);
    for (const chr of ch.numeral) {
      const g = FONT[chr];
      g.forEach((row, ry) => [...row].forEach((p, rx) => { if (p === '#') S(gx + rx, 8 + ry, cream); }));
      gx += g[0].length + 1;
    }
    // Symbol (2x vergrößert) mit Kontur
    const icon = ICONS[ch.icon];
    const ox = 30 - 12, oy = 44 - 12;
    const on = (ix, iy) => iy >= 0 && iy < 12 && ix >= 0 && ix < 12 && icon[iy][ix] !== '.';
    for (let iy = -1; iy <= 12; iy++) for (let ix = -1; ix <= 12; ix++) {
      const ch2 = on(ix, iy) ? icon[iy][ix] : null;
      for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
        const X = ox + ix * 2 + sx, Y = oy + iy * 2 + sy;
        if (ch2) S(X, Y, ch2 === '+' ? cream : colL);
        else if (on(ix - 1, iy) || on(ix + 1, iy) || on(ix, iy - 1) || on(ix, iy + 1)) S(X, Y, OUT);
      }
    }
    // Zierpunkte im Fuß
    for (let x = 12; x <= w - 13; x += 6) { S(x, 78, colP); S(x + 1, 78, colP); S(x, 79, colP); S(x + 1, 79, colP); }
    return bufCanvas(buf, w, h);
  }

  // ---------- Kartenhaus-Aufbau ----------
  // Karten werden geschert (Parallelogramm) und leicht gestaucht gezeichnet –
  // so wirken sie wie schräg von vorn gesehen und treffen sich oben spitz.
  const SQ = 0.7, SH = 0.36;                     // Stauchung, Scherung (≈ 20° Neigung)
  const GROUND = 200, CX = 298, STEP = 50, FLAT_T = 3, FLAT_L = 60;
  const TW = CW * SQ, TOPX = SH * CHh;           // sichtbare Breite, Versatz oben
  let tower = null;

  function layoutTower(chapters) {
    const ay1 = GROUND - CHh, ay2 = ay1 - (FLAT_T + 1) - CHh, ay3 = ay2 - (FLAT_T + 1) - CHh;
    const pairs = [
      { ax: CX - STEP, ay: ay1, lvl: 0 }, { ax: CX, ay: ay1, lvl: 0 }, { ax: CX + STEP, ay: ay1, lvl: 0 },
      { ax: CX - STEP / 2, ay: ay2, lvl: 1 }, { ax: CX + STEP / 2, ay: ay2, lvl: 1 },
      { ax: CX, ay: ay3, lvl: 2 },
    ];
    const flats = [
      { x: CX - STEP / 2, y: ay1 - FLAT_T - 1, lvl: 0, len: FLAT_L }, { x: CX + STEP / 2, y: ay1 - FLAT_T - 1, lvl: 0, len: FLAT_L },
      { x: CX, y: ay2 - FLAT_T - 1, lvl: 1, len: FLAT_L }, { x: CX, y: ay3 - FLAT_T - 1, lvl: 2, len: 34 },
    ];
    pairs.forEach((p, i) => {
      const ch = chapters[i];
      p.i = i;
      // Drehpunkt = untere Innenecke; sh = Scherung (links: oben nach rechts)
      p.left = { px: p.ax - TOPX, py: p.ay + CHh, sh: -SH, corner: CW, sprite: buildBack(ch.color), glow: buildBack(ch.color, true) };
      p.right = { px: p.ax + TOPX, py: p.ay + CHh, sh: SH, corner: 0, sprite: buildBack(null), extra: 0 };
      p.face = buildFace(ch);
      p.seed = hash(i, 9) * 6.28;
    });
    const flatSprites = {};
    flats.forEach((f) => { if (!flatSprites[f.len]) flatSprites[f.len] = buildFlat(f.len); });
    return { pairs, flats, flatSprites };
  }

  function buildFlat(len) {
    const w = len, h = FLAT_T + 1, buf = new Uint32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let c = pack(hex('#16233c'));
      if (y === 0 || x === 0 || x === w - 1 || y === h - 1) c = OUT;
      else if (y === h - 2) c = pack(hex('#c49a46'));
      else if ((x + y) % 3 === 0) c = pack(hex('#22365a'));
      buf[y * w + x] = c;
    }
    return bufCanvas(buf, w, h);
  }

  // ---------- Zustand ----------
  let ctx = null, bgC, fogA, fogB, beamC, vigC, boy, eyeImg, eyeBuf, glowC;
  const EYE_BOX = { x: 84, y: 98, w: 52, h: 16 };
  const st = {
    t: 0, tx: 300, ty: 150, gx: [0, 0], gy: [0, 0], blink: -1, nextBlink: 2,
    hover: null, pointer: null,
    wobble: 0, sag: 0,
    pull: null,                     // { i, p, dir, onDone }
  };
  let chapters = [];
  const embers = [], dust = [], floaters = [];

  function initParticles() {
    for (let i = 0; i < 46; i++) embers.push({ x: 0, y: 0, vy: 0, vx: 0, life: 0, max: 1 });
    embers.forEach((e) => respawnEmber(e, true));
    for (let i = 0; i < 26; i++) dust.push({ x: Math.random() * 210, y: Math.random() * H, ph: Math.random() * 6.28, sp: 2 + Math.random() * 4 });
    for (let i = 0; i < 9; i++) floaters.push({ x: Math.random() * W, y: Math.random() * H, d: 0.35 + Math.random() * 0.5, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, vy: 2 + Math.random() * 4 });
  }
  function respawnEmber(e, anywhere) {
    e.x = 226 + Math.random() * 140;
    e.y = anywhere ? 60 + Math.random() * 150 : 196 + Math.random() * 10;
    e.vy = 8 + Math.random() * 16; e.vx = (Math.random() - 0.5) * 6;
    e.life = 0; e.max = 3 + Math.random() * 4;
  }

  // ---------- Zeichnen ----------
  function drawCard(sprite, px, py, sh, rot, corner) {
    ctx.save();
    ctx.translate(Math.round(px), Math.round(py));
    ctx.rotate(rot);
    ctx.transform(SQ, 0, sh, 1, 0, 0);
    ctx.drawImage(sprite, -corner, -CHh);
    ctx.restore();
  }

  function drawTower() {
    const { pairs, flats, flatSprites } = tower;
    const pulled = st.pull ? st.pull.i : -1;
    const pulledLvl = pulled >= 0 ? pairs[pulled].lvl : 9;
    for (let lvl = 0; lvl < 3; lvl++) {
      const sagY = lvl > pulledLvl ? Math.round(st.sag * 1.5 * (lvl - pulledLvl)) : 0;
      for (const p of pairs) {
        if (p.lvl !== lvl) continue;
        const wob = st.wobble * (0.6 + lvl * 0.5);
        const w1 = Math.sin(st.t * 15 + p.seed) * wob, w2 = Math.sin(st.t * 13 + p.seed + 1.7) * wob;
        const R = p.right;
        drawCard(R.sprite, R.px, R.py + sagY, R.sh + R.extra, w2, R.corner);
        if (p.i !== pulled) {
          const L = p.left;
          const lift = st.hover === p.i && !st.pull ? -2 : 0;
          drawCard(st.hover === p.i ? L.glow : L.sprite, L.px, L.py + sagY + lift, L.sh, w1, L.corner);
        }
      }
      for (const f of flats) {
        if (f.lvl !== lvl) continue;
        const sagF = f.lvl >= pulledLvl ? Math.round(st.sag * 1.5 * (f.lvl - pulledLvl + 1)) : 0;
        const spr = flatSprites[f.len];
        ctx.save();
        ctx.translate(Math.round(f.x), Math.round(f.y + sagF));
        ctx.rotate(Math.sin(st.t * 11 + f.x) * st.wobble * 0.5);
        ctx.drawImage(spr, -Math.floor(spr.width / 2), 0);
        ctx.restore();
      }
    }
  }

  // Mittelpunkt der Kapitelkarte im Turm
  function slotCenter(p) {
    const L = p.left;
    const lx = -L.corner + CW / 2, ly = -CHh / 2;
    return [L.px + SQ * lx + L.sh * ly, L.py + ly];
  }
  const TARGET = { x: 176, y: 106, s: 3 };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function drawPulled() {
    const pl = st.pull;
    const p = tower.pairs[pl.i];
    const e = ease(pl.p);
    const [sx, sy] = slotCenter(p);
    const x = sx + (TARGET.x - sx) * e, y = sy + (TARGET.y - sy) * e - Math.sin(Math.PI * e) * 16;
    const s = 1 + (TARGET.s - 1) * e;
    const rot = Math.sin(Math.PI * e) * -0.25;
    const sq = SQ + (1 - SQ) * e, sh = p.left.sh * (1 - e);
    const q = clamp((pl.p - 0.2) / 0.65);
    const fx = Math.max(0.06, Math.abs(Math.cos(Math.PI * q)));
    if (e > 0) {                                   // dunkler Schleier + Leuchten hinter der Karte
      ctx.fillStyle = 'rgba(3,4,10,' + (0.62 * e).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = e;
      ctx.drawImage(glowC[pl.i], Math.round(x - glowC[pl.i].width / 2), Math.round(y - glowC[pl.i].height / 2));
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(rot);
    ctx.transform(sq, 0, sh, 1, 0, 0);
    if (q < 0.5) { ctx.scale(s * fx, s); ctx.drawImage(p.left.sprite, -CW / 2, -CHh / 2); }
    else { ctx.scale((s / 3) * fx, s / 3); ctx.drawImage(p.face, -30, -45); }
    ctx.restore();
    return [x, y];
  }

  function buildGlow(color) {
    const r = 64, w = r * 2, buf = new Uint32Array(w * w), c = hex(color);
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - r, (y - r) * 0.85) / r;
      if (d >= 1) continue;
      const a = (1 - d) * (1 - d);
      const lvl = a > 0.5 ? 70 : a > 0.22 ? 42 : a > 0.06 ? 20 : 0;
      if (lvl) buf[y * w + x] = pack(c, lvl);
    }
    return bufCanvas(buf, w, w);
  }

  function drawEyes(dy, blink) {
    const b = eyeBuf, bx = EYE_BOX.x, by = EYE_BOX.y, bw = EYE_BOX.w;
    for (let y = 0; y < EYE_BOX.h; y++) for (let x = 0; x < bw; x++) b[y * bw + x] = boy.px[(by + y) * W + bx + x];
    EYES.forEach((e, k) => {
      const ddx = st.tx - e.cx, ddy = st.ty - e.cy, dist = Math.hypot(ddx, ddy) || 1;
      const m = Math.min(1, dist / 50);
      st.gx[k] += ((ddx / dist) * m * e.maxX - st.gx[k]) * 0.2;
      st.gy[k] += ((ddy / dist) * m * e.maxY - st.gy[k]) * 0.2;
      const icx = e.cx + Math.round(st.gx[k]), icy = e.cy + Math.round(st.gy[k]);
      for (let y = Math.floor(e.cy - e.hh) - 1; y <= Math.ceil(e.cy + e.hh) + 1; y++) {
        for (let x = Math.floor(e.cx - e.hw) - 1; x <= Math.ceil(e.cx + e.hw) + 1; x++) {
          const m2 = boy.mat[y * W + x];
          if (m2 !== 6 && m2 !== 8 && m2 !== 9) continue;
          const bi = (y - by) * bw + (x - bx);
          const s = eyeShape(e, x, y);
          if (!s) continue;
          if (blink > 0) {                                     // Lid schließt sich
            const lidEdge = -s.lim + 2 * s.lim * blink;
            if (s.v < lidEdge) { b[bi] = Math.abs(s.v - lidEdge) < 0.45 ? OUT : P.skin[3]; continue; }
          }
          if (m2 !== 6) continue;
          const d = Math.hypot(x - icx, y - icy);
          if (d > e.ir) continue;
          let c;
          if (d <= e.pr) c = OUT;
          else if (d > e.ir - 0.9) c = P.iris[0];
          else c = pick(P.iris, 0.45 + ((y - icy) / e.ir) * 0.45 + (x - icx > 0 ? 0.15 : 0), x, y);
          if (s.v < -s.lim + 1.2) c = P.iris[0];             // Schatten vom Oberlid
          if (x === icx + 1 && y === icy - 1) c = P.iris[3];
          b[bi] = c;
        }
      }
    });
    ctx.putImageData(eyeImg, bx, by + dy);
  }

  function drawFloaters(dt) {
    for (const f of floaters) {
      f.y -= f.vy * dt * f.d; f.r += f.vr * dt;
      if (f.y < -20) { f.y = H + 20; f.x = Math.random() * W; }
      const s = Math.round(f.d * 2 * 10) / 10;
      ctx.save();
      ctx.translate(Math.round(f.x - st.t * 0), Math.round(f.y));
      ctx.rotate(f.r);
      ctx.globalAlpha = 0.18 + f.d * 0.25;
      ctx.fillStyle = '#0b1828';
      ctx.fillRect(Math.round(-4 * s), Math.round(-6 * s), Math.round(8 * s), Math.round(12 * s));
      ctx.fillStyle = '#1e3a50';
      ctx.fillRect(Math.round(-4 * s), Math.round(-6 * s), Math.round(8 * s), 1);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawParticles(dt) {
    for (const e of embers) {
      e.life += dt; e.y -= e.vy * dt; e.x += Math.sin(st.t * 2 + e.max * 3) * 6 * dt + e.vx * dt;
      if (e.life > e.max || e.y < 0) respawnEmber(e, false);
      const a = Math.sin((e.life / e.max) * Math.PI);
      ctx.fillStyle = a > 0.6 ? '#ffd27a' : a > 0.3 ? '#ff9a3c' : '#a8441e';
      ctx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1);
    }
    for (const d of dust) {
      d.y -= d.sp * dt * 0.5; d.x += Math.sin(st.t * 0.7 + d.ph) * dt * 3;
      if (d.y < 0) { d.y = H; d.x = Math.random() * 210; }
      if (Math.sin(st.t * 2 + d.ph) > 0.2) { ctx.fillStyle = '#6fd6d6'; ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1); }
    }
  }

  function drawFog(c, off, y) {
    const o = ((off % c.width) + c.width) % c.width;
    ctx.drawImage(c, Math.round(-o), y);
    ctx.drawImage(c, Math.round(-o + c.width), y);
  }

  function frame(dt) {
    st.t += dt;
    st.wobble *= Math.exp(-dt * 2.6);
    // Ziehen-Animation
    let cardPos = null;
    if (st.pull) {
      const pl = st.pull;
      pl.p = clamp(pl.p + (dt / 0.75) * pl.dir);
      const R = tower.pairs[pl.i].right;
      R.extra += ((pl.dir > 0 || pl.p > 0.05 ? 0.28 : 0) * Math.min(1, pl.p * 3) - R.extra) * Math.min(1, dt * 6);
      st.sag += ((pl.p > 0.15 ? 1 : 0) - st.sag) * Math.min(1, dt * 5);
      if ((pl.dir > 0 && pl.p >= 1) || (pl.dir < 0 && pl.p <= 0)) {
        const cb = pl.onDone; pl.onDone = null;
        if (pl.dir < 0) { R.extra = 0; st.pull = null; st.sag = 0; st.wobble = 0.035; }
        if (cb) cb();
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(bgC, 0, 0);
    drawFloaters(dt);
    drawFog(fogA, st.t * 3, 0);
    ctx.globalAlpha = 0.75 + Math.sin(st.t * 1.3) * 0.15 + Math.sin(st.t * 3.7) * 0.05;
    ctx.drawImage(beamC, 0, 0);
    ctx.globalAlpha = 1;

    const dy = Math.sin(st.t * 1.5) > 0.45 ? 1 : 0;
    ctx.drawImage(boy.canvas, 0, dy);

    // Blickziel: gezogene Karte > Hover-Karte > Maus > Turm
    if (st.pull) {
      const p = tower.pairs[st.pull.i], [sx, sy] = slotCenter(p), e = ease(st.pull.p);
      st.tx = sx + (TARGET.x - sx) * e; st.ty = sy + (TARGET.y - sy) * e;
    } else if (st.hover !== null) {
      [st.tx, st.ty] = slotCenter(tower.pairs[st.hover]);
    } else if (st.pointer) {
      [st.tx, st.ty] = st.pointer;
    } else { st.tx = 296; st.ty = 150; }

    let blink = 0;
    if (st.blink >= 0) {
      st.blink += dt;
      const p = st.blink / 0.2;
      blink = p < 0.5 ? p * 2 : (1 - p) * 2;
      if (st.blink > 0.2) st.blink = -1;
    } else if ((st.nextBlink -= dt) <= 0) { st.blink = 0; st.nextBlink = 2.5 + Math.random() * 4; }
    drawEyes(dy, clamp(blink));

    drawTower();
    drawParticles(dt);
    drawFog(fogB, -st.t * 6, 0);
    ctx.drawImage(vigC, 0, 0);
    if (st.pull) cardPos = drawPulled();
    return cardPos;
  }

  // ---------- Schleife & API ----------
  let raf = 0, last = 0, running = false;
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    frame(dt);
    raf = requestAnimationFrame(loop);
  }

  function init(canvas, chs) {
    chapters = chs;
    canvas.width = W; canvas.height = H;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (!bgC) {
      bgC = buildBg();
      fogA = buildFog(3.1, [120, 190, 205], 150, 46, 0.9);
      fogB = buildFog(8.7, [150, 200, 210], 206, 16, 1.0);
      beamC = buildBeams();
      vigC = buildVignette();
      boy = buildBoy();
      eyeBuf = new Uint32Array(EYE_BOX.w * EYE_BOX.h);
      eyeImg = new ImageData(new Uint8ClampedArray(eyeBuf.buffer), EYE_BOX.w, EYE_BOX.h);
      tower = layoutTower(chapters);
      glowC = chapters.map((c) => buildGlow(c.color));
      initParticles();
    }
    frame(0);
  }

  window.MenuArt = {
    W, H, init,
    start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); },
    stop() { running = false; cancelAnimationFrame(raf); },
    setPointer(ax, ay) { st.pointer = ax === null ? null : [ax, ay]; },
    setHover(i) { if (!st.pull) st.hover = i; },
    // Klickflächen der Kapitel (Bild-Koordinaten)
    slots() { return tower.pairs.map((p) => ({ x: p.ax - 22, y: p.ay - 5, w: 44, h: CHh + 5 })); },
    cardRect() { return { x: TARGET.x - 30, y: TARGET.y - 45, w: 60, h: 90 }; },
    busy() { return !!(st.pull && st.pull.p > 0 && st.pull.p < 1); },
    isOut() { return !!st.pull; },
    pull(i, onDone) { if (st.pull) return; st.hover = null; st.wobble = 0.05; st.pull = { i, p: 0, dir: 1, onDone }; },
    pushBack(onDone) { if (!st.pull) return onDone && onDone(); st.pull.dir = -1; st.pull.onDone = onDone; },
    reset() { if (st.pull) { tower.pairs[st.pull.i].right.extra = 0; st.pull = null; st.sag = 0; } },
    renderOnce(dt) { frame(dt || 0.016); },
  };
})();
