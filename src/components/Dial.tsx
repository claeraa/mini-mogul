import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'

type DialProps = {
  label: string
  /** The big readout, e.g. "$3.00" or "12". */
  display: string
  /** Read by screen readers as the slider's value. */
  valueText: string
  value: number
  min: number
  max: number
  step: number
  hint?: ReactNode
  onChange: (value: number) => void
}

/** A chunky slider with minus and plus buttons for precise little steps. */
export function Dial({
  label,
  display,
  valueText,
  value,
  min,
  max,
  step,
  hint,
  onChange,
}: DialProps) {
  const id = useId()
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0

  return (
    <div className="dial">
      <div className="dial__top">
        <label htmlFor={id}>{label}</label>
        <output className="dial__value" htmlFor={id}>
          {display}
        </output>
      </div>
      <div className="dial__row">
        <button
          type="button"
          className="dial__step"
          aria-label={`Lower: ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 12h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={max <= min}
          aria-valuetext={valueText}
          aria-describedby={hint ? `${id}-hint` : undefined}
          style={{ '--fill': `${fill}%` } as CSSProperties}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <button
          type="button"
          className="dial__step"
          aria-label={`Raise: ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="field__help">
          {hint}
        </p>
      )}
    </div>
  )
}
