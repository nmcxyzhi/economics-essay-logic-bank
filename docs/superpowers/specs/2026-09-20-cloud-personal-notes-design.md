# Cloud Personal Notes Design

## Goal

Keep the existing Personal Notes editing experience while adding durable cloud backup through the same Vercel project. Notes remain available immediately offline and are synchronized when the site is online.

## Architecture

- The browser keeps the current `localStorage` value as the fast local cache and offline fallback.
- A Vercel serverless endpoint at `/api/notes` reads and writes one private Vercel Blob object per essay ID.
- The browser sends only the current essay's note to the endpoint. The Blob token remains server-side in `BLOB_READ_WRITE_TOKEN`.
- On page load, the local value is shown immediately, then the cloud value is fetched with cache bypass. The newer value wins using the stored update timestamp; a cloud value replaces a stale local value and is saved locally.
- On input, the existing debounce first saves locally, then attempts the cloud write. Status text distinguishes local-only, syncing, synced, and cloud-error states.
- If the Blob environment variable is not configured, the site keeps working locally and explicitly reports that cloud sync is not configured.

## Data and safety

- Blob pathname: `personal-notes/{essayId}.json`, with essay IDs validated against a conservative URL-safe pattern.
- Payload: `{ essayId, value, updatedAt }`.
- Empty notes are stored as an empty string so clearing a note is synchronized instead of resurrecting old content.
- The API rejects malformed JSON, unknown methods, invalid essay IDs, and notes over 200,000 characters.

## Verification

- Unit-test note storage and cloud payload helpers without changing Economics content.
- Run `npm run check` and `npm run build`.
- Run a production-shaped browser check against the deployed URL once the Blob store token is configured: load an essay, edit Personal Notes, confirm the synced status, reload in a fresh tab, and verify the exact text remains.

## Scope

This change only adds Personal Notes cloud persistence and its status handling. It does not modify Essay content, classifications, diagrams, payoff matrices, or Practice Mode reveal order.
