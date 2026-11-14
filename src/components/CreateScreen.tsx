import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Progress, ThemeId } from '../lib/storage.ts'
import { DISCARD_COPY, THEMES } from '../lib/constants.ts'
import { CloseButton, ConfirmDialog } from './ConfirmDialog.tsx'
import { ShopPreview } from './ShopPreview.tsx'
import { SparkIcon, TactileButton } from './StartButton.tsx'

type ShopValues = { shopName: string; theme: ThemeId; offering: string }

type CreateScreenProps = {
  progress: Progress
  /** True when the idea being shaped has not been saved yet. */
  unsavedDraft: boolean
  /** Name of an already saved shop that saving this one would replace. */
  replacesShop?: string
  /** Back to the idea screen. */
  onBack: () => void
  /** Leave for home, dropping whatever is unsaved. */
  onExit: () => void
  onPlay: () => void
  onDirtyChange: (dirty: boolean) => void
  onSave: (values: ShopValues) => void
}

function suggestShopName(playerName: string, idea: string) {
  const words = idea
    .replace(/^(a|an|the)\s+/i, '')
    .split(/\s+/)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return (playerName ? `${playerName}'s ${words}` : words).slice(0, 40)
}

export function CreateScreen({
  progress,
  unsavedDraft,
  replacesShop,
  onBack,
  onExit,
  onPlay,
  onDirtyChange,
  onSave,
}: CreateScreenProps) {
  // What the form looked like when it was last opened or saved.
  const [baseline, setBaseline] = useState<ShopValues>(() => ({
    shopName:
      progress.shopName || suggestShopName(progress.playerName, progress.idea),
    theme: progress.theme,
    offering: progress.offering,
  }))
  const [shopName, setShopName] = useState(baseline.shopName)
  const [theme, setTheme] = useState<ThemeId>(baseline.theme)
  const [offering, setOffering] = useState(baseline.offering)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(progress.step !== 'ready')
  const [leaving, setLeaving] = useState<'home' | 'back' | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const fieldsChanged =
    editing &&
    (shopName !== baseline.shopName ||
      theme !== baseline.theme ||
      offering !== baseline.offering)
  // Leaving for home also abandons a planted-but-unsaved idea.
  const dirty = fieldsChanged || (editing && unsavedDraft)

  useEffect(() => {
    headingRef.current?.focus()
  }, [editing])

  useEffect(() => {
    onDirtyChange(dirty)
    return () => onDirtyChange(false)
  }, [dirty, onDirtyChange])

  const finishLeaving = (target: 'home' | 'back') => {
    setLeaving(null)
    if (target === 'home') onExit()
    else onBack()
  }

  const requestLeave = (target: 'home' | 'back') => {
    // Going back keeps a planted idea; going home abandons it too.
    const needsConfirm = target === 'home' ? dirty : fieldsChanged
    if (needsConfirm) setLeaving(target)
    else finishLeaving(target)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!shopName.trim()) {
      setError('Give your shop a name so customers can find it.')
      nameRef.current?.focus()
      return
    }
    const saved = {
      shopName: shopName.trim(),
      theme,
      offering: offering.trim(),
    }
    onSave(saved)
    setBaseline(saved)
    setShopName(saved.shopName)
    setOffering(saved.offering)
    setEditing(false)
  }

  if (!editing) {
    return (
      <section className="card card--ready">
        <CloseButton label="Close and return home" onClick={onExit} />
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
          Your shop is saved on this device. Open it to set a price, make your
          first items and meet your customers.
        </p>
        <div className="card__actions card__actions--stack">
          <TactileButton size="large" onClick={onPlay}>
            <SparkIcon />
            Open Your Shop
          </TactileButton>
          <div className="card__links">
            <button
              type="button"
              className="text-button"
              onClick={() => setEditing(true)}
            >
              Edit shop
            </button>
            <button type="button" className="text-button" onClick={onExit}>
              Back to the island
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <CloseButton
        label="Close and return home"
        onClick={() => requestLeave('home')}
      />
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

      {replacesShop && (
        <p className="card__note card__note--warn">
          You already have a saved shop, {replacesShop}. It stays safe unless
          you save this one, which will replace it and start again from day 1.
        </p>
      )}

      <div className="card__actions">
        <button
          type="button"
          className="text-button"
          onClick={() => requestLeave('back')}
        >
          Back
        </button>
        <TactileButton type="submit">Save my shop</TactileButton>
      </div>

      <ConfirmDialog
        open={leaving !== null}
        {...DISCARD_COPY}
        onKeep={() => setLeaving(null)}
        onConfirm={() => leaving && finishLeaving(leaving)}
      />
    </form>
  )
}
