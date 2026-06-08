/// <reference types="vitest" />
import { createRequire } from 'module'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)
const { version } = require('./package.json') as { version: string }

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
    // Vite 8 no longer auto-forwards OS env vars to import.meta.env — explicit forwarding required
    'import.meta.env.VITE_API_URL': process.env.VITE_API_URL ? JSON.stringify(process.env.VITE_API_URL) : 'undefined',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/test-setup.ts'],
    globals: true,
    env: { TZ: 'UTC' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      exclude: [
        // shadcn/ui generated files — not business logic, not worth unit testing
        'src/components/ui/dropdown-menu.tsx',
        // SVG canvas components with complex pointer/drag event logic — tested via
        // Playwright E2E tests; intentionally mocked in all parent component tests
        'src/components/beds/BedGrid.tsx',
        'src/components/gardens/GardenGrid.tsx',
        'src/components/shared/PlacementCanvas.tsx',
      ],
      thresholds: {
        statements: 85,
        branches: 70,
        functions: 85,
        lines: 85,
      },
    },
  },
})
