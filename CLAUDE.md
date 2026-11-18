# CLAUDE.md (file-concatenator)

Master rules: `~/.claude/CLAUDE.md` (read it; not copied here). Stack summary for agents: `AGENTS.md`.

## What this is
Single-page Next.js 16 app (App Router, Tailwind 3, `pdf-lib`) that merges PDF/PNG/JPG/TXT files into one PDF entirely in the browser. No server routes, no database, no env vars.

## Commands (all run 2026-11-18, Node 26, npm)
- `npm ci`, `npm run dev` (port 3000), `npm run build`, `npm run lint`, `npx tsc --noEmit`
- `npm run test:e2e`: Playwright; builds, serves the production build with `next start` on port 3100, drives the real page, loads the downloaded PDF with `pdf-lib` and asserts page count/sizes. First time: `npx playwright install chromium`.

## Layout and where logic lives
- All merge logic: `handleMerge` in `app/page.tsx`. Components: `components/file-dropzone.tsx`, `components/file-list.tsx`.
- `lib/pdf-utils.ts` (`mergePDFs`) is not imported anywhere (dead code); do not assume it is used.
- E2E specs: `e2e/merge.spec.ts`; config `playwright.config.ts`.

## Rules
- UI claims are proven with Playwright through the page, never by calling functions directly.
- Playwright pinned `^1.55` because Next 16 declares a peer of `^1.51.1`.
- Do not claim a license: there is no LICENSE file.
- Branch + PR only; never push to `main`.
