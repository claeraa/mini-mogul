import type { Cents } from './model.ts'

/** 1250 -> "$12.50", -300 -> "-$3.00". Play money only. */
export function formatMoney(cents: Cents): string {
  const abs = Math.abs(cents)
  const whole = Math.floor(abs / 100)
  const part = String(abs % 100).padStart(2, '0')
  return `${cents < 0 ? '-' : ''}$${whole}.${part}`
}

/** Like formatMoney but always shows the direction: "+$3.00" / "-$3.00". */
export function formatSigned(cents: Cents): string {
  return cents > 0 ? `+${formatMoney(cents)}` : formatMoney(cents)
}
