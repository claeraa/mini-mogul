import { assembleBlueprint, generateWorldBlueprint } from '../world/blueprint.ts'
import type { BlueprintInput, WorldBlueprint } from '../world/blueprint.ts'
import { ACCENT_COLORS, WALL_COLORS } from './schema.ts'
import type { ConceptId, WorldDirection } from './schema.ts'

/** The words that go with a world: who visits and what it teaches. */
export type WorldStory = {
  summary: string
  customers: string
  /** Suggestions for the first product; empty when the rules built the world. */
  offerings: string[]
  concepts: { id: ConceptId; why: string }[]
}

export type World = {
  /** 'ai' when the Imagination Director shaped it, 'rules' for the fallback. */
  source: 'ai' | 'rules'
  blueprint: WorldBlueprint
  story: WorldStory
}

const RULES_CONCEPTS: WorldStory['concepts'] = [
  { id: 'pricing', why: 'Choose a price customers are happy to pay.' },
  { id: 'profit', why: 'Earn more from sales than you spend making things.' },
  { id: 'inventory', why: 'Make enough to sell, but not so much it sits on the shelf.' },
]

/**
 * Builds the world for a business. With a checked AI direction the Director's
 * choices are used; without one the keyword rules build it, so the game looks
 * and plays the same whether or not AI is available.
 *
 * Either way the player's chosen style still sets the roof, sky and setting,
 * and their first product still picks the icon when the game recognises it.
 */
export function buildWorld(
  input: BlueprintInput,
  direction: WorldDirection | null,
): World {
  if (!direction) {
    const blueprint = generateWorldBlueprint(input)
    return {
      source: 'rules',
      blueprint,
      story: {
        summary: `A ${blueprint.label.toLowerCase()}, built from your idea.`,
        customers: 'Friendly neighbours',
        offerings: [],
        concepts: RULES_CONCEPTS,
      },
    }
  }

  return {
    source: 'ai',
    blueprint: assembleBlueprint(
      {
        theme: direction.theme,
        label: direction.label,
        structure: direction.structure,
        biome: direction.biome,
        night: direction.timeOfDay === 'night',
        kind: direction.kind,
        props: direction.props,
        decorations: direction.decorations,
        productIcon: direction.productIcon,
        ...WALL_COLORS[direction.wallColor],
        accent: ACCENT_COLORS[direction.accentColor],
        reactions: direction.reactions,
        audience: `${direction.customers} ${direction.label}`,
        customerCast: direction.customerCast,
      },
      input,
    ),
    story: {
      summary: direction.summary,
      customers: direction.customers,
      offerings: direction.offerings,
      concepts: direction.concepts,
    },
  }
}

/** Ideas are matched ignoring case and spacing, so a cached world is reused. */
export function ideaKey(idea: string): string {
  return idea.toLowerCase().replace(/\s+/g, ' ').trim()
}
