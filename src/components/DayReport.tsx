import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { BusinessModel, DayResult } from '../game/model.ts'
import { formatMoney, formatSigned } from '../game/money.ts'
import { eventById, inventoryValue, takeaway } from '../game/simulation.ts'
import { SparkIcon, TactileButton } from './StartButton.tsx'

type DayReportProps = {
  model: BusinessModel
  result: DayResult
  shopName: string
  onNextDay: () => void
  onExit: () => void
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

function LedgerRow({
  label,
  detail,
  cents,
}: {
  label: string
  detail: string
  cents: number
}) {
  return (
    <div className="ledger__row">
      <dt>
        {label}
        <span>{detail}</span>
      </dt>
      <dd>{formatSigned(cents)}</dd>
    </div>
  )
}

/** The end-of-day story: what happened, then money in, money out, profit. */
export function DayReport({
  model,
  result: r,
  shopName,
  onNextDay,
  onExit,
}: DayReportProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const event = eventById(r.eventId)
  const profit = r.operatingProfitCents
  const cashChange = r.cashEndCents - r.cashStartCents
  const shownCustomers = Math.min(r.demand, 40)

  return (
    <section className="card card--play">
      <p className="card__step">
        <SparkIcon />
        Day {r.day} report
      </p>
      <h1 className="card__title" ref={headingRef} tabIndex={-1}>
        {profit > 0
          ? `${shopName} made a profit`
          : profit < 0
            ? `${shopName} made a loss today`
            : `${shopName} broke even`}
      </h1>

      {event && (
        <div className="surprise">
          <p className="surprise__label">Today's surprise</p>
          <p className="surprise__title">{event.title}</p>
          <p>{event.description}</p>
        </div>
      )}

      <div className="visitors">
        <p>
          <strong>{plural(r.demand, 'customer', 'customers')}</strong> wanted to
          buy at {formatMoney(r.priceCents)}. You had{' '}
          {plural(r.available, 'item', 'items')} and sold{' '}
          <strong>{r.sold}</strong>.
          {r.missedCustomers > 0 &&
            ` ${plural(r.missedCustomers, 'customer', 'customers')} left empty-handed.`}
        </p>
        {shownCustomers > 0 && (
          <div className="crowd" aria-hidden="true">
            {Array.from({ length: shownCustomers }, (_, i) => (
              <motion.span
                key={i}
                className={i < r.sold ? 'crowd__person' : 'crowd__person crowd__person--missed'}
                initial={{ opacity: 0, y: 8, scale: 0.6 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.03, duration: 0.25 }}
              />
            ))}
          </div>
        )}
      </div>

      <dl className="ledger">
        <LedgerRow
          label="Money in (revenue)"
          detail={`${r.sold} sold × ${formatMoney(r.priceCents)}`}
          cents={r.revenueCents}
        />
        <LedgerRow
          label="Cost of the items you sold"
          detail={`${r.sold} × ${formatMoney(model.unitCostCents)} to make`}
          cents={-r.costOfSalesCents}
        />
        {r.marketingCents > 0 && (
          <LedgerRow label="Flyers" detail="Handed out this morning" cents={-r.marketingCents} />
        )}
        {r.spoilageCents > 0 && (
          <LedgerRow
            label="Lost items"
            detail={`${r.stockLost} × ${formatMoney(model.unitCostCents)}`}
            cents={-r.spoilageCents}
          />
        )}
        {r.eventCashCents !== 0 && (
          <LedgerRow
            label="Surprise"
            detail={event?.title ?? ''}
            cents={r.eventCashCents}
          />
        )}
        <motion.div
          className={
            profit < 0 ? 'ledger__row ledger__total ledger__total--loss' : 'ledger__row ledger__total'
          }
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <dt>
            {profit < 0 ? 'Loss today' : 'Profit today'}
            <span>Money in, take away the costs</span>
          </dt>
          <dd>{formatSigned(profit)}</dd>
        </motion.div>
      </dl>

      <div className="aftermath">
        <p>
          <strong>
            Cash: {formatMoney(r.cashStartCents)} → {formatMoney(r.cashEndCents)}
          </strong>{' '}
          ({formatSigned(cashChange)})
        </p>
        <p>
          {r.produced > 0
            ? `You spent ${formatMoney(r.productionSpendCents)} making ${plural(r.produced, 'item', 'items')} today. `
            : 'You made nothing new today. '}
          {r.endInventory > 0
            ? `${plural(r.endInventory, 'is', 'are')} still on your shelf for tomorrow, worth ${formatMoney(inventoryValue(model, r.endInventory))}.`
            : 'Your shelf is empty.'}
        </p>
        {cashChange !== profit && (
          <p className="field__help">
            Profit only counts the items you sold. Money spent on items still on
            the shelf comes back when they sell.
          </p>
        )}
      </div>

      <p className="tip">
        <SparkIcon />
        <span>{takeaway(model, r)}</span>
      </p>

      <div className="card__actions">
        <button type="button" className="text-button" onClick={onExit}>
          Back to the island
        </button>
        <TactileButton onClick={onNextDay}>Plan day {r.day + 1}</TactileButton>
      </div>
    </section>
  )
}
