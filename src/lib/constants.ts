import type { ThemeId } from './storage.ts'

export const THEMES: {
  id: ThemeId
  label: string
  roof: string
  trim: string
}[] = [
  { id: 'cottage', label: 'Cozy cottage', roof: '#f0705f', trim: '#ffd978' },
  { id: 'forest', label: 'Enchanted forest', roof: '#3fa56b', trim: '#d6f58c' },
  { id: 'seaside', label: 'Seaside', roof: '#2aa9c4', trim: '#ffe9c2' },
  { id: 'starlight', label: 'Starlight', roof: '#7667d8', trim: '#ffd978' },
]

/** Wording for the leave-without-saving dialog. */
export const DISCARD_COPY = {
  title: 'Discard your changes?',
  message:
    "You're about to leave without saving. Any unsaved progress will be lost.",
  keepLabel: 'Keep creating',
  confirmLabel: 'Discard and leave',
} as const
