import { parseGame } from '../game/state.ts'
import type { GameState } from '../game/state.ts'

export type Settings = {
  /** Master switch. Off by default so nothing ever plays unasked. */
  sound: boolean
  music: boolean
  sfx: boolean
  /** null follows the device's prefers-reduced-motion setting. */
  reduceMotion: boolean | null
}

export type ThemeId = 'cottage' | 'forest' | 'seaside' | 'starlight'

export type Progress = {
  step: 'create' | 'ready'
  playerName: string
  idea: string
  shopName: string
  theme: ThemeId
  offering: string
}

const SETTINGS_KEY = 'mini-mogul:settings'
const PROGRESS_KEY = 'mini-mogul:progress'

export const defaultSettings: Settings = {
  sound: false,
  music: true,
  sfx: true,
  reduceMotion: null,
}

function read<T>(key: string): Partial<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    return typeof value === 'object' && value !== null
      ? (value as Partial<T>)
      : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode); the game still works.
  }
}

export function loadSettings(): Settings {
  return { ...defaultSettings, ...read<Settings>(SETTINGS_KEY) }
}

export function saveSettings(settings: Settings) {
  write(SETTINGS_KEY, settings)
}

export function loadProgress(): Progress | null {
  const saved = read<Progress>(PROGRESS_KEY)
  if (!saved || typeof saved.idea !== 'string' || !saved.idea.trim()) {
    return null
  }
  return {
    step: saved.step === 'ready' ? 'ready' : 'create',
    playerName: saved.playerName ?? '',
    idea: saved.idea,
    shopName: saved.shopName ?? '',
    theme: saved.theme ?? 'cottage',
    offering: saved.offering ?? '',
  }
}

export function saveProgress(progress: Progress) {
  write(PROGRESS_KEY, progress)
}

// ---- Opening-day game ------------------------------------------------------

const GAME_KEY = 'mini-mogul:game'

export function loadGame(): GameState | null {
  return parseGame(read<GameState>(GAME_KEY))
}

export function saveGame(game: GameState) {
  write(GAME_KEY, game)
}

export function clearGame() {
  try {
    localStorage.removeItem(GAME_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
