import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSONAL_NOTE_PREFIX,
  personalNoteKey,
  loadPersonalNote,
  loadPersonalNoteRecord,
  savePersonalNote,
  cloudNotePayload,
  loadCloudPersonalNote,
  saveCloudPersonalNote
} from '../personal-notes.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value))
  };
}

test('personal notes use a versioned essay-specific key', () => {
  assert.equal(personalNoteKey('essay-one'), `${PERSONAL_NOTE_PREFIX}essay-one`);
  assert.notEqual(personalNoteKey('essay-one'), personalNoteKey('essay-two'));
});

test('personal notes preserve exact multiline text and stay isolated by essay', () => {
  const storage = memoryStorage();
  const text = 'A reusable sentence.\n\nA second paragraph.';
  assert.equal(loadPersonalNote(storage, 'essay-one').value, '');
  assert.equal(savePersonalNote(storage, 'essay-one', text), true);
  assert.deepEqual(loadPersonalNote(storage, 'essay-one'), { ok: true, value: text });
  assert.deepEqual(loadPersonalNote(storage, 'essay-two'), { ok: true, value: '' });
});

test('storage errors are contained', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(loadPersonalNote(blocked, 'essay-one'), { ok: false, value: '' });
  assert.equal(savePersonalNote(blocked, 'essay-one', 'text'), false);
});

test('note timestamps support legacy migration without changing the public note shape', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadPersonalNoteRecord(storage, 'essay-one'), { ok: true, value: '', updatedAt: 0 });
  assert.equal(savePersonalNote(storage, 'essay-one', 'Legacy note', 1234), true);
  assert.deepEqual(loadPersonalNote(storage, 'essay-one'), { ok: true, value: 'Legacy note' });
  assert.deepEqual(loadPersonalNoteRecord(storage, 'essay-one'), { ok: true, value: 'Legacy note', updatedAt: 1234 });
});

test('cloud payload preserves multiline text and cloud helpers handle API responses', async () => {
  const payload = cloudNotePayload('essay-one', 'Line one\n\nLine two', 5678);
  assert.deepEqual(payload, { essayId: 'essay-one', value: 'Line one\n\nLine two', updatedAt: 5678 });
  const calls = [];
  const fetchMock = async (url, options = {}) => {
    calls.push({ url, options });
    if (options.method === 'PUT') return { ok: true, status: 200, json: async () => ({ updatedAt: 5678 }) };
    return { ok: true, status: 200, json: async () => payload };
  };
  assert.deepEqual(await loadCloudPersonalNote('essay-one', fetchMock), { ok: true, found: true, value: payload.value, updatedAt: 5678 });
  assert.deepEqual(await saveCloudPersonalNote('essay-one', payload.value, 5678, fetchMock), { ok: true, updatedAt: 5678 });
  assert.match(calls[0].url, /essayId=essay-one$/);
  assert.equal(JSON.parse(calls[1].options.body).value, payload.value);
});
