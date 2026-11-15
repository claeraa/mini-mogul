import type { IncomingMessage, ServerResponse } from 'node:http'
import { createAiHandler } from './director.ts'
import { createAnthropicProvider } from './provider.ts'
import type { AiEnv } from './provider.ts'

/**
 * The /api/ai/* request handling, shared by the Vite dev/preview servers
 * (vitePlugin.ts) and the production server (serve.ts), so the hosted game
 * runs exactly the code that was tested locally.
 */

const PREFIX = '/api/ai/'
const MAX_BODY_BYTES = 8 * 1024

export type AiSettings = AiEnv & {
  /** Must be exactly "on"; anything else leaves the AI off. */
  AI_DIRECTOR?: string
  /** Optional cap on AI calls per day across all players (default 300). */
  AI_DAILY_LIMIT?: string
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        resolve(undefined)
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        resolve(undefined)
      }
    })
    req.on('error', () => resolve(undefined))
  })
}

/**
 * Builds the AI endpoint from server-side settings. The AI must be switched
 * on deliberately, so a key that happens to be set can never run up charges
 * by surprise.
 */
export function createAiEndpoint(settings: AiSettings) {
  const enabled = settings.AI_DIRECTOR?.trim() === 'on'
  const provider = createAnthropicProvider({
    ANTHROPIC_API_KEY: enabled ? settings.ANTHROPIC_API_KEY : undefined,
    AI_MODEL: settings.AI_MODEL,
  })
  const perDay = Number(settings.AI_DAILY_LIMIT)
  const handle = createAiHandler(provider, {
    perDay: Number.isInteger(perDay) && perDay > 0 ? perDay : undefined,
    log: (message) => console.warn(message),
  })

  /** Answers the request if it is for /api/ai/*; otherwise returns false. */
  const respond = (req: IncomingMessage, res: ServerResponse): boolean => {
    const url = req.url ?? ''
    if (!url.startsWith(PREFIX)) return false
    const path = url.slice(PREFIX.length).split('?')[0]
    const method = req.method ?? 'GET'
    const run = async () => {
      const body = method === 'POST' ? await readJson(req) : undefined
      const result = await handle(method, path, body)
      res.statusCode = result.status
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(result.body))
    }
    run().catch(() => {
      res.statusCode = 500
      res.end('{"error":"unavailable"}')
    })
    return true
  }

  /** One line for the server log. Never includes the key. */
  const summary = provider
    ? `[ai-director] on (${provider.name}, ${provider.model})`
    : '[ai-director] off (set AI_DIRECTOR=on and ANTHROPIC_API_KEY); using the built-in rules'

  return { respond, summary }
}
