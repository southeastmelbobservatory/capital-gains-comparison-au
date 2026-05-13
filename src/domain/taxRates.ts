export interface TaxBracket {
  threshold: number
  rate: number
  baseTax: number
}

export const RESIDENT_2027_TAX_BRACKETS: TaxBracket[] = [
  { threshold: 0, rate: 0, baseTax: 0 },
  { threshold: 18200, rate: 0.14, baseTax: 0 },
  { threshold: 45000, rate: 0.28, baseTax: 3752 },
  { threshold: 135000, rate: 0.37, baseTax: 28952 },
  { threshold: 190000, rate: 0.45, baseTax: 49302 },
]

export function estimateResidentIncomeTax(taxableIncome: number): number {
  const income = Math.max(0, taxableIncome)
  const bracket = [...RESIDENT_2027_TAX_BRACKETS]
    .reverse()
    .find((candidate) => income >= candidate.threshold)

  if (!bracket) return 0
  return bracket.baseTax + (income - bracket.threshold) * bracket.rate
}

export function estimateAdditionalResidentTax(incomeBeforeGain: number, taxableGain: number): number {
  return estimateResidentIncomeTax(incomeBeforeGain + taxableGain) - estimateResidentIncomeTax(incomeBeforeGain)
}

