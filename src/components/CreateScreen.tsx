import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CONCEPTS } from '../ai/schema.ts'
import type { WorldDirection } from '../ai/schema.ts'
import { buildWorld } from '../ai/world.ts'
import type { World } from '../ai/world.ts'
import type { Progress, ThemeId } from '../lib/storage.ts'
import { DISCARD_COPY, THEMES } from '../lib/constants.ts'
import { CloseButton, ConfirmDialog } from './ConfirmDialog.tsx'
import { offeringLabel } from '../world/blueprint.ts'
import { SparkIcon, TactileButton } from './StartButton.tsx'
import { ProductIcon } from './WorldParts.tsx'
import { WorldScene } from './WorldScene.tsx'

type ShopValues = { shopName: string; theme: ThemeId; offering: string }

type CreateScreenProps = {
  progress: Progress
  /** The AI Director's checked reading of the idea, when there is one. */
  direction: WorldDirection | null
  /** 'off' when this site has no AI Director switched on. */
  ai: 'off' | 'idle' | 'thinking' | 'failed'
  onAskAi: (offering: string) => void
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

/**
 * What the Imagination Director made of the idea: who visits, what to sell
 * and what the business teaches. Says plainly when the built-in rules made
 * the world instead.
 */
function DirectorNotes({
  world,
  ai,
  onAskAi,
  onPickOffering,
}: {
  world: World
  ai: CreateScreenProps['ai']
  onAskAi?: () => void
  onPickOffering?: (offering: string) => void
}) {
  const { story, blueprint, source } = world

  if (ai === 'thinking') {
    return (
      <div className="director director--thinking" role="status">
        <p className="director__by">
          <SparkIcon />
          The Imagination Director is dreaming up your world…
        </p>
        <p className="field__help">You can keep going while it thinks.</p>
      </div>
    )
  }

  if (source === 'rules') {
    if (ai === 'off' || !onAskAi) return null
    return (
      <div className="director director--rules" role="status">
        <p className="field__help">
          {ai === 'failed'
            ? 'The Imagination Director could not be reached, so Mini Mogul built this world with its own rules. Everything still works.'
            : 'Built with Mini Mogul\'s own world rules.'}
        </p>
        <button type="button" className="chip" onClick={onAskAi}>
          <SparkIcon /> Ask the Imagination Director
        </button>
      </div>
    )
  }

  return (
    <div className="director" role="status">
      <p className="director__by">
        <SparkIcon />
        Imagined by the AI Director
      </p>
      <p>{story.summary}</p>
      <p className="director__line">
        <span>Your customers</span>
        {story.customers}
      </p>
      {onPickOffering && story.offerings.length > 0 && (
        <div className="director__line">
          <span>Ideas for your first {blueprint.kind === 'service' ? 'service' : 'product'}</span>
          <ul className="director__chips">
            {story.offerings.map((idea) => (
              <li key={idea}>
                <button type="button" className="chip" onClick={() => onPickOffering(idea)}>
                  {idea}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="director__line">
        <span>You will learn about</span>
        <ul className="director__concepts">
          {story.concepts.map((concept) => (
            <li key={concept.id}>
              <strong>{CONCEPTS[concept.id]}.</strong> {concept.why}
            </li>
          ))}
        </ul>
      </div>
      {blueprint.kind === 'service' && (
        <p className="field__help">
          This is a service business. For now Mini Mogul plays every business
          the same way: each one you prepare counts as an item on your shelf.
        </p>
      )}
    </div>
  )
}

export function CreateScreen({
  progress,
  direction,
  ai,
  onAskAi,
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

  // The world is rebuilt from the words on screen, so it updates as you type.
  const world = useMemo(
    () => buildWorld({ idea: progress.idea, offering, style: theme }, direction),
    [progress.idea, offering, theme, direction],
  )
  const blueprint = world.blueprint
  // The dragon nursery shows its full lived-in scene before play begins.
  const richPreview = blueprint.theme === 'creature-care'
  // Changing a shop that is already saved, rather than making a new one.
  const editingSaved = progress.step === 'ready' && !unsavedDraft

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
        <WorldScene blueprint={blueprint} sign={shopName} rich={richPreview} />
        <p className="world-label">
          <ProductIcon icon={blueprint.productIcon} />
          {blueprint.label}
        </p>
        <DirectorNotes world={world} ai={ai} />
        <dl className="summary">
          <div>
            <dt>The idea</dt>
            <dd>{progress.idea}</dd>
          </div>
          {offering && (
            <div>
              <dt>{offeringLabel(blueprint.kind)}</dt>
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
        {editingSaved ? 'Edit' : 'Create'}
      </p>
      <h1 className="card__title" ref={headingRef} tabIndex={-1}>
        {editingSaved ? 'Edit your world' : 'Shape your world'}
      </h1>
      <p className="card__idea">
        <span>Your idea</span>
        {progress.idea}
      </p>

      <WorldScene blueprint={blueprint} sign={shopName} rich={richPreview} />
      <p className="world-label" role="status">
        <ProductIcon icon={blueprint.productIcon} />
        {blueprint.label}
      </p>
      <DirectorNotes
        world={world}
        ai={ai}
        onAskAi={() => onAskAi(offering.trim())}
        onPickOffering={offering.trim() ? undefined : setOffering}
      />

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
                style={{ background: option.swatch }}
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
          aria-describedby="first-offering-help"
          onChange={(event) => setOffering(event.target.value)}
        />
        <p id="first-offering-help" className="field__help">
          Your idea, this and your style shape the world above.
        </p>
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
        <TactileButton type="submit">
          {editingSaved ? 'Save changes' : 'Create my world'}
        </TactileButton>
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
