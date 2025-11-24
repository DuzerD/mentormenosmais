export interface Mission5Report {
  reachDelta: string
  engagementDelta: string
  clarityScore: string
  consistencyLevel: string
  frequency: string
  commentary?: string
}

export interface Mission5Insight {
  id: string
  title: string
  detail: string
  rationale?: string
}

export interface Mission5InsightsOutput {
  insights: Mission5Insight[]
  framingNote?: string
}

export interface Mission5PlanStep {
  objective: string
  action: string
  expectedImpact: string
}

export interface Mission5AdjustmentPlan {
  heading?: string
  steps: Mission5PlanStep[]
  reminder?: string
}

export interface Mission5MaturityScore {
  score: number
  stage: string
  narrative?: string
}

export interface Mission5Results {
  generatedAt: string
  report: Mission5Report
  insights: Mission5Insight[]
  plan: Mission5AdjustmentPlan
  maturity: Mission5MaturityScore
}

export interface Mission5Mission4Snapshot {
  calendarSummary?: string
  legenda?: string
  selectedIdeaTitle?: string
  presenceFrequency?: string
}

export interface Mission5Context {
  brandName?: string
  creatorName?: string
  mission1Summary?: string
  mission2Message?: string
  mission3Identity?: string
  mission4Presence?: Mission5Mission4Snapshot | null
  xpAtual?: number
  comparativoPercentual?: number
}
