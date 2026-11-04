import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

/**
 * End-to-end tests run against the production build (`vite preview`), so
 * they exercise exactly what gets deployed: the static files plus the MSW
 * service worker answering /api requests in the browser.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    // Phone-sized Chromium: covers the full-screen sheet and sticky button.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
