(function () {
  const W = 320, H = 180;            // Spielwelt in Pixeln, wird hochskaliert
  const SPEED = 70;                  // Pixel pro Sekunde
  const PX_PER_FRAME = 4;            // Distanz pro Animationsframe (kein Rutschen)
  const FEET = 62;                   // y-Position der Füße im 64px-Sprite
  const HALF = Sprite.SIZE / 2;

  const canvas = document.getElementById('game');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // ganzzahlig skalieren, damit die Pixel scharf bleiben
  function fit() {
    const k = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
    canvas.style.width = W * k + 'px';
    canvas.style.height = H * k + 'px';
  }
  addEventListener('resize', fit);
  fit();

  const sprites = Sprite.buildSprites();

  const player = {
    x: W / 2, y: H - 30,             // Position der Füße
    tx: null, ty: null,              // Ziel
    dir: 'down',
    walked: 0,
  };
  let marker = null;                 // { x, y, t }

  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    // Kopf soll im Bild bleiben, Figur nicht aus dem Fenster laufen
    player.tx = Math.min(W - HALF / 2, Math.max(HALF / 2, x));
    player.ty = Math.min(H - 2, Math.max(FEET + 1, y));
    marker = { x: player.tx, y: player.ty, t: 0 };

    const dx = player.tx - player.x;
    const dy = player.ty - player.y;
    if (Math.abs(dx) >= Math.abs(dy)) player.dir = dx < 0 ? 'left' : 'right';
    else player.dir = dy < 0 ? 'up' : 'down';
  });

  function update(dt) {
    if (marker) marker.t += dt;
    if (player.tx === null) return;
    const dx = player.tx - player.x;
    const dy = player.ty - player.y;
    const dist = Math.hypot(dx, dy);
    const step = SPEED * dt;
    if (dist <= step) {
      player.x = player.tx;
      player.y = player.ty;
      player.tx = player.ty = null;
      player.walked = 0;
      return;
    }
    player.x += (dx / dist) * step;
    player.y += (dy / dist) * step;
    player.walked += step;
  }

  function drawMarker() {
    if (!marker) return;
    const pulse = Math.floor(marker.t * 6) % 2;
    const r = 3 + pulse;
    const x = Math.round(marker.x), y = Math.round(marker.y);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - r, y, 2, 1);
    ctx.fillRect(x + r - 1, y, 2, 1);
    ctx.fillRect(x, y - Math.ceil(r / 2), 1, 2);
    ctx.fillRect(x, y + Math.ceil(r / 2) - 1, 1, 2);
  }

  function drawShadow(x, y) {
    ctx.fillStyle = 'rgba(8, 16, 70, 0.35)';
    ctx.fillRect(x - 11, y - 1, 22, 3);
    ctx.fillRect(x - 8, y - 2, 16, 5);
  }

  function draw() {
    ctx.fillStyle = '#2f6bdc';
    ctx.fillRect(0, 0, W, H);
    drawMarker();

    const x = Math.round(player.x), y = Math.round(player.y);
    drawShadow(x, y);
    const set = sprites[player.dir];
    const moving = player.tx !== null;
    const img = moving
      ? set.walk[Math.floor(player.walked / PX_PER_FRAME) % Sprite.WALK_FRAMES]
      : set.idle;
    ctx.drawImage(img, x - HALF, y - FEET);
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Für Tests / Debugging
  window.__game = { player, sprites };
})();
