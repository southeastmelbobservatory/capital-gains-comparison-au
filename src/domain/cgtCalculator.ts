import type {
  CapitalGainsInput,
  CapitalGainsResult,
  CgtRuleSegment,
  EligibilitySummary,
  LegacyComparisonSummary,
} from './cgtTypes'
import {
  CGT_REFORM_START_DATE,
  daysHeld,
  heldForAtLeast12Months,
  isOnOrAfter,
  overlapsReformStart,
} from './dateRules'
import { estimateAdditionalResidentTax } from './taxRates'
import { hasBlockingValidationErrors, validateCapitalGainsInput } from './validation'

const MINIMUM_POST_2027_CGT_RATE = 0.3

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function buildEligibility(input: CapitalGainsInput): EligibilitySummary {
  const heldLongEnough = heldForAtLeast12Months(input.acquisitionDate, input.disposalDate)
  const newRulesApply = isOnOrAfter(input.disposalDate, CGT_REFORM_START_DATE)
  const newBuildChoiceAvailable = input.assetCategory === 'residential-new-build' && newRulesApply
  const discountEligible = heldLongEnough
    && input.residencyStatus === 'resident'
    && ['individual', 'trust'].includes(input.ownershipType)

  const notes = [
    'Budget 2026-27 announced replacement of the 50% CGT discount from 1 July 2027 with inflation-indexed treatment and a 30% minimum tax rate on realised gains.',
  ]

  if (newBuildChoiceAvailable) {
    notes.push('New builds can choose between the 50% discount and the new arrangements from 1 July 2027.')
  }

  if (newRulesApply && overlapsReformStart(input.acquisitionDate, input.disposalDate)) {
    notes.push('This calculator treats gains before 1 July 2027 as eligible for the current discount and gains after that date under the new indexed rules.')
  }

  return {
    heldForAtLeast12Months: heldLongEnough,
    discountEligible,
    newRulesApply,
    newBuildChoiceAvailable,
    notes,
  }
}

function calculateCostBase(input: CapitalGainsInput): number {
  return input.acquisitionAmount.dollars
    + input.costs.acquisition
    + input.costs.disposal
    + input.costs.improvement
    + input.costs.ownership
}

function calculateAcquisitionBase(input: CapitalGainsInput): number {
  return input.acquisitionAmount.dollars
    + input.costs.acquisition
    + input.costs.improvement
    + input.costs.ownership
}

function calculateLegacyComparison(
  input: CapitalGainsInput,
  ownershipAdjustedGain: number,
  eligibility: EligibilitySummary,
): LegacyComparisonSummary {
  const taxableCapitalGain = eligibility.discountEligible ? ownershipAdjustedGain * 0.5 : ownershipAdjustedGain
  const estimatedTax = input.residencyStatus === 'resident'
    ? estimateAdditionalResidentTax(input.taxableIncomeBeforeGain.dollars, taxableCapitalGain)
    : 0

  return {
    taxableCapitalGain: roundCurrency(taxableCapitalGain),
    estimatedTax: roundCurrency(estimatedTax),
    effectiveTaxRate: ownershipAdjustedGain > 0 ? roundCurrency(estimatedTax / ownershipAdjustedGain) : 0,
    notes: eligibility.discountEligible
      ? ['Legacy rules apply the 50% CGT discount to the whole eligible gain.']
      : ['Legacy rules tax the whole gain because the asset/taxpayer is not discount eligible.'],
  }
}

function makeDiscountSegment(
  input: CapitalGainsInput,
  nominalGain: number,
  eligibility: EligibilitySummary,
  startDate: string,
  endDate: string,
): CgtRuleSegment {
  const taxableGain = eligibility.discountEligible ? nominalGain * 0.5 : nominalGain
  const estimatedTax = input.residencyStatus === 'resident'
    ? estimateAdditionalResidentTax(input.taxableIncomeBeforeGain.dollars, taxableGain)
    : 0

  return {
    period: 'pre-2027-discount',
    startDate,
    endDate,
    nominalGain: roundCurrency(nominalGain),
    realGain: roundCurrency(nominalGain),
    taxableGain: roundCurrency(taxableGain),
    estimatedTax: roundCurrency(estimatedTax),
    minimumTaxApplied: false,
    notes: eligibility.discountEligible
      ? ['50% discount applied to the pre-1 July 2027 eligible gain portion.']
      : ['No discount applied because the asset/taxpayer is not eligible under the current discount rules.'],
  }
}

