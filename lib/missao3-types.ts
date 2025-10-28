export type VisualEnergyChoice =
  | "professionalismo"
  | "inspiracao"
  | "criatividade"
  | "calma"
  | "energia"

export interface Mission2Snapshot {
  brandName?: string | null
  creatorName?: string | null
  selectedPhrase: string
  subtitle?: string
  bio?: string
  insight?: string
  tone?: string
}

export interface PaletteSwatch {
  hex: string
  label: string
  usage: string
}

export interface VisualDirectionOption {
  id: string
  name: string
  summary: string
  palette: PaletteSwatch[]
  texture: string
  lighting: string
  typography: string
  shapes?: string
  keywords: string[]
}

export interface DirectionsResponsePayload {
  directions: VisualDirectionOption[]
  creativeNote?: string
}

export type LayoutPreference = "curves" | "lines" | "none"

export interface Mission3GuideSummary {
  palette: PaletteSwatch[]
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
}

export interface Mission3Results {
  energy: VisualEnergyChoice
  direction: VisualDirectionOption
  layoutPreference: LayoutPreference
  palette: PaletteSwatch[]
  typography: Mission3GuideSummary["typography"]
  visualNotes: string[]
  signatureIdea: string
  socialPreviewIdea: string
  toneReminder: string
  finalImageUrl: string
  generatedAt: string
}

