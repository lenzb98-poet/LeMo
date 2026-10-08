// Lädt alle Grafiken. Code-Sprites (Textzeilen) werden beim ersten Gebrauch einmal pro Palette auf eine
// unsichtbare Canvas gezeichnet und zwischengespeichert. Liegt in assets/png/ eine PNG mit gleichem Namen,
// wird stattdessen die PNG benutzt (waagerechter Streifen, alle Einzelbilder gleich groß).

import { PALETTES } from './palettes.js';

const defs = {};           // Name → { w, h, frames, palette? }
const pngs = {};           // Name → Image (eigene Grafik aus assets/png/)
const cache = new Map();   // "Name|Palette" → { img, w, h, count }
const palettes = { ...PALETTES };

// Eigene Paletten anmelden (z. B. Zwischenstufen beim Überblenden)
export function registerPalette(id, colors) {
  if (palettes[id] === colors) return;
  palettes[id] = colors;
  for (const key of cache.keys()) if (key.endsWith('|' + id)) cache.delete(key);
}

export function palette(id) {
  return palettes[id];
}

function probePng(name, dir) {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      if (ok) pngs[name] = img;
      resolve();
    };
    img.onload = () => finish(img.naturalWidth > 0);
    img.onerror = () => finish(false);
    setTimeout(() => finish(false), 5000);
    img.src = dir + name + '.png';
  });
}

// Alle Definitionen anmelden und nach PNG-Ersatz suchen
export async function loadAssets(groups, { pngDir = 'assets/png/' } = {}) {
  for (const g of groups) Object.assign(defs, g);
  await Promise.all(Object.keys(defs).map((name) => probePng(name, pngDir)));
  return { custom: Object.keys(pngs) };
}

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildStrip(def, colors) {
  const { w, h, frames } = def;
  const c = document.createElement('canvas');
  c.width = w * frames.length;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(c.width, h);
  const lut = {};
  const indexed = Array.isArray(colors);         // Hex-Palette (0–f) oder eigene Zeichen (Porträt)
  if (indexed) colors.forEach((col, i) => (lut[i.toString(16)] = hexToRgb(col)));
  else for (const k in colors) lut[k] = hexToRgb(colors[k]);
  frames.forEach((rows, f) => {
    for (let y = 0; y < h; y++) {
      const row = rows[y] || '';
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        if (!ch || ch === '.') continue;
        const rgb = indexed ? lut[ch.toLowerCase()] : lut[ch];
        if (!rgb) continue;
        const i = (y * c.width + f * w + x) * 4;
        img.data[i] = rgb[0];
        img.data[i + 1] = rgb[1];
        img.data[i + 2] = rgb[2];
        img.data[i + 3] = 255;
      }
    }
  });
  ctx.putImageData(img, 0, 0);
  return c;
}

// Liefert die fertige Grafik: { img, w, h, count }. paletteId z. B. 'D'.
export function sprite(name, paletteId) {
  const def = defs[name];
  if (pngs[name]) {
    const key = name + '|png';
    if (!cache.has(key)) {
      const img = pngs[name];
      const h = img.naturalHeight;
      const w = def ? def.w : h;
      cache.set(key, { img, w, h, count: Math.max(1, Math.floor(img.naturalWidth / w)) });
    }
    return cache.get(key);
  }
  if (!def) return null;
  const pid = def.palette ? 'own' : paletteId;
  const key = name + '|' + pid;
  let s = cache.get(key);
  if (!s) {
    const colors = def.palette || palettes[paletteId];
    if (!colors) throw new Error('Unbekannte Palette: ' + paletteId);
    s = { img: buildStrip(def, colors), w: def.w, h: def.h, count: def.frames.length };
    cache.set(key, s);
  }
  return s;
}
