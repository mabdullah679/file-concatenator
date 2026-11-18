# File Concatenator

A client-side web page that merges PDFs, PNG/JPG images and plain-text files into one PDF, with optional A4 or Letter page standardization.

Spec: none beyond this README; `AGENTS.md` holds a short stack note for coding agents.

```
browser tab
  files --> [ file list: reorder / remove ] --> pdf-lib merge (in page) --> merged_<timestamp>.pdf download
```

Not local or contained: nothing. There is no server component and the page sends no requests with file contents (asserted by an e2e test); you only need a browser.

## Prerequisites
- Node.js 20.9 or newer (Next.js 16.1.6 requires `>=20.9.0`) and npm
- Port 3000 free for `npm run dev`; port 3100 free for the e2e run
- Not needed: any backend, database, account, API key, or Docker

## Run it
1. `npm ci`
2. `npm run dev`
3. Open http://localhost:3000, drop files, choose a page layout, press "Merge & Download".

Port 3000 taken: `npx next dev -p 3001`. Production build: `npm run build && npm run start`.

## What it does
| Action | Result |
|---|---|
| Add PDF / PNG / JPG / TXT files | They appear in the list in the order added |
| Move up / down, remove (hover a row) | List order changes; merge uses the list order |
| Layout "Original" | PDF pages and images keep native size; text goes on default-size pages |
| Layout "A4" / "Letter" | Every output page is A4 (595.28 x 841.89 pt) or Letter (612 x 792 pt); content is fit with a 20 pt margin and never scaled up |
| Total input over 100 MB | Error "Total file size exceeds 100MB limit.", no download |
| Merge & Download | Browser downloads `merged_<timestamp>.pdf` |

Limits: text is drawn with one font size (12 pt) and is not paginated, so long text files overflow a single page. Other file types (Word, Excel) are not supported.

## Tests
- `npm run lint` and `npx tsc --noEmit`: static checks.
- `npm run test:e2e`: 10 Playwright tests against the production build (`npm run build` then `next start` on port 3100). They cover disabled/enabled merge button, original/A4/Letter page sizes and counts, reorder/remove/clear, merge order, blank PDF pages in A4 mode, the 100 MB limit, and no non-GET requests during a merge. No external services needed; first run needs `npx playwright install chromium`.
- Not covered: password-protected or corrupt PDFs, very large real-world files, other browsers than Chromium, drag-and-drop gestures (uploads go through the file input).

CI: [.github/workflows/ci.yml](.github/workflows/ci.yml) runs lint, type check, the e2e suite, and a gitleaks scan.

## Layout
| Path | Role |
|---|---|
| [app/page.tsx](app/page.tsx) | page UI and all merge logic (`handleMerge`) |
| [components/file-dropzone.tsx](components/file-dropzone.tsx) | file picker / drop target |
| [components/file-list.tsx](components/file-list.tsx) | list with reorder/remove controls |
| [components/ui/button.tsx](components/ui/button.tsx) | button primitive |
| [lib/pdf-utils.ts](lib/pdf-utils.ts) | unused helper (not imported) |
| [e2e/merge.spec.ts](e2e/merge.spec.ts) | Playwright suite |
| [playwright.config.ts](playwright.config.ts) | staging-style config: production build on port 3100 |
| [AGENTS.md](AGENTS.md) | notes for AI agents |
| [CLAUDE.md](CLAUDE.md) | repo rules for Claude Code |

## Design decisions
- Merge in the browser with `pdf-lib` rather than uploading to a server: files never leave the machine, and the app needs no backend to host.
- E2E reads the downloaded PDF back with `pdf-lib` instead of checking that a download started, because a download alone would not catch wrong page sizes or order.

## License
No LICENSE file is present in this repository.
