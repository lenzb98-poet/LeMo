(function () {
  // Kapitel (Staffeln des Lebens) – hier Namen/Beschreibungen anpassen.
  // playable: true schaltet eine Staffel frei, sobald sie gebaut ist.
  const SEASONS = [
    { title: 'Kindheit',   desc: 'Die ersten Erinnerungen.',       playable: false, color: '#d9812f' },
    { title: 'Jugend',     desc: 'Schulzeit und erste Freiheit.',  playable: false, color: '#3f82cc' },
    { title: 'Ausbildung', desc: 'Neue Wege, neue Menschen.',      playable: false, color: '#4f9440' },
    { title: 'Erwachsen',  desc: 'Auf eigenen Beinen.',            playable: false, color: '#b8433f' },
    { title: 'Heute',      desc: 'Wo ich jetzt stehe.',            playable: false, color: '#c9a63e' },
  ];
  const DEMO = { title: 'Dein Zimmer', desc: 'Lauf durchs Zimmer und finde Erinnerungen.', playable: true, color: '#2a928b', band: 'DEMO' };

  // Kartenhaus: Position (x, y in cqw im Turm) und Neigung
  const SPOTS = [
    { x: 4.2, y: 24.5, r: -2.5 }, { x: 15.6, y: 24.5, r: 1.5 }, { x: 27.0, y: 24.5, r: -1.2 },
    { x: 9.9, y: 12.2, r: 2 }, { x: 21.3, y: 12.2, r: -2 },
    { x: 15.6, y: 0, r: 1 },
  ];

  const home = document.getElementById('home');
  const stage = document.getElementById('stage');
  const menu = document.getElementById('menuStage');
  const tower = document.getElementById('tower');
  const hint = document.getElementById('hint');
  let hintTimer;

  function say(msg) {
    hint.textContent = msg;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => (hint.textContent = ''), 2500);
  }

  // Blickziel für die Augen (in Bild-Pixeln der Grafik)
  const DEFAULT_GAZE = [300, 105];
  function gazeAt(clientX, clientY) {
    const r = menu.getBoundingClientRect();
    MenuArt.setTarget(((clientX - r.left) / r.width) * MenuArt.W, ((clientY - r.top) / r.height) * MenuArt.H);
  }

  function makeCard(item, band, spot) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card ' + (item.playable ? 'playable' : 'locked');
    b.style.cssText = 'left:' + spot.x + 'cqw;top:' + spot.y + 'cqw;--r:' + spot.r + 'deg;--c:' + item.color;
    b.innerHTML = '<span class="band"></span><span class="title"></span><span class="desc"></span><span class="tag"></span>';
    b.querySelector('.band').textContent = band;
    b.querySelector('.title').textContent = item.title;
    b.querySelector('.desc').textContent = item.desc;
    b.querySelector('.tag').textContent = item.playable ? 'SPIELEN' : 'BALD';
    b.addEventListener('focus', () => {
      const r = b.getBoundingClientRect();
      gazeAt(r.left + r.width / 2, r.top + r.height / 2);
    });
    b.addEventListener('click', () => {
      if (item.playable) return showGame();
      b.classList.remove('shake');
      void b.offsetWidth;
      b.classList.add('shake');
      say('„' + item.title + '“ ist noch in Arbeit.');
    });
    tower.appendChild(b);
  }

  SEASONS.forEach((s, i) => makeCard(s, 'STAFFEL ' + (i + 1), SPOTS[i]));
  makeCard(DEMO, DEMO.band, SPOTS[5]);

  // Augen folgen der Maus
  menu.addEventListener('pointermove', (e) => gazeAt(e.clientX, e.clientY));
  menu.addEventListener('pointerleave', () => MenuArt.setTarget(...DEFAULT_GAZE));

  MenuArt.init(document.getElementById('menuArt'));
  MenuArt.setTarget(...DEFAULT_GAZE);
  MenuArt.start();

  function showGame() {
    MenuArt.stop();
    home.classList.add('hidden');
    stage.classList.remove('hidden');
    Game.start();
  }
  function showHome() {
    Game.stop();
    stage.classList.add('hidden');
    home.classList.remove('hidden');
    MenuArt.start();
  }

  document.getElementById('back').addEventListener('click', showHome);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !stage.classList.contains('hidden')) showHome();
  });
})();
