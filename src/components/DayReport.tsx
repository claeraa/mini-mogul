import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Coaching } from '../ai/schema.ts'
import { fallbackCoaching } from '../game/coach.ts'
import type { BusinessModel, DayResult } from '../game/model.ts'
import { formatMoney, formatSigned } from '../game/money.ts'
import { dayMood, reportFaces, reportTitle } from '../game/mood.ts'
import type { DayMood } from '../game/mood.ts'
import { summarizeDay } from '../game/report.ts'
import type { ReportLine } from '../game/report.ts'
import { eventById } from '../game/simulation.ts'
import { requestCoaching } from '../lib/ai.ts'
import type { ProductIconId } from '../world/blueprint.ts'
import type { CustomerCastId } from '../world/customers.ts'
import { Critter } from './Critter.tsx'
import { SparkIcon, TactileButton } from './StartButton.tsx'
import { ProductIcon } from './WorldParts.tsx'

type DayReportProps = {
  model: BusinessModel
  result: DayResult
  shopName: string
  icon: ProductIconId
  /** The world's customers, who cheer (or not) on the report. */
  cast: CustomerCastId
  /** No confetti, coins or bouncing when the player has asked for less motion. */
  reducedMotion: boolean
  /** Sent to the AI coach along with the day's numbers. Never the player's name. */
  shop: { worldId: string; idea: string; offering: string }
  aiOn: boolean
  onNextDay: () => void
  onExit: () => void
}

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

const SHELF_ICONS = 24

