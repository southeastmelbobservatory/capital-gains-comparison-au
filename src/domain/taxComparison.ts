export type TaxComparisonDirection = 'same' | 'reform-higher' | 'reform-lower'

export interface TaxPayableComparison {
  direction: TaxComparisonDirection
  difference: number
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function compareTaxPayable(reformTaxPayable: number, legacyTaxPayable: number): TaxPayableComparison {
  const rawDifference = reformTaxPayable - legacyTaxPayable
  const difference = roundCurrency(Math.abs(rawDifference))

  if (difference === 0) {
    return {
      direction: 'same',
      difference: 0,
    }
  }

  return {
    direction: rawDifference > 0 ? 'reform-higher' : 'reform-lower',
    difference,
  }
}
