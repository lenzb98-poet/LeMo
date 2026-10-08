// B – Schulhof (ich bin ca. 12). Wird in Meilenstein 5 gebaut – bis dahin ein leerer Testraum.
import { createTestRoom } from './testraum.js';

export default function schulhof(game) {
  return createTestRoom(game, { section: 'B', paletteId: 'B', next: 'C', note: 'B Schulhof · Platzhalter (Meilenstein 5)' });
}
