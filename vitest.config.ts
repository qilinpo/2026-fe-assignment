import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Playwright owns e2e/; Vitest would otherwise pick up its *.spec.ts.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    css: true,
    restoreMocks: true,
    // Same results on every machine and in CI, whatever the local timezone.
    env: { TZ: 'Asia/Singapore' },
  },
})
