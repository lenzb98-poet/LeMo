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
    mode: 'free',                    // free | settling | lying | rising
    timer: 0,
    onArrive: null,
    queued: null,                    // Klick, der nach dem Aufstehen ausgeführt wird
  };
  let mood = 0;                      // 0 = normal, 1 = ganz dunkel
  let clock = 0;
  const caption = document.getElementById('caption');
  const say = (t) => { if (caption) caption.textContent = t; };
  let marker = null;                 // { x, y, t }

  function walkTo(x, y, showMarker) {
    player.tx = Math.min(W - HALF / 2, Math.max(HALF / 2, x));
    player.ty = Math.min(H - 2, Math.max(FEET + 1, y));
    marker = showMarker ? { x: player.tx, y: player.ty, t: 0 } : null;

    const dx = player.tx - player.x;
    const dy = player.ty - player.y;
    if (Math.abs(dx) >= Math.abs(dy)) player.dir = dx < 0 ? 'left' : 'right';
    else player.dir = dy < 0 ? 'up' : 'down';
  }

  function handleClick(x, y) {
    if (Bed.hit(x, y)) {
      player.onArrive = settle;
      walkTo(Bed.STAND.x, Bed.STAND.y, false);
    } else {
      player.onArrive = null;
      walkTo(x, y, true);
    }
  }

  function settle() {
    player.dir = 'right';
    player.mode = 'settling';
    player.timer = 0.6;
  }

  function rise(queued) {
    player.mode = 'rising';
    player.timer = 0.7;
    player.queued = queued;
    say('');
  }

  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    if (player.mode === 'lying') rise({ x, y });
    else if (player.mode === 'free') handleClick(x, y);
  });

  function update(dt) {
    clock += dt;
    if (marker) marker.t += dt;
    mood += ((player.mode === 'lying' ? 0.55 : 0) - mood) * Math.min(1, dt * 1.6);

    if (player.timer > 0) {
      player.timer -= dt;
      if (player.timer <= 0) {
        if (player.mode === 'settling') {
          player.mode = 'lying';
          say('Alles ist zu schwer … (Klick = aufstehen)');
        } else if (player.mode === 'rising') {
          player.mode = 'free';
          const q = player.queued;
          player.queued = null;
          if (q) handleClick(q.x, q.y);
        }
      }
    }
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
      const cb = player.onArrive;
      player.onArrive = null;
      if (cb) cb();
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

  function drawThoughts() {
    // graue Gedankenpunkte steigen über Lenz auf
    const base = clock * 0.6;
    for (let i = 0; i < 3; i++) {
      const k = (base + i * 0.33) % 1;
      const r = 1 + i;
      ctx.fillStyle = 'rgba(200, 208, 240, ' + (0.7 * (1 - k)).toFixed(2) + ')';
      const x = Math.round(Bed.AREA.x + 22 + i * 7 + k * 4);
      const y = Math.round(Bed.AREA.y + 4 - k * 16 - i * 3);
      ctx.fillRect(x, y, r + 1, r + 1);
    }
  }

  function draw() {
    ctx.fillStyle = '#2f6bdc';
    ctx.fillRect(0, 0, W, H);
    drawMarker();

    const lying = player.mode === 'lying' || (player.mode === 'rising' && player.timer > 0.35);
    const hidden = player.mode === 'lying' || (player.mode === 'rising' && player.timer > 0.35);
    const x = Math.round(player.x), y = Math.round(player.y);
    const behindBed = y < Bed.BASE_Y;

    const drawPlayer = () => {
      if (hidden) return;
      drawShadow(x, y);
      const set = sprites[player.dir];
      const moving = player.tx !== null;
      const img = moving
        ? set.walk[Math.floor(player.walked / PX_PER_FRAME) % Sprite.WALK_FRAMES]
        : set.idle;
      ctx.drawImage(img, x - HALF, y - FEET);
    };

    if (behindBed) drawPlayer();
    Bed.draw(ctx, lying, clock);
    if (!behindBed) drawPlayer();

    if (mood > 0.01) {
      ctx.fillStyle = 'rgba(24, 28, 64, ' + mood.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (player.mode === 'lying') drawThoughts();
  }

  let running = false;
  let last = 0;
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    player.tx = player.ty = null;
    player.mode = 'free';
    player.timer = 0;
    mood = 0;
    say('');
    marker = null;
    fit();
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
  }

  // Für Homescreen, Tests und Debugging
  window.Game = { start, stop, player, sprites };
})();
