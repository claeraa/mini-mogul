import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { aiDirectorPlugin } from './server/vitePlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server-side only. These names have no VITE_ prefix on purpose, so Vite
  // never copies them into the code that is sent to the browser.
  const env = loadEnv(mode, process.cwd(), '')
  // The AI must be switched on deliberately, so a key that happens to be set
  // in someone's shell can never run up charges by surprise.
  const enabled = env.AI_DIRECTOR === 'on'
  return {
    plugins: [
      react(),
      aiDirectorPlugin({
        ANTHROPIC_API_KEY: enabled ? env.ANTHROPIC_API_KEY : undefined,
        AI_MODEL: env.AI_MODEL,
      }),
    ],
  }
})
