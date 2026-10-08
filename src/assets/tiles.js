// Kacheln 16 × 16 (Boden, Wände, Rampen). Gleiches Format wie die Sprites: Hex-Ziffer = Palettenplatz.
// Mehrere Einzelbilder = Varianten, damit sich der Boden nicht sichtbar wiederholt.
// Auch Kacheln lassen sich per PNG in assets/png/ ersetzen (z. B. ground_top.png = 2 Varianten nebeneinander).


export const GROUND_TOP_0 = [
  '9cccccc9cccccc9c',
  'cccccccccccccccc',
  'dccccdccccdccccd',
  'dcccdcccdcccdccc',
  'dddddddddddddddd',
  'ddddddcddddddddd',
  'dcdddddcdddd00dd',
  'ddddddddddcddddd',
  'dddddddddddddddd',
  'ddd0dddddddddddd',
  'dddcdddddddddddd',
  'ddcddddddddddddd',
  'dddddddddddddddd',
  'dcdddddddddddddd',
  'dddddddddddddddd',
  'd0ddddddddddcddd',
];

export const GROUND_TOP_1 = [
  'ccccc9cccccc9ccc',
  'cccccccccccccccc',
  'ccccdccccdccccdc',
  'cdcccdcccdcccdcc',
  'dddddddddddddddd',
  'dddddddcdddddddd',
  'dddddcdddddddddd',
  'dddddddddddddcdd',
  'dddddddddddddddd',
  'ddddcddddddddddd',
  'ddddddcddddddddd',
  'ddddddddddddd0dd',
  'dddddddddddddddd',
  'dddcdd0ddcdddddd',
  'ddccdddddddddddd',
  'd0dddddddddddd0d',
];

export const GROUND_FILL_0 = [
  'dddddddddddddddd',
  'dddddddddddddddd',
  'd0dddddddddddddd',
  'ddcddddddddddddd',
  'dddddddddd0ddddd',
  'dddddddddddddcdd',
  'dddddddddddddddd',
  'dddddcdddcdddddd',
  'dddddddddddddddd',
  'ddcdddddddddddcd',
  'dddddddddd0ddddc',
  'ddddddddddddddcd',
  'dddddddddddddddd',
  'ddddddddddddddd0',
  'dddddddddddddddd',
  'ddddddddddd0dddd',
];

export const GROUND_FILL_1 = [
  'dddddddddddddddd',
  'dddddddddddddddd',
  'ddddddddddddddcc',
  'dddddddddddddddd',
  'ddddddddd0dddddd',
  'dddddddddddcdddd',
  'd0dddddddddddddd',
  'dddddddddddddddd',
  'ddcddddddddddddd',
  'dcddddddddddddcd',
  'dddddddddddddddd',
  'ddddddddddddcddd',
  'ddddddd0dddddddd',
  'dddddddddddddddd',
  'cddddddddddddddd',
  'ddd0dddddddd0ddd',
];

export const TILES = {
  ground_top: { w: 16, h: 16, frames: [GROUND_TOP_0, GROUND_TOP_1] },
  ground_fill: { w: 16, h: 16, frames: [GROUND_FILL_0, GROUND_FILL_1] },
};
