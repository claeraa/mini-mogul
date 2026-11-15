import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { formatMoney } from '../game/money.ts'
import type { GameState } from '../game/state.ts'
import {
  CAMPAIGN,
  MAX_UPGRADE_LEVEL,
  checkCampaign,
  checkUpgrade,
  extrasOf,
  nextUpgrade,
} from '../game/upgrades.ts'
import type { PurchaseCheck, UpgradeId } from '../game/upgrades.ts'
import type { WorldBlueprint } from '../world/blueprint.ts'
import { CAMPAIGN_NAME, productionUpgradeName, shopUpgradeName } from '../world/upgradeNames.ts'
import { MegaphoneIcon } from './GameIcons.tsx'
import { TactileButton } from './StartButton.tsx'
import { ProductIcon } from './WorldParts.tsx'

export type Purchase = UpgradeId | 'campaign'

type UpgradeBoardProps = {
  open: boolean
  game: GameState
  blueprint: WorldBlueprint
  onBuy: (purchase: Purchase) => void
  onClose: () => void
}

/** A little shop front, for the shop improvement. */
function ShopFrontIcon() {
  return (
    <svg className="game-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10l2-6h14l2 6z" fill="#ff8f6b" stroke="#c7553a" strokeWidth="1.200" strokeLinejoin="round" />
      <rect x="4.500" y="10" width="15" height="10.500" rx="1.200" fill="#fff3dc" stroke="#c99a5a" strokeWidth="1.200" />
      <rect x="10" y="13.500" width="4" height="7" rx="1" fill="#36bccb" />
      <path d="M17.500 3.200l.7 1.700 1.800.2-1.400 1.200.4 1.800-1.500-1-1.500 1 .4-1.800-1.400-1.200 1.800-.2z" fill="#ffd94a" stroke="#d99a1c" strokeWidth="0.600" />
    </svg>
  )
}

/** A toolbox: the way in to the Improve board. */
export function ToolboxIcon() {
  return (
    <svg className="game-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.500 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" fill="none" stroke="#8a5a48" strokeWidth="2" strokeLinecap="round" />
      <rect x="3" y="8" width="18" height="12" rx="2.500" fill="#f0705f" stroke="#b9453c" strokeWidth="1.200" />
      <path d="M3 13h18" stroke="#b9453c" strokeWidth="1.200" />
      <rect x="10" y="11.500" width="4" height="3.500" rx="1" fill="#ffd94a" stroke="#d99a1c" strokeWidth="0.800" />
    </svg>
  )
}

function Pips({ level }: { level: number }) {
  return (
    <span className="pips" role="img" aria-label={`Level ${level} of ${MAX_UPGRADE_LEVEL}`}>
      {Array.from({ length: MAX_UPGRADE_LEVEL }, (_, i) => (
        <span key={i} className={i < level ? 'pip pip--on' : 'pip'} />
      ))}
    </span>
  )
}

/** One thing to buy: picture, name, what it changes, and a buy button. */
function Card({
  id,
  icon,
  name,
  level,
  now,
  then,
  note,
  check,
  asking,
  justBought,
  onAsk,
  onCancel,
  onConfirm,
}: {
  id: Purchase
  icon: ReactNode
  name: string
  level?: number
  /** What the shop has today, and what it would have after buying. */
  now: string
  then: string | null
  /** One short line about how it is counted. */
  note: string
  check: PurchaseCheck
  asking: boolean
  justBought: boolean
  onAsk: () => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const cost = formatMoney(check.costCents)
  return (
    <li className={justBought ? 'upgrade upgrade--bought' : 'upgrade'} data-upgrade={id}>
      <span className="upgrade__icon">{icon}</span>
      <div className="upgrade__body">
        <h3 className="upgrade__name">
          {name}
          {level !== undefined && <Pips level={level} />}
        </h3>
        <p className="upgrade__effect">
          <span>{now}</span>
          {then && (
            <>
              <span className="upgrade__arrow" aria-hidden="true">→</span>
              <span className="visually-hidden"> becomes </span>
              <strong>{then}</strong>
            </>
          )}
        </p>
        <p className="upgrade__note">{note}</p>
      </div>
      <div className="upgrade__buy">
        {justBought && (
          <p className="upgrade__done" role="status">
            <span className="upgrade__sparkles" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} style={{ '--i': i } as CSSProperties} />
              ))}
            </span>
            Bought!
          </p>
        )}
        {asking ? (
          <div className="upgrade__ask" role="group" aria-label={`Buy ${name} for ${cost}?`}>
            <p>Spend {cost}?</p>
            <TactileButton onClick={onConfirm}>Yes, buy</TactileButton>
            <button type="button" className="text-button" onClick={onCancel}>
              Not now
            </button>
          </div>
        ) : check.ok ? (
          <TactileButton onClick={onAsk} aria-label={`Buy ${name} for ${cost}`}>
            <span className="coin" />
            {cost}
          </TactileButton>
        ) : check.reason === 'maxed' ? (
          <p className="upgrade__locked">All done!</p>
        ) : check.reason === 'active' ? (
          <p className="upgrade__locked">Running now</p>
        ) : (
          <p className="upgrade__locked">
            <span className="coin" />
            {cost}
            <span className="upgrade__short">Need {formatMoney(check.shortCents)} more</span>
          </p>
        )}
      </div>
    </li>
  )
}

