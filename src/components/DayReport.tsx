import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Coaching } from '../ai/schema.ts'
import { fallbackCoaching } from '../game/coach.ts'
import type { BusinessModel, DayResult } from '../game/model.ts'
import { formatMoney, formatSigned } from '../game/money.ts'
import { summarizeDay } from '../game/report.ts'
import type { ReportLine } from '../game/report.ts'
import { eventById } from '../game/simulation.ts'
import { requestCoaching } from '../lib/ai.ts'
import type { ProductIconId } from '../world/blueprint.ts'
import { SparkIcon, TactileButton } from './StartButton.tsx'
import { ProductIcon } from './WorldParts.tsx'

type DayReportProps = {
  model: BusinessModel
  result: DayResult
  shopName: string
  icon: ProductIconId
  /** Sent to the AI coach along with the day's numbers. Never the player's name. */
  shop: { worldId: string; idea: string; offering: string }
  aiOn: boolean
  onNextDay: () => void
  onExit: () => void
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

const SHELF_ICONS = 24

function Lines({
  heading,
  lines,
  sign,
  totalLabel,
  totalCents,
}: {
  heading: string
  lines: ReportLine[]
  sign: 1 | -1
  totalLabel: string
  totalCents: number
}) {
  return (
    <>
      <h3 className="book__group">{heading}</h3>
      <dl className="book__lines">
        {lines.map((line) => (
          <div className="book__line" key={line.id}>
            <dt>
              {line.label}
              <span>{line.detail}</span>
            </dt>
            <dd>{formatMoney(line.cents)}</dd>
          </div>
        ))}
        <div className="book__line book__line--sum">
          <dt>{totalLabel}</dt>
          <dd>{sign < 0 && totalCents > 0 ? '-' : ''}{formatMoney(totalCents)}</dd>
        </div>
      </dl>
    </>
  )
}

function Book({
  kind,
  badge,
  title,
  sub,
  children,
  delay,
}: {
  kind: 'profit' | 'cash' | 'shelf'
  badge: ReactNode
  title: string
  sub: string
  children: ReactNode
  delay: number
}) {
  return (
    <motion.section
      className={`book book--${kind}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
    >
      <div className="book__head">
        <span className="book__badge" aria-hidden="true">
          {badge}
        </span>
        <div>
          <h2 className="book__title">{title}</h2>
          <p className="book__sub">{sub}</p>
        </div>
      </div>
      {children}
    </motion.section>
  )
}

/**
 * The end-of-day story. Profit, cash and the shelf each get their own
 * "book", then a short note explains why profit and cash can differ.
 */
export function DayReport({
  model,
  result: r,
  shopName,
  icon,
  shop,
  aiOn,
  onNextDay,
  onExit,
}: DayReportProps) {
  // The built-in coach answers at once; the AI coach replaces it if and when
  // a checked reply arrives. Coaching is words only and never changes the game.
  const [aiCoaching, setAiCoaching] = useState<Coaching | null>(null)
  const [asking, setAsking] = useState(aiOn)
  const { worldId, idea, offering } = shop
  useEffect(() => {
    if (!aiOn) return
    let live = true
    requestCoaching(model, r, { worldId, idea, offering }).then((coaching) => {
      if (!live) return
      setAiCoaching(coaching)
      setAsking(false)
    })
    return () => {
      live = false
    }
  }, [aiOn, model, r, worldId, idea, offering])
  const coaching = aiCoaching ?? fallbackCoaching(model, r)

  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const event = eventById(r.eventId)
  const s = summarizeDay(model, r)
  const profit = s.profitCents
  const cashChange = s.cashChangeCents
  const shelfGrew = s.inventoryChangeCents > 0
  const shelfShrank = s.inventoryChangeCents < 0
  const shownCustomers = Math.min(r.demand, 40)
  const shelfIcons = Math.min(r.endInventory, SHELF_ICONS)

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

      <div className="books">
        <Book
          kind="profit"
          badge={<SparkIcon />}
          title={profit < 0 ? 'Loss today' : 'Profit today'}
          sub="What you earned from the items you sold"
          delay={0.2}
        >
          <Lines
            heading="Revenue"
            lines={s.revenue}
            sign={1}
            totalLabel="Total revenue"
            totalCents={s.revenueTotalCents}
          />
          <Lines
            heading="Expenses"
            lines={s.expenses}
            sign={-1}
            totalLabel="Total expenses"
            totalCents={s.expensesTotalCents}
          />
          <p className={profit < 0 ? 'book__total book__total--down' : 'book__total'}>
            <span>{profit < 0 ? 'Loss today' : 'Profit today'}</span>
            <strong>{formatSigned(profit)}</strong>
          </p>
          <p className="book__foot">Revenue take away expenses.</p>
        </Book>

        <Book
          kind="cash"
          badge={<span className="coin" />}
          title="Cash change today"
          sub="Money that moved in or out of your till"
          delay={0.35}
        >
          <Lines
            heading="Money in"
            lines={s.cashIn}
            sign={1}
            totalLabel="Total in"
            totalCents={s.cashInTotalCents}
          />
          <Lines
            heading="Money out"
            lines={s.cashOut}
            sign={-1}
            totalLabel="Total out"
            totalCents={s.cashOutTotalCents}
          />
          <p className={cashChange < 0 ? 'book__total book__total--down' : 'book__total'}>
            <span>{cashChange < 0 ? 'Cash went down' : cashChange > 0 ? 'Cash went up' : 'Cash stayed the same'}</span>
            <strong>{formatSigned(cashChange)}</strong>
          </p>
          <p className="book__foot">
            Your till: {formatMoney(r.cashStartCents)} → {formatMoney(r.cashEndCents)}
          </p>
        </Book>

        <Book
          kind="shelf"
          badge={<ProductIcon icon={icon} />}
          title="Inventory carried into tomorrow"
          sub="Items still on your shelf, counted at what they cost to make"
          delay={0.5}
        >
          <div className="shelf-flow">
            <span className="shelf-flow__step">
              <strong>{r.startInventory}</strong>
              <span>this morning</span>
            </span>
            <span className="shelf-flow__op" aria-label="plus">+</span>
            <span className="shelf-flow__step">
              <strong>{r.produced}</strong>
              <span>made</span>
            </span>
            {r.stockLost > 0 && (
              <>
                <span className="shelf-flow__op" aria-label="minus">−</span>
                <span className="shelf-flow__step">
                  <strong>{r.stockLost}</strong>
                  <span>lost</span>
                </span>
              </>
            )}
            <span className="shelf-flow__op" aria-label="minus">−</span>
            <span className="shelf-flow__step">
              <strong>{r.sold}</strong>
              <span>sold</span>
            </span>
            <span className="shelf-flow__op" aria-label="equals">=</span>
            <span className="shelf-flow__step shelf-flow__step--result">
              <strong>{r.endInventory}</strong>
              <span>for tomorrow</span>
            </span>
          </div>
          {r.endInventory > 0 ? (
            <>
              <div className="shelf-icons" aria-hidden="true">
                {Array.from({ length: shelfIcons }, (_, i) => (
                  <ProductIcon key={i} icon={icon} />
                ))}
                {r.endInventory > shelfIcons && (
                  <span className="shelf__more">+{r.endInventory - shelfIcons}</span>
                )}
              </div>
              <p>
                <strong>
                  {plural(r.endInventory, 'item', 'items')} worth{' '}
                  {formatMoney(s.inventoryEndValueCents)}
                </strong>{' '}
                ({formatMoney(model.unitCostCents)} each). They are ready to
                sell tomorrow without spending more.
              </p>
            </>
          ) : (
            <p>
              <strong>Your shelf is empty.</strong> Tomorrow you start with
              nothing to sell until you make more.
            </p>
          )}
        </Book>
      </div>

      <motion.div
        className="bridge"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.3 }}
      >
        <h2 className="bridge__title">
          {shelfGrew || shelfShrank
            ? 'Why profit and cash are different today'
            : 'Profit and cash match today'}
        </h2>
        <div className="bridge__sum">
          <span className="bridge__chip bridge__chip--profit">
            <span>{profit < 0 ? 'Loss' : 'Profit'}</span>
            <strong>{formatSigned(profit)}</strong>
          </span>
          {(shelfGrew || shelfShrank) && (
            <>
              <span className="shelf-flow__op" aria-label={shelfGrew ? 'minus' : 'plus'}>
                {shelfGrew ? '−' : '+'}
              </span>
              <span className="bridge__chip bridge__chip--shelf">
                <span>{shelfGrew ? 'Added to the shelf' : 'Taken from the shelf'}</span>
                <strong>{formatMoney(Math.abs(s.inventoryChangeCents))}</strong>
              </span>
            </>
          )}
          <span className="shelf-flow__op" aria-label="equals">=</span>
          <span className="bridge__chip bridge__chip--cash">
            <span>Cash change</span>
            <strong>{formatSigned(cashChange)}</strong>
          </span>
        </div>
        {shelfGrew && (
          <ul>
            <li>
              <strong>Cash went down</strong> by{' '}
              {formatMoney(s.inventoryChangeCents)} for{' '}
              {plural(s.inventoryChangeItems, 'item', 'items')} you made but
              did not sell.
            </li>
            <li>
              <strong>That money is not lost.</strong> It is sitting on your
              shelf as inventory worth {formatMoney(s.inventoryEndValueCents)}.
            </li>
            <li>
              <strong>Profit does not count it yet.</strong> An item only
              becomes an expense on the day it sells.
            </li>
          </ul>
        )}
        {shelfShrank && (
          <ul>
            <li>
              Your shelf has {plural(-s.inventoryChangeItems, 'item', 'items')}{' '}
              fewer than this morning. You paid for those on an earlier day,
              so <strong>no cash left your till for them today</strong>.
            </li>
            <li>
              <strong>Profit still counts their cost</strong> (
              {formatMoney(-s.inventoryChangeCents)}), because today is the
              day they left the shelf.
            </li>
          </ul>
        )}
        {!shelfGrew && !shelfShrank && (
          <p>
            Your shelf is worth the same as this morning, so everything you
            paid for today also counted as an expense today.
          </p>
        )}
      </motion.div>

      <section className="coach" aria-live="polite">
        <p className="coach__by">
          <SparkIcon />
          {aiCoaching
            ? 'From the AI Director'
            : asking
              ? 'Your coach (the AI Director is reading your day…)'
              : 'Your coach'}
        </p>
        <p>{coaching.encouragement}</p>
        <p>
          <strong>Try this: </strong>
          {coaching.suggestion}
        </p>
        {coaching.challenge && <p className="coach__challenge">{coaching.challenge}</p>}
        {aiCoaching && (
          <p className="field__help">
            The AI only explains. Every number on this page comes from the
            game's own maths.
          </p>
        )}
      </section>

      <div className="card__actions">
        <button type="button" className="text-button" onClick={onExit}>
          My Worlds
        </button>
        <TactileButton onClick={onNextDay}>Plan day {r.day + 1}</TactileButton>
      </div>
    </section>
  )
}
