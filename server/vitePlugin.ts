import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { createAiHandler } from './director.ts'
import { createAnthropicProvider } from './provider.ts'
import type { AiEnv } from './provider.ts'

/**
 * Serves /api/ai/* from the same local server as the game, in both
 * `npm run dev` and `npm run preview`. The handler is plain request-in,
 * response-out, so it can be mounted on any Node host later.
 */

const PREFIX = '/api/ai/'
const MAX_BODY_BYTES = 8 * 1024

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

export function aiDirectorPlugin(env: AiEnv): Plugin {
  const provider = createAnthropicProvider(env)
  const handle = createAiHandler(provider, { log: (message) => console.warn(message) })

  const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ?? ''
    if (!url.startsWith(PREFIX)) {
      next()
      return
    }
    const path = url.slice(PREFIX.length).split('?')[0]
    const method = req.method ?? 'GET'
    const respond = async () => {
      const body = method === 'POST' ? await readJson(req) : undefined
      const result = await handle(method, path, body)
      res.statusCode = result.status
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(result.body))
    }
    respond().catch(() => {
      res.statusCode = 500
      res.end('{"error":"unavailable"}')
    })
  }

  return {
    name: 'mini-mogul-ai-director',
    configureServer(server) {
      console.info(
        provider
          ? `[ai-director] on (${provider.name}, ${provider.model})`
          : '[ai-director] off (set AI_DIRECTOR=on and ANTHROPIC_API_KEY in .env.local); using the built-in rules',
      )
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
