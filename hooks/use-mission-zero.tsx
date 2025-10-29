"use client"

import React, { createContext, useContext, useMemo, useState } from "react"

type MissionZeroField =
  | "brandName"
  | "brandOrigin"
  | "brandVoice"
  | "uniqueValue"
  | "idealCustomer"
  | "currentCustomer"
  | "desiredPerception"
  | "quarterGoals"
  | "instagramRef"
  | "contactInfo"

type MissionZeroAnswers = Partial<Record<MissionZeroField, string>>

interface MissionZeroUpload {
  file?: File | null
  previewUrl?: string | null
  skipped?: boolean
}

interface MissionZeroContextValue {
  answers: MissionZeroAnswers
  upload: MissionZeroUpload
  setAnswer: (field: MissionZeroField, value: string) => void
  setUpload: (upload: MissionZeroUpload) => void
  reset: () => void
}

const MissionZeroContext = createContext<MissionZeroContextValue | undefined>(undefined)

export function MissionZeroProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = useState<MissionZeroAnswers>({})
  const [upload, setUpload] = useState<MissionZeroUpload>({})

  const contextValue = useMemo<MissionZeroContextValue>(
    () => ({
      answers,
      upload,
      setAnswer: (field, value) =>
        setAnswers((prev) => ({
          ...prev,
          [field]: value,
        })),
      setUpload: (payload) => setUpload(payload),
      reset: () => {
        setAnswers({})
        setUpload({})
      },
    }),
    [answers, upload]
  )

  return <MissionZeroContext.Provider value={contextValue}>{children}</MissionZeroContext.Provider>
}

export function useMissionZero() {
  const context = useContext(MissionZeroContext)

  if (!context) {
    throw new Error("useMissionZero must be used within a MissionZeroProvider")
  }

  return context
}
