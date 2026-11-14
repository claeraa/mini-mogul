import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { SparkIcon, TactileButton } from './StartButton.tsx'

type ImagineScreenProps = {
  initialName: string
  initialIdea: string
  onBack: () => void
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
  onBack,
  onSubmit,
}: ImagineScreenProps) {
  const [playerName, setPlayerName] = useState(initialName)
  const [idea, setIdea] = useState(initialIdea)
  const [error, setError] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const ideaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

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
      <p className="card__step">
        <SparkIcon />
        Imagine
      </p>
      <h1 className="card__title" ref={headingRef} tabIndex={-1}>
        What business would you like to build?
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
        <button type="button" className="text-button" onClick={onBack}>
          Back
        </button>
        <TactileButton type="submit">Plant this idea</TactileButton>
      </div>
    </form>
  )
}
