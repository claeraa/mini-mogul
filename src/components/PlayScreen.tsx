import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { guideCard, guideWanted, improveUnlocked, nextGuideStep, reportNote } from '../game/guide.ts'
import type { GuideMode, GuideStep } from '../game/guide.ts'
import { PRODUCT_SHOP } from '../game/model.ts'
import type { DecorationId, WorldBlueprint } from '../world/blueprint.ts'
import { buyCampaign, buyUpgrade, extrasOf, makeLimit, modelForGame, modelForResult, simulateShopDay } from '../game/upgrades.ts'
import type { DayPlan, DayResult } from '../game/model.ts'
import { formatMoney, formatSigned } from '../game/money.ts'
import {
  clampPlan,
  demandForDay,
  maxProduction,
  pickEvent,
} from '../game/simulation.ts'
import { applyResult, newGame } from '../game/state.ts'
import type { GameState } from '../game/state.ts'
import { playSfx } from '../lib/audio.ts'
import type { Progress } from '../lib/storage.ts'
import type { WorldDirection } from '../ai/schema.ts'
import { buildWorld } from '../ai/world.ts'
import { castLabel } from '../world/customers.ts'
import { offeringName, shorten } from '../world/names.ts'
import { MAX_STAGE_VISITORS, crowdNote, shelfDuring, stageVisitors } from '../world/stage.ts'
import { Switch } from './AudioSettings.tsx'
import { CloseButton, ConfirmDialog } from './ConfirmDialog.tsx'
import { DayReport } from './DayReport.tsx'
import { Dial } from './Dial.tsx'
import {
  BellIcon,
  MegaphoneIcon,
  PeopleIcon,
  PouchIcon,
  PriceTagIcon,
  SunIcon,
} from './GameIcons.tsx'
import { ShopStreet } from './ShopStreet.tsx'
import { ToolboxIcon, UpgradeBoard } from './UpgradeBoard.tsx'
import type { Purchase } from './UpgradeBoard.tsx'
import { SparkIcon, TactileButton } from './StartButton.tsx'
import { ProductIcon } from './WorldParts.tsx'
import { WorldScene } from './WorldScene.tsx'

type PlayScreenProps = {
  /** This world's id: keeps its AI requests apart from other worlds'. */
  worldId: string
  shop: Progress
  /** This world's saved days, or null before its first one. */
  savedGame: GameState | null
  /** Called with the new state after every day, and with null on Start over. */
  onGameChange: (game: GameState | null) => void
  /** The AI Director's checked reading of the idea, when there is one. */
  direction: WorldDirection | null
  aiOn: boolean
  /** Skips the customers' walk-through and goes straight to the report. */
  reducedMotion: boolean
  /** The player's guide preference, saved with their settings, not with the world. */
  guideMode: GuideMode
  /** Whether the Improve board has been opened before on this device. */
  improveSeen: boolean
  onPrefs: (patch: { guide?: GuideMode; improveSeen?: boolean }) => void
  onExit: () => void
}

// Every shop runs on the product model for now; see game/model.ts. The
// blueprint's `kind` is where a service model would be chosen later.
// This is the shop before any upgrades; each world's own upgrades are
// applied on top of it (game/upgrades.ts).
const base = PRODUCT_SHOP

/** Time between one on-screen customer's turn and the next. */
const STAGGER_MS = 420

const freshGame = () => newGame(base, Math.floor(Math.random() * 2 ** 32))

type Phase = 'plan' | 'open' | 'report'

/** Decorations a smarter shop front adds, one per level, skipping any the world already has. */
const SHOP_FRONT_EXTRAS: DecorationId[] = ['bunting', 'sparkles', 'fireflies', 'hearts', 'bubbles']

function dressedUp(blueprint: WorldBlueprint, shopLevel: number): WorldBlueprint {
  if (shopLevel <= 0) return blueprint
  const extra = SHOP_FRONT_EXTRAS.filter((id) => !blueprint.decorations.includes(id)).slice(0, shopLevel)
  return { ...blueprint, decorations: [...blueprint.decorations, ...extra] }
}

