// Kamera: folgt einer Figur weich, bleibt innerhalb der Levelgrenzen und rastet auf ganze Pixel ein.

export class Camera {
  constructor(w = 320, h = 180) {
    this.w = w;
    this.h = h;
    this.x = 0;
    this.y = 0;
    this.bounds = { x: 0, y: 0, w, h };
  }

  setBounds(x, y, w, h) {
    this.bounds = { x, y, w, h };
    this.clamp();
  }

  // Sofort auf ein Ziel springen (z. B. beim Szenenstart)
  snap(tx, ty) {
    this.x = tx - this.w / 2;
    this.y = ty - this.h / 2;
    this.clamp();
  }

  // Weich folgen. lookAhead schiebt das Bild in Laufrichtung, damit man sieht, wohin es geht.
  follow(tx, ty, { lerp = 0.1, lookAhead = 0, offsetY = 0 } = {}) {
    const goalX = tx + lookAhead - this.w / 2;
    const goalY = ty + offsetY - this.h / 2;
    this.x += (goalX - this.x) * lerp;
    this.y += (goalY - this.y) * lerp;
    this.clamp();
  }

  clamp() {
    const b = this.bounds;
    this.x = Math.max(b.x, Math.min(b.x + b.w - this.w, this.x));
    this.y = Math.max(b.y, Math.min(b.y + b.h - this.h, this.y));
  }

  get ix() { return Math.round(this.x); }
  get iy() { return Math.round(this.y); }
}
