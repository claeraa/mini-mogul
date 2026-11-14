import { STYLE_PALETTES } from '../world/blueprint.ts'
import type { ThemeId } from './storage.ts'

/** The shop styles the player can pick; colours come from the blueprint. */
export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: 'cottage', label: 'Cozy cottage', swatch: STYLE_PALETTES.cottage.roof },
  { id: 'forest', label: 'Enchanted forest', swatch: STYLE_PALETTES.forest.roof },
  { id: 'seaside', label: 'Seaside', swatch: STYLE_PALETTES.seaside.roof },
  { id: 'starlight', label: 'Starlight', swatch: STYLE_PALETTES.starlight.roof },
]

/** Wording for the leave-without-saving dialog. */
export const DISCARD_COPY = {
  title: 'Discard your changes?',
  message:
    "You're about to leave without saving. Any unsaved progress will be lost.",
  keepLabel: 'Keep creating',
  confirmLabel: 'Discard and leave',
} as const
