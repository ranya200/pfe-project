import { useCallback, useEffect, useState } from 'react'
import { getRisks } from '../api/risks.api'

export default function useRisks(projectId) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      setData(await getRisks(projectId))
    } catch (e) {
      setError(e?.detail || 'Impossible de charger les risques.')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { refresh() }, [refresh])

  return { data, loading, error, refresh, setData }
}
