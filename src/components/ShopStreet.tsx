import { useLayoutEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { ProductIconId } from '../world/blueprint.ts'
import type { CustomerCastId } from '../world/customers.ts'
import { visitorsThatFit } from '../world/stage.ts'
import type { CrowdNote, StageVisitor } from '../world/stage.ts'
import { Critter } from './Critter.tsx'
import { ProductIcon } from './WorldParts.tsx'

type ShopStreetProps = {
  icon: ProductIconId
  /** Which customers queue here: fairies, dragon families, shoppers and so on. */
  cast: CustomerCastId
  visitors: StageVisitor[]
  /** Words for the customers who do not fit on screen, if there are any. */
  crowd: CrowdNote | null
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
  /** Told how many customers the customer area has room for, as it resizes. */
  onRoomChange?: (count: number) => void
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
  cast,
  visitors,
  crowd,
  shelfCount,
  playing,
  staggerMs,
  reactions,
  coinLabel,
  emptyText,
  signs,
  onRoomChange,
  onShelfClick,
  shelfExpanded,
}: ShopStreetProps) {
  // The customer area reports its own width, so only as many customers are
  // drawn as fit beside the signs and shelf at this screen size.
  const guestsRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const area = guestsRef.current
    if (!area || !onRoomChange) return
    const report = () => onRoomChange(visitorsThatFit(area.clientWidth))
    report()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(report)
    observer.observe(area)
    return () => observer.disconnect()
  }, [onRoomChange])

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
      <div className="guests" aria-hidden="true" ref={guestsRef}>
        {visitors.length === 0 && <span className="guests__empty">{emptyText}</span>}
        {visitors.map((visitor, i) => (
          <span
            // Remount when the day starts so each guest's turn plays afresh.
            key={playing ? `turn-${i}` : `idle-${i}`}
            className={
              playing
                ? `guest guest--critter guest--turn${visitor.buys ? '' : ' guest--missed'}`
                : 'guest guest--critter'
            }
            style={{ '--i': i, '--row': i % 3 } as CSSProperties}
          >
            <span className="guest__body">
              <Critter cast={cast} index={i} />
            </span>
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
        {crowd && (
          <span
            className={playing ? 'guests__more' : 'guests__more guests__more--estimate'}
            title={crowd.detail}
          >
            <span className="guests__more-full">{crowd.text}</span>
            <span className="guests__more-short">{crowd.short}</span>
          </span>
        )}
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
