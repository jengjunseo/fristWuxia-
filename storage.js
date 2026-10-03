export const SAVE_KEY = 'jianghu-first-steps-save-v1';
export const BACKUP_KEY = SAVE_KEY + '-previous';
export const SLOT_KEY = SAVE_KEY + '-slot-';

// Keep the legacy plain JSON format so existing exported saves remain usable.
export function readSave(storage, key, normalize, initial) {
  try {
    const raw = storage.getItem(key);
    return raw ? normalize(JSON.parse(raw), initial) : null;
  } catch { return null; }
}

export function writeSave(storage, key, state, normalize, initial, metadata = {}) {
  const clean = normalize(JSON.parse(JSON.stringify(state)), initial);
  // Timers are runtime-only; the saved pending turn is resumed exactly once.
  clean.savedAt = new Date().toISOString();
  clean.writer = metadata.writer || null;
  const json = JSON.stringify(clean);
  const previous = storage.getItem(key);
  if (key === SAVE_KEY && previous && readSave(storage, key, normalize, initial)) {
    storage.setItem(BACKUP_KEY, previous);
  }
  storage.setItem(key, json);
  return clean;
}
