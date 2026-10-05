// Das Bett in der rechten Ecke (nach deinem Foto: weiße Matratze, dunkler
// Rahmen, gelb gestreifte Decke) und Lenz, wie er darin liegt.
(function () {
  const BX = 228;                 // linke Kante des Bettes in der Spielwelt
  const TOP = 146;                // Oberkante der Matratze
  const AREA = { x: BX, y: 116, w: 86, h: 56 };   // anklickbarer Bereich
  const STAND = { x: BX - 12, y: 165 };           // hier steht Lenz neben dem Bett

  const K = {
    frame: '#1b1b25', frameLight: '#2c2c3a',
    mattress: '#efeae0', mattressShade: '#cfc8b8',
    pillow: '#fbfaf5', pillowShade: '#ddd8cc',
    duvet: '#efdc9c', duvetStripe: '#e0c778', duvetLight: '#f8ecbc', duvetShade: '#c9b062',
    skin: '#e6c4a8', skinShade: '#c9a284', brow: '#8a6a50', beard: '#b09a7a',
    beanie: '#6b5a4a', beanieDark: '#4a3b30', beanieLight: '#7f6c5a',
    frameG: '#b5a583', white: '#f3f3f3', pupil: '#222226', mouth: '#7a5644',
  };

  function hit(x, y) {
    return x >= AREA.x && x <= AREA.x + AREA.w && y >= AREA.y && y <= AREA.y + AREA.h;
  }

  function rect(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  // Höhe der Decke über der Matratze an Position dx (0..86)
  function duvetHeight(dx, lying, t) {
    if (lying) {
      // zusammengerollt: Schultern, Hüfte, angezogene Beine
      const breath = Math.sin(t * 1.3) > 0 ? 1 : 0;
      if (dx < 22 || dx > 78) return 0;
      if (dx < 34) return 11 + breath;             // Schultern
      if (dx < 48) return 8 + breath;              // Taille
      if (dx < 60) return 11;                      // Hüfte
      if (dx < 72) return 9;                       // Knie
      return 6;                                    // Füße
    }
    // leeres Bett: zerknüllte Decke
    if (dx < 30 || dx > 78) return 0;
    return Math.round(6 + 3 * Math.sin(dx * 0.45) + 2 * Math.sin(dx * 0.13));
  }

  function drawFrame(ctx) {
    rect(ctx, BX, 120, 6, 50, K.frame);                 // Kopfteil
    rect(ctx, BX, 120, 6, 2, K.frameLight);
    rect(ctx, BX + 80, 140, 6, 30, K.frame);            // Fußteil
    rect(ctx, BX + 80, 140, 6, 2, K.frameLight);
    rect(ctx, BX + 6, 156, 74, 9, K.frame);             // Rahmen unter der Matratze
    rect(ctx, BX + 8, 165, 3, 5, K.frame);              // Füße
    rect(ctx, BX + 74, 165, 3, 5, K.frame);
    rect(ctx, BX + 6, TOP, 74, 10, K.mattress);         // Matratze
    rect(ctx, BX + 6, TOP + 8, 74, 2, K.mattressShade);
    rect(ctx, BX + 40, TOP + 4, 8, 3, K.mattressShade); // Tragegriff
  }

  function drawPillow(ctx) {
    rect(ctx, BX + 8, TOP - 8, 20, 8, K.pillow);
    rect(ctx, BX + 9, TOP - 9, 18, 1, K.pillow);
    rect(ctx, BX + 8, TOP - 2, 20, 2, K.pillowShade);
  }

  function drawDuvet(ctx, lying, t) {
    for (let dx = 0; dx < AREA.w; dx++) {
      const h = duvetHeight(dx, lying, t);
      if (h <= 0) continue;
      const stripe = Math.floor(dx / 3) % 2 === 0 ? K.duvet : K.duvetStripe;
      rect(ctx, BX + dx, TOP - h, 1, h, stripe);
      rect(ctx, BX + dx, TOP - h, 1, 1, K.duvetLight);        // Lichtkante oben
      rect(ctx, BX + dx, TOP - 2, 1, 2, K.duvetShade);        // Schatten unten
    }
  }

  // Kopf auf dem Kissen: müder Blick, Brauen innen hochgezogen, Mundwinkel unten
  function drawHead(ctx) {
    const hx = BX + 11, hy = TOP - 21;
    rect(ctx, hx, hy + 6, 14, 12, K.skin);                    // Gesicht
    rect(ctx, hx - 1, hy + 9, 1, 3, K.skinShade);             // Ohren
    rect(ctx, hx + 14, hy + 9, 1, 3, K.skinShade);
    // Beanie
    rect(ctx, hx + 1, hy, 12, 1, K.beanie);
    rect(ctx, hx, hy + 1, 14, 5, K.beanie);
    rect(ctx, hx + 1, hy + 1, 4, 2, K.beanieLight);
    for (let c = 1; c < 14; c += 2) rect(ctx, hx + c, hy + 4, 1, 2, K.beanieDark);
    // traurige Brauen
    rect(ctx, hx + 2, hy + 8, 2, 1, K.brow);
    rect(ctx, hx + 4, hy + 7, 2, 1, K.brow);
    rect(ctx, hx + 8, hy + 7, 2, 1, K.brow);
    rect(ctx, hx + 10, hy + 8, 2, 1, K.brow);
    // Brille und leerer Blick nach unten
    rect(ctx, hx, hy + 9, 14, 3, K.frameG);
    rect(ctx, hx + 1, hy + 10, 5, 1, K.skin);
    rect(ctx, hx + 8, hy + 10, 5, 1, K.skin);
    rect(ctx, hx + 3, hy + 10, 2, 1, K.pupil);
    rect(ctx, hx + 10, hy + 10, 2, 1, K.pupil);
    // Bart und Mund
    rect(ctx, hx, hy + 12, 2, 4, K.beard);
    rect(ctx, hx + 12, hy + 12, 2, 4, K.beard);
    rect(ctx, hx + 1, hy + 15, 12, 3, K.beard);
    rect(ctx, hx + 5, hy + 13, 4, 1, K.mouth);
    rect(ctx, hx + 4, hy + 14, 1, 1, K.mouth);                // hängende Mundwinkel
    rect(ctx, hx + 9, hy + 14, 1, 1, K.mouth);
  }

  function draw(ctx, lying, t) {
    drawFrame(ctx);
    drawPillow(ctx);
    if (lying) {
      drawHead(ctx);
      rect(ctx, BX + 24, TOP - 11, 4, 3, K.skin);             // Hand an der Decke
    }
    drawDuvet(ctx, lying, t);
  }

  window.Bed = { AREA, STAND, hit, draw, BASE_Y: 166 };
})();
