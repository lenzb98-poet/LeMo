// D – Skatepark (ca. 15–16), das Herzstück. Wird in Meilenstein 2 gebaut – bis dahin ein leerer Testraum.
import { createTestRoom } from './testraum.js';

export default function skatepark(game) {
  return createTestRoom(game, { section: 'D', paletteId: 'D', next: 'ende', note: 'D Skatepark · Platzhalter (Meilenstein 2)' });
}
