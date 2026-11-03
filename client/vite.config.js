import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
  // Local production builds remain useful; hosted builds must never fall back to localhost.
  if (process.env.VERCEL === '1') {
    let url
    try { url = new URL(env.VITE_API_URL) } catch { throw new Error('Set the hosted VITE_API_URL before building.') }
    if (url.protocol !== 'https:' || url.pathname !== '/api/v1' || url.search || url.hash || url.username || url.password || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('VITE_API_URL must be the HTTPS API URL ending in /api/v1.')
    const deploymentMode = env.VITE_DEPLOYMENT_MODE || 'production'
    if (!['production', 'demo'].includes(deploymentMode)) throw new Error('VITE_DEPLOYMENT_MODE must be production or demo.')
    const prefix = deploymentMode === 'demo' ? 'pk_test_' : 'pk_live_'
    if (!env.VITE_CLERK_PUBLISHABLE_KEY?.startsWith(prefix)) throw new Error('Clerk publishable key must match the selected deployment mode.')
  }
  return { plugins: [react()] }
})
