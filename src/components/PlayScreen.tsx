import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { PRODUCT_SHOP } from '../game/model.ts'
import type { DayPlan, DayResult } from '../game/model.ts'
import { formatMoney, formatSigned } from '../game/money.ts'
import {
  clampPlan,
  demandForDay,
  maxProduction,
  pickEvent,
  simulateDay,
} from '../game/simulation.ts'
import { applyResult, newGame } from '../game/state.ts'
import type { GameState } from '../game/state.ts'
import { playSfx } from '../lib/audio.ts'
import { clearGame, loadGame, saveGame } from '../lib/storage.ts'
import type { Progress } from '../lib/storage.ts'
import type { WorldDirection } from '../ai/schema.ts'
import { buildWorld } from '../ai/world.ts'
import { MAX_STAGE_VISITORS, shelfDuring, stageVisitors } from '../world/stage.ts'
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
import { SparkIcon, TactileButton } from './StartButton.tsx'
import { ProductIcon } from './WorldParts.tsx'
import { WorldScene } from './WorldScene.tsx'

type PlayScreenProps = {
  shop: Progress
  /** The AI Director's checked reading of the idea, when there is one. */
  direction: WorldDirection | null
  aiOn: boolean
  /** Skips the customers' walk-through and goes straight to the report. */
  reducedMotion: boolean
  onExit: () => void
}

// Every shop runs on the product model for now; see game/model.ts. The
// blueprint's `kind` is where a service model would be chosen later.
const model = PRODUCT_SHOP

/** Time between one on-screen customer's turn and the next. */
const STAGGER_MS = 420

const freshGame = () => newGame(model, Math.floor(Math.random() * 2 ** 32))

type Phase = 'plan' | 'open' | 'report'

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
  shop,
  direction,
  aiOn,
  reducedMotion,
  onExit,
}: PlayScreenProps) {
  const [game, setGame] = useState<GameState>(() => loadGame() ?? freshGame())
  const [plan, setPlan] = useState<DayPlan>(() =>
    clampPlan(model, game, game.lastPlan),
  )
  const [phase, setPhase] = useState<Phase>('plan')
  const [result, setResult] = useState<DayResult | null>(null)
  /** On-screen sales so far while the shop is open. */
  const [served, setServed] = useState(0)
  const [confirmRestart, setConfirmRestart] = useState(false)
  /** Which control is showing on the plan board. Price first: it is step one. */
  const [control, setControl] = useState<Control | null>('price')
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

  // While the shop is open, customers take turns; then the report appears.
  useEffect(() => {
    if (phase !== 'open' || !result) return
    const cast = stageVisitors(result.demand, result.sold)
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
  }, [phase, result])

  const product = shop.offering || 'your first creations'
  const yesterday = game.history.at(-1)

  const update = (patch: Partial<DayPlan>) =>
    setPlan((current) => clampPlan(model, game, { ...current, ...patch }))

  const makeLimit = maxProduction(model, game.cashCents, plan.flyers)
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
    const today = simulateDay(model, game, plan, pickEvent(game.seed, game.day))
    const next = applyResult(game, today)
    // Saved straight away, so leaving mid-day never loses it.
    setGame(next)
    saveGame(next)
    setResult(today)
    setServed(0)
    if (reducedMotion) {
      setPhase('report')
      playSfx('chime')
    } else {
      setPhase('open')
      playSfx('plop')
    }
  }

  const planNextDay = () => {
    setPlan(clampPlan(model, game, game.lastPlan))
    setResult(null)
    setPhase('plan')
    playSfx('plop')
  }

  const restart = () => {
    const next = freshGame()
    clearGame()
    setGame(next)
    setPlan(clampPlan(model, next, next.lastPlan))
    setResult(null)
    setPhase('plan')
    setConfirmRestart(false)
  }

  if (phase === 'report' && result) {
    return (
      <DayReport
        model={model}
        result={result}
        shopName={shop.shopName}
        icon={blueprint.productIcon}
        shop={{ idea: shop.idea, offering: shop.offering }}
        aiOn={aiOn}
        onNextDay={planNextDay}
        onExit={onExit}
      />
    )
  }

  const open = phase === 'open' && result !== null
  const cast = open
    ? stageVisitors(result.demand, result.sold)
    : stageVisitors(expected, expected)
  const crowd = open ? result.demand : expected
  const buyersShown = cast.filter((visitor) => visitor.buys).length
  const shelfCount = open
    ? shelfDuring(result.available, result.sold, served, buyersShown)
    : toSell

  return (
    <section
      className="card card--play card--game"
      style={
        {
          '--w-accent': blueprint.colors.accent,
          '--w-wall': blueprint.colors.wall,
          '--w-ink': blueprint.colors.ink,
        } as CSSProperties
      }
    >
      <CloseButton label="Close and return home" onClick={onExit} />
      <header className="game-head">
        <p className="card__step">
          <SparkIcon />
          {blueprint.label}
        </p>
        <h1 className="card__title" ref={headingRef} tabIndex={-1}>
          {shop.shopName}
        </h1>
      </header>

      <div className="play-grid">
        <div className="play-stage">
          <WorldScene
            blueprint={blueprint}
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
                      About {expected}
                    </span>
                  </>
                )}
              </>
            }
            overlay={
              !open && (
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
              )
            }
            street={
              <ShopStreet
                icon={blueprint.productIcon}
                theme={blueprint.theme}
                visitors={cast}
                extra={Math.max(0, crowd - MAX_STAGE_VISITORS)}
                shelfCount={shelfCount}
                playing={open}
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
              Customers are stopping by. Each coin is one sale at{' '}
              {formatMoney(result.priceCents)}.
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
                    hint="Lower price, more customers. Higher price, more coins each."
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
                    max={makeLimit}
                    step={1}
                    hint={
                      makeLimit === 0
                        ? 'Not enough cash to make more today.'
                        : `Each costs ${formatMoney(model.unitCostCents)}. That is ${formatMoney(plan.produce * model.unitCostCents)} today. You can afford ${makeLimit}.`
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

            <p className="plan-summary">
              Selling <strong>{product}</strong>. Spending{' '}
              <strong>{formatMoney(spending)}</strong> of your{' '}
              {formatMoney(game.cashCents)}.
              {yesterday &&
                ` Yesterday: ${formatSigned(yesterday.operatingProfitCents)} ${
                  yesterday.operatingProfitCents < 0 ? 'loss' : 'profit'
                }.`}
            </p>

            {outOfCash && (
              <p className="card__note card__note--warn" role="status">
                The till and the shelf are both empty, so the shop cannot open.
                Every mogul has days like this. Start over and try a new plan.
              </p>
            )}

            <div className="mgmt__actions">
              <TactileButton size="large" onClick={openForBusiness} disabled={toSell === 0}>
                <BellIcon />
                Open for Business
              </TactileButton>
              {toSell === 0 && !outOfCash && (
                <p className="field__help">Make at least one item to open.</p>
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

      <ConfirmDialog
        open={confirmRestart}
        title="Start over from day 1?"
        message="Your shop stays saved, but its cash, shelf and day count go back to the beginning."
        keepLabel="Keep playing"
        confirmLabel="Start over"
        onKeep={() => setConfirmRestart(false)}
        onConfirm={restart}
      />
    </section>
  )
}
