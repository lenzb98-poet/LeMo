# LeMo

LeMo (Lenz Memory's) – ein Spiel, in dem man Erinnerungen durchspielen kann.

## Stand

- **Hauptmenü** im Stil von Dead Cells: dunkle, abstrakte Welt mit Nebel, Funken und Lichtstrahlen; links ein handgesetztes Pixel-Porträt (44×56, folgt mit den Augen der Maus, blinzelt), rechts ein echtes Kartenhaus. Jedes Λ-Kartenpaar ist ein Kapitel – anklicken zieht die Karte aus dem Turm, sie dreht sich um und zeigt das Kapitel (der Turm wackelt, die Partnerkarte kippt nach)
- **Demo "Dein Zimmer"**: dein Schlafzimmer nach dem Foto als scrollende Welt mit Parallax-Ebenen (draußen hinterm Fenster, Wand, Boden, Möbel, Vordergrundpflanzen). Lenz startet rechts und läuft per Klick oder Pfeiltasten/A/D nach links und rechts
- **Erinnerungen finden**: Gegenstände im Zimmer (Zweig, Stuhl, Pflanze, Fenster, Spiegel, Bild) anklicken → Lenz läuft hin, es öffnet sich eine Erinnerung als altes Foto mit Text. Ungefundene glitzern, oben steht ein Zähler (wird im Browser gespeichert). Die Texte stehen in `src/memories.js` und sind noch Platzhalter
- **Bett** am linken Ende des Zimmers: anklicken → Lenz legt sich niedergeschlagen hin, der Bildschirm wird dunkel; ein Klick irgendwo lässt ihn aufstehen

## Starten

`index.html` im Browser öffnen – kein Build nötig.

## Aufbau

- `src/home.js` – Hauptmenü; alle Kapitel stehen oben in `CHAPTERS` (Reihenfolge = Platz im Kartenhaus)
- `src/menuart.js` – die Menü-Grafik: Hintergrund und Kartenhaus per Code gemalt; die Figur steht als Pixel-Raster in `PORTRAIT` (ein Zeichen = ein Pixel, Farben in `PORTRAIT_PAL`)
- `src/game.js` – Spiel (Klick zum Laufen)
- `src/world.js` – das Zimmer mit Parallax-Ebenen (Faktoren oben in `F`)
- `src/memories.js` – deine Erinnerungen (Texte und anklickbare Bereiche)
- `src/memory.js` – Anzeige einer Erinnerung
- `src/bed.js` – Bett und liegende Figur
- `src/sprite.js` – Die Figur, per Code gezeichnet
- `src/style.css` – Look
