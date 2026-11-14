import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AmbientLayers } from './components/AmbientLayers.tsx'
import { AudioSettings } from './components/AudioSettings.tsx'
import { CreateScreen } from './components/CreateScreen.tsx'
import { HomeScene } from './components/HomeScene.tsx'
import { ImagineScreen } from './components/ImagineScreen.tsx'
import { initAudio, playSfx, setAudioPrefs } from './lib/audio.ts'
import { useMediaQuery, usePointerParallax } from './lib/hooks.ts'
import {
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
} from './lib/storage.ts'
import type { Progress, Settings, ThemeId } from './lib/storage.ts'

type Screen = 'home' | 'imagine' | 'create'

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
  const [resuming, setResuming] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [introDone, setIntroDone] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

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

  const changeSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const go = (next: Screen) => {
    setIntroDone(true)
    setScreen(next)
    window.scrollTo(0, 0)
  }

  const handleStart = () => {
    if (launching) return
    setResuming(false)
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

  const handleIdea = (values: { playerName: string; idea: string }) => {
    const sameIdea = resuming && progress?.idea === values.idea
    const next: Progress = {
      step: 'create',
      playerName: values.playerName,
      idea: values.idea,
      shopName: sameIdea ? progress.shopName : '',
      theme: sameIdea ? progress.theme : 'cottage',
      offering: sameIdea ? progress.offering : '',
    }
    setProgress(next)
    saveProgress(next)
    setResuming(true)
    playSfx('plop')
    go('create')
  }

  const handleShop = (values: {
    shopName: string
    theme: ThemeId
    offering: string
  }) => {
    if (!progress) return
    const next: Progress = { ...progress, ...values, step: 'ready' }
    setProgress(next)
    saveProgress(next)
    playSfx('chime')
  }

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
                initialName={resuming ? (progress?.playerName ?? '') : ''}
                initialIdea={resuming ? (progress?.idea ?? '') : ''}
                onBack={() => go('home')}
                onSubmit={handleIdea}
              />
            </motion.main>
          )}

          {screen === 'create' && progress && (
            <motion.main key="create" className="screen screen--form" {...formMotion}>
              <CreateScreen
                progress={progress}
                onBack={() => go('imagine')}
                onHome={() => go('home')}
                onSave={handleShop}
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
