import { describe, expect, it } from 'vitest'
import { calculateCapitalGains } from './cgtCalculator'
import { DEFAULT_INPUT, type CapitalGainsInput } from './cgtTypes'

function makeInput(overrides: Partial<CapitalGainsInput>): CapitalGainsInput {
  return {
    ...DEFAULT_INPUT,
    ...overrides,
    acquisitionAmount: overrides.acquisitionAmount ?? DEFAULT_INPUT.acquisitionAmount,
    marketValueAtReformStart: overrides.marketValueAtReformStart ?? DEFAULT_INPUT.marketValueAtReformStart,
    disposalAmount: overrides.disposalAmount ?? DEFAULT_INPUT.disposalAmount,
    costs: {
      ...DEFAULT_INPUT.costs,
      ...overrides.costs,
    },
    taxableIncomeBeforeGain: overrides.taxableIncomeBeforeGain ?? DEFAULT_INPUT.taxableIncomeBeforeGain,
  }
}

describe('calculateCapitalGains', () => {
  it('applies the reform split and compares it with the legacy rules', () => {
    const result = calculateCapitalGains(
      makeInput({
        acquisitionDate: '2026-01-01',
        disposalDate: '2028-01-01',
        acquisitionAmount: { dollars: 100 },
        marketValueAtReformStart: { dollars: 100 },
        disposalAmount: { dollars: 200 },
        costs: {
          acquisition: 0,
          disposal: 0,
          improvement: 0,
          ownership: 0,
        },
        taxableIncomeBeforeGain: { dollars: 0 },
        cpiAtReformStart: 100,
        cpiAtDisposal: 110,
      }),
    )

    expect(result.segments).toHaveLength(1)
    expect(result.segments[0].period).toBe('post-2027-indexed')
    expect(result.estimatedTax).toBe(27)
    expect(result.taxableCapitalGain).toBe(90)
    expect(result.legacyComparison.taxableCapitalGain).toBe(50)
    expect(result.legacyComparison.estimatedTax).toBe(0)
    expect(result.legacyComparison.effectiveTaxRate).toBe(0)
  })

  it('keeps the legacy comparison aligned when the disposal happens before the reform start', () => {
    const result = calculateCapitalGains(
      makeInput({
        acquisitionDate: '2025-01-01',
        disposalDate: '2026-12-31',
        acquisitionAmount: { dollars: 100 },
        disposalAmount: { dollars: 300 },
        costs: {
          acquisition: 0,
          disposal: 0,
          improvement: 0,
          ownership: 0,
        },
        taxableIncomeBeforeGain: { dollars: 0 },
      }),
    )

    expect(result.segments).toHaveLength(1)
    expect(result.segments[0].period).toBe('pre-2027-discount')
    expect(result.estimatedTax).toBe(result.legacyComparison.estimatedTax)
    expect(result.taxableCapitalGain).toBe(result.legacyComparison.taxableCapitalGain)
  })

  it('indexes only the ownership-adjusted acquisition-side base for post-reform acquisitions', () => {
    const result = calculateCapitalGains(
      makeInput({
        acquisitionDate: '2028-01-01',
        disposalDate: '2030-01-01',
        acquisitionAmount: { dollars: 1000 },
        disposalAmount: { dollars: 3000 },
        ownershipPercentage: 50,
        costs: {
          acquisition: 100,
          disposal: 400,
          improvement: 100,
          ownership: 0,
        },
        taxableIncomeBeforeGain: { dollars: 0 },
        cpiAtReformStart: 100,
        cpiAtDisposal: 110,
      }),
    )

    expect(result.ownershipAdjustedGain).toBe(700)
    expect(result.segments).toHaveLength(1)
    expect(result.segments[0].indexedCostBase).toBe(660)
    expect(result.segments[0].taxableGain).toBe(640)
    expect(result.segments[0].estimatedTax).toBe(192)
  })
})
