import assert from 'node:assert/strict'
import { test } from 'node:test'

/**
 * A stand-in phone browser. Like mobile Safari and Chrome, it only lets an
 * AudioContext start running when resume() is called during a tap; resume()
 * at any other time leaves it suspended.
 */
let inGesture = false
const contexts: FakeContext[] = []

class FakeContext {
  state: 'suspended' | 'running' | 'interrupted' = 'suspended'
  currentTime = 0
  sampleRate = 44100
  destination = {}
  started = 0
  listeners: (() => void)[] = []
  createdInGesture = inGesture
  constructor() {
    contexts.push(this)
  }
  addEventListener(_name: string, fn: () => void) {
    this.listeners.push(fn)
  }
  resume() {
    if (inGesture) {
      this.state = 'running'
      for (const fn of this.listeners) fn()
      return Promise.resolve()
    }
    return Promise.reject(new Error('NotAllowedError'))
  }
  node() {
    const node = {
      connect: () => node,
      disconnect: () => {},
      start: () => void (this.started += 1),
      stop: () => {},
      type: '',
      buffer: null as unknown,
      Q: { value: 0 },
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      gain: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, setTargetAtTime: () => {} },
    }
    return node
  }
  createOscillator() { return this.node() }
  createGain() { return this.node() }
  createBufferSource() { return this.node() }
  createBiquadFilter() { return this.node() }
  createBuffer() { return { getChannelData: () => new Float32Array(8) } }
}

const handlers = new Map<string, (() => void)[]>()
const timers: (() => void)[] = []
const scope = globalThis as Record<string, unknown>
scope.window = {
  AudioContext: FakeContext,
  addEventListener: (name: string, fn: () => void) => handlers.set(name, [...(handlers.get(name) ?? []), fn]),
  removeEventListener: () => {},
  setInterval: (fn: () => void) => timers.push(fn),
  clearInterval: () => void (timers.length = 0),
  setTimeout: () => 0,
}
scope.document = { hidden: false, addEventListener: () => {}, removeEventListener: () => {} }

/** Runs code the way the browser runs a tap handler. */
const tap = (fn: () => void) => {
  inGesture = true
  try {
    for (const listener of handlers.get('pointerup') ?? []) listener()
    fn()
  } finally {
    inGesture = false
  }
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

test('sound on a phone: starts from the tap, never before, and comes back after an interruption', async () => {
  // Loaded this way because the audio engine is browser code.
  const audio = await import(new URL('../src/lib/audio.ts', import.meta.url).href)
  audio.initAudio()

  // 1. Sound is off by default: tapping around creates no audio at all.
  audio.setAudioPrefs({ sound: false, music: true, sfx: true })
  tap(() => {})
  audio.playSfx('plop')
  assert.equal(contexts.length, 0)

  // 2. The player taps the sound switch. Audio must start inside that tap;
  //    the saved setting only reaches the engine afterwards.
  tap(() => audio.unlockAudio(true))
  assert.equal(contexts.length, 1)
  const ctx = contexts[0]
  assert.equal(ctx.createdInGesture, true)
  assert.equal(ctx.state, 'running')
  const beforeMusic = ctx.started
  audio.setAudioPrefs({ sound: true, music: true, sfx: true }) // the later, out-of-tap update
  await settle()
  assert.ok(ctx.started > beforeMusic, 'music should begin once sound is on')
  assert.equal(timers.length, 1)

  // 3. Sound effects play.
  const beforeSfx = ctx.started
  audio.playSfx('plop')
  assert.ok(ctx.started > beforeSfx)

  // 4. Switching music off stops it; sound effects still work.
  audio.setAudioPrefs({ sound: true, music: false, sfx: true })
  assert.equal(timers.length, 0)

  // 5. The phone interrupts audio (a call, the lock screen). Nothing can be
  //    scheduled, and nothing throws.
  audio.setAudioPrefs({ sound: true, music: true, sfx: true })
  ctx.state = 'interrupted'
  for (const fn of ctx.listeners) fn() // the browser announces the change
  assert.equal(timers.length, 0, 'music stops scheduling while the phone has audio paused')
  const frozen = ctx.started
  audio.playSfx('chime')
  assert.equal(ctx.started, frozen)

  // 6. The next tap anywhere resumes the same context, and music returns.
  tap(() => {})
  await settle()
  assert.equal(ctx.state, 'running')
  assert.equal(contexts.length, 1)
  assert.ok(ctx.started > frozen)

  // 7. Turning sound off silences everything.
  audio.setAudioPrefs({ sound: false, music: true, sfx: true })
  const silent = ctx.started
  audio.playSfx('plop')
  assert.equal(ctx.started, silent)
  assert.equal(timers.length, 0)
})
