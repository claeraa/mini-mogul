import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { aiDirectorPlugin } from './server/vitePlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server-side only. These names have no VITE_ prefix on purpose, so Vite
  // never copies them into the code that is sent to the browser.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      // The endpoint stays off unless AI_DIRECTOR is exactly "on".
      aiDirectorPlugin({
        AI_DIRECTOR: env.AI_DIRECTOR,
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
        AI_MODEL: env.AI_MODEL,
        AI_DAILY_LIMIT: env.AI_DAILY_LIMIT,
        AI_DEBUG: env.AI_DEBUG,
      }),
    ],
  }
})
