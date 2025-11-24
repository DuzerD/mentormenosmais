export interface Mission1Snapshot {
  name?: string
  q1?: string
  q2?: string[]
  q3?: string
  q4?: string[]
  q5?: string
  resumo?: {
    name: string
    q1: string
    q2: string[]
    q3: string
    q4: string[]
    q5: string
  }
}

export interface Mission4Mission2Snapshot {
  selectedPhrase: string
  subtitle?: string
  bio?: string
  insight?: string
  contentIdea?: {
    title: string
    bullets: string[]
    callToAction?: string
  } | null
  generatedAt?: string
}

export interface Mission4Mission3Snapshot {
  energy: string
  direction: {
    id: string
    name: string
    summary: string
    palette: {
      hex: string
      label: string
      usage: string
    }[]
    typography: string
    keywords: string[]
  }
  layoutPreference: string
  palette: {
    hex: string
    label: string
    usage: string
  }[]
  typography: {
    primary: {
      name: string
      style: string
      usage: string
    }
    secondary?: {
      name: string
      style: string
      usage: string
    }
    accent?: {
      name: string
      style: string
      usage: string
    }
  }
  visualNotes: string[]
  signatureIdea: string
  socialPreviewIdea: string
  toneReminder: string
  finalImageUrl?: string
  generatedAt: string
}

export interface Mission4Idea {
  id: string
  title: string
  format: string
  caption: string
  angle?: string
}

export interface Mission4IdeasResponse {
  ideas: Mission4Idea[]
  alignmentNote?: string
}

export interface Mission4Roteiro {
  gancho: string
  desenvolvimento: string[]
  insight: string
  callToAction: string
}

export interface Mission4Legenda {
  text: string
  characterCount: number
  toneReminder?: string
}

export interface Mission4CalendarEntry {
  day: string
  theme: string
  format: string
  callToAction: string
}

export interface Mission4Calendar {
  entries: Mission4CalendarEntry[]
  rationale?: string
}

export interface Mission4Results {
  generatedAt: string
  ideas: Mission4Idea[]
  selectedIdeaId: string
  roteiro: Mission4Roteiro
  legenda: Mission4Legenda
  calendar: Mission4Calendar
}

export interface Mission4Context {
  brandName?: string
  creatorName?: string
  mission1?: Mission1Snapshot | null
  mission2?: Mission4Mission2Snapshot | null
  mission3?: Mission4Mission3Snapshot | null
  tone?: string
  identitySummary?: string
}
