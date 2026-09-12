# Personal Memorisation Notes Design

## Goal

Add one user-editable note area to every Essay Detail page so the learner can paste and revise reusable sentences or full paragraphs beneath the supplied logic chains.

## Placement and interface

- Place the note area after all KAA, EVA and Weighing groups and before the existing essay-end message.
- Use the Chinese heading `我的背诵段落` and a short Chinese explanation that the content is private to the current browser.
- Provide one multiline textarea per essay. It accepts English sentences, multiple paragraphs and line breaks.
- Grow the textarea with its content so longer notes remain comfortable to read, while keeping a practical minimum and maximum visible height.
- Show an unobtrusive save state in the same card: `正在保存…` followed by `已自动保存`.
- Match the existing beige and dark-green revision-notebook design. Do not introduce a dashboard, modal, animation or separate editing screen.

## Storage and data flow

- Store notes in `localStorage`; no backend, account, API or database is added.
- Use a versioned key containing the stable essay ID so every essay has an independent note.
- Load the saved value whenever an Essay Detail page opens.
- Save on user input after a short debounce. Preserve the exact text entered, including line breaks.
- If browser storage is unavailable or full, keep the current textarea text and show a concise Chinese error state instead of breaking the page.
- Personal notes never enter `data/essay-bank.json`, the import schema, or Content ChatGPT import packages.

## Practice Mode

- Keep the personal note card visible in normal and Practice modes.
- Do not add the note, its text or its save state to the reveal sequence.
- Preserve the existing order and count of point, logic, diagram and matrix reveal steps.

## Accessibility and responsive behavior

- Associate the textarea with a visible label and provide a clear Chinese placeholder.
- Keep keyboard editing and normal browser text selection available.
- Use the existing content width on desktop and full available width on mobile without horizontal scrolling.
- Do not erase a saved note when a section is hidden, Practice mode changes, or the route changes.

## Verification

- Add model-independent browser-facing checks where practical for the storage key and note lifecycle.
- Run the existing validation and six model tests without changing Economics data.
- Run `npm run build`.
- Verify in a real browser that text persists after navigating away and back, remains visible in Practice mode, and does not change the reveal-step count.
- Verify a second essay starts with its own empty note.

## Scope boundaries

- One note area per essay, not separate notes for each section.
- No multiple-note cards, sorting, rich-text editor, cloud sync, export, authentication or AI assistance.
- Existing Question, summary, point, logic, diagrams, matrix and Practice behavior remain unchanged.
