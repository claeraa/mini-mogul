import { useEffect, useId, useRef } from 'react'
import { TactileButton } from './StartButton.tsx'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  /** The safe choice. Focused first; also chosen by Escape or a tap outside. */
  keepLabel: string
  confirmLabel: string
  onKeep: () => void
  onConfirm: () => void
}

/**
 * A modal built on the native <dialog>, which traps focus, makes the page
 * behind it inert and returns focus to where it was when it closes.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  keepLabel,
  confirmLabel,
  onKeep,
  onConfirm,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="confirm"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-message`}
      onCancel={(event) => {
        event.preventDefault()
        onKeep()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onKeep()
      }}
    >
      <div className="confirm__body">
        <h2 id={`${id}-title`} className="confirm__title">
          {title}
        </h2>
        <p id={`${id}-message`}>{message}</p>
        {/* Keep comes first in the markup so it takes focus; CSS places it
            on the right on wide screens. */}
        <div className="confirm__actions">
          <TactileButton onClick={onKeep}>{keepLabel}</TactileButton>
          <button
            type="button"
            className="text-button text-button--danger"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export function CloseButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="card__close"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 6l12 12M18 6L6 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
