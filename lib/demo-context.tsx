'use client'

import * as React from 'react'

type DemoContextType = {
  showDemoData: boolean
  setShowDemoData: (v: boolean) => void
}

const DemoContext = React.createContext<DemoContextType | null>(null)

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [showDemoData, setShowDemoData] = React.useState(false)
  return (
    <DemoContext.Provider value={{ showDemoData, setShowDemoData }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoMode() {
  const ctx = React.useContext(DemoContext)
  if (!ctx) throw new Error('useDemoMode must be used within DemoProvider')
  return ctx
}
