export const PERSONAL_NOTE_PREFIX = 'economics-essay-logic-bank:personal-note:v1:';

export function personalNoteKey(essayId) {
  return `${PERSONAL_NOTE_PREFIX}${essayId}`;
}

export function loadPersonalNote(storage, essayId) {
  try {
    return { ok: true, value: storage.getItem(personalNoteKey(essayId)) || '' };
  } catch {
    return { ok: false, value: '' };
  }
}

export function savePersonalNote(storage, essayId, value) {
  try {
    storage.setItem(personalNoteKey(essayId), value);
    return true;
  } catch {
    return false;
  }
}
