(function () {
  const W = World.VW, H = World.VH;   // Bildschirm in Pixeln, wird hochskaliert
  const SPEED = 90;                  // Pixel pro Sekunde
  const PX_PER_FRAME = 4;            // Distanz pro Animationsframe (kein Rutschen)
  const FEET = 62;                   // y-Position der Füße im 64px-Sprite
  const HALF = Sprite.SIZE / 2;
  const MIN_X = Bed.STAND.x;         // am Bett ist Schluss
  const MAX_X = World.W - 24;

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
  World.build();

  const player = {
    x: MAX_X - 56,                   // Start: rechts im Zimmer
    dir: 'left',
    tx: null,                        // Ziel (nur noch links/rechts)
    walked: 0,
    mode: 'free',                    // free | settling | lying | rising
    timer: 0,
    onArrive: null,
    queued: null,                    // Klick, der nach dem Aufstehen ausgeführt wird
  };
  let camX = 0;
  let mood = 0;                      // 0 = normal, 1 = ganz dunkel
  let clock = 0;
  let marker = null;                 // { x, t }
  const keys = { left: false, right: false };
  const caption = document.getElementById('caption');
  const say = (t) => { if (caption) caption.textContent = t; };

  const camTarget = () => Math.min(World.W - W, Math.max(0, player.x - W / 2));

  function walkTo(x, showMarker) {
    player.tx = Math.min(MAX_X, Math.max(MIN_X, x));
    marker = showMarker ? { x: player.tx, t: 0 } : null;
    player.dir = player.tx < player.x ? 'left' : 'right';
  }

  function handleClick(x, y) {
    if (Bed.hit(x, y)) {
      player.onArrive = settle;
      walkTo(Bed.STAND.x, false);
    } else {
      player.onArrive = null;
      walkTo(x, true);
    }
  }

  function settle() {
    player.dir = 'left';
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
    const x = ((e.clientX - r.left) / r.width) * W + Math.round(camX);   // Weltkoordinate
    const y = ((e.clientY - r.top) / r.height) * H;
    if (player.mode === 'lying') rise({ x, y });
    else if (player.mode === 'free') handleClick(x, y);
  });

  // Tastatur: Pfeile oder A/D
  const keyDir = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  addEventListener('keydown', (e) => {
    const k = keyDir[e.key];
    if (!k) return;
    keys[k] = true;
    if (player.mode === 'lying') rise(null);
    e.preventDefault();
  });
  addEventListener('keyup', (e) => {
    const k = keyDir[e.key];
    if (!k) return;
    keys[k] = false;
    if (!keys.left && !keys.right && player.keyWalking) {
      player.keyWalking = false;
      player.tx = null;
      player.walked = 0;
    }
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

    // Tastatursteuerung
    if (player.mode === 'free' && (keys.left !== keys.right)) {
      player.keyWalking = true;
      player.onArrive = null;
      marker = null;
      walkTo(player.x + (keys.left ? -40 : 40), false);
    }

    if (player.tx !== null) {
      const dx = player.tx - player.x;
      const step = SPEED * dt;
      if (Math.abs(dx) <= step) {
        player.x = player.tx;
        player.tx = null;
        player.walked = 0;
        const cb = player.onArrive;
        player.onArrive = null;
        if (cb) cb();
      } else {
        player.x += Math.sign(dx) * step;
        player.walked += step;
      }
    }

    camX += (camTarget() - camX) * Math.min(1, dt * 5);
  }

  function drawMarker() {
    if (!marker) return;
    const pulse = Math.floor(marker.t * 6) % 2;
    const r = 3 + pulse;
    const x = Math.round(marker.x), y = World.GROUND + 4;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - r, y, 2, 1);
    ctx.fillRect(x + r - 1, y, 2, 1);
    ctx.fillRect(x, y - 2, 1, 2);
    ctx.fillRect(x, y + 1, 1, 2);
  }

  function drawShadow(x, y) {
    ctx.fillStyle = 'rgba(50, 25, 10, 0.38)';
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
    const cam = Math.round(camX);
    World.drawBack(ctx, cam);

    // Weltkoordinaten: alles zwischen save/restore wird mit der Kamera verschoben
    ctx.save();
    ctx.translate(-cam, 0);
    drawMarker();

    const hidden = player.mode === 'lying' || (player.mode === 'rising' && player.timer > 0.35);
    Bed.draw(ctx, hidden, clock);

    if (!hidden) {
      const x = Math.round(player.x), y = World.GROUND;
      drawShadow(x, y);
      const set = sprites[player.dir];
      const moving = player.tx !== null;
      const img = moving
        ? set.walk[Math.floor(player.walked / PX_PER_FRAME) % Sprite.WALK_FRAMES]
        : set.idle;
      ctx.drawImage(img, x - HALF, y - FEET);
    }
    World.drawLight(ctx, clock);
    ctx.restore();

    World.drawFront(ctx, cam);

    if (mood > 0.01) {
      ctx.fillStyle = 'rgba(24, 28, 64, ' + mood.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (player.mode === 'lying') {
      ctx.save();
      ctx.translate(-cam, 0);
      drawThoughts();
      ctx.restore();
    }
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
    player.tx = null;
    player.mode = 'free';
    player.timer = 0;
    mood = 0;
    say('');
    marker = null;
    camX = camTarget();
    fit();
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
  }

  // Für Homescreen, Tests und Debugging
  window.Game = { start, stop, player, sprites, get camX() { return camX; } };
})();
