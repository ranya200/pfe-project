import { createContext, useContext, useMemo, useState } from 'react'

const RiskContext = createContext(null)

export function RiskProvider({ children }) {
  const [toast, setToast] = useState(null)
  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 2800)
  }

  const value = useMemo(() => ({ toast, showToast }), [toast])

  return (
    <RiskContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className="fixed right-6 top-6 z-[120] rounded-lg px-4 py-3 text-sm shadow-lg"
          style={{
            backgroundColor: toast.type === 'error' ? '#FEE2E2' : '#DCFCE7',
            color: toast.type === 'error' ? '#991B1B' : '#166534',
            border: `1px solid ${toast.type === 'error' ? '#DC2626' : '#16A34A'}`,
          }}
        >
          {toast.message}
        </div>
      )}
    </RiskContext.Provider>
  )
}

export const useRiskUi = () => {
  const ctx = useContext(RiskContext)
  if (!ctx) throw new Error('useRiskUi must be used inside RiskProvider')
  return ctx
}
