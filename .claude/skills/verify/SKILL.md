---
name: verify
description: Build, launch and drive MyNotion to verify changes end-to-end.
---

# Verifying MyNotion

Vite + React SPA, no backend, state in localStorage (`mynotion-state-v1`).

## Build & launch

```bash
npm ci                      # if node_modules missing
npm run build               # tsc -b && vite build (typecheck included)
npm run dev -- --port 5199  # dev server at http://localhost:5199/
```

## Drive it

Use Playwright with the pre-installed Chromium:

```js
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
```

Flows worth driving:
- Sidebar → "All Notes" → "+ New page" → type in `.page-title-input` and `.block-input`s.
- Block editor: `/` opens `.slash-menu` (keyboard: arrows + Enter); markdown
  shortcuts (`# `, `- `, `1. `, `[] `, `> `, "```"); Enter splits, Backspace at
  caret 0 merges; Tab indents; drag `.block-btn.handle` with mouse to reorder;
  click the handle for `.block-menu` (duplicate/delete/turn into).
- Mobile: new context with `{ viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true }`;
  `.burger` opens the `.sidebar.open` drawer; slash menu renders as `.slash-menu.sheet`.

## Gotchas

- Each browser context has fresh localStorage — create a page before opening one.
- Reload always lands on Dashboard; navigate back via the sidebar.
- Read textarea values via `el.value` (`allTextContents()` is stale for controlled textareas).
- Enter on a non-empty todo/bullet/numbered block continues the list (same type),
  Enter on an empty one exits it — account for this when scripting typing.
