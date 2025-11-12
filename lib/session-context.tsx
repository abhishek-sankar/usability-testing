'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SessionContextType {
  sessionActive: boolean
  setSessionActive: (active: boolean) => void
  userEvents: any[]
  setUserEvents: React.Dispatch<React.SetStateAction<any[]>>
  sessionStartTime: number | null
  setSessionStartTime: (time: number | null) => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionActive, setSessionActive] = useState(false)
  const [userEvents, setUserEvents] = useState<any[]>([])
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)

  return (
    <SessionContext.Provider
      value={{
        sessionActive,
        setSessionActive,
        userEvents,
        setUserEvents,
        sessionStartTime,
        setSessionStartTime,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider')
  }
  return context
}

