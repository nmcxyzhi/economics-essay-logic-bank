export const PERSONAL_NOTE_PREFIX = 'economics-essay-logic-bank:personal-note:v1:';
export const PERSONAL_NOTE_UPDATED_PREFIX = 'economics-essay-logic-bank:personal-note-updated:v1:';
export const CLOUD_NOTES_ENDPOINT = '/api/notes';

export function personalNoteKey(essayId) {
  return `${PERSONAL_NOTE_PREFIX}${essayId}`;
}

export function personalNoteUpdatedKey(essayId) {
  return `${PERSONAL_NOTE_UPDATED_PREFIX}${essayId}`;
}

export function loadPersonalNote(storage, essayId) {
  try {
    return { ok: true, value: storage.getItem(personalNoteKey(essayId)) || '' };
  } catch {
    return { ok: false, value: '' };
  }
}

export function loadPersonalNoteRecord(storage, essayId) {
  const note = loadPersonalNote(storage, essayId);
  if (!note.ok) return { ok: false, value: '', updatedAt: 0 };
  let updatedAt = 0;
  try {
    const parsed = Number(storage.getItem(personalNoteUpdatedKey(essayId)));
    updatedAt = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    updatedAt = 0;
  }
  return { ok: true, value: note.value, updatedAt };
}

export function savePersonalNote(storage, essayId, value, updatedAt = Date.now()) {
  try {
    storage.setItem(personalNoteKey(essayId), value);
    storage.setItem(personalNoteUpdatedKey(essayId), String(updatedAt));
    return true;
  } catch {
    return false;
  }
}

export function cloudNotePayload(essayId, value, updatedAt = Date.now()) {
  return { essayId, value: String(value), updatedAt: Number(updatedAt) || Date.now() };
}

export async function loadCloudPersonalNote(essayId, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(`${CLOUD_NOTES_ENDPOINT}?essayId=${encodeURIComponent(essayId)}`, {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  });
  if (response.status === 404) return { ok: true, found: false, value: '', updatedAt: 0 };
  if (!response.ok) {
    const error = new Error(`Cloud notes request failed: ${response.status}`);
    error.code = response.status === 503 ? 'cloud-not-configured' : 'cloud-request-failed';
    throw error;
  }
  const payload = await response.json();
  return {
    ok: true,
    found: true,
    value: typeof payload.value === 'string' ? payload.value : '',
    updatedAt: Number(payload.updatedAt) || 0
  };
}

export async function saveCloudPersonalNote(essayId, value, updatedAt = Date.now(), fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(CLOUD_NOTES_ENDPOINT, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(cloudNotePayload(essayId, value, updatedAt))
  });
  if (!response.ok) {
    const error = new Error(`Cloud notes request failed: ${response.status}`);
    error.code = response.status === 503 ? 'cloud-not-configured' : 'cloud-request-failed';
    throw error;
  }
  const payload = await response.json();
  return { ok: true, updatedAt: Number(payload.updatedAt) || Number(updatedAt) || Date.now() };
}
