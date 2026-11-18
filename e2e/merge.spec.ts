import { test, expect, Page } from "@playwright/test"
import { PDFDocument } from "pdf-lib"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"

// 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
)

async function makePdf(pages: number, blank = false): Promise<Buffer> {
  const d = await PDFDocument.create()
  for (let i = 0; i < pages; i++) {
    const p = d.addPage([300, 400])
    if (!blank) p.drawText(`page ${i + 1}`, { x: 20, y: 200, size: 24 })
  }
  return Buffer.from(await d.save())
}

async function upload(page: Page, files: { name: string; mimeType: string; buffer: Buffer }[]) {
  await page.locator('input[type="file"]').setInputFiles(files)
}

async function mergeAndLoad(page: Page) {
  const [dl] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Merge & Download/ }).click(),
  ])
  expect(dl.suggestedFilename()).toMatch(/^merged_\d+\.pdf$/)
  const path = await dl.path()
  return PDFDocument.load(fs.readFileSync(path))
}

async function fourFiles(page: Page) {
  await upload(page, [
    { name: "a.pdf", mimeType: "application/pdf", buffer: await makePdf(2) },
    { name: "b.png", mimeType: "image/png", buffer: PNG },
    { name: "c.txt", mimeType: "text/plain", buffer: Buffer.from("hello world") },
  ])
}

test.beforeEach(async ({ page }) => {
  page.on("console", (m) => { if (m.type() === "error") console.log("BROWSER ERROR:", m.text()) })
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message))
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "File Concatenator" })).toBeVisible()
})

test("merge button disabled until a file is added", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Merge & Download/ })).toBeDisabled()
  await upload(page, [{ name: "a.pdf", mimeType: "application/pdf", buffer: await makePdf(1) }])
  await expect(page.getByText("a.pdf")).toBeVisible()
  await expect(page.getByRole("button", { name: /Merge & Download/ })).toBeEnabled()
})

test("original mode: PDF(2 pages)+PNG+TXT -> 4 pages, native sizes kept", async ({ page }) => {
  await fourFiles(page)
  const out = await mergeAndLoad(page)
  expect(out.getPageCount()).toBe(4)
  const sizes = out.getPages().map((p) => p.getSize())
  expect(sizes[0]).toEqual({ width: 300, height: 400 })
  expect(sizes[2]).toEqual({ width: 1, height: 1 })
})

test("A4 mode: every page is 595.28 x 841.89", async ({ page }) => {
  await fourFiles(page)
  await page.locator("select").selectOption("a4")
  const out = await mergeAndLoad(page)
  expect(out.getPageCount()).toBe(4)
  for (const p of out.getPages()) {
    expect(p.getWidth()).toBeCloseTo(595.28, 1)
    expect(p.getHeight()).toBeCloseTo(841.89, 1)
  }
})

test("Letter mode: every page is 612 x 792", async ({ page }) => {
  await fourFiles(page)
  await page.locator("select").selectOption("letter")
  const out = await mergeAndLoad(page)
  for (const p of out.getPages()) {
    expect(p.getWidth()).toBeCloseTo(612, 1)
    expect(p.getHeight()).toBeCloseTo(792, 1)
  }
})

test("move up, move down and remove reorder/shrink the list", async ({ page }) => {
  await fourFiles(page)
  const names = () => page.locator("span.truncate").allTextContents()
  expect(await names()).toEqual(["a.pdf", "b.png", "c.txt"])
  const row = (n: string) => page.locator("div.group", { hasText: n })
  await row("c.txt").hover()
  await row("c.txt").getByRole("button").nth(0).click() // move up
  expect(await names()).toEqual(["a.pdf", "c.txt", "b.png"])
  await row("a.pdf").hover()
  await row("a.pdf").getByRole("button").nth(1).click() // move down
  expect(await names()).toEqual(["c.txt", "a.pdf", "b.png"])
  await row("b.png").hover()
  await row("b.png").getByRole("button").nth(2).click() // remove
  expect(await names()).toEqual(["c.txt", "a.pdf"])
})

test("reordered files merge in the new order", async ({ page }) => {
  await fourFiles(page)
  const row = page.locator("div.group", { hasText: "b.png" })
  await row.hover()
  await row.getByRole("button").nth(0).click() // b.png before a.pdf
  const out = await mergeAndLoad(page)
  expect(out.getPage(0).getSize()).toEqual({ width: 1, height: 1 })
  expect(out.getPage(1).getSize()).toEqual({ width: 300, height: 400 })
})

test("clear all empties the list", async ({ page }) => {
  await fourFiles(page)
  await page.getByRole("button", { name: /Clear All/ }).click()
  await expect(page.getByText("a.pdf")).toHaveCount(0)
  await expect(page.getByRole("button", { name: /Merge & Download/ })).toBeDisabled()
})

test("files over 100MB total are rejected with an error and no download", async ({ page }) => {
  const big = path.join(os.tmpdir(), "fc-e2e-big.txt")
  fs.writeFileSync(big, Buffer.alloc(101 * 1024 * 1024, 65))
  try {
    await page.locator('input[type="file"]').setInputFiles(big)
    let downloaded = false
    page.on("download", () => { downloaded = true })
    await page.getByRole("button", { name: /Merge & Download/ }).click()
    await expect(page.getByText("Total file size exceeds 100MB limit.")).toBeVisible()
    expect(downloaded).toBe(false)
  } finally {
    fs.rmSync(big, { force: true })
  }
})

test("blank PDF page (no content stream) still merges in A4 mode", async ({ page }) => {
  await upload(page, [{ name: "blank.pdf", mimeType: "application/pdf", buffer: await makePdf(2, true) }])
  await page.locator("select").selectOption("a4")
  const out = await mergeAndLoad(page)
  expect(out.getPageCount()).toBe(2)
  for (const p of out.getPages()) expect(p.getWidth()).toBeCloseTo(595.28, 1)
})

test("page makes no network requests with file contents (client-side claim)", async ({ page }) => {
  const posts: string[] = []
  page.on("request", (r) => { if (r.method() !== "GET") posts.push(r.method() + " " + r.url()) })
  await fourFiles(page)
  await mergeAndLoad(page)
  expect(posts).toEqual([])
})
