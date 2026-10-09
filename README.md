# LeMo

LeMo (Lenz Memory's) – ein kleines Pixel-Spiel über mein Leben. Läuft als Web-App im Browser (auch iPad/Safari).

## Level „Nebeneinander“ (9–16 Jahre)

Kernidee: Kontakt klappt nicht gegenüber, sondern nebeneinander. Vier Abschnitte + Ende:

| Abschnitt | Inhalt | Stand |
|---|---|---|
| A Spielplatz | Fangen, Kisten zur Bude stapeln | Platzhalter (Meilenstein 6) |
| B Schulhof | Gesprächskreise mit zähen Wortkacheln, Farben werden grau | Platzhalter (Meilenstein 5) |
| C Zimmer | Mini-Spiel am Computer, Jahreszeiten, Skateboard im Licht | Platzhalter (Meilenstein 4) |
| D Skatepark | Skaten, goldener Faden zwischen Skatern, die nebeneinander fahren | Platzhalter (Meilenstein 2) |
| Ende | Sitzplatz, Sonnenuntergang, Titel | Platzhalter (Meilenstein 3) |

**Start:** Beim Öffnen steht Lenz im Klinikraum (`assets/raeume/klinikraum.png`, Szene `src/scenes/start.js`). Auf den Boden tippen = dorthin gehen. Auf den Stuhl am iPad tippen = hinsetzen → Levelauswahl.

**Meilenstein 1 (Grundgerüst) ist fertig:** Levelauswahl, Spielschleife (60 Updates/s), Tastatur + Touch, Szenenwechsel, Sprite-Loader mit PNG-Austausch, Speichern, Manifest.

## Spielen

- **iPad:** Seite in Safari öffnen → Teilen → „Zum Home-Bildschirm“. Dann startet LeMo im Vollbild wie eine App. Querformat.
- **Lokal am Computer:** ES-Module brauchen einen Webserver, z. B. `python3 -m http.server` im Projektordner, dann `http://localhost:8000` öffnen.

### Steuerung

| | Touch | Tastatur |
|---|---|---|
| Bewegen | Steuerkreuz links unten | Pfeiltasten / WASD |
| A – Springen / Ollie | rechter runder Knopf | Leertaste |
| B – Aktion | linker runder Knopf | E |
| Pause | Knopf oben rechts | Esc / P |
| Debug: Abschnitt wählen | oben links in die Ecke tippen | 1–4 (5 = Ende, 0 = Levelauswahl, 9 = Startraum) |

## Selbst anpassen

- **Texte:** alle in `src/texts.js` (Platzhalter in [eckigen Klammern] ersetzen).
- **Eigene Grafiken:** PNG mit dem Sprite-Namen in `assets/png/` legen (z. B. `teen_walk.png`, waagerechter Streifen, alle Bilder gleich groß). Siehe `assets/png/LIESMICH.txt`.
- **Grafiken als Code:** `src/assets/sprites.js` (Figuren), `src/assets/tiles.js` (Kacheln 16×16). Jedes Zeichen = Platz in der Farbpalette, `.` = durchsichtig.
- **Farben:** `src/assets/palettes.js` – je Abschnitt max. 16 Farben.

## Aufbau

```
index.html, style.css, manifest.json, icons/
src/
  main.js            Start: alles zusammenstecken
  texts.js           alle Texte
  engine/            loop, input, touch, renderer, camera, physics, scenes, save
  scenes/            start (Klinikraum), menu (Levelauswahl), a_spielplatz, b_schulhof, c_zimmer, d_skatepark, ende, testraum
  assets/            palettes, sprites, tiles, font (Pixel-Schrift), loader, lenz64 (Figur aus der Demo)
assets/png/          eigene PNG-Grafiken (ersetzen die Code-Grafiken)
assets/raeume/       fertige Raumbilder (Klinikraum)
legacy/              der alte Prototyp „Dein Zimmer“ (Bett, Erinnerungen) – erreichbar über die Levelauswahl
```

Technik: reines HTML + JavaScript (ES-Module) + Canvas 2D, kein Build-Schritt. Internes Bild 320×180, nur in ganzen Faktoren hochskaliert.
