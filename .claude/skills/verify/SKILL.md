---
name: verify
description: Build, run and drive MyNotion in a headless browser to verify changes end-to-end.
---

# Verifying MyNotion changes

Pure client-side React + Vite app; all state in localStorage (fresh browser
context = fresh seeded state with one semester, no courses/pages/tasks).

## Build & run

```bash
npm install
npm run build          # tsc -b && vite build — catches type errors
npx vite --port 5173 --strictPort   # dev server (run in background)
```

## Drive it (Playwright)

Install `playwright` (npm) in a scratch dir and launch the preinstalled
browser — do NOT run `playwright install`:

```js
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
```

Useful flows / selectors:

- App boots to **Dashboard**; navigation state is NOT persisted across reloads.
- Reach the block editor: click sidebar "All Notes" → button "+ New page".
  Editor root: `.block-editor`, inputs: `.block-input`, block wrappers:
  `.block.h1|h2|todo|bullet|quote|code`, dividers: `.block-divider`.
- Slash menu: type "/" in a block → `.slash-menu`, items `.slash-item`,
  selected `.slash-item.selected`.
- Theme toggle is the last button in `.sidebar-head`; theme lands on
  `document.documentElement.dataset.theme`.
- Quick Find: Ctrl/⌘ K → `.qf-panel`.

Gotchas: use `pressSequentially` (not `fill`) so per-keystroke logic
(markdown shortcuts, slash menu) fires; new pages are titled "Untitled" in
the All Notes list after reload.
