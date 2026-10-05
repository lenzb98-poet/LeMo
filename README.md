# Lenz Memory's

Ein Spiel, in dem man Erinnerungen durchspielen kann.

## Stand

- **Homescreen** mit "Staffeln des Lebens" (noch gesperrt) und der Demo
- **Demo "Laufen"**: scrollende Welt (3 Bildschirme breit) mit Parallax-Ebenen (Himmel, Wolken, Berge, Hügel mit Häusern, Bäume, Wiese, Vordergrund). Lenz startet rechts am Bett und läuft per Klick oder Pfeiltasten/A/D nach links und rechts (64×64-Pixel-Figur mit Gehanimation)
- **Bett** in der rechten Ecke: anklicken → Lenz legt sich niedergeschlagen hin, der Bildschirm wird dunkel; ein Klick irgendwo lässt ihn aufstehen

## Starten

`index.html` im Browser öffnen – kein Build nötig.

## Aufbau

- `src/home.js` – Homescreen; Staffeln und Demos stehen oben in den Listen `SEASONS` / `DEMOS`
- `src/game.js` – Spiel (Klick zum Laufen)
- `src/world.js` – scrollende Welt mit Parallax-Ebenen (Faktoren oben in `F`)
- `src/bed.js` – Bett und liegende Figur
- `src/sprite.js` – Die Figur, per Code gezeichnet
- `src/style.css` – Look
