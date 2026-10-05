# LeMo

LeMo (Lenz Memory's) – ein Spiel, in dem man Erinnerungen durchspielen kann.

## Stand

- **Hauptmenü**: detailliertes Pixel-Porträt des Jungen (links), der mit den Augen der Maus folgt und blinzelt; rechts ein Kartenhaus – jede Karte ist ein Kapitel ("Staffeln des Lebens", noch gesperrt), oben die Demo
- **Demo "Dein Zimmer"**: dein Schlafzimmer nach dem Foto als scrollende Welt mit Parallax-Ebenen (draußen hinterm Fenster, Wand, Boden, Möbel, Vordergrundpflanzen). Lenz startet rechts und läuft per Klick oder Pfeiltasten/A/D nach links und rechts
- **Erinnerungen finden**: Gegenstände im Zimmer (Zweig, Stuhl, Pflanze, Fenster, Spiegel, Bild) anklicken → Lenz läuft hin, es öffnet sich eine Erinnerung als altes Foto mit Text. Ungefundene glitzern, oben steht ein Zähler (wird im Browser gespeichert). Die Texte stehen in `src/memories.js` und sind noch Platzhalter
- **Bett** am linken Ende des Zimmers: anklicken → Lenz legt sich niedergeschlagen hin, der Bildschirm wird dunkel; ein Klick irgendwo lässt ihn aufstehen

## Starten

`index.html` im Browser öffnen – kein Build nötig.

## Aufbau

- `src/home.js` – Hauptmenü; Kapitel stehen oben in `SEASONS`, die Demo in `DEMO`
- `src/menuart.js` – die Menü-Grafik (Hintergrund und Junge werden per Code mit Licht und Dithering gemalt)
- `src/game.js` – Spiel (Klick zum Laufen)
- `src/world.js` – das Zimmer mit Parallax-Ebenen (Faktoren oben in `F`)
- `src/memories.js` – deine Erinnerungen (Texte und anklickbare Bereiche)
- `src/memory.js` – Anzeige einer Erinnerung
- `src/bed.js` – Bett und liegende Figur
- `src/sprite.js` – Die Figur, per Code gezeichnet
- `src/style.css` – Look
