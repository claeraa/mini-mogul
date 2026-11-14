import type { CSSProperties, ReactNode } from 'react'
import type { ProductIconId } from '../world/blueprint.ts'
import type { StageVisitor } from '../world/stage.ts'
import { ProductIcon } from './WorldParts.tsx'

type ShopStreetProps = {
  icon: ProductIconId
  visitors: StageVisitor[]
  /** Customers who do not fit on screen. */
  extra: number
  shelfCount: number
  /** True while the shop is open and guests take turns at the counter. */
  playing: boolean
  /** Milliseconds between one guest's turn and the next. */
  staggerMs: number
  reactions: string[]
  /** What each sale adds to the till, e.g. "+$3.00". */
  coinLabel: string
  emptyText: string
  /** Signs standing in the street, between the customers and the shelf. */
  signs?: ReactNode
  /** Makes the shelf a button (it opens the production controls). */
  onShelfClick?: () => void
  shelfExpanded?: boolean
}

const SHELF_ICONS = 10

/**
 * The strip of ground in front of the shop: customers on the left, the
 * shelf on the right. The customers are a picture of numbers shown in words
 * elsewhere, so they are hidden from screen readers; the signs and shelf are
 * real buttons.
 */
export function ShopStreet({
  icon,
  visitors,
  extra,
  shelfCount,
  playing,
  staggerMs,
  reactions,
  coinLabel,
  emptyText,
  signs,
  onShelfClick,
  shelfExpanded,
}: ShopStreetProps) {
  const shown = Math.min(shelfCount, SHELF_ICONS)
  const shelf = (
    <>
      <span className="shelf__label">Shelf: {shelfCount}</span>
      <span className="shelf__board">
        {shown === 0 && <span className="shelf__empty">Empty</span>}
        {Array.from({ length: shown }, (_, i) => (
          <ProductIcon key={i} icon={icon} />
        ))}
        {shelfCount > shown && <span className="shelf__more">+{shelfCount - shown}</span>}
      </span>
    </>
  )

  return (
    <div
      className="street"
      style={{ '--stagger': `${staggerMs}ms`, display: 'contents' } as CSSProperties}
    >
      <div className="guests" aria-hidden="true">
        {visitors.length === 0 && <span className="guests__empty">{emptyText}</span>}
        {visitors.map((visitor, i) => (
          <span
            // Remount when the day starts so each guest's turn plays afresh.
            key={playing ? `turn-${i}` : `idle-${i}`}
            className={
              playing
                ? `guest guest--turn${visitor.buys ? '' : ' guest--missed'}`
                : 'guest'
            }
            style={{ '--i': i, '--row': i % 3 } as CSSProperties}
          >
            <span className="guest__body" />
            {playing && (
              <span className="guest__bubble">
                {visitor.buys ? reactions[i % reactions.length] : 'Sold out!'}
              </span>
            )}
            {playing && visitor.buys && (
              <span className="guest__coin">
                <span className="coin" />
                {coinLabel}
              </span>
            )}
          </span>
        ))}
        {extra > 0 && <span className="guests__more">+{extra} more</span>}
      </div>

      {signs}

      {onShelfClick ? (
        <button
          type="button"
          className="shelf shelf--button"
          aria-label={`Shelf: ${shelfCount} to sell. Change how many to make`}
          aria-expanded={shelfExpanded}
          onClick={onShelfClick}
        >
          {shelf}
        </button>
      ) : (
        <div className="shelf" aria-hidden="true">
          {shelf}
        </div>
      )}
    </div>
  )
}
