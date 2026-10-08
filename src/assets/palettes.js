// Farbpaletten – jeder Abschnitt hat seine eigene, mit höchstens 16 Farben.
//
// In Sprites und Kacheln ist jedes Zeichen eine Hex-Ziffer (0–9, a–f) = Platz in der Palette,
// '.' ist durchsichtig. Damit dieselbe Figur in jedem Abschnitt passend aussieht, haben die
// Plätze 0–9 überall dieselbe Rolle – nur die Farbe ändert sich mit der Stimmung:
//
//   0 Kontur        1 Haut          2 Haut-Schatten   3 Haare          4 Haar-Schatten
//   5 Oberteil      6 Oberteil-Sch. 7 Hose            8 Hose-Schatten  9 Hell (Schuhe, Licht)
//   a–f Umgebung (Himmel, Boden, Licht …) – Bedeutung je Abschnitt, siehe Kommentar.

export const PALETTES = {
  // A – Spielplatz: warm und satt. Sonnengelb, Grasgrün, Himmelblau.
  //   a Himmel · b Himmel hell · c Gras · d Gras dunkel · e Sonne · f Holz/Sand
  A: ['#2a1f1d', '#f7c9a2', '#d9926a', '#f8dc62', '#d19b33', '#e5483b', '#a8302e', '#3d6fd6', '#27448f', '#fffbea',
      '#6ec6f5', '#c4ecff', '#5fc24a', '#2f8a3b', '#ffd43b', '#b8783a'],

  // B – Schulhof: beginnt wie A und wird schrittweise zu B_GRAU überblendet.
  //   a Himmel · b Himmel hell · c Pflaster · d Pflaster dunkel · e Sonne · f Backstein
  B: ['#2a1f1d', '#f7c9a2', '#d9926a', '#f8dc62', '#d19b33', '#e5483b', '#a8302e', '#3d6fd6', '#27448f', '#fffbea',
      '#7ec4ec', '#d2eefc', '#c9a07a', '#8f6a52', '#ffd43b', '#c8553d'],
  B_GRAU: ['#222126', '#d1cdd6', '#a59da3', '#d4d4d0', '#a19c98', '#826d74', '#5d4d54', '#616a83', '#3d4355', '#f2f6ff',
           '#a5b3c6', '#dce4f6', '#a7a4aa', '#736f75', '#d0cdc4', '#7d6e74'],

  // C – Zimmer: dunkles Blau und Grau, kaltes Cyan vom Bildschirm.
  //   a Wand dunkel · b Wand · c Möbel · d Möbel hell · e Bildschirm-Cyan · f Cyan hell
  C: ['#070912', '#8d9cb8', '#5b6a8a', '#a7b09a', '#6e765f', '#34466a', '#222e48', '#2b3349', '#1a2032', '#c9d8ea',
      '#10172a', '#1b263d', '#2a3852', '#46587a', '#3fe6f2', '#b6fcff'],

  // D – Skatepark: Spätnachmittag bis Sonnenuntergang. Orange, Gold, warmes Violett.
  //   a Himmel orange · b Himmel gold · c Beton · d Beton-Schatten violett · e Sonne · f Violett tief
  D: ['#2b1530', '#f9c391', '#cc7a5e', '#ffd67a', '#c78c45', '#3f7fae', '#2a5679', '#5c4a7c', '#3b2c5a', '#fff1d6',
      '#f39a4a', '#ffd08a', '#d98a6a', '#8e5a7a', '#ffb347', '#6b3f6e'],
};

// Der goldene „Faden“ aus Abschnitt D. Diese Farbe kommt sonst nirgends vor.
export const THREAD_GOLD = '#fff36a';

// Mischt zwei Paletten (t = 0 → erste, t = 1 → zweite). Für die Überblendung in Abschnitt B.
export function mixPalettes(p1, p2, t) {
  return p1.map((c1, i) => {
    const c2 = p2[i];
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const ch = (v, s) => (v >> s) & 255;
    const m = (s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
    return '#' + ((1 << 24) | (m(16) << 16) | (m(8) << 8) | m(0)).toString(16).slice(1);
  });
}
