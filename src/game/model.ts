/**
 * Business models describe the numbers behind a shop. All money is held as
 * whole cents so the arithmetic is exact (no floating-point drift).
 *
 * Only the product model is implemented. A service model (selling time or
 * capacity instead of stock) can be added by giving it its own entry here
 * and a matching simulate function; `kind` is what the game will branch on.
 */

export type Cents = number

export type BusinessModel = {
  id: string
  kind: 'product' | 'service'
  startingCashCents: Cents
  /** What it costs to make one item. */
  unitCostCents: Cents
  /** Price sliders move between these in steps. */
  minPriceCents: Cents
  priceStepCents: Cents
  /** At this price exactly `baseDemand` customers want to buy. */
  referencePriceCents: Cents
  baseDemand: number
  /** At this price (or above) nobody buys. */
  ceilingPriceCents: Cents
  maxDailyProduction: number
  /** Optional action: hand out flyers for more customers today. */
  flyerCostCents: Cents
  flyerDemandPct: number
  defaultProduce: number
}

export const PRODUCT_SHOP: BusinessModel = {
  id: 'product-basic',
  kind: 'product',
  startingCashCents: 2000,
  unitCostCents: 100,
  minPriceCents: 50,
  priceStepCents: 25,
  referencePriceCents: 300,
  baseDemand: 20,
  ceilingPriceCents: 800,
  maxDailyProduction: 60,
  flyerCostCents: 300,
  flyerDemandPct: 25,
  defaultProduce: 10,
}

/** One surprise happens every day. Effects are small and easy to explain. */
export type DayEvent = {
  id: string
  title: string
  description: string
  /** Added to 100%: +30 means 30% more customers, -30 means 30% fewer. */
  demandPct: number
  /** Money gained (positive) or paid (negative) because of the surprise. */
  cashCents: Cents
  /** Items lost from the shelf before opening. */
  stockLoss: number
}

export const EVENTS: DayEvent[] = [
  {
    id: 'parade',
    title: 'A parade marches by',
    description: 'The street is full of people looking for something fun.',
    demandPct: 40,
    cashCents: 0,
    stockLoss: 0,
  },
  {
    id: 'sunny',
    title: 'A bright sunny day',
    description: 'Good weather brings a few extra visitors out.',
    demandPct: 20,
    cashCents: 0,
    stockLoss: 0,
  },
  {
    id: 'rain',
    title: 'A rainy afternoon',
    description: 'Lots of people stayed home in the dry.',
    demandPct: -30,
    cashCents: 0,
    stockLoss: 0,
  },
  {
    id: 'review',
    title: 'A glowing review',
    description: 'Someone told the whole town how much they love your shop.',
    demandPct: 50,
    cashCents: 0,
    stockLoss: 0,
  },
  {
    id: 'roadworks',
    title: 'Roadworks outside',
    description: 'The path to your door is a little harder to reach today.',
    demandPct: -20,
    cashCents: 0,
    stockLoss: 0,
  },
  {
    id: 'tip',
    title: 'A generous tip',
    description: 'A happy customer left a little extra in the jar.',
    demandPct: 0,
    cashCents: 300,
    stockLoss: 0,
  },
  {
    id: 'repair',
    title: 'The shop sign came loose',
    description: 'You paid to have it fixed before opening.',
    demandPct: 0,
    cashCents: -200,
    stockLoss: 0,
  },
  {
    id: 'spill',
    title: 'A wobbly shelf',
    description: 'A few items tumbled off and could not be sold.',
    demandPct: 0,
    cashCents: 0,
    stockLoss: 3,
  },
]

export type DayPlan = {
  priceCents: Cents
  produce: number
  flyers: boolean
}

/** Everything that happened in one day, in whole items and whole cents. */
export type DayResult = {
  day: number
  eventId: string
  priceCents: Cents
  flyers: boolean

  startInventory: number
  produced: number
  stockLost: number
  /** Items on the shelf when the doors opened. */
  available: number
  demand: number
  sold: number
  /** Customers who wanted one but the shelf was empty. */
  missedCustomers: number
  endInventory: number

  revenueCents: Cents
  /** Cost of making the items that were sold. */
  costOfSalesCents: Cents
  /** Cost of items lost to a surprise. */
  spoilageCents: Cents
  marketingCents: Cents
  /** Signed: positive is a gain, negative is a cost. */
  eventCashCents: Cents
  operatingProfitCents: Cents

  /** Cash paid today to make new items (sold or not). */
  productionSpendCents: Cents
  /** Cash at the start of the day, before any upgrades bought that morning. */
  cashStartCents: Cents
  cashEndCents: Cents

  // ---- Upgrades (see game/upgrades.ts). Absent on days from older saves. ----
  /** The shop's upgrade levels on this day. */
  productionLevel?: number
  shopLevel?: number
  /** A poster campaign was bringing extra customers. */
  campaignActive?: boolean
  /** Cash spent this morning on lasting upgrades. Not an expense. */
  investmentCents?: Cents
  /** Cost of a campaign bought this morning. An expense, inside operating profit. */
  campaignCents?: Cents
}
