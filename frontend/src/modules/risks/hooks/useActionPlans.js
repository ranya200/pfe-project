import { useCallback, useEffect, useState } from 'react'
import { getActionPlans } from '../api/risks.api'

export default function useActionPlans(projectId) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      setData(await getActionPlans(projectId))
    } catch (e) {
      setError(e?.detail || "Impossible de charger le plan d'action.")
      setData([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { refresh() }, [refresh])

  return { data, loading, error, refresh, setData }
}
