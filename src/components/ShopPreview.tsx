import { THEMES } from '../lib/constants.ts'
import type { ThemeId } from '../lib/storage.ts'

export function ShopPreview({ theme, name }: { theme: ThemeId; name: string }) {
  const { roof, trim } = THEMES.find((t) => t.id === theme) ?? THEMES[0]
  return (
    <figure className="shop-preview">
      <svg viewBox="0 0 240 150" aria-hidden="true">
        <ellipse cx="120" cy="134" rx="96" ry="12" fill="#6cc763" />
        <rect x="62" y="62" width="116" height="74" rx="8" fill="#fff3dc" />
        <path d="M150 62h20a8 8 0 0 1 8 8v58a8 8 0 0 1-8 8h-20z" fill="#efd6b6" />
        <path
          d="M52 66l68-52 68 52z"
          fill={roof}
          stroke={roof}
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <circle cx="120" cy="46" r="12" fill="#fff3dc" />
        <path
          d="M120 38c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z"
          fill={trim}
          stroke="#e8a92a"
          strokeWidth="0.800"
        />
        <rect x="74" y="92" width="44" height="28" rx="4" fill={trim} />
        <path d="M96 92v28M74 106h44" stroke="#fff" strokeWidth="2" opacity="0.7" />
        <path d="M70 78h52v10a6.500 6.500 0 0 1-13 0 6.500 6.500 0 0 1-13 0 6.500 6.500 0 0 1-13 0 6.500 6.500 0 0 1-13 0z" fill="#fff" />
        <path d="M83 78h13v10a6.500 6.500 0 0 1-13 0zM109 78h13v10a6.500 6.500 0 0 1-13 0z" fill={roof} />
        <path d="M134 136v-34a13 13 0 0 1 26 0v34z" fill={roof} />
        <circle cx="153" cy="116" r="2.500" fill="#fff3dc" />
      </svg>
      <figcaption className="shop-preview__sign">
        {name.trim() || 'Your shop name'}
      </figcaption>
    </figure>
  )
}
