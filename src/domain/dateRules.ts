const MS_PER_DAY = 24 * 60 * 60 * 1000
export const CGT_REFORM_START_DATE = '2027-07-01'

export function daysHeld(acquisitionDate: string, disposalDate: string): number {
  const acquired = new Date(`${acquisitionDate}T00:00:00Z`).getTime()
  const disposed = new Date(`${disposalDate}T00:00:00Z`).getTime()
  return Math.floor((disposed - acquired) / MS_PER_DAY)
}

export function heldForAtLeast12Months(acquisitionDate: string, disposalDate: string): boolean {
  return daysHeld(acquisitionDate, disposalDate) >= 365
}

export function isOnOrAfter(date: string, comparisonDate: string): boolean {
  return new Date(`${date}T00:00:00Z`).getTime() >= new Date(`${comparisonDate}T00:00:00Z`).getTime()
}

export function overlapsReformStart(acquisitionDate: string, disposalDate: string): boolean {
  return !isOnOrAfter(acquisitionDate, CGT_REFORM_START_DATE) && isOnOrAfter(disposalDate, CGT_REFORM_START_DATE)
}

export function clampSegmentDays(startDate: string, endDate: string): number {
  return Math.max(0, daysHeld(startDate, endDate))
}
