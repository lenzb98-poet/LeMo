// Einheitliche Eingabe für Tastatur und Touch.
// Aktionen: left, right, up, down, a (Springen/Ollie), b (Aktion), pause.
//   down(x)     – wird gerade gehalten
//   pressed(x)  – wurde seit dem letzten Update gedrückt (auch ganz kurzes Antippen geht nicht verloren)
//   released(x) – wurde seit dem letzten Update losgelassen

export const ACTIONS = ['left', 'right', 'up', 'down', 'a', 'b', 'pause'];

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'a', Enter: 'a',
  KeyE: 'b',
  Escape: 'pause', KeyP: 'pause',
};

export class Input {
  constructor() {
    this.sources = {};
    this.latchP = {};
    this.latchR = {};
    this.p = {};
    this.r = {};
    for (const a of ACTIONS) {
      this.sources[a] = new Set();
      this.latchP[a] = this.latchR[a] = this.p[a] = this.r[a] = false;
    }
    this.taps = [];
    this.pendingTaps = [];
    this.onDigit = null;                 // Debug: Zifferntasten
  }

  attachKeyboard(target) {
    target.addEventListener('keydown', (e) => {
      if (/^Digit[0-9]$/.test(e.code) && this.onDigit && !e.repeat) this.onDigit(Number(e.code.slice(5)));
      const a = KEYMAP[e.code];
      if (!a) return;
      e.preventDefault();
      if (!e.repeat) this.set(a, 'key:' + e.code, true);
    });
    target.addEventListener('keyup', (e) => {
      const a = KEYMAP[e.code];
      if (!a) return;
      e.preventDefault();
      this.set(a, 'key:' + e.code, false);
    });
    target.addEventListener('blur', () => this.releaseAll());
  }

  // Eine Quelle (Taste, Touch-Knopf) drückt oder löst eine Aktion
  set(action, source, isDown) {
    const s = this.sources[action];
    if (!s) return;
    const was = s.size > 0;
    if (isDown) s.add(source); else s.delete(source);
    const now = s.size > 0;
    if (now && !was) this.latchP[action] = true;
    if (!now && was) this.latchR[action] = true;
  }

  releaseAll() {
    for (const a of ACTIONS) for (const src of [...this.sources[a]]) this.set(a, src, false);
  }

  // Antippen auf dem Spielbild (Spielkoordinaten), z. B. für Menüs
  addTap(x, y) {
    this.pendingTaps.push({ x, y });
  }

  // Zu Beginn jedes festen Updates aufrufen
  update() {
    for (const a of ACTIONS) {
      this.p[a] = this.latchP[a];
      this.r[a] = this.latchR[a];
      this.latchP[a] = this.latchR[a] = false;
    }
    this.taps = this.pendingTaps;
    this.pendingTaps = [];
  }

  down(a) { return this.sources[a].size > 0; }
  pressed(a) { return this.p[a]; }
  released(a) { return this.r[a]; }
  axisX() { return (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0); }
  axisY() { return (this.down('down') ? 1 : 0) - (this.down('up') ? 1 : 0); }
}
