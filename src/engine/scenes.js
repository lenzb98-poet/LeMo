// Szenen-Verwaltung: Wechsel mit Abblenden (schwarz oder weiß), kurze Textzeile am Abschnittsanfang,
// Pause-Menü. Eine Szene ist ein Objekt mit enter(), update(), render(r), exit() und den Schaltern
//   controls: true/false  – Touch-Steuerung anzeigen
//   pauseable: true/false – Pause-Knopf anzeigen

const step = (v, n) => Math.round(v * n) / n;   // Alphawerte in Stufen (wirkt pixeliger)

export class SceneManager {
  constructor(game, { onEnter } = {}) {
    this.game = game;
    this.factories = {};
    this.current = null;
    this.currentId = null;
    this.fade = null;
    this.cap = null;
    this.paused = null;
    this.onEnter = onEnter;
  }

  register(id, factory) {
    this.factories[id] = factory;
  }

  // Zu einer Szene wechseln: ausblenden → wechseln → einblenden
  go(id, { color = '#000', frames = 24, params = {} } = {}) {
    if (!this.factories[id]) throw new Error('Unbekannte Szene: ' + id);
    if (this.fade && this.fade.phase === 'out') return;
    this.paused = null;
    if (!this.current) {
      this.switchTo(id, params);
      this.fade = { phase: 'in', t: 0, frames, color };
      return;
    }
    this.fade = { phase: 'out', t: 0, frames, color, next: { id, params } };
  }

  switchTo(id, params) {
    if (this.current && this.current.exit) this.current.exit();
    this.cap = null;
    this.current = this.factories[id](this.game, params);
    this.currentId = id;
    if (this.current.enter) this.current.enter();
    if (this.onEnter) this.onEnter(this.current, id);
  }

  // Kurze Textzeile einblenden (oben, mittig). Leerer Text = nichts anzeigen.
  caption(text, { hold = 210, y = 18 } = {}) {
    if (!text) return;
    this.cap = { text, t: 0, hold, y, fin: 30, fout: 45 };
  }

  pause() {
    if (!this.current || this.current.pauseable === false || this.paused || this.fade) return;
    this.paused = { sel: 0 };
  }

  resume() {
    this.paused = null;
  }

  update() {
    const input = this.game.input;
    if (this.paused) { this.updatePause(input); return; }
    if (input.pressed('pause')) { this.pause(); if (this.paused) return; }

    if (this.fade) {
      this.fade.t++;
      if (this.fade.phase === 'out' && this.fade.t >= this.fade.frames) {
        const { id, params } = this.fade.next;
        this.switchTo(id, params);
        this.fade = { phase: 'in', t: 0, frames: this.fade.frames, color: this.fade.color };
      } else if (this.fade.phase === 'in' && this.fade.t >= this.fade.frames) {
        this.fade = null;
      }
    }
    if (this.current && (!this.fade || this.fade.phase === 'in')) this.current.update();
    if (this.cap) {
      this.cap.t++;
      if (this.cap.t > this.cap.fin + this.cap.hold + this.cap.fout) this.cap = null;
    }
  }

  render(r) {
    if (this.current) this.current.render(r);

    if (this.cap) {
      const c = this.cap;
      let a = 1;
      if (c.t < c.fin) a = c.t / c.fin;
      else if (c.t > c.fin + c.hold) a = 1 - (c.t - c.fin - c.hold) / c.fout;
      a = step(Math.max(0, a), 4);
      if (a > 0) {
        const lines = r.wrap(c.text, 280);
        lines.forEach((line, i) => r.text(line, r.w / 2, c.y + i * 10, { align: 'center', color: '#fff8ec', shadow: '#000000', alpha: a }));
      }
    }

    if (this.fade) {
      const f = this.fade;
      const p = f.t / f.frames;
      const a = step(f.phase === 'out' ? p : 1 - p, 8);
      if (a > 0) {
        r.ctx.globalAlpha = a;
        r.rect(0, 0, r.w, r.h, f.color);
        r.ctx.globalAlpha = 1;
      }
    }

    if (this.paused) this.renderPause(r);
  }

  // ---------- Pause-Menü ----------
  pauseItems() {
    const t = this.game.texts.ui;
    return [
      { label: t.resume, run: () => this.resume() },
      { label: t.toMenu, run: () => { this.resume(); this.go('menu'); } },
    ];
  }

  pauseLayout(r) {
    const items = this.pauseItems();
    return items.map((it, i) => ({ ...it, x: r.w / 2 - 60, y: 78 + i * 20, w: 120, h: 16 }));
  }

  updatePause(input) {
    const r = this.game.renderer;
    const items = this.pauseLayout(r);
    if (input.pressed('up')) this.paused.sel = (this.paused.sel + items.length - 1) % items.length;
    if (input.pressed('down')) this.paused.sel = (this.paused.sel + 1) % items.length;
    if (input.pressed('pause') || input.pressed('b')) { this.resume(); return; }
    for (const t of input.taps) {
      const hit = items.findIndex((it) => t.x >= it.x && t.x <= it.x + it.w && t.y >= it.y && t.y <= it.y + it.h);
      if (hit >= 0) { items[hit].run(); return; }
    }
    if (input.pressed('a')) items[this.paused.sel].run();
  }

  renderPause(r) {
    r.ctx.globalAlpha = 0.65;
    r.rect(0, 0, r.w, r.h, '#05060c');
    r.ctx.globalAlpha = 1;
    r.text(this.game.texts.ui.pause, r.w / 2, 52, { align: 'center', color: '#ffd27a', shadow: '#000', scale: 2 });
    this.pauseLayout(r).forEach((it, i) => {
      const sel = i === this.paused.sel;
      r.rect(it.x, it.y, it.w, it.h, sel ? '#2a2236' : '#14121c');
      r.rect(it.x, it.y, it.w, 1, sel ? '#ffd27a' : '#3a3448');
      r.rect(it.x, it.y + it.h - 1, it.w, 1, sel ? '#ffd27a' : '#3a3448');
      r.text(it.label, r.w / 2, it.y + 4, { align: 'center', color: sel ? '#fff3c4' : '#a8a2b8' });
    });
  }
}
