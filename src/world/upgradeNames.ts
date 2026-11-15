import type { ProductIconId, StructureType } from './blueprint.ts'

/**
 * What each upgrade is called in each kind of business. The upgrade does the
 * same thing everywhere; only the name fits the shop. Anything the game has
 * no special name for gets a plain one, never an unrelated one.
 */

const PRODUCTION_NAMES: Record<ProductIconId, string> = {
  cupcake: 'Bigger oven',
  drink: 'Bigger juicer',
  flower: 'More flower beds',
  palette: 'Bigger craft table',
  book: 'Printing press',
  dress: 'Sewing machine',
  toy: 'Toy workbench',
  egg: 'More cosy nests',
  paw: 'More play pens',
  gift: 'Bigger workshop',
}

const SHOP_NAMES: Partial<Record<StructureType, string>> = {
  stall: 'Brighter stall',
  cave: 'Cosier cave',
  greenhouse: 'Sparkling greenhouse',
  tower: 'Twinkling tower',
  pavilion: 'Smarter pavilion',
}

export function productionUpgradeName(icon: ProductIconId): string {
  return PRODUCTION_NAMES[icon] ?? 'Bigger workshop'
}

export function shopUpgradeName(structure: StructureType): string {
  return SHOP_NAMES[structure] ?? 'Prettier shop'
}

export const CAMPAIGN_NAME = 'Poster campaign'
