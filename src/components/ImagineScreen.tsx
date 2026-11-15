import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
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
  /** Leave for home, dropping whatever is unsaved. */
  onExit: () => void
  onDirtyChange: (dirty: boolean) => void
  onSubmit: (values: { playerName: string; idea: string }) => void
}

const SPARKS = [
  'Magical bakery',
  'Dragon daycare',
  'Pet-sitting service',
  'Moonlight lemonade stand',
]

const IDEA_LIMIT = 120

export function ImagineScreen({
  initialName,
  initialIdea,
  unsavedDraft,
  editingSaved,
  onExit,
  onDirtyChange,
  onSubmit,
}: ImagineScreenProps) {
  const [playerName, setPlayerName] = useState(initialName)
  const [idea, setIdea] = useState(initialIdea)
  const [error, setError] = useState('')
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
    onSubmit({ playerName: playerName.trim(), idea: trimmed })
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
          : 'What business would you like to build?'}
      </h1>

      <div className="field">
        <label htmlFor="player-name">Your name</label>
        <input
          id="player-name"
          type="text"
          autoComplete="given-name"
          maxLength={24}
          placeholder="What should we call you?"
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="business-idea">Your business idea</label>
        <textarea
          id="business-idea"
          ref={ideaRef}
          rows={3}
          maxLength={IDEA_LIMIT}
          placeholder="A shop that sells…"
          value={idea}
          aria-invalid={error ? true : undefined}
          aria-describedby="business-idea-help"
          onChange={(event) => {
            setIdea(event.target.value)
            if (error) setError('')
          }}
        />
        <p
          id="business-idea-help"
          className={error ? 'field__help field__help--error' : 'field__help'}
          role={error ? 'alert' : undefined}
        >
          {error || 'Anything goes. The stranger, the better.'}
        </p>
      </div>

      <div className="sparks">
        <p id="sparks-label">Need a spark?</p>
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
                }}
              >
                {spark}
              </button>
            </li>
          ))}
        </ul>
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
