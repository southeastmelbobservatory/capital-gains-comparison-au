import { describe, expect, it } from 'vitest'
import { compareTaxPayable } from './taxComparison'

describe('compareTaxPayable', () => {
  it('reports higher tax when the reform estimate exceeds the legacy estimate', () => {
    expect(compareTaxPayable(12_500, 6_250)).toEqual({
      direction: 'reform-higher',
      difference: 6250,
    })
  })

  it('reports lower tax when the reform estimate is below the legacy estimate', () => {
    expect(compareTaxPayable(6_250, 12_500)).toEqual({
      direction: 'reform-lower',
      difference: 6250,
    })
  })

  it('reports no change for matching estimates', () => {
    expect(compareTaxPayable(6_250, 6_250)).toEqual({
      direction: 'same',
      difference: 0,
    })
  })
})
