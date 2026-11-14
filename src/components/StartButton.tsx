import { motion } from 'motion/react'
import type { ReactNode } from 'react'

type TactileButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  size?: 'large' | 'medium'
}

/** The raised, squishy primary button used for the game's main actions. */
export function TactileButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  size = 'medium',
}: TactileButtonProps) {
  return (
    <motion.button
      type={type}
      className={`tactile tactile--${size}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.03 }}
      whileFocus={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <span className="tactile__face">{children}</span>
    </motion.button>
  )
}

export function SparkIcon() {
  return (
    <svg className="spark-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 1.500c1.200 6 4.500 9.300 10.500 10.500-6 1.200-9.300 4.500-10.500 10.500C10.800 16.500 7.500 13.200 1.500 12 7.500 10.800 10.800 7.500 12 1.500z"
        fill="currentColor"
      />
    </svg>
  )
}

export function StartButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <TactileButton size="large" onClick={onClick} disabled={disabled}>
      <SparkIcon />
      Start Imagining
    </TactileButton>
  )
}
