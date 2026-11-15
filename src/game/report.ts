import type { BusinessModel, Cents, DayResult } from './model.ts'
import { formatMoney as money } from './money.ts'
import { eventById, inventoryValue } from './simulation.ts'

/**
 * Sorts one day's numbers into the three things the report shows side by
 * side: profit (revenue minus expenses), cash (money in minus money out)
 * and the shelf (inventory carried into tomorrow).
 *
 * Every line is a positive amount of whole cents; which list it sits in
 * says whether it adds or takes away.
 */

export type ReportLine = {
  id: string
  label: string
  detail: string
  cents: Cents
}

export type DaySummary = {
  revenue: ReportLine[]
  revenueTotalCents: Cents
  expenses: ReportLine[]
  expensesTotalCents: Cents
  /** Revenue minus expenses. Negative is a loss. */
  profitCents: Cents

  cashIn: ReportLine[]
  cashInTotalCents: Cents
  cashOut: ReportLine[]
  cashOutTotalCents: Cents
  /** Money in minus money out. */
  cashChangeCents: Cents

  inventoryStartValueCents: Cents
  inventoryEndValueCents: Cents
  /** How much the shelf's value grew (positive) or shrank (negative). */
  inventoryChangeCents: Cents
  /** How many more (or fewer) items are on the shelf than this morning. */
  inventoryChangeItems: number
  /** Cash turned into lasting upgrades this morning. In cash out, not in expenses. */
  investmentCents: Cents
}

const sum = (lines: ReportLine[]) =>
  lines.reduce((total, line) => total + line.cents, 0)

const items = (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`

export function summarizeDay(model: BusinessModel, r: DayResult): DaySummary {
  const event = eventById(r.eventId)
  const surprise = event?.title ?? 'Surprise'
  const unit = model.unitCostCents

  const sales: ReportLine = {
    id: 'sales',
    label: 'Sales',
    detail: `${r.sold} sold × ${money(r.priceCents)}`,
    cents: r.revenueCents,
  }
  const bonus: ReportLine[] =
    r.eventCashCents > 0
      ? [{ id: 'bonus', label: 'Surprise bonus', detail: surprise, cents: r.eventCashCents }]
      : []
  const flyers: ReportLine[] =
    r.marketingCents > 0
      ? [{ id: 'flyers', label: 'Flyers', detail: 'Handed out this morning', cents: r.marketingCents }]
      : []
  const surpriseCost: ReportLine[] =
    r.eventCashCents < 0
      ? [{ id: 'surprise-cost', label: 'Surprise cost', detail: surprise, cents: -r.eventCashCents }]
      : []

  // A campaign is used up, so it is an expense and a cash payment. A lasting
  // upgrade is only a cash payment: the shop still owns what it bought.
  const campaign: ReportLine[] =
    (r.campaignCents ?? 0) > 0
      ? [{ id: 'campaign', label: 'Poster campaign', detail: 'Bought this morning', cents: r.campaignCents ?? 0 }]
      : []
  const investmentCents = r.investmentCents ?? 0
  const upgrades: ReportLine[] =
    investmentCents > 0
      ? [{ id: 'upgrades', label: 'Shop upgrades', detail: 'Yours to keep, so not an expense', cents: investmentCents }]
      : []

  const revenue = [sales, ...bonus]
  const expenses: ReportLine[] = [
    {
      id: 'cost-of-sales',
      label: 'Making the items you sold',
      detail: `${r.sold} × ${money(unit)}`,
      cents: r.costOfSalesCents,
    },
    ...(r.spoilageCents > 0
      ? [
          {
            id: 'lost',
            label: 'Lost items',
            detail: `${r.stockLost} × ${money(unit)}`,
            cents: r.spoilageCents,
          },
        ]
      : []),
    ...flyers,
    ...campaign,
    ...surpriseCost,
  ]

  const cashIn = [sales, ...bonus]
  const cashOut: ReportLine[] = [
    {
      id: 'production',
      label: 'Making new items today',
      detail:
        r.produced > 0
          ? `${items(r.produced)} × ${money(unit)}, sold or not`
          : 'Nothing made today',
      cents: r.productionSpendCents,
    },
    ...flyers,
    ...campaign,
    ...upgrades,
    ...surpriseCost,
  ]

  const revenueTotalCents = sum(revenue)
  const expensesTotalCents = sum(expenses)
  const cashInTotalCents = sum(cashIn)
  const cashOutTotalCents = sum(cashOut)
  const inventoryStartValueCents = inventoryValue(model, r.startInventory)
  const inventoryEndValueCents = inventoryValue(model, r.endInventory)

  return {
    revenue,
    revenueTotalCents,
    expenses,
    expensesTotalCents,
    profitCents: revenueTotalCents - expensesTotalCents,
    cashIn,
    cashInTotalCents,
    cashOut,
    cashOutTotalCents,
    cashChangeCents: cashInTotalCents - cashOutTotalCents,
    inventoryStartValueCents,
    inventoryEndValueCents,
    inventoryChangeCents: inventoryEndValueCents - inventoryStartValueCents,
    inventoryChangeItems: r.endInventory - r.startInventory,
    investmentCents,
  }
}
