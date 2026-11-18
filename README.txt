FILE CONCATENATOR

What it is: a web page that glues several files (PDFs, PNG and JPG pictures, and plain text files) into one PDF. Everything happens inside your browser. The files are not sent anywhere.

What you need: Node.js version 20.9 or newer and npm. You do not need a server, database, account or key.

How to run it:
1. Run: npm ci
2. Run: npm run dev
3. Open http://localhost:3000 in a browser, add your files, pick a page layout, and press Merge & Download.
If port 3000 is busy, run: npx next dev -p 3001

What you can do: add files; hover a file row to move it up or down or remove it; choose Original (keep sizes), A4 or Letter (every page forced to that size, content shrunk to fit with a small margin, never enlarged); merge. If the files add up to more than 100 MB you get an error and no download. The download is named merged_ plus a timestamp, ending in .pdf.

Known limits: long text files are not split across pages, so they run off one page. Word and Excel files are not supported.

How it is tested: npm run lint and npx tsc --noEmit check the code. npm run test:e2e builds the real production version, opens it in a real Chromium browser, adds files, merges, then reads the downloaded PDF back to check page count, page sizes and order. There are 10 such tests. They also check that no data is sent out during a merge. The first time you must run: npx playwright install chromium. Not tested: broken or password-protected PDFs, huge real files, other browsers, and drag and drop (the tests use the file picker).

Automatic checks on GitHub: lint, type check, the browser tests, and a scan for leaked passwords.

Notes: lib/pdf-utils.ts is leftover code that nothing uses. The repository has no LICENSE file.

Files that matter: app/page.tsx (all the merge logic), components/file-dropzone.tsx, components/file-list.tsx, e2e/merge.spec.ts (the tests).
