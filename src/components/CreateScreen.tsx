import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Progress, ThemeId } from '../lib/storage.ts'
import { SparkIcon, TactileButton } from './StartButton.tsx'

type CreateScreenProps = {
  progress: Progress
  onBack: () => void
  onHome: () => void
  onSave: (values: {
    shopName: string
    theme: ThemeId
    offering: string
  }) => void
}

const THEMES: { id: ThemeId; label: string; roof: string; trim: string }[] = [
  { id: 'cottage', label: 'Cozy cottage', roof: '#f0705f', trim: '#ffd978' },
  { id: 'forest', label: 'Enchanted forest', roof: '#3fa56b', trim: '#d6f58c' },
  { id: 'seaside', label: 'Seaside', roof: '#2aa9c4', trim: '#ffe9c2' },
  { id: 'starlight', label: 'Starlight', roof: '#7667d8', trim: '#ffd978' },
]

function suggestShopName(playerName: string, idea: string) {
  const words = idea
    .replace(/^(a|an|the)\s+/i, '')
    .split(/\s+/)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return (playerName ? `${playerName}'s ${words}` : words).slice(0, 40)
}

function ShopPreview({ theme, name }: { theme: ThemeId; name: string }) {
  const { roof, trim } = THEMES.find((t) => t.id === theme) ?? THEMES[0]
  return (
    <figure className="shop-preview">
      <svg viewBox="0 0 240 150" aria-hidden="true">
        <ellipse cx="120" cy="134" rx="96" ry="12" fill="#6cc763" />
        <rect x="62" y="62" width="116" height="74" rx="8" fill="#fff3dc" />
        <path d="M150 62h20a8 8 0 0 1 8 8v58a8 8 0 0 1-8 8h-20z" fill="#efd6b6" />
        <path
          d="M52 66l68-52 68 52z"
          fill={roof}
          stroke={roof}
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <circle cx="120" cy="46" r="12" fill="#fff3dc" />
        <path
          d="M120 38c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z"
          fill={trim}
          stroke="#e8a92a"
          strokeWidth="0.800"
        />
        <rect x="74" y="92" width="44" height="28" rx="4" fill={trim} />
        <path d="M96 92v28M74 106h44" stroke="#fff" strokeWidth="2" opacity="0.7" />
        <path d="M70 78h52v10a6.500 6.500 0 0 1-13 0 6.500 6.500 0 0 1-13 0 6.500 6.500 0 0 1-13 0 6.500 6.500 0 0 1-13 0z" fill="#fff" />
        <path d="M83 78h13v10a6.500 6.500 0 0 1-13 0zM109 78h13v10a6.500 6.500 0 0 1-13 0z" fill={roof} />
        <path d="M134 136v-34a13 13 0 0 1 26 0v34z" fill={roof} />
        <circle cx="153" cy="116" r="2.500" fill="#fff3dc" />
      </svg>
      <figcaption className="shop-preview__sign">
        {name.trim() || 'Your shop name'}
      </figcaption>
    </figure>
  )
}

export function CreateScreen({
  progress,
  onBack,
  onHome,
  onSave,
}: CreateScreenProps) {
  const [shopName, setShopName] = useState(
    progress.shopName || suggestShopName(progress.playerName, progress.idea),
  )
  const [theme, setTheme] = useState<ThemeId>(progress.theme)
  const [offering, setOffering] = useState(progress.offering)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(progress.step !== 'ready')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [editing])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!shopName.trim()) {
      setError('Give your shop a name so customers can find it.')
      nameRef.current?.focus()
      return
    }
    onSave({ shopName: shopName.trim(), theme, offering: offering.trim() })
    setEditing(false)
  }

  if (!editing) {
    return (
      <section className="card card--ready">
        <p className="card__step">
          <SparkIcon />
          Shop saved
        </p>
        <h1 className="card__title" ref={headingRef} tabIndex={-1}>
          {shopName} is ready to open
        </h1>
        <ShopPreview theme={theme} name={shopName} />
        <dl className="summary">
          <div>
            <dt>The idea</dt>
            <dd>{progress.idea}</dd>
          </div>
          {offering && (
            <div>
              <dt>First on the shelf</dt>
              <dd>{offering}</dd>
            </div>
          )}
        </dl>
        <p className="card__note">
          Opening day, where you set prices and meet your first customers, is
          the next part of Mini Mogul to be built. Your shop is saved on this
          device until then.
        </p>
        <div className="card__actions">
          <button
            type="button"
            className="text-button"
            onClick={() => setEditing(true)}
          >
            Edit shop
          </button>
          <TactileButton onClick={onHome}>Back to the island</TactileButton>
        </div>
      </section>
    )
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <p className="card__step">
        <SparkIcon />
        Create
      </p>
      <h1 className="card__title" ref={headingRef} tabIndex={-1}>
        Shape your shop
      </h1>
      <p className="card__idea">
        <span>Your idea</span>
        {progress.idea}
      </p>

      <ShopPreview theme={theme} name={shopName} />

      <div className="field">
        <label htmlFor="shop-name">Shop name</label>
        <input
          id="shop-name"
          ref={nameRef}
          type="text"
          maxLength={40}
          value={shopName}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'shop-name-error' : undefined}
          onChange={(event) => {
            setShopName(event.target.value)
            if (error) setError('')
          }}
        />
        {error && (
          <p
            id="shop-name-error"
            className="field__help field__help--error"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>

      <fieldset className="field themes">
        <legend>Shop style</legend>
        <div className="themes__grid">
          {THEMES.map((option) => (
            <label key={option.id} className="theme-option">
              <input
                type="radio"
                name="shop-theme"
                value={option.id}
                checked={theme === option.id}
                onChange={() => setTheme(option.id)}
              />
              <span
                className="theme-option__swatch"
                style={{ background: option.roof }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="first-offering">
          What is the first thing you will sell or do?
        </label>
        <input
          id="first-offering"
          type="text"
          maxLength={50}
          placeholder="Cloud cupcakes, dragon naps, dog walks…"
          value={offering}
          onChange={(event) => setOffering(event.target.value)}
        />
      </div>

      <div className="card__actions">
        <button type="button" className="text-button" onClick={onBack}>
          Back
        </button>
        <TactileButton type="submit">Save my shop</TactileButton>
      </div>
    </form>
  )
}
