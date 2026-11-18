import { defineConfig } from "@playwright/test"

// Staging = the production build served by `next start`, same as it ships.
const PORT = 3100
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  workers: 1,
  reporter: [["list"]],
  use: { channel: "chromium", baseURL: `http://localhost:${PORT}`, acceptDownloads: true, screenshot: "only-on-failure" },
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
