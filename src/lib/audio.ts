/**
 * All sound is synthesised in the browser with the Web Audio API, so there
 * are no audio files to license or fetch. Nothing plays until the player has
 * both interacted with the page and switched sound on.
 *
 * Phones are strict about this. Mobile Safari and Chrome only let a page
 * start audio from inside a tap, click or key press: the AudioContext must
 * be created and resumed during that event, not a moment later. So the
 * context is only ever created by unlockAudio(), which runs inside real
 * input events, and music waits until the context reports it is running.
 * A phone can also suspend or interrupt audio (a call, a locked screen,
 * another app); the next tap resumes it.
 */

export type SfxName = 'plop' | 'chime' | 'whoosh'

type AudioPrefs = { sound: boolean; music: boolean; sfx: boolean }

let prefs: AudioPrefs = { sound: false, music: false, sfx: false }
let unlocked = false
let ctx: AudioContext | null = null
let musicGain: GainNode | null = null
let musicTimer: number | undefined
/** True once a silent sample has been played inside a gesture (older iOS needs it). */
let primed = false

type ContextClass = typeof AudioContext

function contextClass(): ContextClass | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as { AudioContext?: ContextClass; webkitAudioContext?: ContextClass }
  return scope.AudioContext ?? scope.webkitAudioContext ?? null
}

/** The context, but only if a gesture has already created it and it is playing. */
function getContext(): AudioContext | null {
  return ctx && ctx.state === 'running' ? ctx : null
}

/**
 * Makes sound possible. Must be called synchronously from a tap, click or
 * key handler: that is the only moment a phone allows audio to start.
 *
 * `wantSound` says whether the player has sound switched on (or is switching
 * it on with this very tap). With sound off nothing is created at all.
 */
export function unlockAudio(wantSound: boolean = prefs.sound) {
  unlocked = true
  if (!wantSound) return
  const Context = contextClass()
  if (!Context) return
  try {
    if (!ctx) {
      ctx = new Context()
      // Music starts, or picks up again, whenever the context starts running.
      ctx.addEventListener('statechange', syncMusic)
    }
    // 'suspended' before the first gesture; iOS also reports 'interrupted'
    // after a call or a locked screen. Both need a resume inside a gesture.
    if (ctx.state !== 'running') {
      void ctx.resume().then(syncMusic, () => {})
    }
    if (!primed) {
      const source = ctx.createBufferSource()
      source.buffer = ctx.createBuffer(1, 1, 22050)
      source.connect(ctx.destination)
      source.start(0)
      primed = true
    }
  } catch {
    // A browser that refuses audio simply stays quiet; the game still works.
  }
  syncMusic()
}

function tone(
  ac: AudioContext,
  dest: AudioNode,
  freq: number,
  at: number,
  attack: number,
  length: number,
  peak: number,
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, at)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.linearRampToValueAtTime(peak, at + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(gain).connect(dest)
  osc.start(at)
  osc.stop(at + length + 0.05)
  return osc
}

export function playSfx(name: SfxName) {
  if (!prefs.sound || !prefs.sfx) return
  const ac = getContext()
  if (!ac) return
  const now = ac.currentTime

  if (name === 'plop') {
    const osc = tone(ac, ac.destination, 520, now, 0.01, 0.18, 0.12)
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.14)
  } else if (name === 'chime') {
    ;[1318.5, 1760, 2093].forEach((freq, i) => {
      tone(ac, ac.destination, freq, now + i * 0.09, 0.01, 0.9, 0.07)
    })
  } else {
    const length = 0.6
    const buffer = ac.createBuffer(1, ac.sampleRate * length, ac.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const source = ac.createBufferSource()
    source.buffer = buffer
    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 0.8
    filter.frequency.setValueAtTime(300, now)
    filter.frequency.exponentialRampToValueAtTime(2200, now + length)
    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.06, now + 0.2)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length)
    source.connect(filter).connect(gain).connect(ac.destination)
    source.start(now)
  }
}

// A slow, generative pentatonic lullaby: soft sine notes that never repeat
// exactly. Original by construction.
const SCALE = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25]

function musicStep() {
  const ac = getContext()
  if (!ac || !musicGain) return
  const now = ac.currentTime
  const freq = SCALE[Math.floor(Math.random() * SCALE.length)]
  tone(ac, musicGain, freq, now, 0.5, 4.5, 0.5)
  if (Math.random() < 0.4) tone(ac, musicGain, freq / 2, now, 0.8, 5, 0.35)
}

function syncMusic() {
  const ac = getContext()
  // Music needs a running context: until a gesture has started one, or
  // while the phone has paused it, there is nothing to schedule.
  const shouldPlay =
    unlocked && prefs.sound && prefs.music && !document.hidden && ac !== null
  if (shouldPlay && musicTimer === undefined) {
    if (!ac) return
    musicGain = ac.createGain()
    musicGain.gain.value = 0.07
    musicGain.connect(ac.destination)
    musicStep()
    musicTimer = window.setInterval(musicStep, 2000)
  } else if (!shouldPlay && musicTimer !== undefined) {
    window.clearInterval(musicTimer)
    musicTimer = undefined
    if (ctx && musicGain) {
      const gain = musicGain
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15)
      window.setTimeout(() => gain.disconnect(), 1000)
    }
    musicGain = null
  }
}

export function setAudioPrefs(next: AudioPrefs) {
  prefs = next
  syncMusic()
}

/** The input events a phone accepts as "the player asked for this". */
const GESTURES = ['pointerup', 'touchend', 'click', 'keydown'] as const

/**
 * Listens for real interaction. The listeners stay for the whole visit, so
 * that after the phone pauses audio (a call, the lock screen, switching
 * apps) the very next tap brings it back. They run in the capture phase,
 * before the button's own handler, so a sound effect played by that handler
 * already has a running context.
 */
export function initAudio() {
  const onGesture = () => unlockAudio()
  for (const name of GESTURES) window.addEventListener(name, onGesture, true)
  document.addEventListener('visibilitychange', syncMusic)
  return () => {
    for (const name of GESTURES) window.removeEventListener(name, onGesture, true)
    document.removeEventListener('visibilitychange', syncMusic)
  }
}