/**
 * The Improve board: spend the shop's cash on a bigger workshop, a prettier
 * shop or a poster campaign. Every purchase is confirmed before any cash
 * moves. Built on the native <dialog>, which traps focus and closes on
 * Escape.
 */
export function UpgradeBoard({ open, game, blueprint, onBuy, onClose }: UpgradeBoardProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  const [asking, setAsking] = useState<Purchase | null>(null)
  const [bought, setBought] = useState<Purchase | null>(null)
  // One confirmation buys one thing. A double tap on "Yes, buy" arrives as
  // two clicks before the screen has redrawn; the second is ignored.
  const spending = useRef(false)
  useEffect(() => {
    spending.current = false
  })

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const close = () => {
    setAsking(null)
    setBought(null)
    onClose()
  }

  const extras = extrasOf(game)
  const production = nextUpgrade('production', extras.upgrades)
  const shop = nextUpgrade('shop', extras.upgrades)
  const card = (purchase: Purchase) => ({
    id: purchase,
    asking: asking === purchase,
    justBought: bought === purchase,
    onAsk: () => {
      setBought(null)
      setAsking(purchase)
    },
    onCancel: () => setAsking(null),
    onConfirm: () => {
      if (spending.current || asking !== purchase) return
      spending.current = true
      onBuy(purchase)
      setAsking(null)
      setBought(purchase)
    },
  })
  const plus = (pct: number) => (pct === 0 ? 'Usual customers' : `${pct}% more customers`)
  const daysLeft = extras.campaignDaysLeft

  return (
    <dialog
      ref={ref}
      className="confirm board"
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className="confirm__body board__body">
        <header className="board__head">
          <h2 id={`${id}-title`} className="confirm__title">
            Improve your shop
          </h2>
          <p className="fact-chip fact-chip--spend" role="status">
            <span className="coin" />
            <span className="visually-hidden">Cash: </span>
            {formatMoney(game.cashCents)}
          </p>
        </header>

        <ul className="board__list">
          <Card
            {...card('production')}
            icon={<ProductIcon icon={blueprint.productIcon} />}
            name={productionUpgradeName(blueprint.productIcon)}
            level={extras.upgrades.production}
            now={`Make up to ${production ? production.from : 60} a day`}
            then={production ? `${production.to} a day` : null}
            note="Yours to keep."
            check={checkUpgrade(game, 'production')}
          />
          <Card
            {...card('shop')}
            icon={<ShopFrontIcon />}
            name={shopUpgradeName(blueprint.structure)}
            level={extras.upgrades.shop}
            now={plus(shop ? shop.from : 45)}
            then={shop ? plus(shop.to) : null}
            note="Yours to keep."
            check={checkUpgrade(game, 'shop')}
          />
          <Card
            {...card('campaign')}
            icon={<MegaphoneIcon />}
            name={CAMPAIGN_NAME}
            now={
              daysLeft > 0
                ? `${CAMPAIGN.demandPct}% more customers: ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`
                : `${CAMPAIGN.demandPct}% more customers for ${CAMPAIGN.days} days`
            }
            then={null}
            note="Used up, so it counts as a cost today."
            check={checkCampaign(game)}
          />
        </ul>

        <p className="board__why">
          <strong>Why does cash go down?</strong> You swap coins for something
          that helps your shop every day. It is not a loss: you still own it.
          It helps, but it cannot promise a profit!
        </p>

        <div className="confirm__actions">
          <TactileButton onClick={close}>Done</TactileButton>
        </div>
      </div>
    </dialog>
  )
}
