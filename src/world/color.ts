/**
 * Tiny colour helpers for building a world's palette. Colours go in and come
 * out as lower-case "#rrggbb", so palettes stay easy to check and compare.
 */

type Rgb = [number, number, number]

const parse = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

const format = (rgb: Rgb): string =>
  `#${rgb
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
    .join('')}`

/** A blend of two colours: 0 gives `a`, 1 gives `b`. */
export function mix(a: string, b: string, amount: number): string {
  const [x, y] = [parse(a), parse(b)]
  return format([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * amount) as Rgb)
}

/**
 * A darker version of a colour that keeps its hue: the weakest channel is
 * pulled down hardest, so shadows look richer instead of grey.
 */
export function shade(hex: string, amount: number): string {
  const rgb = parse(hex)
  const top = Math.max(...rgb)
  return format(
    rgb.map((value) => {
      const weakness = top === 0 ? 0 : 1 - value / top
      return value * (1 - amount) * (1 - weakness * amount * 0.6)
    }) as Rgb,
  )
}
