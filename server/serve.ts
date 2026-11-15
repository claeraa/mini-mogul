import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { createAiEndpoint } from './http.ts'

/**
 * The production server: one small Node process that serves the built game
 * from dist/ and the AI endpoint at /api/ai/*. Run `npm run build` first,
 * then `npm start`.
 *
 * Credentials come from the host's environment variables (or .env.local on
 * your own machine). They are read here, on the server, and nowhere else.
 */

const DIST = resolve(import.meta.dirname, '..', 'dist')
const PORT = Number(process.env.PORT) || 4173

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/index.html is missing. Run "npm run build" before "npm start".')
  process.exit(1)
}

const ai = createAiEndpoint({
  AI_DIRECTOR: process.env.AI_DIRECTOR,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  AI_MODEL: process.env.AI_MODEL,
  AI_DAILY_LIMIT: process.env.AI_DAILY_LIMIT,
})

/** The file for a URL path, or null if it is missing or outside dist/. */
function fileFor(urlPath: string): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(urlPath)
  } catch {
    return null
  }
  const file = normalize(join(DIST, decoded))
  if (file !== DIST && !file.startsWith(DIST + sep)) return null
  try {
    return statSync(file).isFile() ? file : null
  } catch {
    return null
  }
}

const server = createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')

  if (req.url === '/healthz') {
    res.setHeader('Content-Type', 'text/plain')
    res.end('ok')
    return
  }
  if (ai.respond(req, res)) return

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.end()
    return
  }

  const urlPath = (req.url ?? '/').split('?')[0]
  const asset = fileFor(urlPath)
  // A missing file with an extension is a real 404; anything else is the game.
  if (!asset && extname(urlPath)) {
    res.statusCode = 404
    res.end('Not found')
    return
  }
  const file = asset ?? join(DIST, 'index.html')
  res.setHeader('Content-Type', TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream')
  // Vite gives built assets a content hash, so they can be cached for good.
  res.setHeader(
    'Cache-Control',
    urlPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  )
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  createReadStream(file)
    .on('error', () => {
      if (!res.headersSent) res.statusCode = 500
      res.end()
    })
    .pipe(res)
})

server.listen(PORT, '0.0.0.0', () => {
  console.info(`Mini Mogul is running on port ${PORT}`)
  console.info(ai.summary)
})
