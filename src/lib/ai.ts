import { parseCoaching, parseWorldDirection } from '../ai/schema.ts'
import type { Coaching, WorldDirection } from '../ai/schema.ts'
import { ideaKey } from '../ai/world.ts'
import { coachFacts } from '../game/coach.ts'
import type { BusinessModel, DayResult } from '../game/model.ts'

/**
 * The browser's side of the AI Imagination Director. It talks only to this
 * site's own /api/ai endpoint (never to an AI company directly, and it holds
 * no key), checks every reply again, and returns null on any problem so the
 * caller can carry on with the built-in rules.
 *
 * Only the business idea, the first product and the day's numbers are sent.
 * The player's name never leaves the device.
 */

/** Longer than the server's own limit, so the server's answer wins. */
const CLIENT_TIMEOUT_MS = 45_000


async function call(path: string, body?: unknown): Promise<Record<string, unknown> | null> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS)
  try {
    const response = await fetch(`/api/ai/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
    if (!response.ok) return null
    const data: unknown = await response.json()
    return typeof data === 'object' && data !== null
      ? (data as Record<string, unknown>)
      : null
  } catch {
    // Offline, timed out, no server, or not JSON: all mean "no AI right now".
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

/** Identical requests share one call, so a re-render never pays twice. */
const inFlight = new Map<string, Promise<unknown>>()

function once<T>(key: string, start: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined
  if (existing) return existing
  const promise = start()
  // Keep successes for the session; let failures be retried.
  void promise.then((value) => {
    if (value === null) inFlight.delete(key)
  })
  inFlight.set(key, promise)
  return promise
}

let availability: Promise<boolean> | null = null

/** Whether this site has an AI Director switched on. Asked once. */
export function aiAvailable(): Promise<boolean> {
  availability ??= call('status').then((data) => data?.available === true)
  return availability
}

// ---- Worlds -------------------------------------------------------------------

/**
 * Asks the Director to imagine a world. Null means "use the built-in rules".
 * The reply belongs to the world that asked: the caller stores it in that
 * world's own save, and requests from different worlds are never shared.
 */
export function requestWorldDirection(
  worldId: string,
  idea: string,
  offering: string,
): Promise<WorldDirection | null> {
  return once(`world:${worldId}|${ideaKey(idea)}|${offering.trim().toLowerCase()}`, async () => {
    const data = await call('world', { idea, offering })
    return parseWorldDirection(data?.direction)
  })
}

// ---- Coaching -----------------------------------------------------------------

/** Asks the Director to coach on one finished day. Null means "use the built-in coach". */
export function requestCoaching(
  model: BusinessModel,
  result: DayResult,
  shop: { worldId: string; idea: string; offering: string },
): Promise<Coaching | null> {
  const { worldId, ...about } = shop
  return once(`coach:${worldId}|${ideaKey(shop.idea)}|${JSON.stringify(result)}`, async () => {
    const data = await call('coach', { ...about, result })
    // The same number check the server ran, against this device's own figures.
    const facts = coachFacts(model, result)
    return parseCoaching(data?.coaching, facts.allowed, facts.outcome)
  })
}
