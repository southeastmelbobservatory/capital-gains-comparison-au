import { ABS_TABLE_17_METADATA, ABS_TABLE_17_QUARTERLY_AUSTRALIA } from './cpiTable17.generated'
import type { CpiObservation } from './cpiTypes'

export function getAustralianQuarterPeriod(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return date

  const year = parsed.getUTCFullYear()
  const month = parsed.getUTCMonth() + 1
  const quarterEndingMonth = Math.ceil(month / 3) * 3
  return new Date(Date.UTC(year, quarterEndingMonth - 1, 1)).toISOString().slice(0, 10)
}

export function findQuarterlyCpi(date: string): CpiObservation | undefined {
  const quarterStart = getAustralianQuarterPeriod(date)
  return ABS_TABLE_17_QUARTERLY_AUSTRALIA.find((observation) => observation.period === quarterStart)
}

export function latestQuarterlyCpi(): CpiObservation {
  return ABS_TABLE_17_QUARTERLY_AUSTRALIA[ABS_TABLE_17_QUARTERLY_AUSTRALIA.length - 1]
}

export function calculateDisposalCpiFromAnnualRate(
  cpiAtStart: number,
  annualRatePercent: number,
  years: number,
): number {
  if (!Number.isFinite(cpiAtStart) || cpiAtStart <= 0) return 0
  if (!Number.isFinite(annualRatePercent)) return cpiAtStart
  if (!Number.isFinite(years) || years <= 0) return cpiAtStart

  return Math.round(cpiAtStart * ((1 + annualRatePercent / 100) ** years) * 10) / 10
}

export { ABS_TABLE_17_METADATA, ABS_TABLE_17_QUARTERLY_AUSTRALIA }
