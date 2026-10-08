// Ende. Wird in Meilenstein 3 gebaut (Sitzplatz, Sonnenuntergang, Abspann).
// Bis dahin: letzte Zeile, dann der Titel, dann zurück zur Levelauswahl.
import { palette } from '../assets/loader.js';

export default function ende(game) {
  const pal = palette('D');
  let t = 0;
  return {
    controls: false,
    pauseable: false,
    enter() { game.save.setSection('ende'); },
    update() {
      t++;
      if (t > 90 && (game.input.pressed('a') || game.input.pressed('b') || game.input.taps.length)) game.scenes.go('menu');
      if (t > 60 * 9) game.scenes.go('menu');
    },
    render(r) {
      r.clear(pal[15]);
      r.rect(0, 120, r.w, 60, pal[0]);
      const a1 = Math.min(1, Math.max(0, (t - 20) / 40));
      const a2 = Math.min(1, Math.max(0, (t - 150) / 50));
      r.text(game.texts.ende.lastLine, r.w / 2, 60, { align: 'center', color: pal[11], shadow: pal[0], alpha: Math.round(a1 * 4) / 4 });
      r.text(game.texts.ende.title, r.w / 2, 82, { align: 'center', color: pal[9], shadow: pal[0], scale: 2, alpha: Math.round(a2 * 4) / 4 });
      r.text('Ende · Platzhalter (Meilenstein 3)', 4, 4, { color: pal[11], alpha: 0.6 });
    },
  };
}
