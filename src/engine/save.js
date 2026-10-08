// Fortschritt im Browser speichern (localStorage). Wenn das nicht geht
// (privates Surfen, gesperrter Speicher), läuft das Spiel einfach ohne Speichern weiter.

const KEY = 'lemo.nebeneinander.v1';

export function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) {
    return {};
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    /* ohne Speichern weiter */
  }
}

// Welcher Abschnitt zuletzt erreicht wurde: 'A' | 'B' | 'C' | 'D' | 'ende'
export function section() {
  return load().section || null;
}

export function setSection(id) {
  save({ ...load(), section: id });
}

export function reset() {
  try { localStorage.removeItem(KEY); } catch (e) { /* egal */ }
}
