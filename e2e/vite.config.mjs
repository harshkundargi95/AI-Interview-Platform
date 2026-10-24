import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)), envDir: false,
  plugins: [react()],
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('http://127.0.0.1:3101/api/v1') },
  server: { host: '127.0.0.1', port: 4173, strictPort: true,
    fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] },
    proxy: { '/fixture-token': 'http://127.0.0.1:3101' } },
})
