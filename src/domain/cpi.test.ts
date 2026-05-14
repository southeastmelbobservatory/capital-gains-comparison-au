import { describe, expect, it } from 'vitest'
import {
  ABS_TABLE_17_METADATA,
  ABS_TABLE_17_QUARTERLY_AUSTRALIA,
  findQuarterlyCpi,
  getAustralianQuarterPeriod,
  latestQuarterlyCpi,
} from './cpi'

describe('ABS Table 17 CPI dataset', () => {
  it('contains the verified quarterly Australia series and release metadata', () => {
    expect(ABS_TABLE_17_METADATA.releaseDate).toBe('2026-04-29')
    expect(ABS_TABLE_17_METADATA.referencePeriod).toBe('March 2026')
    expect(ABS_TABLE_17_METADATA.rowCount).toBe(311)
    expect(ABS_TABLE_17_QUARTERLY_AUSTRALIA).toHaveLength(311)
    expect(latestQuarterlyCpi()).toEqual({
      period: '2026-03-01',
      index: 101.7,
      percentageChange: 1.4,
    })
  })

  it('looks up quarterly CPI by Australian quarter-ending month', () => {
    expect(getAustralianQuarterPeriod('2026-01-15')).toBe('2026-03-01')
    expect(getAustralianQuarterPeriod('2026-04-15')).toBe('2026-06-01')
    expect(findQuarterlyCpi('2026-01-15')).toEqual({
      period: '2026-03-01',
      index: 101.7,
      percentageChange: 1.4,
    })
  })
})
