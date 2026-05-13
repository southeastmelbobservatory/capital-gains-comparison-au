export type ResidencyStatus = 'resident' | 'foreign-resident'

export type OwnershipType = 'individual' | 'company' | 'trust' | 'super-fund'

export type AssetCategory = 'general-asset' | 'residential-established' | 'residential-new-build'

export type CgtRulePeriod = 'pre-2027-discount' | 'post-2027-indexed'

export type ValidationSeverity = 'error' | 'warning'

export interface MoneyAmount {
  dollars: number
}

export interface DisposalCosts {
  acquisition: number
  disposal: number
  improvement: number
  ownership: number
}

export interface CapitalGainsInput {
  acquisitionDate: string
  disposalDate: string
  acquisitionAmount: MoneyAmount
  marketValueAtReformStart: MoneyAmount
  disposalAmount: MoneyAmount
  costs: DisposalCosts
  ownershipPercentage: number
  residencyStatus: ResidencyStatus
  ownershipType: OwnershipType
  assetCategory: AssetCategory
  taxableIncomeBeforeGain: MoneyAmount
  cpiAtReformStart: number
  cpiAtDisposal: number
  receivesIncomeSupport: boolean
}

export interface ValidationIssue {
  field: keyof CapitalGainsInput | `costs.${keyof DisposalCosts}`
  message: string
  severity: ValidationSeverity
}

export interface EligibilitySummary {
  heldForAtLeast12Months: boolean
  discountEligible: boolean
  newRulesApply: boolean
  newBuildChoiceAvailable: boolean
  notes: string[]
}

export interface CgtRuleSegment {
  period: CgtRulePeriod
  startDate: string
  endDate: string
  nominalGain: number
  indexedCostBase?: number
  realGain: number
  taxableGain: number
  estimatedTax: number
  minimumTaxApplied: boolean
  notes: string[]
}

export interface CapitalGainsResult {
  input: CapitalGainsInput
  capitalProceeds: number
  costBase: number
  grossCapitalGain: number
  ownershipAdjustedGain: number
  eligibility: EligibilitySummary
  segments: CgtRuleSegment[]
  taxableCapitalGain: number
  estimatedTax: number
  effectiveTaxRate: number
  validation: ValidationIssue[]
}

export const DEFAULT_INPUT: CapitalGainsInput = {
  acquisitionDate: '2010-07-01',
  disposalDate: '2030-07-01',
  acquisitionAmount: { dollars: 650000 },
  marketValueAtReformStart: { dollars: 850000 },
  disposalAmount: { dollars: 950000 },
  costs: {
    acquisition: 35000,
    disposal: 18000,
    improvement: 45000,
    ownership: 0,
  },
  ownershipPercentage: 100,
  residencyStatus: 'resident',
  ownershipType: 'individual',
  assetCategory: 'general-asset',
  taxableIncomeBeforeGain: { dollars: 120000 },
  cpiAtReformStart: 100,
  cpiAtDisposal: 106,
  receivesIncomeSupport: false,
}
