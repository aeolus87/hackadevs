import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['tests/global-setup.ts'],
    setupFiles: ['tests/vitest-setup.ts'],
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      reporter: ['text', 'text-summary', 'lcov'],
    },
  },
})
