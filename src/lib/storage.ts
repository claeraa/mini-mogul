import { loadStore, saveStore } from '../worlds/store.ts'
import type { KeyValue, Shop, WorldStore } from '../worlds/store.ts'

export type Settings = {
  /** Master switch. Off by default so nothing ever plays unasked. */
  sound: boolean
  music: boolean
  sfx: boolean
  /** null follows the device's prefers-reduced-motion setting. */
  reduceMotion: boolean | null
}

/** The four shop styles. */
export type ThemeId = Shop['theme']

/** One world's shop details. (Kept under its original name.) */
export type Progress = Shop

const SETTINGS_KEY = 'mini-mogul:settings'

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

// ---- My Worlds ----------------------------------------------------------------

/** A new id that has never been used on this device. */
export function makeWorldId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}

/** localStorage, or a stand-in that remembers nothing when it is unavailable. */
function deviceStorage(): KeyValue {
  try {
    const storage = window.localStorage
    storage.getItem('mini-mogul:settings')
    return storage
  } catch {
    return { getItem: () => null, setItem: () => {} }
  }
}

/** Loads every saved world, bringing an older single save across the first time. */
export function loadWorlds(): WorldStore {
  return loadStore(deviceStorage(), makeWorldId, Date.now())
}

export function saveWorlds(store: WorldStore) {
  saveStore(deviceStorage(), store)
}
