import { useEffect, useMemo, useRef, useState } from 'react'
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
import { generateWorldBlueprint } from '../world/blueprint.ts'
import { MAX_STAGE_VISITORS, shelfDuring, stageVisitors } from '../world/stage.ts'
import { Switch } from './AudioSettings.tsx'
import { CloseButton, ConfirmDialog } from './ConfirmDialog.tsx'
import { DayReport } from './DayReport.tsx'
import { Dial } from './Dial.tsx'
import { ShopStreet } from './ShopStreet.tsx'
import { SparkIcon, TactileButton } from './StartButton.tsx'
import { WorldScene } from './WorldScene.tsx'

type PlayScreenProps = {
  shop: Progress
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

/** The shop in its world: plan a day, watch it happen, read the report. */
export function PlayScreen({ shop, reducedMotion, onExit }: PlayScreenProps) {
  const [game, setGame] = useState<GameState>(() => loadGame() ?? freshGame())
  const [plan, setPlan] = useState<DayPlan>(() =>
    clampPlan(model, game, game.lastPlan),
  )
  const [phase, setPhase] = useState<Phase>('plan')
  const [result, setResult] = useState<DayResult | null>(null)
  /** On-screen sales so far while the shop is open. */
  const [served, setServed] = useState(0)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)

  const blueprint = useMemo(
    () =>
      generateWorldBlueprint({
        idea: shop.idea,
        offering: shop.offering,
        style: shop.theme,
      }),
    [shop.idea, shop.offering, shop.theme],
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
    <section className="card card--play">
      <CloseButton label="Close and return home" onClick={onExit} />
      <p className="card__step">
        <SparkIcon />
        {blueprint.label}
      </p>
      <h1 className="card__title" ref={headingRef} tabIndex={-1}>
        {shop.shopName}
      </h1>

      <div className="play-grid">
        <div className="play-stage">
          <WorldScene
            blueprint={blueprint}
            sign={`Selling: ${product}`}
            hud={
              <>
                <span className="hud-chip">Day {open ? result.day : game.day}</span>
                {open ? (
                  <span className="hud-chip hud-chip--open">Open!</span>
                ) : (
                  <span className="hud-chip hud-chip--cash">
                    <span className="coin" />
                    {formatMoney(game.cashCents)}
                  </span>
                )}
              </>
            }
            street={
              <ShopStreet
                icon={blueprint.productIcon}
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
              />
            }
          />
          {!open && (
            <p className="play-stage__note">
              Move the dials and watch your street and shelf change.
            </p>
          )}
        </div>

        {open ? (
          <div className="play-plan play-plan--compact play-open">
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
          <div className="play-plan play-plan--compact">
            <h2 className="play-plan__title">Today's plan</h2>

            <Dial
              label="Selling price"
              display={formatMoney(plan.priceCents)}
              valueText={`${formatMoney(plan.priceCents)}, about ${expected} customers`}
              value={plan.priceCents}
              min={model.minPriceCents}
              max={model.ceilingPriceCents}
              step={model.priceStepCents}
              hint={
                <>
                  <strong>
                    About {expected} {expected === 1 ? 'customer' : 'customers'}
                  </strong>{' '}
                  at this price. Higher prices earn more per sale but bring
                  fewer customers.
                </>
              }
              onChange={(priceCents) => update({ priceCents })}
            />

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
                  ? 'You do not have enough cash to make more today.'
                  : `${formatMoney(model.unitCostCents)} each, so ${formatMoney(plan.produce * model.unitCostCents)} today. You can afford up to ${makeLimit}.`
              }
              onChange={(produce) => update({ produce })}
            />

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

            <p className="plan-summary">
              <strong>{toSell}</strong> to sell, spending{' '}
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

            <div className="card__actions">
              <button
                type="button"
                className="text-button"
                onClick={() => (game.day === 1 ? restart() : setConfirmRestart(true))}
                hidden={game.day === 1 && !outOfCash}
              >
                Start over
              </button>
              <TactileButton onClick={openForBusiness} disabled={toSell === 0}>
                Open for Business
              </TactileButton>
            </div>
            {toSell === 0 && !outOfCash && (
              <p className="field__help">Make at least one item to open.</p>
            )}
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
