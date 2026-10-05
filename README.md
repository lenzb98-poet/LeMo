# Lenz Memory's

Ein Spiel, in dem man Erinnerungen durchspielen kann.

## Stand

- **Homescreen** mit "Staffeln des Lebens" (noch gesperrt) und der Demo
- **Demo "Laufen"**: blauer Bildschirm, Klick = die 64×64-Pixel-Figur läuft dorthin (mit Gehanimation in 4 Richtungen)

## Starten

`index.html` im Browser öffnen – kein Build nötig.

## Aufbau

- `src/home.js` – Homescreen; Staffeln und Demos stehen oben in den Listen `SEASONS` / `DEMOS`
- `src/game.js` – Spiel (Klick zum Laufen)
- `src/sprite.js` – Die Figur, per Code gezeichnet
- `src/style.css` – Look