function makeIndexedSegment(
  input: CapitalGainsInput,
  nominalGain: number,
  segmentCostBase: number,
  startDate: string,
  endDate: string,
): CgtRuleSegment {
  const indexationFactor = input.cpiAtDisposal / input.cpiAtReformStart
  const indexedCostBase = segmentCostBase * indexationFactor
  const inflationAdjustment = Math.max(0, indexedCostBase - segmentCostBase)
  const realGain = Math.max(0, nominalGain - inflationAdjustment)
  const ordinaryTax = input.residencyStatus === 'resident'
    ? estimateAdditionalResidentTax(input.taxableIncomeBeforeGain.dollars, realGain)
    : 0
  const minimumTax = input.receivesIncomeSupport ? 0 : realGain * MINIMUM_POST_2027_CGT_RATE
  const estimatedTax = Math.max(ordinaryTax, minimumTax)

  return {
    period: 'post-2027-indexed',
    startDate,
    endDate,
    nominalGain: roundCurrency(nominalGain),
    indexedCostBase: roundCurrency(indexedCostBase),
    realGain: roundCurrency(realGain),
    taxableGain: roundCurrency(realGain),
    estimatedTax: roundCurrency(estimatedTax),
    minimumTaxApplied: estimatedTax === minimumTax && minimumTax > ordinaryTax,
    notes: [
      'Post-1 July 2027 gain uses inflation indexation and the 30% minimum tax rule announced in Budget 2026-27.',
    ],
  }
}

export function calculateCapitalGains(input: CapitalGainsInput): CapitalGainsResult {
  const validation = validateCapitalGainsInput(input)
  const capitalProceeds = input.disposalAmount.dollars
  const costBase = calculateCostBase(input)
  const grossCapitalGain = capitalProceeds - costBase
  const ownershipAdjustedGain = grossCapitalGain * (input.ownershipPercentage / 100)
  const eligibility = buildEligibility(input)

  if (hasBlockingValidationErrors(validation) || ownershipAdjustedGain <= 0) {
    const legacyComparison = calculateLegacyComparison(input, Math.max(0, ownershipAdjustedGain), eligibility)
    return {
      input,
      capitalProceeds: roundCurrency(capitalProceeds),
      costBase: roundCurrency(costBase),
      grossCapitalGain: roundCurrency(grossCapitalGain),
      ownershipAdjustedGain: roundCurrency(ownershipAdjustedGain),
      eligibility,
      segments: [],
      taxableCapitalGain: 0,
      estimatedTax: 0,
      effectiveTaxRate: 0,
      legacyComparison,
      validation,
    }
  }

  const totalDays = Math.max(1, daysHeld(input.acquisitionDate, input.disposalDate))
  const segments: CgtRuleSegment[] = []

  if (!eligibility.newRulesApply) {
    segments.push(makeDiscountSegment(input, ownershipAdjustedGain, eligibility, input.acquisitionDate, input.disposalDate))
  } else if (isOnOrAfter(input.acquisitionDate, CGT_REFORM_START_DATE)) {
    const ownershipRatio = input.ownershipPercentage / 100
    const indexableCostBase = calculateAcquisitionBase(input) * ownershipRatio
    segments.push(makeIndexedSegment(input, ownershipAdjustedGain, indexableCostBase, input.acquisitionDate, input.disposalDate))
  } else {
    const ownershipRatio = input.ownershipPercentage / 100
    const reformValue = input.marketValueAtReformStart.dollars || (
      input.acquisitionAmount.dollars + (input.disposalAmount.dollars - input.acquisitionAmount.dollars)
      * (Math.max(0, daysHeld(input.acquisitionDate, CGT_REFORM_START_DATE)) / totalDays)
    )
    const preReformGain = (reformValue - calculateAcquisitionBase(input)) * ownershipRatio
    const postReformGain = (input.disposalAmount.dollars - input.costs.disposal - reformValue) * ownershipRatio
    const postReformCostBase = reformValue * ownershipRatio

    if (preReformGain > 0) {
      segments.push(makeDiscountSegment(input, preReformGain, eligibility, input.acquisitionDate, CGT_REFORM_START_DATE))
    }
    if (postReformGain > 0) {
      segments.push(makeIndexedSegment(input, postReformGain, postReformCostBase, CGT_REFORM_START_DATE, input.disposalDate))
    }
  }

  const taxableCapitalGain = segments.reduce((total, segment) => total + segment.taxableGain, 0)
  const estimatedTax = segments.reduce((total, segment) => total + segment.estimatedTax, 0)
  const legacyComparison = calculateLegacyComparison(input, ownershipAdjustedGain, eligibility)

  return {
    input,
    capitalProceeds: roundCurrency(capitalProceeds),
    costBase: roundCurrency(costBase),
    grossCapitalGain: roundCurrency(grossCapitalGain),
    ownershipAdjustedGain: roundCurrency(ownershipAdjustedGain),
    eligibility,
    segments,
    taxableCapitalGain: roundCurrency(taxableCapitalGain),
    estimatedTax: roundCurrency(estimatedTax),
    effectiveTaxRate: ownershipAdjustedGain > 0 ? roundCurrency(estimatedTax / ownershipAdjustedGain) : 0,
    legacyComparison,
    validation,
  }
}
