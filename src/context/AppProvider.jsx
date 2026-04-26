import { useMemo, useState } from 'react'
import { AppContext } from './appContext'

export default function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const value = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
    }),
    [sidebarOpen],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
