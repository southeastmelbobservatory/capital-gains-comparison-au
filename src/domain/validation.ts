import type { CapitalGainsInput, DisposalCosts, ValidationIssue } from './cgtTypes'

const REQUIRED_DATE_FIELDS: Array<keyof Pick<CapitalGainsInput, 'acquisitionDate' | 'disposalDate'>> = [
  'acquisitionDate',
  'disposalDate',
]

const COST_FIELDS: Array<keyof DisposalCosts> = [
  'acquisition',
  'disposal',
  'improvement',
  'ownership',
]

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const time = new Date(`${value}T00:00:00Z`).getTime()
  return Number.isFinite(time)
}

function isNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

export function validateCapitalGainsInput(input: CapitalGainsInput): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const field of REQUIRED_DATE_FIELDS) {
    if (!isValidDate(input[field])) {
      issues.push({
        field,
        severity: 'error',
        message: 'Enter a valid date in YYYY-MM-DD format.',
      })
    }
  }

  if (isValidDate(input.acquisitionDate) && isValidDate(input.disposalDate)) {
    const acquired = new Date(`${input.acquisitionDate}T00:00:00Z`).getTime()
    const disposed = new Date(`${input.disposalDate}T00:00:00Z`).getTime()
    if (disposed <= acquired) {
      issues.push({
        field: 'disposalDate',
        severity: 'error',
        message: 'Disposal date must be after the acquisition date.',
      })
    }
  }

  if (!isNonNegativeNumber(input.acquisitionAmount.dollars) || input.acquisitionAmount.dollars === 0) {
    issues.push({
      field: 'acquisitionAmount',
      severity: 'error',
      message: 'Acquisition amount must be greater than zero.',
    })
  }

  if (!isNonNegativeNumber(input.marketValueAtReformStart.dollars)) {
    issues.push({
      field: 'marketValueAtReformStart',
      severity: 'error',
      message: 'Market value at 1 July 2027 cannot be negative.',
    })
  }

  if (!isNonNegativeNumber(input.disposalAmount.dollars) || input.disposalAmount.dollars === 0) {
    issues.push({
      field: 'disposalAmount',
      severity: 'error',
      message: 'Disposal amount must be greater than zero.',
    })
  }

  for (const field of COST_FIELDS) {
    if (!isNonNegativeNumber(input.costs[field])) {
      issues.push({
        field: `costs.${field}`,
        severity: 'error',
        message: 'Costs cannot be negative.',
      })
    }
  }

  if (!Number.isFinite(input.ownershipPercentage) || input.ownershipPercentage <= 0 || input.ownershipPercentage > 100) {
    issues.push({
      field: 'ownershipPercentage',
      severity: 'error',
      message: 'Ownership percentage must be greater than 0 and no more than 100.',
    })
  }

  if (!isNonNegativeNumber(input.taxableIncomeBeforeGain.dollars)) {
    issues.push({
      field: 'taxableIncomeBeforeGain',
      severity: 'error',
      message: 'Taxable income before the gain cannot be negative.',
    })
  }

  if (!Number.isFinite(input.cpiAtReformStart) || input.cpiAtReformStart <= 0) {
    issues.push({
      field: 'cpiAtReformStart',
      severity: 'error',
      message: 'CPI at reform start must be greater than zero.',
    })
  }

  if (!Number.isFinite(input.cpiAtDisposal) || input.cpiAtDisposal <= 0) {
    issues.push({
      field: 'cpiAtDisposal',
      severity: 'error',
      message: 'CPI at disposal must be greater than zero.',
    })
  }

  if (
    Number.isFinite(input.cpiAtReformStart)
    && Number.isFinite(input.cpiAtDisposal)
    && input.cpiAtReformStart > 0
    && input.cpiAtDisposal > 0
    && input.cpiAtDisposal < input.cpiAtReformStart
  ) {
    issues.push({
      field: 'cpiAtDisposal',
      severity: 'warning',
      message: 'Disposal CPI is below the reform-start CPI; this can reduce indexed cost base assumptions.',
    })
  }

  if (input.ownershipType !== 'individual') {
    issues.push({
      field: 'ownershipType',
      severity: 'warning',
      message: 'Non-individual ownership has different CGT concessions and tax treatment.',
    })
  }

  if (input.residencyStatus === 'foreign-resident') {
    issues.push({
      field: 'residencyStatus',
      severity: 'warning',
      message: 'Foreign resident CGT discount rules depend on timing and residency periods.',
    })
  }

  return issues
}

export function hasBlockingValidationErrors(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error')
}
