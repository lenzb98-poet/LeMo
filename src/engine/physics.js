// Einfache, verzeihende Physik. Alle Werte in Pixeln pro Update (60 Updates = 1 Sekunde).
//
// Der Boden eines Levels ist eine Linie aus Punkten ("ground"), von links nach rechts sortiert:
//   [{ x: 0, y: 148 }, { x: 200, y: 148 }, { x: 260, y: 120 }, …]
// Dazwischen wird gerade verbunden – so gehen auch Schrägen und Rampen.

export const GRAVITY = 0.2;
export const MAX_FALL = 5;

// Höhe des Bodens an Stelle x
export function groundY(ground, x) {
  if (x <= ground[0].x) return ground[0].y;
  for (let i = 1; i < ground.length; i++) {
    const a = ground[i - 1], b = ground[i];
    if (x <= b.x) {
      const t = (x - a.x) / (b.x - a.x || 1);
      return a.y + (b.y - a.y) * t;
    }
  }
  return ground[ground.length - 1].y;
}

// Steigung des Bodens an Stelle x (dy/dx)
export function groundSlope(ground, x) {
  for (let i = 1; i < ground.length; i++) {
    const a = ground[i - 1], b = ground[i];
    if (x <= b.x) return (b.y - a.y) / (b.x - a.x || 1);
  }
  return 0;
}

// Eine Figur, die läuft und springt. x/y = Mitte der Füße.
export class Walker {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.facing = 1;
    this.walked = 0;          // zurückgelegte Strecke am Boden (für die Gehanimation)
  }

  update(input, level, { accel = 0.16, maxSpeed = 1.25, friction = 0.2, jump = 3.6 } = {}) {
    const ax = input.axisX();
    if (ax) {
      this.vx += ax * accel;
      if (Math.abs(this.vx) > maxSpeed) this.vx = Math.sign(this.vx) * maxSpeed;
      this.facing = ax;
    } else {
      const f = Math.min(Math.abs(this.vx), friction);
      this.vx -= Math.sign(this.vx) * f;
    }

    if (this.onGround && input.pressed('a')) {
      this.vy = -jump;
      this.onGround = false;
    }
    // Kurz antippen = kleiner Sprung, halten = hoher Sprung
    if (!this.onGround && this.vy < -1.2 && !input.down('a')) this.vy = -1.2;

    this.vy = Math.min(this.vy + GRAVITY, MAX_FALL);
    this.x += this.vx;
    if (this.x < level.minX) { this.x = level.minX; this.vx = 0; }
    if (this.x > level.maxX) { this.x = level.maxX; this.vx = 0; }
    this.y += this.vy;

    const gy = groundY(level.ground, this.x);
    if (this.y >= gy) {
      this.y = gy;
      this.vy = 0;
      this.onGround = true;
    } else if (this.onGround && this.vy >= 0 && gy - this.y < 4) {
      this.y = gy;                         // bergab am Boden kleben bleiben
    } else {
      this.onGround = false;
    }
    if (this.onGround) this.walked += Math.abs(this.vx);
  }
}
