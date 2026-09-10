import { useState, useCallback } from 'react'
import {
  analyzeProjectRisk,
  getProjectRiskResult,
  getProjectRiskHistory,
  getProjectAlerts,
  acknowledgeAlert,
} from '../api/aiApi'


export const useAIAnalysis = (projectId) => {
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [alerts,    setAlerts]    = useState([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)

  const fetchResult = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProjectRiskResult(projectId)
      setResult(data)
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Erreur lors de la récupération du résultat.')
      }
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getProjectRiskHistory(projectId)
      setHistory(data)
    } catch {
      setHistory([])
    }
  }, [projectId])

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getProjectAlerts(projectId)
      setAlerts(data)
    } catch {
      setAlerts([])
    }
  }, [projectId])

  const ackAlert = useCallback(async (alertId) => {
    try {
      await acknowledgeAlert(alertId)
      // Retirer l'alerte de la liste localement
      setAlerts(prev => prev.filter(a => a.id !== alertId))
    } catch {
      setError('Erreur lors de l\'acquittement de l\'alerte.')
    }
  }, [])


  const runAnalysis = useCallback(async () => {
    setAnalyzing(true)
    setError(null)
    try {
      await analyzeProjectRisk(projectId)
      // Polling jusqu'à ce que le résultat soit completed
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        try {
          const data = await getProjectRiskResult(projectId)
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(poll)
            setResult(data)
            setAnalyzing(false)
            fetchHistory()
            fetchAlerts()
          }
        } catch {
          if (attempts > 10) {
            clearInterval(poll)
            setAnalyzing(false)
            setError('Délai d\'attente dépassé.')
          }
        }
      }, 1500)
    } catch {
      setError('Erreur lors du lancement de l\'analyse.')
      setAnalyzing(false)
    }
  }, [projectId, fetchHistory, fetchAlerts])

  return {
    result, history, alerts,
    loading, analyzing, error,
    fetchResult, fetchHistory, fetchAlerts,
    runAnalysis, ackAlert,
  }
}