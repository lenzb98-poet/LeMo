(function () {
  // Staffeln des Lebens – hier Namen/Beschreibungen anpassen.
  // playable: true schaltet eine Staffel frei, sobald sie gebaut ist.
  const SEASONS = [
    { title: 'Kindheit',        desc: 'Die ersten Erinnerungen.',       playable: false },
    { title: 'Jugend',          desc: 'Schulzeit und erste Freiheit.',  playable: false },
    { title: 'Ausbildung',      desc: 'Neue Wege, neue Menschen.',      playable: false },
    { title: 'Erwachsen',       desc: 'Auf eigenen Beinen.',            playable: false },
    { title: 'Heute',           desc: 'Wo ich jetzt stehe.',            playable: false },
  ];
  const DEMOS = [
    { title: 'Laufen', desc: 'Klick irgendwo hin – die Figur läuft.', playable: true, run: () => showGame() },
  ];

  const home = document.getElementById('home');
  const stage = document.getElementById('stage');
  const hint = document.getElementById('hint');
  let hintTimer;

  function say(msg) {
    hint.textContent = msg;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => (hint.textContent = ''), 2500);
  }

  function card(item, label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card ' + (item.playable ? 'playable' : 'locked');
    b.innerHTML =
      '<span class="num"></span><span class="title"></span><span class="desc"></span><span class="tag"></span>';
    b.querySelector('.num').textContent = label;
    b.querySelector('.title').textContent = item.title;
    b.querySelector('.desc').textContent = item.desc;
    b.querySelector('.tag').textContent = item.playable ? 'SPIELEN' : 'BALD';
    b.addEventListener('click', () => {
      if (item.playable) return item.run();
      b.classList.remove('shake');
      void b.offsetWidth;
      b.classList.add('shake');
      say('„' + item.title + '“ ist noch in Arbeit.');
    });
    return b;
  }

  SEASONS.forEach((s, i) =>
    document.getElementById('seasons').appendChild(card(s, 'STAFFEL ' + (i + 1), null)));
  DEMOS.forEach((d) =>
    document.getElementById('demos').appendChild(card(d, 'DEMO', null)));

  // Figur als Logo
  const logo = document.getElementById('logo').getContext('2d');
  logo.imageSmoothingEnabled = false;
  logo.drawImage(Game.sprites.down.idle, 0, 0);

  function showGame() {
    home.classList.add('hidden');
    stage.classList.remove('hidden');
    Game.start();
  }
  function showHome() {
    Game.stop();
    stage.classList.add('hidden');
    home.classList.remove('hidden');
  }

  document.getElementById('back').addEventListener('click', showHome);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !stage.classList.contains('hidden')) showHome();
  });
})();
