import { Island } from './Island.tsx'
import { StartButton } from './StartButton.tsx'

type HomeSceneProps = {
  /** True only for the first visit, which gets the full staged entrance. */
  intro: boolean
  launching: boolean
  /** The name of the world Continue will open, if there is one. */
  continueName: string | null
  /** How many worlds are saved on this device. */
  worldCount: number
  onStart: () => void
  onContinue: () => void
  onWorlds: () => void
}

function IdeaStar() {
  return (
    <div className="idea-star">
      <div className="enter enter--star">
        <div className="idea-star__body">
          <span className="idea-star__halo" />
          <svg viewBox="0 0 64 64" focusable="false">
            <defs>
              <linearGradient id="idea-star-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fffbe0" />
                <stop offset="1" stopColor="#ffc93d" />
              </linearGradient>
            </defs>
            <path
              d="M32 4c3 15 13 25 28 28-15 3-25 13-28 28C29 45 19 35 4 32 19 29 29 19 32 4z"
              fill="url(#idea-star-fill)"
              stroke="#fff8d6"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export function HomeScene({
  intro,
  launching,
  continueName,
  worldCount,
  onStart,
  onContinue,
  onWorlds,
}: HomeSceneProps) {
  return (
    <div className="home" data-intro={intro ? 'first' : 'return'}>
      <header className="home-brand enter enter--logo">
        <h1 className="logo">Mini Mogul</h1>
        <p className="tagline">Imagine it. Build it. Grow it.</p>
      </header>

      <div className="island-slot" aria-hidden="true">
        <div className="island-parallax">
          <div className="enter enter--island">
            <div className="island">
              <Island />
              <IdeaStar />
              <div className="launch-ripple">
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="home-actions enter enter--cta">
        <StartButton onClick={onStart} disabled={launching} />
        {(continueName !== null || worldCount > 0) && (
          <div className="home-actions__row">
            {continueName !== null && (
              <button
                type="button"
                className="ghost-button"
                aria-label={`Continue ${continueName}`}
                onClick={onContinue}
                disabled={launching}
              >
                Continue
              </button>
            )}
            {worldCount > 0 && (
              <button
                type="button"
                className="ghost-button"
                onClick={onWorlds}
                disabled={launching}
              >
                My Worlds
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
