import { useEffect, useRef, useState } from 'react'
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
import { Switch } from './AudioSettings.tsx'
import { CloseButton, ConfirmDialog } from './ConfirmDialog.tsx'
import { DayReport } from './DayReport.tsx'
import { Dial } from './Dial.tsx'
import { ShopPreview } from './ShopPreview.tsx'
import { SparkIcon, TactileButton } from './StartButton.tsx'

type PlayScreenProps = {
  shop: Progress
  onExit: () => void
}

// Every shop runs on the product model for now; see game/model.ts.
const model = PRODUCT_SHOP

const freshGame = () => newGame(model, Math.floor(Math.random() * 2 ** 32))

function Crowd({ count }: { count: number }) {
  return (
    <div className="crowd" aria-hidden="true">
      {Array.from({ length: Math.min(count, 40) }, (_, i) => (
        <span key={i} className="crowd__person" />
      ))}
    </div>
  )
}

/** The shop dashboard: plan a day, open for business, read the report. */
export function PlayScreen({ shop, onExit }: PlayScreenProps) {
  const [game, setGame] = useState<GameState>(() => loadGame() ?? freshGame())
  const [plan, setPlan] = useState<DayPlan>(() =>
    clampPlan(model, game, game.lastPlan),
  )
  const [report, setReport] = useState<DayResult | null>(null)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!report) headingRef.current?.focus()
  }, [report])

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
  const outOfCash = game.inventory === 0 && maxProduction(model, game.cashCents, false) === 0

  const openForBusiness = () => {
    const result = simulateDay(model, game, plan, pickEvent(game.seed, game.day))
    const next = applyResult(game, result)
    setGame(next)
    saveGame(next)
    setReport(result)
    playSfx('chime')
  }

  const planNextDay = () => {
    setPlan(clampPlan(model, game, game.lastPlan))
    setReport(null)
    playSfx('plop')
  }

  const restart = () => {
    const next = freshGame()
    clearGame()
    setGame(next)
    setPlan(clampPlan(model, next, next.lastPlan))
    setReport(null)
    setConfirmRestart(false)
  }

  if (report) {
    return (
      <DayReport
        model={model}
        result={report}
        shopName={shop.shopName}
        onNextDay={planNextDay}
        onExit={onExit}
      />
    )
  }

  return (
    <section className="card card--play">
      <CloseButton label="Close and return home" onClick={onExit} />
      <p className="card__step">
        <SparkIcon />
        Day {game.day}
      </p>
      <h1 className="card__title" ref={headingRef} tabIndex={-1}>
        {shop.shopName}
      </h1>

      <div className="play-grid">
        <div className="play-side">
          <ShopPreview theme={shop.theme} name={`Selling: ${product}`} />
          <dl className="stats">
            <div className="stat stat--cash">
              <dt>Cash</dt>
              <dd>{formatMoney(game.cashCents)}</dd>
            </div>
            <div className="stat">
              <dt>On the shelf</dt>
              <dd>{game.inventory}</dd>
            </div>
            <div className="stat">
              <dt>{yesterday ? 'Yesterday' : 'Each one costs'}</dt>
              <dd>
                {yesterday
                  ? formatSigned(yesterday.operatingProfitCents)
                  : formatMoney(model.unitCostCents)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="play-plan">
          <h2 className="play-plan__title">Today's plan</h2>

          <Dial
            label="Selling price"
            display={formatMoney(plan.priceCents)}
            valueText={`${formatMoney(plan.priceCents)}, about ${expected} customers`}
            value={plan.priceCents}
            min={model.minPriceCents}
            max={model.ceilingPriceCents}
            step={model.priceStepCents}
            hint={`Each one costs ${formatMoney(model.unitCostCents)} to make.`}
            onChange={(priceCents) => update({ priceCents })}
          />

          <div className="demand">
            <p>
              <strong>
                About {expected} {expected === 1 ? 'customer' : 'customers'}
              </strong>{' '}
              would buy at this price.
            </p>
            <Crowd count={expected} />
            <p className="field__help">
              Higher prices earn more per sale but bring fewer customers.
            </p>
          </div>

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
                : `Costs ${formatMoney(plan.produce * model.unitCostCents)}. You can afford up to ${makeLimit}.`
            }
            onChange={(produce) => update({ produce })}
          />

          <div className="play-action">
            <Switch
              label={`Hand out flyers (${formatMoney(model.flyerCostCents)})`}
              hint={
                canAffordFlyers
                  ? `Brings about ${model.flyerDemandPct}% more customers today.`
                  : 'Not enough cash for flyers today.'
              }
              checked={plan.flyers}
              onToggle={() => update({ flyers: !plan.flyers })}
            />
          </div>

          <p className="plan-summary">
            You will have <strong>{toSell}</strong> to sell and spend{' '}
            <strong>{formatMoney(spending)}</strong> of your{' '}
            {formatMoney(game.cashCents)}.
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
            <TactileButton
              size="large"
              onClick={openForBusiness}
              disabled={toSell === 0}
            >
              Open for Business
            </TactileButton>
          </div>
          {toSell === 0 && !outOfCash && (
            <p className="field__help">Make at least one item to open.</p>
          )}
        </div>
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
