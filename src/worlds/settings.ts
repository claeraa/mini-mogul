/**
 * The player's own preferences: sound, motion, text size and contrast. Plain
 * logic with no browser code, so the same checks run in the tests. Saved on
 * this device only (see lib/storage.ts).
 */

export const TEXT_SIZES = ['normal', 'large', 'larger'] as const
export type TextSize = (typeof TEXT_SIZES)[number]

/** How much each text size enlarges the whole interface's type. */
export const TEXT_SCALE: Record<TextSize, number> = {
  normal: 1,
  large: 1.15,
  larger: 1.3,
}

export type Settings = {
  /** Master switch. Off by default so nothing ever plays unasked. */
  sound: boolean
  music: boolean
  sfx: boolean
  /** null follows the device's prefers-reduced-motion setting. */
  reduceMotion: boolean | null
  /** Larger type throughout, for easier reading. */
  textSize: TextSize
  /** Darker text, solid backgrounds and stronger outlines. */
  highContrast: boolean
}

export const defaultSettings: Settings = {
  sound: false,
  music: true,
  sfx: true,
  reduceMotion: null,
  textSize: 'normal',
  highContrast: false,
}

/**
 * Reads saved settings, keeping each value only if it is the right kind.
 * Anything missing or damaged falls back to its default, so settings saved
 * by an older version of the game still load.
 */
export function parseSettings(value: unknown): Settings {
  const saved = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  const flag = (key: 'sound' | 'music' | 'sfx' | 'highContrast') =>
    typeof saved[key] === 'boolean' ? (saved[key] as boolean) : defaultSettings[key]
  return {
    sound: flag('sound'),
    music: flag('music'),
    sfx: flag('sfx'),
    reduceMotion: typeof saved.reduceMotion === 'boolean' ? saved.reduceMotion : null,
    textSize: (TEXT_SIZES as readonly unknown[]).includes(saved.textSize)
      ? (saved.textSize as TextSize)
      : defaultSettings.textSize,
    highContrast: flag('highContrast'),
  }
}
