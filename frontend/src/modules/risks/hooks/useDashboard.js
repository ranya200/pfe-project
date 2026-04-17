import { useCallback, useEffect, useState } from 'react'
import { getRiskDashboard } from '../api/risks.api'

export default function useDashboard(projectId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      setData(await getRiskDashboard(projectId))
    } catch (e) {
      setError(e?.detail || 'Impossible de charger le dashboard.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { refresh() }, [refresh])

  return { data, loading, error, refresh }
}
