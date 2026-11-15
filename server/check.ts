import assert from 'node:assert/strict'
import { parseCoaching, parseWorldDirection } from '../src/ai/schema.ts'
import { buildWorld } from '../src/ai/world.ts'
import { coachFacts } from '../src/game/coach.ts'
import { EVENTS, PRODUCT_SHOP } from '../src/game/model.ts'
import { simulateDay } from '../src/game/simulation.ts'

/**
 * A supervised check of the real AI Director: `npm run ai:check`.
 *
 * It makes exactly TWO paid API calls through a running server (one world,
 * one coaching reply), then checks the replies with the same validators the
 * game uses. Start the server first (`npm run dev`, or `npm run build` and
 * `npm start`). It never reads or prints the API key.
 *
 *   npm run ai:check                      # against http://localhost:5173
 *   npm run ai:check -- http://localhost:4173
 */

const base = (process.argv[2] ?? 'http://localhost:5173').replace(/\/$/, '')
const idea = 'Star-polishing service for sleepy comets'
const offering = 'Sparkle polish'

async function call(path: string, body?: unknown) {
  const started = Date.now()
  const response = await fetch(`${base}/api/ai/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = (await response.json()) as Record<string, unknown>
  return { status: response.status, json, ms: Date.now() - started }
}

const status = await call('status').catch(() => null)
if (!status) {
  console.log(`No server is answering at ${base}. Start it first (npm run dev, or npm run build and npm start).`)
  process.exit(1)
}
if (status.json.available !== true) {
  console.log('The AI Director is OFF on this server, so no paid call was made.')
  console.log('Set AI_DIRECTOR=on and ANTHROPIC_API_KEY in .env.local, restart the server, and run this again.')
  process.exit(1)
}
console.log(`AI Director is on (${String(status.json.provider)}). Making 2 paid calls...\n`)

// 1. One imaginative business idea.
const world = await call('world', { idea, offering })
assert.equal(world.status, 200, `world call failed: ${JSON.stringify(world.json)}`)
const direction = parseWorldDirection(world.json.direction)
assert.ok(direction, 'the world reply did not pass validation')
const built = buildWorld({ idea, offering, style: 'starlight' }, direction)
assert.equal(built.source, 'ai')
console.log(`1. World for "${idea}" (${world.ms} ms): VALID`)
console.log(`   ${direction.label}: ${direction.summary}`)
console.log(`   ${direction.structure} in the ${direction.biome}, ${direction.timeOfDay}; props ${direction.props.join(', ')}`)
console.log(`   customers: ${direction.customers}; they say: ${direction.reactions.join(' / ')}`)
console.log(`   teaches: ${direction.concepts.map((c) => c.id).join(', ')}\n`)

// 2. One day from the financial engine, then one coaching reply about it.
const start = { day: 1, cashCents: PRODUCT_SHOP.startingCashCents, inventory: 0 }
const plan = { priceCents: 450, produce: 12, flyers: false }
const quiet = EVENTS.find((e) => e.id === 'tip') ?? EVENTS[0]
const result = simulateDay(PRODUCT_SHOP, start, plan, quiet)
const facts = coachFacts(PRODUCT_SHOP, result)

const coach = await call('coach', { idea, offering, result })
assert.equal(coach.status, 200, `coach call failed: ${JSON.stringify(coach.json)}`)
const coaching = parseCoaching(coach.json.coaching, facts.allowed, facts.truth)
assert.ok(coaching, 'the coaching reply did not pass validation (it may have used a number the engine did not produce)')
console.log(`2. Coaching for a ${facts.outcome} day (${coach.ms} ms): VALID, uses only the engine's numbers`)
console.log(`   ${coaching.encouragement}`)
console.log(`   ${coaching.suggestion}`)
if (coaching.challenge) console.log(`   ${coaching.challenge}`)

// 3. The AI changed nothing: the same day simulates to the same result.
assert.deepEqual(simulateDay(PRODUCT_SHOP, start, plan, quiet), result)
console.log('\n3. Financial engine: the same day gives the same numbers before and after the AI calls.')
console.log('\nAll checks passed.')
