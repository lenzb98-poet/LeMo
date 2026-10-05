// Hauptmenü-Grafik: ein detaillierteres Pixel-Porträt (384x216), das per Code "gerendert" wird.
// Statt von Hand Pixel für Pixel zu setzen, werden Formen mit einer Lichtquelle schattiert
// (warmes Licht von rechts oben) und über Farbrampen + Raster-Dithering in Pixel verwandelt.
// Die Augen werden jeden Frame neu gezeichnet, damit sie der Maus folgen können.
(function () {
  const W = 384, H = 216;

  // ---------- Helfer ----------
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const pack = (c) => ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
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
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => (v + 0.5) / 16));
  // Wert 0..1 -> Farbe aus der Rampe, mit Raster-Dithering zwischen zwei Stufen
  function pick(r, v, x, y) {
    v = clamp(v);
    const p = v * (r.length - 1);
    const i = Math.floor(p);
    if (i >= r.length - 1) return r[r.length - 1];
    return p - i > BAYER[y & 3][x & 3] ? r[i + 1] : r[i];
  }
  function mul(c, f) {
    const r = Math.min(255, (c & 255) * f), g = Math.min(255, ((c >> 8) & 255) * f), b = Math.min(255, ((c >> 16) & 255) * f);
    return pack([r, g, b]);
  }
  const norm3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
  const LIGHT = norm3(0.55, -0.5, 0.68);                       // Licht von rechts oben vorn
  const dot = (n) => n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
  function inPoly(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  const distSeg = (x, y, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1, t = clamp(((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy));
    return Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t));
  };

  // ---------- Hintergrund: Gaststube mit Steinwand, Fenster, Pflanze, Tisch ----------
  function buildBg() {
    const px = new Uint32Array(W * H);
    const lamp = { x: 330, y: 8 };
    const wallR = ramp(['#160c08', '#2a190f', '#46291a', '#6f4a2e', '#a0713f', '#d1a066']);
    const woodR = ramp(['#120804', '#26130a', '#42261a', '#5d3a24']);
    const glassR = ramp(['#070c12', '#101c2a', '#1e3348', '#34506a']);
    const leafR = ramp(['#0c2412', '#17391d', '#25542a', '#3a7632', '#62a247']);
    const stoneR = [
      ramp(['#1c2419', '#2e3c27', '#465832', '#66784a']),
      ramp(['#2a1f15', '#44311f', '#634a2d', '#85673d']),
      ramp(['#1d2a2b', '#2f4443', '#47615b', '#688478']),
      ramp(['#33291c', '#52432a', '#756140', '#9a8458']),
    ];
    const clothR = ramp(['#3a3026', '#6b5d4a', '#a3937a', '#d2c5aa', '#efe6d1']);
    const mortar = pack(hex('#140b07'));

    const light = (x, y) => clamp(0.66 - Math.hypot(x - lamp.x, (y - lamp.y) * 1.25) / 440 + (vnoise(x * 0.05, y * 0.05) - 0.5) * 0.12);

    // Wand (oben Putz, unten Naturstein)
    const CW = 27, CH = 21;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const L = light(x, y);
        const stoneTop = 114 + 3 * Math.sin(x * 0.06);
        if (y < stoneTop) { px[y * W + x] = pick(wallR, L, x, y); continue; }
        const gx = Math.floor(x / CW), gy = Math.floor(y / CH);
        let d1 = 1e9, d2 = 1e9, id = 0;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const cx = gx + ox, cy = gy + oy;
          const sx = (cx + 0.15 + 0.7 * hash(cx, cy)) * CW, sy = (cy + 0.15 + 0.7 * hash(cy, cx + 9)) * CH;
          const d = Math.hypot((x - sx) * 0.9, y - sy);
          if (d < d1) { d2 = d1; d1 = d; id = cx * 131 + cy * 17; } else if (d < d2) d2 = d;
        }
        if (d2 - d1 < 1.7) { px[y * W + x] = mortar; continue; }
        const t = hash(id, 3), pal = stoneR[Math.floor(hash(id, 7) * 4)];
        const edge = clamp((d2 - d1) / 7);
        px[y * W + x] = pick(pal, (L + 0.12) * 0.95 + (t - 0.5) * 0.35 + (edge - 0.5) * 0.25 + (vnoise(x * 0.3, y * 0.3) - 0.5) * 0.18, x, y);
      }
    }

    // Fenster mit Sprossen
    const wx0 = 196, wx1 = 300, wy0 = 8, wy1 = 112;
    for (let y = wy0; y < wy1; y++) for (let x = wx0; x < wx1; x++) {
      const inner = x >= wx0 + 8 && x < wx1 - 8 && y >= wy0 + 8 && y < wy1 - 6;
      const barV = ((x - wx0 - 8) % 26) < 3, barH = ((y - wy0 - 8) % 30) < 3;
      if (inner && !barV && !barH) {
        const streak = Math.abs(((x - y * 0.7) % 38) - 10) < 3 ? 0.25 : 0;
        px[y * W + x] = pick(glassR, 0.2 + 0.28 * (x - wx0) / (wx1 - wx0) + streak + (vnoise(x * 0.2, y * 0.2) - 0.5) * 0.15, x, y);
      } else {
        px[y * W + x] = pick(woodR, 0.3 + vnoise(x * 0.9, y * 0.07) * 0.45 + ((x - wx0) < 3 ? 0.2 : 0), x, y);
      }
    }
    // Fensterbank
    for (let y = wy1; y < wy1 + 7; y++) for (let x = wx0 - 6; x < wx1 + 6; x++) px[y * W + x] = pick(stoneR[3], 0.55 + (y === wy1 ? 0.25 : -0.15 * (y - wy1) / 7), x, y);

    // Yucca-Pflanze auf der Fensterbank
    const bx = 244, by = 108;
    for (let k = 0; k < 22; k++) {
      const a = (-170 + k * 7.6 + (hash(k, 1) - 0.5) * 8) * Math.PI / 180;
      const len = 34 + hash(k, 2) * 36, droop = 0.35 + hash(k, 3) * 0.55;
      const shade = hash(k, 4);
      for (let t = 0; t <= 1; t += 0.008) {
        const x = Math.round(bx + Math.cos(a) * len * t), y = Math.round(by + Math.sin(a) * len * t + droop * len * t * t);
        const w = Math.max(1, Math.round(3.4 * (1 - t) + 0.4));
        for (let oy = 0; oy < w; oy++) for (let ox = 0; ox < w; ox++) {
          const xx = x + ox, yy = y + oy;
          if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
          px[yy * W + xx] = pick(leafR, 0.25 + shade * 0.35 + t * 0.25 + (xx > bx ? 0.12 : 0), xx, yy);
        }
      }
    }

    // Bokeh-Lichter
    [[300, 14, 15], [346, 40, 10], [262, 26, 7], [366, 10, 12], [330, 74, 8], [286, 60, 6]].forEach(([cx, cy, r]) => {
      for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const d = Math.hypot(x - cx, y - cy) / r;
        if (d > 1) continue;
        const a = 0.2 + (d > 0.85 ? 0.12 : 0);
        if (a > BAYER[y & 3][x & 3] * 0.7) px[y * W + x] = pick(wallR, 0.95, x, y);
      }
    });

    // runder Tisch mit Tischdecke (dort steht das Kartenhaus)
    for (let y = 150; y < H; y++) for (let x = 180; x < W; x++) {
      const top = 168 + Math.pow((x - 300) / 150, 2) * 12;
      if (y < top) continue;
      const edge = y - top < 1.5;
      const fold = Math.sin(x * 0.18 + vnoise(x * 0.04, y * 0.1) * 4) * 0.08;
      px[y * W + x] = edge ? pick(clothR, 0.95, x, y) : pick(clothR, 0.72 - (y - top) / 90 + fold + (light(x, 40) - 0.4) * 0.35, x, y);
    }

    // Vignette
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const vv = Math.pow((x - 192) / 192, 2) + Math.pow((y - 108) / 108, 2);
      if (vv > 0.6 && (vv - 0.6) * 1.1 > BAYER[y & 3][x & 3]) px[y * W + x] = mul(px[y * W + x], 0.55);
    }
    return px;
  }

  // ---------- Der Junge ----------
  const EYES = [
    { cx: 91, cy: 108, rx: 11, ry: 7.5, ir: 5.6, pr: 2.5, maxX: 4, maxY: 2.5 },   // naher Auge (links im Bild)
    { cx: 127, cy: 107, rx: 8.5, ry: 7.5, ir: 4.8, pr: 2.2, maxX: 3, maxY: 2.5 },  // fernes Auge (verkürzt)
  ];
  const SIDE_HAIR = [[50, 62], [43, 96], [40, 130], [45, 160], [53, 166], [62, 172], [70, 164], [77, 160], [77, 128], [72, 100], [66, 70]];
  const V_NECK = [[86, 142], [122, 142], [104, 170]];

  function bangEdge(x) {
    const k = (x - 98) / 52;
    const jag = ((Math.floor(x / 3) * 7) % 5) * 1.3 + Math.sin(x * 1.1) * 1.4;
    return 97 - 14 * Math.pow(Math.abs(k), 2.2) + jag - 2;
  }
  function faceInfo(x, y) {
    const t = clamp((y - 104) / 46);
    const cx = 100 + 8 * t, rx = 44 * (1 - 0.24 * Math.pow(t, 1.5)), ry = 46;
    const u = (x - cx) / rx, v = (y - 104) / ry, r2 = u * u + v * v;
    return r2 > 1 ? null : { u, v, z: Math.sqrt(1 - r2) };
  }
  function ellipseInfo(x, y, cx, cy, rx, ry) {
    const u = (x - cx) / rx, v = (y - cy) / ry, r2 = u * u + v * v;
    return r2 > 1 ? null : { u, v, z: Math.sqrt(1 - r2) };
  }

  function buildBoy() {
    const px = new Uint32Array(W * H);
    const mat = new Uint8Array(W * H);          // 1 Hemd, 2 Hals, 3 Haar, 4 Gesicht, 6 Auge
    const skinR = ramp(['#4a1f1a', '#7a3a2e', '#a85f46', '#cf8864', '#eaaa80', '#f8c9a2', '#ffe0c0']);
    const hairR = ramp(['#5e3f14', '#92651f', '#c79a3c', '#e6c363', '#f4dc8e', '#fff2bc']);
    const shirtW = ramp(['#4a4c66', '#7e809c', '#b4b6cc', '#dcdde8', '#f6f6fa']);
    const shirtN = ramp(['#0e1430', '#1a2450', '#2b3a72', '#42559a']);
    const shirtY = ramp(['#4a4a1c', '#76752c', '#a5a447', '#cfce6c']);
    const lash = pack(hex('#3a2016')), sclera = ramp(['#8a6f66', '#c2aaa0', '#e8dcd2', '#faf4ee']);
    const lipU = pack(hex('#9a4a44')), lipL = pack(hex('#e0948a')), mouthD = pack(hex('#4a2020'));

    const set = (x, y, c, m) => { const i = y * W + x; px[i] = c; mat[i] = m; };

    for (let y = 20; y < H; y++) for (let x = 0; x < 210; x++) {
      // ---- 1. Auge (liegt vor dem Gesicht) ----
      let done = false;
      for (const e of EYES) {
        const u = (x - e.cx) / e.rx, v = (y - e.cy) / e.ry, r2 = u * u + v * v;
        if (r2 <= 1) {
          const top = v < -0.45 && r2 > 0.55;
          const col = top ? lash : (v > 0.55 && r2 > 0.7 ? pack(hex('#b8806c')) : pick(sclera, 0.78 - Math.max(0, -v) * 0.45 + (u > 0.5 ? -0.12 : 0), x, y));
          set(x, y, col, 6); done = true; break;
        }
        // Lidfalte über dem Auge
        const r2b = Math.pow(u / 1.18, 2) + Math.pow((v + 0.3) / 1.3, 2);
        if (r2b <= 1 && v < -0.2 && r2 > 1 && r2b > 0.72) { set(x, y, skinR[2], 4); done = true; break; }
      }
      if (done) continue;

      // ---- 2. Haar (Pony + Haarkrone) ----
      const crown = ellipseInfo(x, y, 98, 68, 52, 44);
      if (crown && y <= bangEdge(x)) {
        const ang = Math.atan2(y - 40, x - 98);
        const streak = Math.sin(ang * 46 + vnoise(x * 0.15, y * 0.15) * 5) * 0.5 + 0.5;
        const d = dot(norm3(crown.u, crown.v * 0.9, crown.z + 0.1));
        const val = clamp(0.2 + d * 0.62 + (streak - 0.5) * 0.3 + (vnoise(x * 0.4, y * 0.4) - 0.5) * 0.12 - Math.max(0, y - 82) * 0.004);
        set(x, y, pick(hairR, val, x, y), 3); continue;
      }
      if (inPoly(SIDE_HAIR, x, y)) {
        const streak = Math.sin(x * 1.5 + vnoise(x * 0.1, y * 0.06) * 6) * 0.5 + 0.5;
        const val = clamp(0.18 + (x - 40) / 70 * 0.28 + (streak - 0.5) * 0.35 + (vnoise(x * 0.3, y * 0.2) - 0.5) * 0.12 - Math.max(0, y - 140) * 0.003);
        set(x, y, pick(hairR, val, x, y), 3); continue;
      }

      // ---- 3. Nase + Gesicht ----
      const nose = ellipseInfo(x, y, 139, 120, 8, 7);
      const face = faceInfo(x, y);
      if (nose || face) {
        let n;
        if (nose && (!face || nose.z > 0.35 || x > 142)) n = norm3(nose.u, nose.v, nose.z + 0.2);
        else n = norm3(face.u, face.v, face.z + 0.12);
        let val = clamp(dot(n) * 0.95 + 0.27);
        const be = bangEdge(x);
        if (y > be) val *= 0.55 + 0.45 * clamp((y - be) / 9);          // Schatten vom Pony
        if (x < 76) val *= 0.7;                                          // Haar wirft Schatten links
        const sock = Math.hypot((x - 100) / 20, (y - 112) / 9);          // Augenhöhlen
        if (sock < 1.6 && !nose) val *= 0.86;
        if (nose && nose.u < -0.2 && nose.v > -0.1) val *= 0.78;         // Nasenflügel
                set(x, y, pick(skinR, val, x, y), 4); continue;
      }

      // ---- 4. Hals ----
      if (y >= 134 && x >= 88 && x <= 120 && y < 142 + 74 * ((x - 100) / 98) * ((x - 100) / 98)) {
        const n = norm3((x - 104) / 16, 0.1, 0.8);
        let val = clamp(dot(n) * 0.8 + 0.05);
        val *= clamp(0.3 + (y - 134) / 22);
        set(x, y, pick(skinR, val * 0.9, x, y), 2); continue;
      }

      // ---- 5. Hemd (kariert) ----
      const u = (x - 100) / 98;
      if (y >= 142 + 74 * u * u && Math.abs(u) <= 1) {
        if (inPoly(V_NECK, x, y)) {
          const val = 0.22 + (y - 142) * 0.004;
          set(x, y, pick(skinR, val, x, y), 2); continue;
        }
        const nz = Math.sqrt(Math.max(0, 1 - u * u));
        const d = dot(norm3(u * 0.8, -0.25, nz + 0.1));
        const wr = (vnoise(x * 0.07, y * 0.11) - 0.5) * 0.4;
        const val = clamp(0.28 + 0.8 * d + wr - Math.max(0, 172 - y) * 0.01);
        const vx = (x + (y - 190) * 0.1 + 900) % 9, vy = (y + (x - 100) * 0.04 + 900) % 11;
        const hrow = Math.floor((y + (x - 100) * 0.04 + 900) / 11);
        let c;
        if (vx < 1.3) c = pick(shirtN, val + 0.05, x, y);
        else if (vy < 1.3) c = pick(hrow % 2 ? shirtY : shirtN, val + 0.05, x, y);
        else c = pick(shirtW, val, x, y);
        // Kragen entlang des V-Ausschnitts
        const dl = Math.min(distSeg(x, y, 86, 142, 104, 170), distSeg(x, y, 122, 142, 104, 170));
        if (dl < 5) c = pick(shirtW, val + 0.28, x, y);
        else if (dl < 6.2) c = pick(shirtN, val, x, y);
        set(x, y, c, 1);
      }
    }

    // ---- Mund (schiefes Grinsen), Sommersprossen ----
    const bez = (t) => {
      const a = 1 - t;
      return [a * a * 107 + 2 * a * t * 119 + t * t * 133, a * a * 140 + 2 * a * t * 147 + t * t * 133];
    };
    for (let t = 0; t <= 1; t += 0.01) {
      const [mx, my] = bez(t);
      const x = Math.round(mx), y = Math.round(my);
      set(x, y - 1, lipU, 7); set(x, y, mouthD, 7); set(x + 0, y + 1, mouthD, 7);
      set(x, y + 2, lipL, 7); set(x, y + 3, pick(skinR, 0.55, x, y + 3), 4);
    }
    set(134, 132, skinR[2], 4); set(135, 133, skinR[2], 4); set(135, 131, skinR[3], 4);   // Grübchen
    [[118, 125], [123, 127], [114, 128], [127, 129], [120, 131]].forEach(([x, y]) => set(x, y, skinR[2], 4));

    // ---- Kontur ----
    const outline = pack(hex('#1b0e08')), skinLine = skinR[1];
    const snap = px.slice(), msnap = mat.slice();
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < 209; x++) {
      const i = y * W + x;
      if (snap[i] === 0) {
        if (snap[i - 1] || snap[i + 1] || snap[i - W] || snap[i + W]) px[i] = outline;
      } else if (msnap[i] === 4) {
        if (msnap[i - 1] === 3 || msnap[i - W] === 3 || msnap[i + 1] === 3 || msnap[i + W] === 3) px[i] = skinLine;
      }
    }
    return { px, mat };
  }

  // ---------- Zusammensetzen pro Frame (Augen bewegen sich) ----------
  let bg = null, boy = null, buf = null, img = null, ctx = null, canvas = null;
  const state = { tx: 290, ty: 110, gx: [0, 0], gy: [0, 0], blink: -1, nextBlink: 2.5, t: 0 };
  const irisR = ramp(['#2c4656', '#4c7288', '#7aa2b6', '#aacbd8']);
  const limbus = pack(hex('#22394a')), pupil = pack(hex('#0a1218')), white = pack(hex('#ffffff'));
  let lashC = pack(hex('#3a2016')), lidC = pack(hex('#cf8864'));

  function drawEyes(dy, blink) {
    EYES.forEach((e, k) => {
      const ddx = state.tx - e.cx, ddy = state.ty - e.cy, dist = Math.hypot(ddx, ddy) || 1;
      const m = Math.min(1, dist / 55);
      const wantX = (ddx / dist) * m * e.maxX, wantY = (ddy / dist) * m * e.maxY;
      state.gx[k] += (wantX - state.gx[k]) * 0.22;
      state.gy[k] += (wantY - state.gy[k]) * 0.22;
      const icx = e.cx + Math.round(state.gx[k]), icy = e.cy + Math.round(state.gy[k]);
      for (let y = Math.floor(e.cy - e.ry) - 1; y <= Math.ceil(e.cy + e.ry) + 1; y++) {
        for (let x = Math.floor(e.cx - e.rx) - 1; x <= Math.ceil(e.cx + e.rx) + 1; x++) {
          const u = (x - e.cx) / e.rx, v = (y - e.cy) / e.ry;
          if (u * u + v * v > 1) continue;
          const i = (y + dy) * W + x;
          if (boy.mat[y * W + x] !== 6) continue;
          if (boy.px[y * W + x] === lashC) continue;                      // Wimpernlinie bleibt
          // Lid schließt sich von oben
          if (blink > 0 && v < -1 + 2 * blink) { buf[i] = v > -1 + 2 * blink - 0.22 ? lashC : lidC; continue; }
          const d = Math.hypot(x - icx, (y - icy) * 1.02);
          if (d > e.ir) continue;                                         // Augenweiß bleibt
          let c;
          if (d <= e.pr) c = pupil;
          else if (d > e.ir - 1.2) c = limbus;
          else c = pick(irisR, 0.35 + ((y - icy) / e.ir) * 0.5 + (hash(x, y) - 0.5) * 0.15, x, y);
          if (v < -0.5) c = mul(c, 0.6);                                  // Oberlid wirft Schatten
          if ((x === icx + 2 && y === icy - 2) || (x === icx + 1 && y === icy - 2) || (x === icx + 2 && y === icy - 1)) c = white;
          buf[i] = c;
        }
      }
    });
  }

  function frame(t) {
    buf.set(bg);
    const dy = Math.sin(t * 1.7) > 0.5 ? 1 : 0;                           // Atmen
    for (let y = 16; y < H; y++) {
      const ty = y + dy;
      if (ty >= H) break;
      const row = y * W, trow = ty * W;
      for (let x = 0; x < 212; x++) { const c = boy.px[row + x]; if (c) buf[trow + x] = c; }
    }
    // Blinzeln
    let blink = 0;
    if (state.blink >= 0) {
      const p = state.blink / 0.22;
      blink = p < 0.5 ? p * 2 : (1 - p) * 2;
    }
    drawEyes(dy, clamp(blink * 1.05));
    ctx.putImageData(img, 0, 0);
  }

  let raf = 0, last = 0, running = false;
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.t += dt;
    if (state.blink >= 0) { state.blink += dt; if (state.blink > 0.22) state.blink = -1; }
    else if ((state.nextBlink -= dt) <= 0) { state.blink = 0; state.nextBlink = 2.5 + Math.random() * 3.5; }
    frame(state.t);
    raf = requestAnimationFrame(loop);
  }

  function init(c) {
    canvas = c;
    canvas.width = W; canvas.height = H;
    ctx = canvas.getContext('2d');
    if (!bg) { bg = buildBg(); boy = buildBoy(); buf = new Uint32Array(W * H); img = new ImageData(new Uint8ClampedArray(buf.buffer), W, H); }
    frame(0);
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function setTarget(ax, ay) { state.tx = ax; state.ty = ay; }

  window.MenuArt = { W, H, init, start, stop, setTarget, renderOnce: () => frame(state.t) };
})();
