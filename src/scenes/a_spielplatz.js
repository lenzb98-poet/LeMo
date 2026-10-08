// A – Spielplatz (ich bin ca. 9). Wird in Meilenstein 6 gebaut – bis dahin ein leerer Testraum.
import { createTestRoom } from './testraum.js';

export default function spielplatz(game) {
  return createTestRoom(game, { section: 'A', paletteId: 'A', next: 'B', note: 'A Spielplatz · Platzhalter (Meilenstein 6)' });
}
