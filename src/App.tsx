import { useMemo, useState } from 'react'
import { calculateCapitalGains } from './domain/cgtCalculator'
import { CGT_REFORM_START_DATE } from './domain/dateRules'
import { ABS_TABLE_17_METADATA } from './domain/cpi'
import {
  DEFAULT_INPUT,
  type AssetCategory,
  type CapitalGainsInput,
  type DisposalCosts,
  type OwnershipType,
  type ResidencyStatus,
} from './domain/cgtTypes'
import './App.css'

const currencyFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('en-AU', {
  style: 'percent',
  maximumFractionDigits: 1,
})

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value)
}

function formatMoney(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

function updateMoney(
  input: CapitalGainsInput,
  field: 'acquisitionAmount' | 'marketValueAtReformStart' | 'disposalAmount' | 'taxableIncomeBeforeGain',
  value: string,
): CapitalGainsInput {
  return {
    ...input,
    [field]: { dollars: toNumber(value) },
  }
}

function updateCost(input: CapitalGainsInput, field: keyof DisposalCosts, value: string): CapitalGainsInput {
  return {
    ...input,
    costs: {
      ...input.costs,
      [field]: toNumber(value),
    },
  }
}

function App() {
  const [input, setInput] = useState<CapitalGainsInput>(DEFAULT_INPUT)
  const calculation = useMemo(() => calculateCapitalGains(input), [input])
  const blockingIssues = calculation.validation.filter((issue) => issue.severity === 'error')
  const warnings = calculation.validation.filter((issue) => issue.severity === 'warning')
  const postReformSegments = calculation.segments.filter((segment) => segment.period === 'post-2027-indexed')
  const minimumTaxTriggered = postReformSegments.some((segment) => segment.minimumTaxApplied)
  const legacyTaxDelta = calculation.legacyComparison.estimatedTax - calculation.estimatedTax
  const currentTaxPayable = calculation.estimatedTax
  const legacyTaxPayable = calculation.legacyComparison.estimatedTax
  const cpiDatasetNote = `${ABS_TABLE_17_METADATA.rowCount} quarterly observations through ${ABS_TABLE_17_METADATA.referencePeriod}`

  return (
    <main className="app-shell">
      <section className="app-header">
        <div>
          <p className="eyebrow">Australian CGT calculator</p>
          <h1>Capital Gains</h1>
          <p className="lede">
            Single-path estimate using the Budget 2026-27 CGT reforms: current discount treatment before
            1 July 2027, inflation-indexed real gains after that date, and a 30% minimum tax rule.
          </p>
        </div>
        <div className="status-panel">
          <span>Rule start</span>
          <strong>{CGT_REFORM_START_DATE}</strong>
          <small>Subject to legislation and ATO guidance.</small>
        </div>
      </section>

      <section className="summary-strip" aria-label="Calculation summary">
        <div>
          <span>Estimated CGT</span>
          <strong>{formatMoney(currentTaxPayable)}</strong>
        </div>
        <div>
          <span>Taxable capital gain</span>
          <strong>{formatMoney(calculation.taxableCapitalGain)}</strong>
        </div>
        <div>
          <span>If rules stayed as they were</span>
          <strong>{formatMoney(legacyTaxPayable)}</strong>
        </div>
        <div>
          <span>Tax difference</span>
          <strong>{legacyTaxDelta === 0 ? 'No change' : formatMoney(Math.abs(legacyTaxDelta))}</strong>
        </div>
      </section>

      <section className="workspace-grid">
        <form className="input-panel">
          <div className="panel-heading">
            <div>
              <h2>Inputs</h2>
              <p>Enter the dates, values, CPI assumptions, and taxpayer context.</p>
            </div>
            <button type="button" className="secondary-action" onClick={() => setInput(DEFAULT_INPUT)}>
              Reset sample
            </button>
          </div>

          <h3 className="group-title">Dates and values</h3>
          <div className="field-grid">
            <label>
              Acquisition date
              <input
                type="date"
                value={input.acquisitionDate}
                onChange={(event) => setInput({ ...input, acquisitionDate: event.target.value })}
              />
            </label>
            <label>
              Disposal date
              <input
                type="date"
                value={input.disposalDate}
                onChange={(event) => setInput({ ...input, disposalDate: event.target.value })}
              />
            </label>
            <label>
              Asset category
              <select
                value={input.assetCategory}
                onChange={(event) => setInput({ ...input, assetCategory: event.target.value as AssetCategory })}
              >
                <option value="general-asset">General asset</option>
                <option value="residential-established">Established residential property</option>
                <option value="residential-new-build">New build residential property</option>
              </select>
            </label>
            <label>
              Acquisition amount
              <input
                type="number"
                min="0"
                value={input.acquisitionAmount.dollars}
                onChange={(event) => setInput(updateMoney(input, 'acquisitionAmount', event.target.value))}
              />
            </label>
            <label>
              Value at 1 July 2027
              <input
                type="number"
                min="0"
                value={input.marketValueAtReformStart.dollars}
                onChange={(event) => setInput(updateMoney(input, 'marketValueAtReformStart', event.target.value))}
              />
            </label>
            <label>
              Disposal amount
              <input
                type="number"
                min="0"
                value={input.disposalAmount.dollars}
                onChange={(event) => setInput(updateMoney(input, 'disposalAmount', event.target.value))}
              />
            </label>
          </div>

          <h3 className="group-title">Taxpayer context</h3>
          <div className="field-grid">
            <label>
              Ownership %
              <input
                type="number"
                min="0"
                max="100"
                value={input.ownershipPercentage}
                onChange={(event) => setInput({ ...input, ownershipPercentage: toNumber(event.target.value) })}
              />
            </label>
            <label>
              Taxable income before gain
              <input
                type="number"
                min="0"
                value={input.taxableIncomeBeforeGain.dollars}
                onChange={(event) => setInput(updateMoney(input, 'taxableIncomeBeforeGain', event.target.value))}
              />
            </label>
            <label>
              Owner type
              <select
                value={input.ownershipType}
                onChange={(event) => setInput({ ...input, ownershipType: event.target.value as OwnershipType })}
              >
                <option value="individual">Individual</option>
                <option value="trust">Trust</option>
                <option value="company">Company</option>
                <option value="super-fund">Super fund</option>
              </select>
            </label>
            <label>
              Residency
              <select
                value={input.residencyStatus}
                onChange={(event) => setInput({ ...input, residencyStatus: event.target.value as ResidencyStatus })}
              >
                <option value="resident">Resident</option>
                <option value="foreign-resident">Foreign resident</option>
              </select>
            </label>
            <label className="toggle-field">
              <input
                type="checkbox"
                checked={input.receivesIncomeSupport}
                onChange={(event) => setInput({ ...input, receivesIncomeSupport: event.target.checked })}
              />
              <span>
                Receives pension or income support
                <small>Used as a provisional exemption flag for the 30% minimum tax floor.</small>
              </span>
            </label>
          </div>

          <h3 className="group-title">CPI assumptions</h3>
          <div className="field-grid">
            <label>
              CPI at 1 July 2027
              <input
                type="number"
                min="0"
                step="0.1"
                value={input.cpiAtReformStart}
                onChange={(event) => setInput({ ...input, cpiAtReformStart: toNumber(event.target.value) })}
              />
            </label>
            <label>
              CPI at disposal
              <input
                type="number"
                min="0"
                step="0.1"
                value={input.cpiAtDisposal}
                onChange={(event) => setInput({ ...input, cpiAtDisposal: toNumber(event.target.value) })}
              />
            </label>
          </div>

          <div className="cost-section">
            <h3 className="group-title">Costs</h3>
            <div className="field-grid">
              <label>
                Acquisition costs
                <input
                  type="number"
                  min="0"
                  value={input.costs.acquisition}
                  onChange={(event) => setInput(updateCost(input, 'acquisition', event.target.value))}
                />
              </label>
              <label>
                Disposal costs
                <input
                  type="number"
                  min="0"
                  value={input.costs.disposal}
                  onChange={(event) => setInput(updateCost(input, 'disposal', event.target.value))}
                />
              </label>
              <label>
                Improvement costs
                <input
                  type="number"
                  min="0"
                  value={input.costs.improvement}
                  onChange={(event) => setInput(updateCost(input, 'improvement', event.target.value))}
                />
              </label>
              <label>
                Ownership costs
                <input
                  type="number"
                  min="0"
                  value={input.costs.ownership}
                  onChange={(event) => setInput(updateCost(input, 'ownership', event.target.value))}
                />
              </label>
            </div>
          </div>
        </form>

        <section className="results-panel">
          <div className="panel-heading">
            <div>
              <h2>Estimate</h2>
              <p>Side-by-side comparison of the current reform estimate versus the legacy rules.</p>
            </div>
          </div>

          <div className="result-hero">
            <span>Estimated CGT</span>
            <strong>{formatMoney(calculation.estimatedTax)}</strong>
            <small>
              Taxable capital gain {formatMoney(calculation.taxableCapitalGain)} from an ownership-adjusted gain of{' '}
              {formatMoney(calculation.ownershipAdjustedGain)}.
            </small>
          </div>

          <div className="metric-grid">
            <div>
              <span>Proceeds</span>
              <strong>{formatMoney(calculation.capitalProceeds)}</strong>
            </div>
            <div>
              <span>Cost base</span>
              <strong>{formatMoney(calculation.costBase)}</strong>
            </div>
            <div>
              <span>Gross gain</span>
              <strong>{formatMoney(calculation.grossCapitalGain)}</strong>
            </div>
            <div>
              <span>Effective rate</span>
              <strong>{percentFormatter.format(calculation.effectiveTaxRate)}</strong>
            </div>
          </div>

          <div className="comparison-grid" aria-label="Tax comparison">
            <article className="comparison-card">
              <span>Current reform rules</span>
              <strong>{formatMoney(currentTaxPayable)}</strong>
              <dl>
                <div>
                  <dt>Taxable gain</dt>
                  <dd>{formatMoney(calculation.taxableCapitalGain)}</dd>
                </div>
                <div>
                  <dt>Effective rate</dt>
                  <dd>{percentFormatter.format(calculation.effectiveTaxRate)}</dd>
                </div>
              </dl>
              <p className="segment-note">
                Gain is split across the reform date, with the post-1 July 2027 portion using CPI indexation
                and the provisional 30% minimum tax floor.
              </p>
            </article>
            <article className="comparison-card comparison-card--legacy">
              <span>If rules stayed as they were</span>
              <strong>{formatMoney(legacyTaxPayable)}</strong>
              <dl>
                <div>
                  <dt>Taxable gain</dt>
                  <dd>{formatMoney(calculation.legacyComparison.taxableCapitalGain)}</dd>
                </div>
                <div>
                  <dt>Effective rate</dt>
                  <dd>{percentFormatter.format(calculation.legacyComparison.effectiveTaxRate)}</dd>
                </div>
              </dl>
              <p className="segment-note">{calculation.legacyComparison.notes.join(' ')}</p>
            </article>
          </div>

          <div className="comparison-delta" aria-label="Tax payable difference">
            <strong>
              {legacyTaxDelta === 0
                ? 'No tax difference between the scenarios.'
                : legacyTaxDelta > 0
                  ? `${formatMoney(legacyTaxDelta)} more tax under the reform rules.`
                  : `${formatMoney(Math.abs(legacyTaxDelta))} less tax under the reform rules.`}
            </strong>
            <span>
              {minimumTaxTriggered
                ? 'The 30% minimum tax floor is affecting the current estimate.'
                : 'The minimum tax floor is not binding on the current estimate.'}
            </span>
          </div>

          <div className="segment-list">
            <h3>Rule periods</h3>
            {calculation.segments.length ? (
              calculation.segments.map((segment) => (
                <article key={`${segment.period}-${segment.startDate}`} className="segment-card">
                  <div>
                    <strong>{segment.period === 'pre-2027-discount' ? 'Current discount rules' : 'New indexed rules'}</strong>
                    <span>{segment.startDate} to {segment.endDate}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Nominal gain</dt>
                      <dd>{formatMoney(segment.nominalGain)}</dd>
                    </div>
                    {segment.indexedCostBase != null && (
                      <div>
                        <dt>Indexed base</dt>
                        <dd>{formatMoney(segment.indexedCostBase)}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Real/taxable gain</dt>
                      <dd>{formatMoney(segment.taxableGain)}</dd>
                    </div>
                    <div>
                      <dt>Estimated tax</dt>
                      <dd>{formatMoney(segment.estimatedTax)}</dd>
                    </div>
                  </dl>
                  {segment.minimumTaxApplied && <p className="tag">30% minimum tax applied</p>}
                  <p className="segment-note">{segment.notes.join(' ')}</p>
                </article>
              ))
            ) : (
              <p className="muted">No taxable gain calculated for the current inputs.</p>
            )}
          </div>

          {(blockingIssues.length > 0 || warnings.length > 0) && (
            <div className="issue-list">
              {[...blockingIssues, ...warnings].map((issue) => (
                <p key={`${issue.field}-${issue.message}`} className={`issue issue-${issue.severity}`}>
                  {issue.message}
                </p>
              ))}
            </div>
          )}

          <div className="assumptions">
            <h3>Assumptions</h3>
            <ul>
              <li>Rules are based on the 2026-27 Budget announcement and remain subject to legislation.</li>
              <li>Gains up to 1 July 2027 use current discount treatment where eligible.</li>
              <li>Gains after 1 July 2027 use the entered 1 July 2027 value as the new-rule cost base.</li>
              <li>ABS Table 17 CPI data is embedded in the app and currently covers {cpiDatasetNote}.</li>
              <li>This is an estimate only, not tax or financial advice.</li>
            </ul>
          </div>

          <div className="source-list">
            <h3>Sources</h3>
            <a href="https://budget.gov.au/content/04-tax-reform.htm" target="_blank" rel="noreferrer">
              Budget 2026-27 tax reform
            </a>
            <a href="https://www.pm.gov.au/media/tax-reform-workers-businesses-and-future-generations" target="_blank" rel="noreferrer">
              PM and Treasurer tax reform release
            </a>
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
