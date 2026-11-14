import { useEffect, useRef, useState } from 'react'
import { buildWorld } from '../ai/world.ts'
import { formatMoney } from '../game/money.ts'
import type { SavedWorld } from '../worlds/store.ts'
import { CloseButton, ConfirmDialog } from './ConfirmDialog.tsx'
import { SparkIcon, TactileButton } from './StartButton.tsx'
import { ProductIcon } from './WorldParts.tsx'
import { WorldScene } from './WorldScene.tsx'

type WorldsScreenProps = {
  /** Most recently played first. */
  worlds: SavedWorld[]
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
  onExit: () => void
}

function WorldCard({
  world,
  onOpen,
  onEdit,
  onAskDelete,
}: {
  world: SavedWorld
  onOpen: () => void
  onEdit: () => void
  onAskDelete: () => void
}) {
  const { shop, game } = world
  const { blueprint } = buildWorld(
    { idea: shop.idea, offering: shop.offering, style: shop.theme },
    world.direction,
  )
  const finished = shop.step === 'ready'
  const name = shop.shopName || shop.idea

  return (
    <li className="world-card">
      <div className="world-card__picture">
        <WorldScene blueprint={blueprint} />
      </div>
      <div className="world-card__body">
        <h2 className="world-card__name">{name}</h2>
        <p className="world-card__kind">
          <ProductIcon icon={blueprint.productIcon} />
          {blueprint.label}
        </p>
        <p className="world-card__status">
          {!finished ? (
            'Not finished yet'
          ) : game ? (
            <>
              Day {game.day}
              <span className="world-card__cash">
                <span className="coin" />
                {formatMoney(game.cashCents)}
              </span>
            </>
          ) : (
            'Ready for day 1'
          )}
        </p>
        <div className="world-card__actions">
          <TactileButton onClick={onOpen}>{finished ? 'Play' : 'Finish'}</TactileButton>
          <button type="button" className="text-button" aria-label={`Edit ${name}`} onClick={onEdit}>
            Edit
          </button>
          <button
            type="button"
            className="text-button text-button--danger"
            aria-label={`Delete ${name}`}
            onClick={onAskDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  )
}

/** Every world saved on this device: open one, edit it, delete it, or start another. */
export function WorldsScreen({
  worlds,
  onOpen,
  onEdit,
  onDelete,
  onNew,
  onExit,
}: WorldsScreenProps) {
  const [deleting, setDeleting] = useState<SavedWorld | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section className="card card--worlds">
      <CloseButton label="Close and return home" onClick={onExit} />
      <p className="card__step">
        <SparkIcon />
        My Worlds
      </p>
      <h1 className="card__title" ref={headingRef} tabIndex={-1}>
        {worlds.length === 0
          ? 'No worlds yet'
          : worlds.length === 1
            ? 'Your world'
            : `Your ${worlds.length} worlds`}
      </h1>

      <ul className="world-grid">
        {worlds.map((world) => (
          <WorldCard
            key={world.id}
            world={world}
            onOpen={() => onOpen(world.id)}
            onEdit={() => onEdit(world.id)}
            onAskDelete={() => setDeleting(world)}
          />
        ))}
        <li className="world-card world-card--new">
          <button type="button" className="world-card__new" onClick={onNew}>
            <span className="world-card__plus" aria-hidden="true">
              +
            </span>
            New world
            <span className="world-card__hint">Your other worlds stay safe.</span>
          </button>
        </li>
      </ul>

      <p className="card__note">
        Worlds are saved in this browser, on this device. They are not backed
        up online, so they will not appear on another device or browser, and
        clearing this site's data removes them.
      </p>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting ? deleting.shop.shopName || deleting.shop.idea : 'this world'}?`}
        message="This removes the world, its shop and all of its saved days from this device. It cannot be undone. Your other worlds are not affected."
        keepLabel="Keep this world"
        confirmLabel="Delete world"
        onKeep={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) onDelete(deleting.id)
          setDeleting(null)
        }}
      />
    </section>
  )
}
