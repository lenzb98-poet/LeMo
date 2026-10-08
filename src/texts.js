// ALLE Texte des Spiels stehen hier – nur diese Datei musst du zum Schreiben anfassen.
// Platzhalter stehen in [eckigen Klammern]: einfach den ganzen Text zwischen den '…' ersetzen.
// Kurz halten: am Anfang eines Abschnitts höchstens eine Zeile. Die Stimmung machen Farbe, Licht und Tempo.
// Erlaubt sind Buchstaben inkl. ä ö ü ß, Ziffern und . , ! ? : ; - – „ “ ' ( ) / …

export const TEXTS = {
  // ---------- Levelauswahl und Bedienung ----------
  ui: {
    title: 'LeMo',
    subtitle: "Lenz Memory's",
    level1: 'Nebeneinander',
    level1Info: '9 bis 16 Jahre',
    prototype: 'Dein Zimmer',
    prototypeInfo: 'Prototyp',
    continueAt: 'Weiter',
    restart: 'Von vorn',
    pause: 'Pause',
    resume: 'Weiter',
    toMenu: 'Zur Levelauswahl',
    rotate: 'Bitte ins Querformat drehen',
    sections: { A: 'Spielplatz', B: 'Schulhof', C: 'Zimmer', D: 'Skatepark', ende: 'Ende' },
  },

  // ---------- A – Spielplatz (ca. 9) ----------
  A: {
    intro: '[Zeile am Anfang – ich bin 9]',
    names: ['[Name 1]', '[Name 2]', '[Name 3]'],   // über den Köpfen der drei Kinder
    outro: '[Zeile beim Übergang – ich werde älter]',
  },

  // ---------- B – Schulhof (ca. 12) ----------
  B: {
    intro: '[Zeile am Anfang – ich bin 12]',
    names: ['[Name A]', '[Name B]', '[Name C]'],   // die drei, die noch einen Namen haben
    unknown: '???',
    // Gesprächskreise: Frage der Gruppe + die Antwort, deren Wortkacheln man ordnen soll (3–4 Wörter)
    talks: [
      { question: '[Und, was hast du am Wochenende gemacht?]', answer: ['[Ich]', '[war]', '[zu]', '[Hause]'] },
      { question: '[Frage 2]', answer: ['[Wort]', '[Wort]', '[Wort]'] },
      { question: '[Frage 3]', answer: ['[Wort]', '[Wort]', '[Wort]', '[Wort]'] },
    ],
    outro: '[Zeile auf dem Heimweg]',
  },

  // ---------- C – Zimmer (ca. 13–15) ----------
  C: {
    intro: '[Zeile am Anfang – mein Zimmer]',
    outro: '[Zeile, wenn die Tür aufgeht]',
  },

  // ---------- D – Skatepark (ca. 15–16) ----------
  D: {
    intro: '[Zeile am Anfang – der Skatepark]',
    unknown: '???',
    skaters: ['[Skater 1]', '[Skater 2]', '[Skater 3]', '[Skater 4]', '[Skater 5]'],   // Namen erscheinen nach dem Verbinden
  },

  // ---------- Ende ----------
  ende: {
    lastLine: '[Letzte Zeile]',
    title: 'Nebeneinander.',
  },
};
