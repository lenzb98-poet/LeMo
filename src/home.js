(function () {
  // Kapitel (Staffeln des Lebens) – hier Namen/Beschreibungen anpassen.
  // Reihenfolge = Platz im Kartenhaus: unten 1–3, Mitte 4–5, Spitze 6.
  // playable: true schaltet ein Kapitel frei, sobald es gebaut ist.
  const CHAPTERS = [
    { kicker: 'STAFFEL I',   title: 'Kindheit',    desc: 'Die ersten Erinnerungen.',                   playable: false, color: '#d9812f', icon: 'star',  numeral: 'I' },
    { kicker: 'STAFFEL II',  title: 'Jugend',      desc: 'Schulzeit und erste Freiheit.',              playable: false, color: '#3f82cc', icon: 'bolt',  numeral: 'II' },
    { kicker: 'STAFFEL III', title: 'Ausbildung',  desc: 'Neue Wege, neue Menschen.',                  playable: false, color: '#4f9440', icon: 'book',  numeral: 'III' },
    { kicker: 'STAFFEL IV',  title: 'Erwachsen',   desc: 'Auf eigenen Beinen.',                        playable: false, color: '#b8433f', icon: 'key',   numeral: 'IV' },
    { kicker: 'STAFFEL V',   title: 'Heute',       desc: 'Wo ich jetzt stehe.',                        playable: false, color: '#c9a63e', icon: 'flame', numeral: 'V' },
    { kicker: 'DEMO',        title: 'Dein Zimmer', desc: 'Lauf durchs Zimmer, finde Erinnerungen – oder leg dich ins Bett.', playable: true, color: '#2a928b', icon: 'bed', numeral: 'D' },
  ];

  const home = document.getElementById('home');
  const stage = document.getElementById('stage');
  const menu = document.getElementById('menuStage');
  const slotsEl = document.getElementById('slots');
  const caption = document.getElementById('menuCaption');
  const panel = document.getElementById('chapter');
  const el = (id) => document.getElementById(id);
  let open = null;

  const toArt = (cx, cy) => {
    const r = menu.getBoundingClientRect();
    return [((cx - r.left) / r.width) * MenuArt.W, ((cy - r.top) / r.height) * MenuArt.H];
  };

  MenuArt.init(el('menuArt'), CHAPTERS);

  // Unsichtbare Klickflächen über den Λ-Paaren des Kartenhauses
  MenuArt.slots().forEach((s, i) => {
    const c = CHAPTERS[i];
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', c.kicker + ': ' + c.title);
    b.style.cssText = 'left:' + (s.x / MenuArt.W) * 100 + '%;top:' + (s.y / MenuArt.H) * 100 + '%;width:' +
      (s.w / MenuArt.W) * 100 + '%;height:' + (s.h / MenuArt.H) * 100 + '%';
    const enter = () => {
      if (open !== null) return;
      MenuArt.setHover(i);
      caption.textContent = c.kicker + ' · ' + c.title + (c.playable ? '' : ' – bald');
    };
    const leave = () => { MenuArt.setHover(null); if (open === null) caption.textContent = ''; };
    b.addEventListener('pointerenter', enter);
    b.addEventListener('focus', enter);
    b.addEventListener('pointerleave', leave);
    b.addEventListener('blur', leave);
    b.addEventListener('click', () => openChapter(i));
    slotsEl.appendChild(b);
  });

  function openChapter(i) {
    if (open !== null || MenuArt.isOut()) return;
    open = i;
    const c = CHAPTERS[i];
    caption.textContent = '';
    menu.classList.add('open');
    MenuArt.pull(i, () => {
      panel.style.setProperty('--ch', c.color);
      el('chKicker').textContent = c.kicker;
      el('chTitle').textContent = c.title;
      el('chDesc').textContent = c.desc;
      el('chStatus').textContent = c.playable ? 'Spielbar.' : 'Dieses Kapitel ist noch in Arbeit.';
      el('chPlay').classList.toggle('hidden', !c.playable);
      panel.classList.remove('hidden');
      (c.playable ? el('chPlay') : el('chBack')).focus();
    });
  }

  function closeChapter() {
    if (open === null || MenuArt.busy()) return;
    const i = open;
    panel.classList.add('hidden');
    MenuArt.pushBack(() => {
      open = null;
      menu.classList.remove('open');
      const btn = slotsEl.children[i];
      if (btn) btn.focus({ preventScroll: true });
    });
  }

  el('chBack').addEventListener('click', closeChapter);
  el('chPlay').addEventListener('click', () => { if (open !== null && CHAPTERS[open].playable) showGame(); });

  // Augen folgen der Maus
  menu.addEventListener('pointermove', (e) => MenuArt.setPointer(...toArt(e.clientX, e.clientY)));
  menu.addEventListener('pointerleave', () => MenuArt.setPointer(null));

  MenuArt.start();

  function showGame() {
    MenuArt.stop();
    MenuArt.reset();
    open = null;
    panel.classList.add('hidden');
    menu.classList.remove('open');
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

  el('back').addEventListener('click', showHome);
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!stage.classList.contains('hidden')) showHome();
    else if (open !== null) closeChapter();
  });
})();
