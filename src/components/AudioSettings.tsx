import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import type { Settings } from '../lib/storage.ts'
import { TEXT_SIZES } from '../worlds/settings.ts'
import type { TextSize } from '../worlds/settings.ts'

const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  normal: 'Normal text',
  large: 'Large text',
  larger: 'Largest text',
}

type AudioSettingsProps = {
  settings: Settings
  reducedMotion: boolean
  onChange: (patch: Partial<Settings>) => void
}

export function Switch({
  label,
  hint,
  checked,
  onToggle,
}: {
  label: string
  hint?: string
  checked: boolean
  onToggle: () => void
}) {
  const id = useId()
  return (
    <div className="setting-row">
      <div>
        <span id={`${id}-label`} className="setting-row__label">
          {label}
        </span>
        {hint && (
          <span id={`${id}-hint`} className="setting-row__hint">
            {hint}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        className="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={onToggle}
      >
        <span className="switch__thumb" />
      </button>
    </div>
  )
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.500"
        strokeLinejoin="round"
      />
      {on ? (
        <path
          d="M15.500 9a4.200 4.200 0 0 1 0 6M18 6.500a7.800 7.800 0 0 1 0 11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M15.500 9.500l5 5m0-5l-5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="7.5" strokeWidth="3.4" strokeDasharray="3.2 2.69" />
      <circle cx="12" cy="12" r="5.6" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" strokeWidth="0" />
    </svg>
  )
}

/** Top-corner sound toggle plus the floating settings panel. */
export function AudioSettings({
  settings,
  reducedMotion,
  onChange,
}: AudioSettingsProps) {
  const [open, setOpen] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)
  const gearRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        gearRef.current?.focus()
      }
    }
    const onPointer = (event: PointerEvent) => {
      if (!dockRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div className="dock" ref={dockRef}>
      <button
        type="button"
        className="dock-button"
        aria-pressed={settings.sound}
        aria-label={settings.sound ? 'Sound on' : 'Sound off'}
        title={settings.sound ? 'Turn sound off' : 'Turn sound on'}
        onClick={() => onChange({ sound: !settings.sound })}
      >
        <SoundIcon on={settings.sound} />
      </button>
      <button
        type="button"
        ref={gearRef}
        className="dock-button"
        aria-label="Settings"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <GearIcon />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            className="settings-panel"
            role="dialog"
            aria-label="Settings"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <h2 className="settings-panel__title">Settings</h2>
            <Switch
              label="Sound"
              hint="Off until you switch it on. On a phone, check it is not on silent."
              checked={settings.sound}
              onToggle={() => onChange({ sound: !settings.sound })}
            />
            <Switch
              label="Music"
              checked={settings.music}
              onToggle={() => onChange({ music: !settings.music })}
            />
            <Switch
              label="Sound effects"
              checked={settings.sfx}
              onToggle={() => onChange({ sfx: !settings.sfx })}
            />
            <hr />
            <div className="setting-row" role="group" aria-labelledby={`${panelId}-text`}>
              <span>
                <span className="setting-row__label" id={`${panelId}-text`}>
                  Text size
                </span>
              </span>
              <span className="text-sizes">
                {TEXT_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className="text-size"
                    aria-pressed={settings.textSize === size}
                    aria-label={TEXT_SIZE_LABELS[size]}
                    onClick={() => onChange({ textSize: size })}
                  >
                    A
                  </button>
                ))}
              </span>
            </div>
            <Switch
              label="High contrast"
              hint="Darker words and stronger outlines."
              checked={settings.highContrast}
              onToggle={() => onChange({ highContrast: !settings.highContrast })}
            />
            <div className="setting-row">
              <span>
                <span className="setting-row__label">First-day guide</span>
                <span className="setting-row__hint" role="status">
                  {settings.guide === 'replay' ? 'It will show when you plan a day.' : 'Three quick tips for running a shop.'}
                </span>
              </span>
              <button
                type="button"
                className="text-button"
                onClick={() => onChange({ guide: 'replay' })}
                disabled={settings.guide === 'replay'}
              >
                Show again
              </button>
            </div>
            <Switch
              label="Reduce motion"
              hint="Calms the floating, drifting and zooming."
              checked={reducedMotion}
              onToggle={() => onChange({ reduceMotion: !reducedMotion })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
