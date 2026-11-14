/**
 * All sound is synthesised in the browser with the Web Audio API, so there
 * are no audio files to license or fetch. Nothing plays until the player has
 * both interacted with the page and switched sound on.
 */

export type SfxName = 'plop' | 'chime' | 'whoosh'

type AudioPrefs = { sound: boolean; music: boolean; sfx: boolean }

let prefs: AudioPrefs = { sound: false, music: false, sfx: false }
let unlocked = false
let ctx: AudioContext | null = null
let musicGain: GainNode | null = null
let musicTimer: number | undefined

function getContext(): AudioContext | null {
  if (!unlocked || typeof AudioContext === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
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
  const shouldPlay =
    unlocked && prefs.sound && prefs.music && !document.hidden
  if (shouldPlay && musicTimer === undefined) {
    const ac = getContext()
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

/** Waits for the first real interaction before any audio may start. */
export function initAudio() {
  const unlock = () => {
    unlocked = true
    syncMusic()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
  document.addEventListener('visibilitychange', syncMusic)
  return () => {
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
    document.removeEventListener('visibilitychange', syncMusic)
  }
}