/** "Challenge: serve everyone." becomes "Serve everyone." under a Mission tag. */
function missionText(challenge: string) {
  const text = challenge.replace(/^\s*(challenge|mission)\s*[:!-]\s*/i, '').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

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

const CONFETTI = ['#ff8fb8', '#ffd066', '#6fb7e8', '#8fd6a0', '#b79cf0', '#ff9a76']

/**
 * A short burst of feedback behind the headline, chosen by how the day went:
 * confetti for a great day, popping coins for a profit, a few soft sparkles
 * for an okay day, and nothing at all on a tough one. Decoration only: it is
 * hidden from screen readers and is not drawn when motion is reduced.
 */
function Celebration({ mood }: { mood: DayMood }) {
  if (mood === 'tough') return null
  const count = mood === 'great' ? 22 : mood === 'good' ? 7 : 4
  return (
    <div className={`celebrate celebrate--${mood}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        // Spread evenly, then nudged, so the burst looks scattered but is
        // the same every time.
        const left = ((i + 0.5) / count) * 100 + ((i * 37) % 9) - 4
        const style = {
          left: `${Math.min(97, Math.max(3, left))}%`,
          '--delay': `${((i * 53) % 10) * 0.07}s`,
          '--spin': `${((i * 71) % 5) * 90 - 180}deg`,
          '--drift': `${((i * 29) % 7) * 6 - 18}px`,
          background: mood === 'great' ? CONFETTI[i % CONFETTI.length] : undefined,
        } as CSSProperties
        return mood === 'great' ? (
          <span key={i} className={i % 3 === 0 ? 'celebrate__bit celebrate__bit--round' : 'celebrate__bit'} style={style} />
        ) : mood === 'good' ? (
          <span key={i} className="celebrate__coin coin" style={style} />
        ) : (
          <span key={i} className="celebrate__spark" style={style}>
            <SparkIcon />
          </span>
        )
      })}
    </div>
  )
}

/** A target, for the coach's optional mission. */
function TargetIcon() {
  return (
    <svg className="mission__icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#ff8f6b" />
      <circle cx="12" cy="12" r="6.500" fill="#fff" />
      <circle cx="12" cy="12" r="3" fill="#ff8f6b" />
    </svg>
  )
}

/** A light bulb, for the coach's tip. */
function BulbIcon() {
  return (
    <svg className="coach__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.500a7 7 0 0 0-4 12.700V18h8v-2.800A7 7 0 0 0 12 2.500z" fill="#ffd94a" stroke="#d99a1c" strokeWidth="1.200" />
      <rect x="8.500" y="18.500" width="7" height="3" rx="1.200" fill="#8a7f9c" />
    </svg>
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
  cast,
  reducedMotion,
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
  const mood = dayMood(model, r)
  const faces = reportFaces(r)
  // Customers arrive one after another; each tile pops in after the headline.
  const pop = (order: number) => ({
    initial: { opacity: 0, scale: 0.6, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { delay: 0.15 + order * 0.12, type: 'spring' as const, stiffness: 420, damping: 16 },
  })
  const shelfIcons = Math.min(r.endInventory, SHELF_ICONS)

  return (
    <section className="card card--play">
      <p className="card__step">
        <SparkIcon />
        Day {r.day} report
      </p>
      <div className={`report-hero report-hero--${mood}`}>
        {!reducedMotion && <Celebration mood={mood} />}
        <h1 className="card__title" ref={headingRef} tabIndex={-1}>
          {reportTitle(model, r)}
        </h1>
        <p className="visually-hidden">
          {shopName}: {profit > 0 ? 'a profit' : profit < 0 ? 'a loss' : 'broke even'} of {formatMoney(Math.abs(profit))}.
        </p>

        {faces.happy + faces.sad > 0 ? (
          <div className="cheer" aria-hidden="true">
            {Array.from({ length: faces.happy + faces.sad }, (_, i) => (
              <motion.span
                key={i}
                className={i < faces.happy ? 'cheer__face cheer__face--happy' : 'cheer__face cheer__face--sad'}
                style={{ '--i': i } as CSSProperties}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
              >
                <Critter cast={cast} index={i} />
              </motion.span>
            ))}
          </div>
        ) : (
          <p className="cheer cheer--empty">Nobody came by today.</p>
        )}

        <p className="fact-row fact-row--center">
          <span className="fact-chip">
            <strong>{r.demand}</strong> came
          </span>
          <span className="fact-chip fact-chip--up">
            <strong>{r.sold}</strong> bought
          </span>
          {r.missedCustomers > 0 && (
            <span className="fact-chip fact-chip--calm">
              <strong>{r.missedCustomers}</strong> missed out
            </span>
          )}
        </p>
      </div>

      <div className="score" role="group" aria-label="Today at a glance">
        <motion.p
          className={
            profit > 0 ? 'score__tile score__tile--profit' : profit < 0 ? 'score__tile score__tile--calm' : 'score__tile'
          }
          {...pop(0)}
        >
          <SparkIcon />
          <span>{profit < 0 ? 'Loss' : 'Profit'}</span>
          <strong>{formatSigned(profit)}</strong>
        </motion.p>
        <motion.p className="score__tile score__tile--cash" {...pop(1)}>
          <span className="coin" />
          <span>Cash</span>
          <strong>{formatMoney(r.cashEndCents)}</strong>
        </motion.p>
        <motion.p className="score__tile score__tile--shelf" {...pop(2)}>
          <ProductIcon icon={icon} />
          <span>Shelf</span>
          <strong>{r.endInventory}</strong>
        </motion.p>
      </div>

      {event && (
        <p className="surprise surprise--line">
          <span className="surprise__label">Surprise!</span>
          <strong>{event.title}</strong>
          <span>{event.description}</span>
        </p>
      )}

      <section className="coach" aria-live="polite">
        <p className="coach__by">
          <SparkIcon />
          {aiCoaching ? 'AI coach' : asking ? 'Coach (the AI is thinking…)' : 'Coach'}
        </p>
        <p>{coaching.encouragement}</p>
        <p className="coach__tip">
          <BulbIcon />
          <span>
            <span className="visually-hidden">Try this: </span>
            {coaching.suggestion}
          </span>
        </p>
      </section>

      {coaching.challenge && (
        <motion.section
          className="mission"
          aria-label="Mission for tomorrow"
          initial={{ opacity: 0, y: 12, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 18 }}
        >
          <TargetIcon />
          <p>
            <span className="mission__tag">Mission</span>
            {missionText(coaching.challenge)}
          </p>
        </motion.section>
      )}

      <details className="numbers">
        <summary>
          <span>See how it adds up</span>
        </summary>
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

      </details>

      <div className="card__actions">
        <button type="button" className="text-button" onClick={onExit}>
          My Worlds
        </button>
        <TactileButton onClick={onNextDay}>Plan day {r.day + 1}</TactileButton>
      </div>
    </section>
  )
}
