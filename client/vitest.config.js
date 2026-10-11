import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Full interview journeys type answers and exercise routing; allow slower Windows runners.
  test: { testTimeout: 15000, environment: 'jsdom', setupFiles: ['./src/test/setup.js'] },
})
