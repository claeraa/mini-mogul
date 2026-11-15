import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ideaKey } from './ai/world.ts'
import { AmbientLayers } from './components/AmbientLayers.tsx'
import { AudioSettings } from './components/AudioSettings.tsx'
import { CreateScreen } from './components/CreateScreen.tsx'
import { HomeScene } from './components/HomeScene.tsx'
import { ImagineScreen } from './components/ImagineScreen.tsx'
import { PlayScreen } from './components/PlayScreen.tsx'
import { WorldsScreen } from './components/WorldsScreen.tsx'
import { aiAvailable, requestWorldDirection } from './lib/ai.ts'
import { initAudio, playSfx, setAudioPrefs } from './lib/audio.ts'
import { useMediaQuery, usePointerParallax } from './lib/hooks.ts'
import {
  loadSettings,
  loadWorlds,
  makeWorldId,
  saveSettings,
  saveWorlds,
} from './lib/storage.ts'
import type { Settings, ThemeId } from './lib/storage.ts'
import {
  findWorld,
  newWorld,
  openWorld,
  putWorld,
  recentFirst,
  removeWorld,
  updateWorld,
} from './worlds/store.ts'
import type { SavedWorld, WorldStore } from './worlds/store.ts'
import { TEXT_SCALE } from './worlds/settings.ts'

/** The root font size in index.css. */
const BASE_FONT_PX = 17

