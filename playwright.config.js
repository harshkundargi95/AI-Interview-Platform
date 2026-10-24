const { defineConfig } = require('@playwright/test')
module.exports = defineConfig({
  testDir: './e2e', testMatch: '**/*.spec.js', fullyParallel: false, workers: 1,
  timeout: 60000, retries: 0, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'node e2e/server.mjs', cwd: __dirname, url: 'http://127.0.0.1:3101/api/v1/live', reuseExistingServer: false },
    { command: 'npx vite --config e2e/vite.config.mjs', cwd: __dirname, url: 'http://127.0.0.1:4173', reuseExistingServer: false },
  ],
})
