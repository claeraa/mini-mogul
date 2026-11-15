import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { createAiEndpoint } from './http.ts'
import type { AiSettings } from './http.ts'

/**
 * Serves /api/ai/* from the same local server as the game, in both
 * `npm run dev` and `npm run preview`. The hosted game uses serve.ts, which
 * mounts the same endpoint.
 */
export function aiDirectorPlugin(settings: AiSettings): Plugin {
  const endpoint = createAiEndpoint(settings)
  const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!endpoint.respond(req, res)) next()
  }

  return {
    name: 'mini-mogul-ai-director',
    configureServer(server) {
      console.info(endpoint.summary)
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