type Screen = 'home' | 'worlds' | 'imagine' | 'create' | 'play'

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

  // Every saved world. Each keeps its own shop, AI world and game days.
  const [store, setStore] = useState<WorldStore>(loadWorlds)
  /** The saved world currently open, if any. */
  const [activeId, setActiveId] = useState<string | null>(null)
  // A brand-new world still being shaped. It lives only in memory until it is
  // saved, so abandoning it never touches the worlds already saved.
  const [draft, setDraft] = useState<SavedWorld | null>(null)
  const [resuming, setResuming] = useState(false)
  /** Opens the shop form straight away (Edit in My Worlds). */
  const [startEditing, setStartEditing] = useState(false)
  /** Where closing a form leads back to. */
  const [returnTo, setReturnTo] = useState<'home' | 'worlds'>('home')
  const [dirty, setDirty] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [introDone, setIntroDone] = useState(false)

  // The AI Imagination Director. Everything works without it.
  const [aiOn, setAiOn] = useState(false)
  /** Which world is waiting on the Director, keyed by world id. */
  const [aiBusy, setAiBusy] = useState<{ key: string; state: 'thinking' | 'failed' } | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  const active = useMemo(() => findWorld(store, activeId), [store, activeId])
  const working = draft ?? active
  const worlds = useMemo(() => recentFirst(store), [store])
  const lastWorld = useMemo(() => findWorld(store, store.lastWorldId), [store])

  // Every change is written to this device straight away.
  useEffect(() => {
    saveWorlds(store)
  }, [store])

  useEffect(() => {
    let live = true
    aiAvailable().then((available) => {
      if (live) setAiOn(available)
    })
    return () => {
      live = false
    }
  }, [])

  /**
   * Asks the Director to imagine a world. The answer is stored in the world
   * that asked and nowhere else; a failure just leaves the rules-built world.
   */
  const imagine = useCallback((worldId: string, idea: string, offering: string) => {
    setAiBusy({ key: worldId, state: 'thinking' })
    requestWorldDirection(worldId, idea, offering).then((direction) => {
      if (direction) {
        // Only if the world still has the idea that was asked about.
        const apply = (world: SavedWorld): SavedWorld =>
          ideaKey(world.shop.idea) === ideaKey(idea) ? { ...world, direction } : world
        setDraft((current) => (current?.id === worldId ? apply(current) : current))
        setStore((current) => updateWorld(current, worldId, apply, Date.now()))
      }
      setAiBusy((current) =>
        current?.key !== worldId ? current : direction ? null : { key: worldId, state: 'failed' },
      )
    })
  }, [])

  const aiState = !aiOn ? 'off' : working && aiBusy?.key === working.id ? aiBusy.state : 'idle'

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

  // Text size scales the root font, so every rem-sized label grows together.
  useEffect(() => {
    const root = document.documentElement
    const scale = TEXT_SCALE[settings.textSize]
    root.style.fontSize = scale === 1 ? '' : `${BASE_FONT_PX * scale}px`
    return () => {
      root.style.fontSize = ''
    }
  }, [settings.textSize])

  const changeSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const go = (next: Screen) => {
    setIntroDone(true)
    if (next === 'home' || next === 'worlds') setDraft(null)
    setScreen(next)
    window.scrollTo(0, 0)
  }

  const beginNewWorld = () => {
    setResuming(false)
    setActiveId(null)
    setDraft(null)
    setStartEditing(false)
  }

  const handleStart = () => {
    if (launching) return
    beginNewWorld()
    setReturnTo('home')
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

  /** Opens a saved world: on its shop page, in its form, or straight into play. */
  const openSaved = (id: string, target: 'shop' | 'edit' | 'play') => {
    const world = findWorld(store, id)
    if (!world) return
    playSfx('plop')
    setActiveId(id)
    setDraft(null)
    setResuming(true)
    setReturnTo('worlds')
    setStartEditing(target === 'edit')
    setStore((current) => openWorld(current, id))
    go(target === 'play' && world.shop.step === 'ready' ? 'play' : 'create')
  }

  const deleteWorld = (id: string) => {
    setStore((current) => removeWorld(current, id))
    if (activeId === id) setActiveId(null)
    playSfx('plop')
  }

  // Reworking a world that is already saved, rather than starting a new one.
  const editingExisting = resuming && draft === null && active !== null
  const editingSaved = editingExisting && active.shop.step === 'ready'

  const handleIdea = (values: { playerName: string; idea: string }) => {
    const now = Date.now()
    if (editingExisting) {
      // The same world keeps its id, name, style and game days. If the idea
      // itself changed, the old AI reading no longer fits and is dropped.
      const changed = ideaKey(active.shop.idea) !== ideaKey(values.idea)
      setStore((current) =>
        updateWorld(
          current,
          active.id,
          (world) => ({
            ...world,
            shop: { ...world.shop, ...values },
            direction: changed ? null : world.direction,
          }),
          now,
        ),
      )
      if (aiOn && (changed || !active.direction)) {
        imagine(active.id, values.idea, active.shop.offering)
      }
      playSfx(editingSaved ? 'chime' : 'plop')
      go('create')
      return
    }

    // A new world. Going back and keeping the same idea keeps the same draft.
    const sameDraft = resuming && draft && draft.shop.idea === values.idea ? draft : null
    const next: SavedWorld = sameDraft
      ? { ...sameDraft, shop: { ...sameDraft.shop, playerName: values.playerName } }
      : newWorld(
          makeWorldId(),
          {
            step: 'create',
            playerName: values.playerName,
            idea: values.idea,
            shopName: '',
            theme: 'cottage',
            offering: '',
          },
          now,
        )
    setDraft(next)
    setResuming(true)
    // One call per new world; a draft that already has its answer keeps it.
    if (aiOn && !next.direction) imagine(next.id, values.idea, '')
    playSfx('plop')
    go('create')
  }

  const handleShop = (values: {
    shopName: string
    theme: ThemeId
    offering: string
  }) => {
    if (!working) return
    const now = Date.now()
    if (draft) {
      // First save: the new world joins My Worlds. Nothing else is touched.
      setStore((current) =>
        putWorld(current, {
          ...draft,
          shop: { ...draft.shop, ...values, step: 'ready' },
          updatedAt: now,
        }),
      )
      setActiveId(draft.id)
      setDraft(null)
    } else {
      setStore((current) =>
        updateWorld(
          current,
          working.id,
          (world) => ({ ...world, shop: { ...world.shop, ...values, step: 'ready' } }),
          now,
        ),
      )
    }
    setStartEditing(false)
    playSfx('chime')
  }

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
      <div
        className="app"
        ref={rootRef}
        data-screen={screen}
        data-motion={reducedMotion ? 'reduced' : 'full'}
        data-contrast={settings.highContrast ? 'high' : undefined}
        data-text={settings.textSize}
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
                continueName={
                  lastWorld ? lastWorld.shop.shopName || lastWorld.shop.idea : null
                }
                worldCount={worlds.length}
                onStart={handleStart}
                onContinue={() => lastWorld && openSaved(lastWorld.id, 'shop')}
                onWorlds={() => {
                  playSfx('plop')
                  go('worlds')
                }}
              />
            </motion.main>
          )}

          {screen === 'worlds' && (
            <motion.main key="worlds" className="screen screen--form" {...formMotion}>
              <WorldsScreen
                worlds={worlds}
                onOpen={(id) => openSaved(id, 'play')}
                onEdit={(id) => openSaved(id, 'edit')}
                onDelete={deleteWorld}
                onNew={() => {
                  beginNewWorld()
                  setReturnTo('worlds')
                  playSfx('whoosh')
                  go('imagine')
                }}
                onExit={() => go('home')}
              />
            </motion.main>
          )}

          {screen === 'imagine' && (
            <motion.main key="imagine" className="screen screen--form" {...formMotion}>
              <ImagineScreen
                initialName={resuming ? (working?.shop.playerName ?? '') : ''}
                initialIdea={resuming ? (working?.shop.idea ?? '') : ''}
                unsavedDraft={draft !== null}
                editingSaved={editingSaved}
                onExit={() => go(returnTo)}
                onDirtyChange={setDirty}
                onSubmit={handleIdea}
              />
            </motion.main>
          )}

          {screen === 'create' && working && (
            <motion.main key="create" className="screen screen--form" {...formMotion}>
              <CreateScreen
                key={working.id}
                progress={working.shop}
                direction={working.direction}
                ai={aiState}
                onAskAi={(offering) => imagine(working.id, working.shop.idea, offering)}
                unsavedDraft={draft !== null}
                startEditing={startEditing}
                exitLabel={draft && returnTo === 'home' ? 'Back to the island' : 'My Worlds'}
                onBack={() => go('imagine')}
                onExit={() => go(draft && returnTo === 'home' ? 'home' : 'worlds')}
                onPlay={() => {
                  playSfx('plop')
                  go('play')
                }}
                onDirtyChange={setDirty}
                onSave={handleShop}
              />
            </motion.main>
          )}

          {screen === 'play' && active?.shop.step === 'ready' && (
            <motion.main key="play" className="screen screen--form" {...formMotion}>
              <PlayScreen
                key={active.id}
                worldId={active.id}
                shop={active.shop}
                direction={active.direction}
                savedGame={active.game}
                onGameChange={(game) =>
                  setStore((current) =>
                    updateWorld(current, active.id, (world) => ({ ...world, game }), Date.now()),
                  )
                }
                aiOn={aiOn}
                reducedMotion={reducedMotion}
                onExit={() => go('worlds')}
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
