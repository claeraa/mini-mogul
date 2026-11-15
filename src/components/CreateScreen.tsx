import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CONCEPTS } from '../ai/schema.ts'
import type { WorldDirection } from '../ai/schema.ts'
import { buildWorld } from '../ai/world.ts'
import type { World } from '../ai/world.ts'
import type { Progress, ThemeId } from '../lib/storage.ts'
import { DISCARD_COPY, THEMES } from '../lib/constants.ts'
import { CloseButton, ConfirmDialog } from './ConfirmDialog.tsx'
import { CAST_NAMES } from '../world/customers.ts'
import { offeringName, shorten, suggestShopName } from '../world/names.ts'
import { Critter } from './Critter.tsx'
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
  /** Opens straight on the edit form (used by Edit in My Worlds). */
  startEditing?: boolean
  /** Where leaving goes: "My Worlds" for a saved world, the island for a new one. */
  exitLabel: string
  /** Back to the idea screen. */
  onBack: () => void
  /** Leave for home, dropping whatever is unsaved. */
  onExit: () => void
  onPlay: () => void
  onDirtyChange: (dirty: boolean) => void
  onSave: (values: ShopValues) => void
}

/**
 * The world at a glance: who visits (drawn, then named) and, when the AI
 * Director imagined it, a one-line story, product ideas to tap and what the
 * business teaches. Pictures and chips first; the longer words are tucked
 * into "More" for anyone who wants them.
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
  const fromAi = source === 'ai'
  const castName = CAST_NAMES[blueprint.customers]

  return (
    <div className={fromAi ? 'director' : 'director director--plain'}>
      {fromAi && (
        <p className="director__by">
          <SparkIcon />
          AI Director
        </p>
      )}
      {fromAi && <p className="director__story">{shorten(story.summary, 120)}</p>}

      <p className="director__cast">
        <span className="director__faces" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <Critter key={i} cast={blueprint.customers} index={i} />
          ))}
        </span>
        <span>
          <span className="director__tag">Customers</span>
          <strong>{castName}</strong>
        </span>
      </p>

      {fromAi && onPickOffering && story.offerings.length > 0 && (
        <div className="director__line">
          <span className="director__tag">Tap one to {blueprint.kind === 'service' ? 'offer' : 'sell'}</span>
          <ul className="director__chips">
            {story.offerings.map((idea) => (
              <li key={idea}>
                <button type="button" className="chip" onClick={() => onPickOffering(idea)}>
                  <ProductIcon icon={blueprint.productIcon} />
                  {idea}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fromAi && (
        <details className="director__more">
          <summary>
            <span className="director__tag">You will learn</span>
            {story.concepts.map((concept) => (
              <span key={concept.id} className="learn-chip">
                {CONCEPTS[concept.id]}
              </span>
            ))}
            <span className="director__toggle">More</span>
          </summary>
          <ul className="director__concepts">
            <li>
              <strong>Customers.</strong> {story.customers}
            </li>
            {story.concepts.map((concept) => (
              <li key={concept.id}>
                <strong>{CONCEPTS[concept.id]}.</strong> {concept.why}
              </li>
            ))}
            {blueprint.kind === 'service' && (
              <li>
                <strong>Services.</strong> For now each one you get ready
                counts as one item on your shelf.
              </li>
            )}
          </ul>
        </details>
      )}

      {ai === 'thinking' && (
        <p className="director__status" role="status">
          <SparkIcon />
          The AI Director is dreaming…
        </p>
      )}
      {!fromAi && ai !== 'thinking' && ai !== 'off' && onAskAi && (
        <div className="director__ask" role="status">
          {ai === 'failed' && <span className="field__help">The AI is resting. Your world still works!</span>}
          <button type="button" className="chip" onClick={onAskAi}>
            <SparkIcon /> Ask the AI Director
          </button>
        </div>
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
  startEditing = false,
  exitLabel,
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
  const [editing, setEditing] = useState(startEditing || progress.step !== 'ready')
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
      setError('Your shop needs a name!')
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
          Ready to open!
        </p>
        <h1 className="card__title" ref={headingRef} tabIndex={-1}>
          {shopName}
        </h1>
        <WorldScene blueprint={blueprint} sign={shopName} rich={richPreview} />
        <p className="world-label">
          <ProductIcon icon={blueprint.productIcon} />
          {blueprint.label}
        </p>
        <DirectorNotes world={world} ai={ai} />
        {offering && (
          <p className="fact-row">
            <span className="fact-chip">
              <ProductIcon icon={blueprint.productIcon} />
              <span className="visually-hidden">
                {blueprint.kind === 'service' ? 'First service: ' : 'First product: '}
              </span>
              {shorten(offeringName(offering), 40)}
            </span>
          </p>
        )}
        <p className="card__note">Saved on this device.</p>
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
              Edit
            </button>
            <button type="button" className="text-button" onClick={onExit}>
              {exitLabel}
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
        <legend>Style</legend>
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
          <ProductIcon icon={blueprint.productIcon} />
          {blueprint.kind === 'service' ? 'First thing to offer' : 'First thing to sell'}
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
