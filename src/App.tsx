import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AmbientLayers } from './components/AmbientLayers.tsx'
import { AudioSettings } from './components/AudioSettings.tsx'
import { CreateScreen } from './components/CreateScreen.tsx'
import { HomeScene } from './components/HomeScene.tsx'
import { ImagineScreen } from './components/ImagineScreen.tsx'
import { PlayScreen } from './components/PlayScreen.tsx'
import { initAudio, playSfx, setAudioPrefs } from './lib/audio.ts'
import { useMediaQuery, usePointerParallax } from './lib/hooks.ts'
import {
  clearGame,
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
} from './lib/storage.ts'
import type { Progress, Settings, ThemeId } from './lib/storage.ts'

type Screen = 'home' | 'imagine' | 'create' | 'play'

/** How long the idea-star takes to reach the island before we move on. */
const LAUNCH_MS = 900

const formMotion = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: 'easeOut' },
} as const

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [progress, setProgress] = useState<Progress | null>(loadProgress)
  // A new idea being shaped while a saved shop already exists. It lives only
  // in memory, so the saved shop is untouched until it is saved.
  const [draft, setDraft] = useState<Progress | null>(null)
  const [resuming, setResuming] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [introDone, setIntroDone] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  const working = draft ?? progress

  const systemReduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const reducedMotion = settings.reduceMotion ?? systemReduced

  usePointerParallax(rootRef, !reducedMotion)

  useEffect(() => initAudio(), [])
  useEffect(() => {
    setAudioPrefs({
      sound: settings.sound,
      music: settings.music,
      sfx: settings.sfx,
    })
  }, [settings.sound, settings.music, settings.sfx])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  // Closing or reloading the tab would also abandon unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const changeSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const go = (next: Screen) => {
    setIntroDone(true)
    if (next === 'home') setDraft(null)
    setScreen(next)
    window.scrollTo(0, 0)
  }

  const handleStart = () => {
    if (launching) return
    setResuming(false)
    setDraft(null)
    playSfx('whoosh')
    if (reducedMotion) {
      go('imagine')
      return
    }
    setLaunching(true)
    timers.current.push(
      window.setTimeout(() => playSfx('chime'), LAUNCH_MS - 250),
      window.setTimeout(() => {
        go('imagine')
        setLaunching(false)
      }, LAUNCH_MS),
    )
  }

  const handleContinue = () => {
    playSfx('plop')
    setResuming(true)
    go('create')
  }

  // Reworking the saved shop's idea, rather than starting a new business.
  const editingSaved = resuming && draft === null && progress?.step === 'ready'

  const handleIdea = (values: { playerName: string; idea: string }) => {
    if (editingSaved && progress) {
      // "Save changes": the same shop keeps its name, style and game days;
      // only its idea (and so its world) changes.
      const next: Progress = { ...progress, ...values }
      setProgress(next)
      saveProgress(next)
      playSfx('chime')
      go('create')
      return
    }
    const base = resuming ? working : null
    const sameIdea = base?.idea === values.idea
    const next: Progress = {
      step: 'create',
      playerName: values.playerName,
      idea: values.idea,
      shopName: sameIdea ? base.shopName : '',
      theme: sameIdea ? base.theme : 'cottage',
      offering: sameIdea ? base.offering : '',
    }
    if (progress?.step === 'ready') {
      // Never overwrite a saved shop with a half-made one.
      setDraft(next)
    } else {
      setProgress(next)
      saveProgress(next)
    }
    setResuming(true)
    playSfx('plop')
    go('create')
  }

  const handleShop = (values: {
    shopName: string
    theme: ThemeId
    offering: string
  }) => {
    if (!working) return
    // A different business starts its opening days afresh.
    if (progress?.step !== 'ready' || progress.idea !== working.idea) clearGame()
    const next: Progress = { ...working, ...values, step: 'ready' }
    setProgress(next)
    saveProgress(next)
    setDraft(null)
    playSfx('chime')
  }

  const replacesShop =
    draft && progress?.step === 'ready' && draft.idea !== progress.idea
      ? progress.shopName
      : undefined

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
      <div
        className="app"
        ref={rootRef}
        data-screen={screen}
        data-motion={reducedMotion ? 'reduced' : 'full'}
        data-launching={launching ? '' : undefined}
      >
        <AmbientLayers />

        <AnimatePresence mode="wait" initial={false}>
          {screen === 'home' && (
            <motion.main
              key="home"
              className="screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <HomeScene
                intro={!introDone}
                launching={launching}
                canContinue={progress !== null}
                onStart={handleStart}
                onContinue={handleContinue}
              />
            </motion.main>
          )}

          {screen === 'imagine' && (
            <motion.main key="imagine" className="screen screen--form" {...formMotion}>
              <ImagineScreen
                initialName={resuming ? (working?.playerName ?? '') : ''}
                initialIdea={resuming ? (working?.idea ?? '') : ''}
                unsavedDraft={draft !== null}
                editingSaved={editingSaved}
                onExit={() => go('home')}
                onDirtyChange={setDirty}
                onSubmit={handleIdea}
              />
            </motion.main>
          )}

          {screen === 'create' && working && (
            <motion.main key="create" className="screen screen--form" {...formMotion}>
              <CreateScreen
                progress={working}
                unsavedDraft={draft !== null}
                replacesShop={replacesShop}
                onBack={() => go('imagine')}
                onExit={() => go('home')}
                onPlay={() => {
                  playSfx('plop')
                  go('play')
                }}
                onDirtyChange={setDirty}
                onSave={handleShop}
              />
            </motion.main>
          )}

          {screen === 'play' && progress?.step === 'ready' && (
            <motion.main key="play" className="screen screen--form" {...formMotion}>
              <PlayScreen
                shop={progress}
                reducedMotion={reducedMotion}
                onExit={() => go('home')}
              />
            </motion.main>
          )}
        </AnimatePresence>

        <AudioSettings
          settings={settings}
          reducedMotion={reducedMotion}
          onChange={changeSettings}
        />
      </div>
    </MotionConfig>
  )
}

export default App
