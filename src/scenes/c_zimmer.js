// C – Zimmer (ca. 13–15). Wird in Meilenstein 4 gebaut – bis dahin ein leerer Testraum.
import { createTestRoom } from './testraum.js';

export default function zimmer(game) {
  return createTestRoom(game, { section: 'C', paletteId: 'C', next: 'D', note: 'C Zimmer · Platzhalter (Meilenstein 4)' });
}
