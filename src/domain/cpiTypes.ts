export interface CpiObservation {
  period: string
  index: number
  percentageChange: number | null
}

export interface CpiDatasetMetadata {
  sourceUrl: string
  workbookUrl: string
  releaseDate: string
  referencePeriod: string
  tableTitle: string
  generatedAt: string
  rowCount: number
}
