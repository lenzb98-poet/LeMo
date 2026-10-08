// Zeichnet ins 320×180-Spielbild und skaliert es nur in ganzen Faktoren hoch (gestochen scharfe Pixel).
// Gerechnet wird in echten Geräte-Pixeln – auf dem iPad (Retina) passt so ein größerer ganzer Faktor.

import { GLYPHS, FONT_HEIGHT, LINE_HEIGHT, SPACE_WIDTH } from '../assets/font.js';
import { sprite as getSprite } from '../assets/loader.js';

export class Renderer {
  constructor(canvas, width = 320, height = 180) {
    this.canvas = canvas;
    this.w = width;
    this.h = height;
    canvas.width = width;
    canvas.height = height;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.fontAtlas = new Map();
    this.resize = this.resize.bind(this);
    addEventListener('resize', this.resize);
    addEventListener('orientationchange', () => setTimeout(this.resize, 250));
    if (window.visualViewport) window.visualViewport.addEventListener('resize', this.resize);
    this.resize();
  }

  // Größten ganzen Faktor wählen, der ins Fenster passt, und das Bild mittig auf Geräte-Pixel setzen
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const k = Math.max(1, Math.floor(Math.min((vw * dpr) / this.w, (vh * dpr) / this.h)));
    const cssW = (this.w * k) / dpr;
    const cssH = (this.h * k) / dpr;
    const left = Math.floor((vw * dpr - this.w * k) / 2) / dpr;
    const top = Math.floor((vh * dpr - this.h * k) / 2) / dpr;
    const s = this.canvas.style;
    s.width = cssW + 'px';
    s.height = cssH + 'px';
    s.left = left + 'px';
    s.top = top + 'px';
    this.factor = k;
  }

  // Bildschirm-Koordinaten (Finger, Maus) → Spielkoordinaten
  toGame(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * this.w, y: ((clientY - r.top) / r.height) * this.h };
  }

  // ---------- Grundformen ----------
  clear(color = '#000') {
    this.rect(0, 0, this.w, this.h, color);
  }

  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Welt-Koordinaten: alles zwischen push und pop wird um die Kamera verschoben
  push(camX, camY) {
    this.ctx.save();
    this.ctx.translate(-Math.round(camX), -Math.round(camY));
  }

  pop() {
    this.ctx.restore();
  }

  // ---------- Sprites ----------
  // name aus SPRITES/TILES, frame = Einzelbild, palette = Abschnitts-Palette ('A'…'D')
  sprite(name, frame, x, y, { palette = 'D', flip = false, scale = 1, alpha = 1 } = {}) {
    const s = getSprite(name, palette);
    if (!s) return;
    const f = ((frame % s.count) + s.count) % s.count;
    const ctx = this.ctx;
    const dx = Math.round(x), dy = Math.round(y);
    const w = s.w * scale, h = s.h * scale;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    if (flip) {
      ctx.save();
      ctx.translate(dx + w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(s.img, f * s.w, 0, s.w, s.h, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(s.img, f * s.w, 0, s.w, s.h, dx, dy, w, h);
    }
    if (alpha !== 1) ctx.globalAlpha = 1;
  }

  // ---------- Pixel-Text ----------
  atlas(color) {
    let a = this.fontAtlas.get(color);
    if (a) return a;
    const map = {};
    let x = 0;
    for (const ch in GLYPHS) {
      const rows = GLYPHS[ch];
      const w = Math.max(...rows.map((r) => r.length));
      map[ch] = { x, w };
      x += w + 1;
    }
    const c = document.createElement('canvas');
    c.width = x;
    c.height = FONT_HEIGHT;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    for (const ch in GLYPHS) {
      GLYPHS[ch].forEach((row, y) => {
        for (let i = 0; i < row.length; i++) if (row[i] === '#') ctx.fillRect(map[ch].x + i, y, 1, 1);
      });
    }
    a = { canvas: c, map };
    this.fontAtlas.set(color, a);
    return a;
  }

  charWidth(ch) {
    if (ch === ' ') return SPACE_WIDTH;
    const g = GLYPHS[ch] || GLYPHS['?'];
    return Math.max(...g.map((r) => r.length));
  }

  textWidth(str, scale = 1) {
    let w = 0;
    for (const line of String(str).split('\n')) {
      let lw = 0;
      for (const ch of line) lw += this.charWidth(ch) + 1;
      w = Math.max(w, lw - 1);
    }
    return Math.max(0, w) * scale;
  }

  // Zeilenumbruch nach Wörtern, damit ein Text in maxWidth passt
  wrap(str, maxWidth, scale = 1) {
    const out = [];
    for (const para of String(str).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const test = line ? line + ' ' + word : word;
        if (line && this.textWidth(test, scale) > maxWidth) { out.push(line); line = word; }
        else line = test;
      }
      out.push(line);
    }
    return out;
  }

  // align: 'left' | 'center' | 'right'; shadow: Farbe oder null
  text(str, x, y, { color = '#fff', align = 'left', shadow = null, scale = 1, alpha = 1 } = {}) {
    const lines = String(str).split('\n');
    const ctx = this.ctx;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    lines.forEach((line, li) => {
      const w = this.textWidth(line, scale);
      let cx = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
      const cy = Math.round(y + li * LINE_HEIGHT * scale);
      if (shadow) this.drawLine(line, cx + scale, cy + scale, shadow, scale);
      this.drawLine(line, cx, cy, color, scale);
    });
    if (alpha !== 1) ctx.globalAlpha = 1;
  }

  drawLine(line, x, y, color, scale) {
    const a = this.atlas(color);
    const ctx = this.ctx;
    for (const ch of line) {
      if (ch === ' ') { x += (SPACE_WIDTH + 1) * scale; continue; }
      const g = a.map[ch] || a.map['?'];
      ctx.drawImage(a.canvas, g.x, 0, g.w, FONT_HEIGHT, x, y, g.w * scale, FONT_HEIGHT * scale);
      x += (g.w + 1) * scale;
    }
  }
}

export { LINE_HEIGHT };
