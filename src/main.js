// Startpunkt: baut Bild, Eingabe, Touch-Steuerung und Szenen zusammen und startet die Spielschleife.

import { Renderer } from './engine/renderer.js';
import { Input } from './engine/input.js';
import { setupTouch, createDebugMenu } from './engine/touch.js';
import { startLoop } from './engine/loop.js';
import { SceneManager } from './engine/scenes.js';
import * as save from './engine/save.js';
import { loadAssets } from './assets/loader.js';
import { SPRITES } from './assets/sprites.js';
import { TILES } from './assets/tiles.js';
import { TEXTS } from './texts.js';

import menu from './scenes/menu.js';
import spielplatz from './scenes/a_spielplatz.js';
import schulhof from './scenes/b_schulhof.js';
import zimmer from './scenes/c_zimmer.js';
import skatepark from './scenes/d_skatepark.js';
import ende from './scenes/ende.js';

// Fehler sichtbar machen (auf dem iPad gibt es keine Konsole)
function showError(msg) {
  let el = document.getElementById('error');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'error';
    document.body.appendChild(el);
  }
  el.textContent += msg + '\n';
}
addEventListener('error', (e) => showError('Fehler: ' + (e.message || e.error)));
addEventListener('unhandledrejection', (e) => showError('Fehler: ' + (e.reason && e.reason.message ? e.reason.message : e.reason)));

async function boot() {
  const root = document.getElementById('app');
  const renderer = new Renderer(document.getElementById('screen'), 320, 180);
  const input = new Input();
  input.attachKeyboard(window);

  const game = { renderer, input, texts: TEXTS, save };
  let touch = null;
  const scenes = new SceneManager(game, {
    onEnter: (scene) => touch && touch.setMode({ controls: scene.controls !== false, pause: scene.pauseable !== false }),
  });
  game.scenes = scenes;

  // Debug: Abschnitte direkt anspringen – Tasten 1–4 (5 = Ende, 0 = Levelauswahl)
  // oder auf dem iPad oben links in die Ecke tippen.
  const jump = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'ende', 0: 'menu' };
  const debug = createDebugMenu(root, [
    ...['A', 'B', 'C', 'D'].map((id) => ({ label: id + ' ' + TEXTS.ui.sections[id], run: () => scenes.go(id, { frames: 12 }) })),
    { label: TEXTS.ui.sections.ende, run: () => scenes.go('ende', { frames: 12 }) },
    { label: TEXTS.ui.toMenu, run: () => scenes.go('menu', { frames: 12 }) },
  ]);
  input.onDigit = (n) => { if (jump[n]) scenes.go(jump[n], { frames: 12 }); };

  touch = setupTouch(root, input, renderer, { onPause: () => scenes.pause(), onDebug: () => debug.toggle() });
  game.touch = touch;

  const rotate = document.getElementById('rotate');
  if (rotate) rotate.textContent = TEXTS.ui.rotate;

  await loadAssets([SPRITES, TILES]);

  scenes.register('menu', menu);
  scenes.register('A', spielplatz);
  scenes.register('B', schulhof);
  scenes.register('C', zimmer);
  scenes.register('D', skatepark);
  scenes.register('ende', ende);

  const loading = document.getElementById('boot');
  if (loading) loading.remove();
  scenes.go('menu');

  startLoop(
    () => { input.update(); scenes.update(); },
    () => scenes.render(renderer),
  );

  window.__lemo = game;            // für Tests
}

boot().catch((e) => showError('Start fehlgeschlagen: ' + (e && e.message ? e.message : e)));