/** Every lasting upgrade there is to buy: two kinds, three levels each. */
const UPGRADE_SLOTS = 6

/** The three things a player can change before opening. */
type Control = 'price' | 'make' | 'flyers'

/** One tile of the toolbar: an icon, a short label and today's value. */
function ToolTile({
  step,
  icon,
  label,
  value,
  active,
  onClick,
}: {
  step: number
  icon: ReactNode
  label: string
  value: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className="tile" aria-pressed={active} onClick={onClick}>
      <span className="tile__step" aria-hidden="true">
        {step}
      </span>
      <span className="tile__icon">{icon}</span>
      <span className="tile__label">{label}</span>
      <span className="tile__value">{value}</span>
    </button>
  )
}

/** The shop in its world: plan a day, watch it happen, read the report. */
export function PlayScreen({
  worldId,
  shop,
  savedGame,
  onGameChange,
  direction,
  aiOn,
  reducedMotion,
  guideMode,
  improveSeen,
  onPrefs,
  onExit,
}: PlayScreenProps) {
  const [game, setGame] = useState<GameState>(() => savedGame ?? freshGame())
  // The shop as it stands this morning, with this world's upgrades.
  const model = useMemo(() => modelForGame(base, game), [game])
  const [plan, setPlan] = useState<DayPlan>(() =>
    clampPlan(modelForGame(base, game), game, game.lastPlan),
  )
  const [improving, setImproving] = useState(false)
  // The first-day guide: which tip is showing, or null when there is none.
  // Decided once when the screen opens, so it never pops up mid-day.
  const [guideStep, setGuideStep] = useState<GuideStep | null>(() =>
    guideWanted(guideMode, game) ? 'make' : null,
  )
  /** Shown once on the report that follows a guided day. */
  const [guideOnReport, setGuideOnReport] = useState(false)
  const finishGuide = () => {
    setGuideStep(null)
    setGuideOnReport(false)
    onPrefs({ guide: 'done' })
  }
  const [phase, setPhase] = useState<Phase>('plan')
  const [result, setResult] = useState<DayResult | null>(null)
  /** On-screen sales so far while the shop is open. */
  const [served, setServed] = useState(0)
  const [confirmRestart, setConfirmRestart] = useState(false)
  /** Which control is showing on the plan board. Price first: it is step one. */
  // With the guide on, nothing is open yet: the first tip says where to tap.
  const [control, setControl] = useState<Control | null>(() =>
    guideWanted(guideMode, game) ? null : 'price',
  )
  const panelRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)

  const blueprint = useMemo(
    () =>
      buildWorld(
        { idea: shop.idea, offering: shop.offering, style: shop.theme },
        direction,
      ).blueprint,
    [shop.idea, shop.offering, shop.theme, direction],
  )

  useEffect(() => {
    if (phase === 'plan') headingRef.current?.focus()
    if (phase === 'open') skipRef.current?.focus()
  }, [phase])

  // How many customers the street has room for at this screen size. The
  // number in use is fixed when the shop opens, so a day's little play never
  // changes cast halfway through.
  const [room, setRoom] = useState(MAX_STAGE_VISITORS)
  const [openRoom, setOpenRoom] = useState(MAX_STAGE_VISITORS)

  // While the shop is open, customers take turns; then the report appears.
  useEffect(() => {
    if (phase !== 'open' || !result) return
    const cast = stageVisitors(result.demand, result.sold, openRoom)
    const buyers = cast.filter((visitor) => visitor.buys).length
    const timers: number[] = []
    for (let i = 0; i < buyers; i += 1) {
      timers.push(
        window.setTimeout(() => {
          setServed(i + 1)
          playSfx('plop')
        }, i * STAGGER_MS + 450),
      )
    }
    timers.push(
      window.setTimeout(() => {
        setPhase('report')
        playSfx('chime')
      }, cast.length * STAGGER_MS + 1700),
    )
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [phase, result, openRoom])

  const product = shorten(offeringName(shop.offering), 32) || blueprint.label
  const yesterday = game.history.at(-1)

  const update = (patch: Partial<DayPlan>) => {
    setPlan((current) => clampPlan(model, game, { ...current, ...patch }))
    // Doing the thing a tip describes moves the guide on by itself.
    if (guideStep === 'make' && patch.produce !== undefined) setGuideStep('price')
    if (guideStep === 'price' && patch.priceCents !== undefined) setGuideStep('open')
  }

  const making = makeLimit(model, game, plan.flyers)
  const makeMax = making.limit
  const expected = demandForDay(model, plan.priceCents, plan.flyers, null)
  const toSell = game.inventory + plan.produce
  const spending =
    plan.produce * model.unitCostCents + (plan.flyers ? model.flyerCostCents : 0)
  const canAffordFlyers = game.cashCents >= model.flyerCostCents
  const outOfCash =
    game.inventory === 0 && maxProduction(model, game.cashCents, false) === 0

  /** From the panel: fold a control open or shut. */
  const toggleControl = (next: Control) => {
    setControl((current) => (current === next ? null : next))
    playSfx('plop')
  }

  /** From the world: tapping a sign or the shelf opens its control. */
  const showControl = (next: Control) => {
    setControl(next)
    playSfx('plop')
    window.requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
    })
  }

  // One plain sentence about whether today's plan fits today's customers.
  const match: { tone: 'good' | 'warn' | 'stop'; text: string } =
    toSell === 0
      ? { tone: 'stop', text: 'Nothing to sell yet. Tap Make.' }
      : expected === 0
        ? { tone: 'stop', text: 'Too pricey! Nobody would buy. Lower the price.' }
        : plan.priceCents <= model.unitCostCents
          ? {
              tone: 'warn',
              text: `Each one costs ${formatMoney(model.unitCostCents)} to make. This price earns nothing.`,
            }
          : toSell < expected
            ? {
                tone: 'warn',
                text: `You might sell out: about ${expected} want one, ${toSell} to sell.`,
              }
            : toSell > expected
              ? {
                  tone: 'warn',
                  text: `You might have leftovers: ${toSell} to sell, about ${expected} want one.`,
                }
              : { tone: 'good', text: 'Just right! Enough for everyone.' }

  const openForBusiness = () => {
    const today = simulateShopDay(base, game, plan, pickEvent(game.seed, game.day))
    const next = applyResult(game, today)
    // Saved straight away, so leaving mid-day never loses it.
    setGame(next)
    onGameChange(next)
    setResult(today)
    if (guideStep !== null) {
      setGuideStep(null)
      setGuideOnReport(true)
    }
    setOpenRoom(room)
    setServed(0)
    if (reducedMotion) {
      setPhase('report')
      playSfx('chime')
    } else {
      setPhase('open')
      playSfx('plop')
    }
  }

  /** Spends cash on an upgrade. Saved at once, like a day's result. */
  const buy = (purchase: Purchase) => {
    const next = purchase === 'campaign' ? buyCampaign(game) : buyUpgrade(game, purchase)
    if (next === game) return
    setGame(next)
    onGameChange(next)
    // Less cash may mean fewer can be made today; more room may mean more.
    setPlan((current) => clampPlan(modelForGame(base, next), next, current))
    playSfx('chime')
  }

  const planNextDay = () => {
    setPlan(clampPlan(model, game, game.lastPlan))
    setResult(null)
    setPhase('plan')
    playSfx('plop')
  }

  const restart = () => {
    const next = freshGame()
    onGameChange(null)
    setGame(next)
    setPlan(clampPlan(modelForGame(base, next), next, next.lastPlan))
    setResult(null)
    setPhase('plan')
    setConfirmRestart(false)
  }

  if (phase === 'report' && result) {
    return (
      <DayReport
        model={modelForResult(base, result)}
        result={result}
        shopName={shop.shopName}
        icon={blueprint.productIcon}
        cast={blueprint.customers}
        reducedMotion={reducedMotion}
        shop={{ worldId, idea: shop.idea, offering: shop.offering }}
        aiOn={aiOn}
        guideNote={guideOnReport ? reportNote(result.operatingProfitCents) : null}
        onGuideDone={finishGuide}
        onNextDay={() => {
          if (guideOnReport) finishGuide()
          planNextDay()
        }}
        onExit={onExit}
      />
    )
  }

  const open = phase === 'open' && result !== null
  const levels = extrasOf(game).upgrades
  // A smarter shop front shows: each level hangs out one more decoration
  // the scene can already draw.
  const scene = dressedUp(blueprint, levels.shop)
  const upgradeCount = levels.production + levels.shop
  // Improve waits until the player has seen cash and profit at work, and is
  // never shown while the first-day guide is teaching the basics.
  const canImprove = improveUnlocked(game) && guideStep === null
  const card = guideStep
    ? guideCard(guideStep, {
        product: offeringName(shop.offering),
        customers: castLabel(blueprint.customers, shop.idea),
      })
    : null
  const openImprove = () => {
    setImproving(true)
    if (!improveSeen) onPrefs({ improveSeen: true })
    playSfx('plop')
  }
  const cast = open
    ? stageVisitors(result.demand, result.sold, openRoom)
    : stageVisitors(expected, expected, room)
  const crowd = open ? result.demand : expected
  const buyersShown = cast.filter((visitor) => visitor.buys).length
  const shelfCount = open
    ? shelfDuring(result.available, result.sold, served, buyersShown)
    : toSell

  return (
    <section
      className="card card--play card--game"
      data-guide={guideStep ?? undefined}
      style={
        {
          '--w-accent': blueprint.colors.accent,
          '--w-wall': blueprint.colors.wall,
          '--w-ink': blueprint.colors.ink,
        } as CSSProperties
      }
    >
      <CloseButton label="Close and go to My Worlds" onClick={onExit} />
      <header className="game-head">
        <p className="card__step">
          <SparkIcon />
          {blueprint.label}
        </p>
        <h1 className="card__title" ref={headingRef} tabIndex={-1}>
          {shop.shopName}
        </h1>
      </header>

      {card && (
        <aside className="guide" aria-label="First-day guide" aria-live="polite">
          <p className="guide__count">Tip {card.count}</p>
          <p className="guide__title">{card.title}</p>
          <p>{card.body}</p>
          <div className="guide__actions">
            <button
              type="button"
              className="chip"
              onClick={() => {
                const next = nextGuideStep(card.step)
                if (next) setGuideStep(next)
                else finishGuide()
              }}
            >
              {nextGuideStep(card.step) ? 'Next tip' : 'Got it'}
            </button>
            <button type="button" className="text-button" onClick={finishGuide}>
              Skip tips
            </button>
          </div>
        </aside>
      )}

      <div className="play-grid">
        <div className="play-stage">
          <WorldScene
            blueprint={scene}
            rich
            hud={
              <>
                <span className="hud-chip">
                  <SunIcon />
                  Day {open ? result.day : game.day}
                </span>
                {open ? (
                  <span className="hud-chip hud-chip--open">Open!</span>
                ) : (
                  <>
                    <span className="hud-chip hud-chip--cash">
                      <PouchIcon />
                      {formatMoney(game.cashCents)}
                    </span>
                    <span className="hud-chip hud-chip--crowd">
                      <PeopleIcon />
                      <span className="hud-chip__word">About </span>
                      {expected}
                      <span className="visually-hidden"> customers expected today</span>
                    </span>
                  </>
                )}
              </>
            }
            overlay={
              !open && (
                <>
                {canImprove && (
                <button
                  type="button"
                  className="hotspot hotspot--improve"
                  aria-label={`${improveSeen ? '' : 'New! '}Improve your shop. ${upgradeCount} of ${UPGRADE_SLOTS} upgrades bought`}
                  aria-haspopup="dialog"
                  onClick={openImprove}
                >
                  <span className="improve-sign">
                    <ToolboxIcon />
                    <span className="improve-sign__word">Improve</span>
                    {upgradeCount > 0 && <span className="improve-sign__stars">{'★'.repeat(upgradeCount)}</span>}
                    {!improveSeen && <span className="new-tag">New!</span>}
                  </span>
                </button>
                )}
                <button
                  type="button"
                  className="hotspot hotspot--workshop"
                  aria-label={`Your workshop: making ${plan.produce} today. Change how many to make`}
                  aria-expanded={control === 'make'}
                  onClick={() => showControl('make')}
                >
                  <span className="hotspot__badge">
                    <ProductIcon icon={blueprint.productIcon} />+{plan.produce}
                  </span>
                </button>
                </>
              )
            }
            street={
              <ShopStreet
                icon={blueprint.productIcon}
                cast={blueprint.customers}
                visitors={cast}
                crowd={crowdNote(open ? 'arrived' : 'expected', crowd, cast.length)}
                shelfCount={shelfCount}
                playing={open}
                onRoomChange={setRoom}
                staggerMs={STAGGER_MS}
                reactions={blueprint.reactions}
                coinLabel={open ? formatSigned(result.priceCents) : ''}
                emptyText={
                  open ? 'Nobody came by today' : 'Nobody would buy at this price'
                }
                onShelfClick={open ? undefined : () => showControl('make')}
                shelfExpanded={control === 'make'}
                signs={
                  <div className="street-signs">
                    {open ? (
                      <span className="sign sign--price" aria-hidden="true">
                        <PriceTagIcon />
                        <span className="sign__value">{formatMoney(result.priceCents)}</span>
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="sign sign--price"
                          aria-label={`Price sign: ${formatMoney(plan.priceCents)}. Change the selling price`}
                          aria-expanded={control === 'price'}
                          onClick={() => showControl('price')}
                        >
                          <PriceTagIcon />
                          <span className="sign__value">{formatMoney(plan.priceCents)}</span>
                        </button>
                        <button
                          type="button"
                          className="sign sign--flyers"
                          data-on={plan.flyers ? '' : undefined}
                          aria-label={`Flyer board: flyers are ${plan.flyers ? 'on' : 'off'}. Change flyers`}
                          aria-expanded={control === 'flyers'}
                          onClick={() => showControl('flyers')}
                        >
                          <MegaphoneIcon />
                          <span className="sign__value">{plan.flyers ? 'On' : 'Off'}</span>
                        </button>
                      </>
                    )}
                  </div>
                }
              />
            }
          />
        </div>

        {open ? (
          <div className="mgmt play-open">
            <p className="play-open__title" role="status">
              {shop.shopName} is open!
            </p>
            <p>
              <span className="coin" /> Each coin is one sale at {formatMoney(result.priceCents)}.
            </p>
            <button
              type="button"
              className="text-button"
              ref={skipRef}
              onClick={() => {
                setPhase('report')
                playSfx('chime')
              }}
            >
              Skip to the report
            </button>
          </div>
        ) : (
          <div className="mgmt" ref={panelRef}>
            <h2 className="mgmt__title">Today's plan</h2>


            <div className="toolbar" role="group" aria-label="What would you like to change?">
              <ToolTile
                step={1}
                icon={<PriceTagIcon />}
                label="Price"
                value={formatMoney(plan.priceCents)}
                active={control === 'price'}
                onClick={() => toggleControl('price')}
              />
              <ToolTile
                step={2}
                icon={<ProductIcon icon={blueprint.productIcon} />}
                label="Make"
                value={`+${plan.produce}`}
                active={control === 'make'}
                onClick={() => toggleControl('make')}
              />
              <ToolTile
                step={3}
                icon={<MegaphoneIcon />}
                label="Flyers"
                value={plan.flyers ? 'On' : 'Off'}
                active={control === 'flyers'}
                onClick={() => toggleControl('flyers')}
              />
            </div>

            {control && (
              <div className="mgmt__control" key={control}>
                {control === 'price' && (
                  <Dial
                    label="Sell each one for"
                    display={formatMoney(plan.priceCents)}
                    valueText={`${formatMoney(plan.priceCents)}, about ${expected} customers`}
                    value={plan.priceCents}
                    min={model.minPriceCents}
                    max={model.ceilingPriceCents}
                    step={model.priceStepCents}
                    hint="Lower: more customers. Higher: more coins each."
                    onChange={(priceCents) => update({ priceCents })}
                  />
                )}
                {control === 'make' && (
                  <Dial
                    label="Make today"
                    display={String(plan.produce)}
                    valueText={`${plan.produce} items, costing ${formatMoney(plan.produce * model.unitCostCents)}`}
                    value={plan.produce}
                    min={0}
                    max={makeMax}
                    step={1}
                    hint={
                      makeMax === 0
                        ? 'Not enough cash to make more today.'
                        : making.reason === 'workshop'
                          ? `${formatMoney(model.unitCostCents)} each. Your workshop makes up to ${making.capacity} a day.${making.canGrow ? ' Improve it to make more!' : ''}`
                          : `${formatMoney(model.unitCostCents)} each. You have cash for ${makeMax} today.`
                    }
                    onChange={(produce) => update({ produce })}
                  />
                )}
                {control === 'flyers' && (
                  <div className="play-action">
                    <Switch
                      label={`Hand out flyers (${formatMoney(model.flyerCostCents)})`}
                      hint={
                        canAffordFlyers
                          ? `About ${model.flyerDemandPct}% more customers today.`
                          : 'Not enough cash for flyers today.'
                      }
                      checked={plan.flyers}
                      onToggle={() => update({ flyers: !plan.flyers })}
                    />
                  </div>
                )}
              </div>
            )}

            <p className={`match match--${match.tone}`} role="status">
              <span className="match__dot" aria-hidden="true" />
              {match.text}
            </p>

            <p className="fact-row">
              <span className="fact-chip">
                <ProductIcon icon={blueprint.productIcon} />
                {shop.offering.trim() && <span className="visually-hidden">Selling </span>}
                {product}
              </span>
              <span className="fact-chip fact-chip--spend">
                <span className="coin" />
                Spend {formatMoney(spending)}
              </span>
              {yesterday && (
                <span
                  className={
                    yesterday.operatingProfitCents < 0 ? 'fact-chip fact-chip--down' : 'fact-chip fact-chip--up'
                  }
                >
                  Yesterday {formatSigned(yesterday.operatingProfitCents)}
                </span>
              )}
            </p>

            {outOfCash && (
              <p className="card__note card__note--warn" role="status">
                No cash and an empty shelf. It happens to every mogul! Start
                over and try a new plan.
              </p>
            )}

            <div className="mgmt__actions">
              {canImprove && (
                <button type="button" className="improve-button" aria-haspopup="dialog" onClick={openImprove}>
                  <ToolboxIcon />
                  Improve your shop
                  {!improveSeen && <span className="new-tag">New!</span>}
                </button>
              )}
              <TactileButton size="large" onClick={openForBusiness} disabled={toSell === 0}>
                <BellIcon />
                Open for Business
              </TactileButton>
              {toSell === 0 && !outOfCash && (
                <p className="field__help">Make at least one to open.</p>
              )}
              <button
                type="button"
                className="text-button"
                onClick={() => (game.day === 1 ? restart() : setConfirmRestart(true))}
                hidden={game.day === 1 && !outOfCash}
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </div>

      <UpgradeBoard
        open={improving}
        game={game}
        blueprint={blueprint}
        onBuy={buy}
        onClose={() => setImproving(false)}
      />

      <ConfirmDialog
        open={confirmRestart}
        title="Start over from day 1?"
        message="Your shop stays saved, but its cash, shelf, upgrades and day count go back to the beginning."
        keepLabel="Keep playing"
        confirmLabel="Start over"
        onKeep={() => setConfirmRestart(false)}
        onConfirm={restart}
      />
    </section>
  )
}
