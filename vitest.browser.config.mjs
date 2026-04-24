import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/browser/vitest/**/*.browser.test.mjs'],
    setupFiles: ['tests/setup.mjs', 'tests/browser/setup.browser.mjs'],
    testTimeout: 10000,
    fileParallelism: false,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium', name: 'chromium' }],
    },
  },
});
