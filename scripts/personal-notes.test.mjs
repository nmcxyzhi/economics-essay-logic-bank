import test from 'node:test';
import assert from 'node:assert/strict';
import { PERSONAL_NOTE_PREFIX, personalNoteKey, loadPersonalNote, savePersonalNote } from '../personal-notes.js';

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
