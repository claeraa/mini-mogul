import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { checkIdea } from '../ai/safety.ts'
import { DISCARD_COPY } from '../lib/constants.ts'
import { CloseButton, ConfirmDialog } from './ConfirmDialog.tsx'
import { SparkIcon, TactileButton } from './StartButton.tsx'

type ImagineScreenProps = {
  initialName: string
  initialIdea: string
  /** True when the prefilled idea itself has not been saved yet. */
  unsavedDraft: boolean
  /** True when changing the idea of a shop that is already saved. */
  editingSaved: boolean
  /** The AI Director turned the last idea away; offer other ideas straight off. */
  turnedAway?: boolean
  /** Leave for home, dropping whatever is unsaved. */
  onExit: () => void
  onDirtyChange: (dirty: boolean) => void
  onSubmit: (values: { playerName: string; idea: string }) => void
}

/** Only examples: tapping one fills the box, and anything can be typed instead. */
const SPARKS = ['Unicorn bakery', 'Dragon daycare', 'Space café', 'Pet sitting']

/** Offered when an idea is turned away without a closer match. */
const ANY_IDEAS = ['Magical bakery', 'Toy shop', 'Space café']

const TURNED_AWAY = "Mini Mogul is for everyone, so let's pick a different idea. How about one of these?"

const IDEA_LIMIT = 120

export function ImagineScreen({
  initialName,
  initialIdea,
  unsavedDraft,
  editingSaved,
  turnedAway = false,
  onExit,
  onDirtyChange,
  onSubmit,
}: ImagineScreenProps) {
  const [playerName, setPlayerName] = useState(initialName)
  const [idea, setIdea] = useState(initialIdea)
  const [error, setError] = useState('')
  // Friendly alternatives, shown when an idea is not right for a children's game.
  const [redirect, setRedirect] = useState<{ message: string; suggestions: string[] } | null>(
    turnedAway ? { message: TURNED_AWAY, suggestions: ANY_IDEAS } : null,
  )
  const [confirming, setConfirming] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const ideaRef = useRef<HTMLTextAreaElement>(null)

  const dirty =
    unsavedDraft || playerName !== initialName || idea !== initialIdea

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    onDirtyChange(dirty)
    return () => onDirtyChange(false)
  }, [dirty, onDirtyChange])

  const leave = () => {
    if (dirty) setConfirming(true)
    else onExit()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = idea.trim()
    if (trimmed.length < 3) {
      setError('Type a business idea first. A few words is plenty.')
      ideaRef.current?.focus()
      return
    }
    // Some businesses are not for children. The player is not told off:
    // they are offered ideas with a similar feel.
    const check = checkIdea(trimmed)
    if (!check.ok) {
      setRedirect({ message: check.message, suggestions: check.suggestions })
      ideaRef.current?.focus()
      return
    }
    // A name is optional, and is simply left out if it is not suitable.
    const name = playerName.trim()
    onSubmit({ playerName: checkIdea(name).ok ? name : '', idea: trimmed })
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <CloseButton label="Close and return home" onClick={leave} />
      <p className="card__step">
        <SparkIcon />
        {editingSaved ? 'Edit' : 'Imagine'}
      </p>
      <h1 className="card__title" ref={headingRef} tabIndex={-1}>
        {editingSaved
          ? 'Change your business idea'
          : 'What would you love to create?'}
      </h1>

      <div className="field">
        <label htmlFor="business-idea">Your idea</label>
        <textarea
          id="business-idea"
          ref={ideaRef}
          rows={3}
          maxLength={IDEA_LIMIT}
          placeholder="A shop on the moon? A robot pet salon? Type anything!"
          value={idea}
          aria-invalid={error ? true : undefined}
          aria-describedby="business-idea-help"
          onChange={(event) => {
            setIdea(event.target.value)
            if (error) setError('')
            if (redirect) setRedirect(null)
          }}
        />
        <p
          id="business-idea-help"
          className={error ? 'field__help field__help--error' : 'field__help'}
          role={error ? 'alert' : undefined}
        >
          {error || 'It is your idea. Silly, magical, anything goes!'}
        </p>
      </div>

      {redirect && (
        <div className="redirect" role="alert">
          <p>{redirect.message}</p>
          <ul>
            {redirect.suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    setIdea(suggestion)
                    setRedirect(null)
                    setError('')
                  }}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sparks">
        <p id="sparks-label">Just examples. Tap one, or type your own!</p>
        <ul aria-labelledby="sparks-label">
          {SPARKS.map((spark) => (
            <li key={spark}>
              <button
                type="button"
                className="chip"
                aria-pressed={idea === spark}
                onClick={() => {
                  setIdea(spark)
                  setError('')
                  setRedirect(null)
                }}
              >
                {spark}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="field">
        <label htmlFor="player-name">Your name (if you like)</label>
        <input
          id="player-name"
          type="text"
          autoComplete="given-name"
          maxLength={24}
          placeholder="So we can name your shop"
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
        />
      </div>

      <div className="card__actions">
        <button type="button" className="text-button" onClick={leave}>
          Back
        </button>
        <TactileButton type="submit">
          {editingSaved ? 'Save changes' : 'Bring it to life'}
        </TactileButton>
      </div>

      <ConfirmDialog
        open={confirming}
        {...DISCARD_COPY}
        onKeep={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          onExit()
        }}
      />
    </form>
  )
}
