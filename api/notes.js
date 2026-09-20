import { get, put } from '@vercel/blob';

const MAX_NOTE_LENGTH = 200_000;
const ESSAY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const pathnameFor = essayId => `personal-notes/${essayId}.json`;

function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function validEssayId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 160 && ESSAY_ID_PATTERN.test(value);
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > MAX_NOTE_LENGTH + 2_000) reject(new Error('body-too-large'));
    });
    req.on('end', () => resolve(JSON.parse(raw || '{}')));
    req.on('error', reject);
  });
}

async function readBlobJson(essayId) {
  const result = await get(pathnameFor(essayId), { access: 'private', useCache: false });
  if (!result) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

export default async function handler(req, res) {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_OIDC_TOKEN) {
    return sendJson(res, 503, { ok: false, error: 'cloud-not-configured' });
  }

  try {
    if (req.method === 'GET') {
      const essayId = req.query?.essayId;
      if (!validEssayId(essayId)) return sendJson(res, 400, { ok: false, error: 'invalid-essay-id' });
      const payload = await readBlobJson(essayId);
      if (!payload) return sendJson(res, 404, { ok: false, error: 'note-not-found' });
      return sendJson(res, 200, {
        ok: true,
        essayId,
        value: typeof payload.value === 'string' ? payload.value : '',
        updatedAt: Number(payload.updatedAt) || 0
      });
    }

    if (req.method === 'PUT') {
      const body = await parseBody(req);
      const { essayId, value, updatedAt } = body || {};
      if (!validEssayId(essayId)) return sendJson(res, 400, { ok: false, error: 'invalid-essay-id' });
      if (typeof value !== 'string') return sendJson(res, 400, { ok: false, error: 'invalid-note' });
      if (value.length > MAX_NOTE_LENGTH) return sendJson(res, 413, { ok: false, error: 'note-too-large' });
      const timestamp = Number(updatedAt);
      if (!Number.isFinite(timestamp) || timestamp <= 0) return sendJson(res, 400, { ok: false, error: 'invalid-updated-at' });

      await put(pathnameFor(essayId), JSON.stringify({ essayId, value, updatedAt: timestamp }), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 60
      });
      return sendJson(res, 200, { ok: true, essayId, updatedAt: timestamp });
    }

    res.setHeader('Allow', 'GET, PUT');
    return sendJson(res, 405, { ok: false, error: 'method-not-allowed' });
  } catch (error) {
    console.error('Personal notes cloud error', error);
    return sendJson(res, 500, { ok: false, error: 'cloud-request-failed' });
  }
}
