import { useState, useEffect, useCallback, useRef } from 'react'
import { getAT, getStep1, getStep2, getStep3, getStep4,
         saveStep1, saveStep2, saveStep3, saveStep4,
         advanceStep, goBackStep } from '../api/assistanceTechniqueApi'

/**
 * Central hook for AT data management.
 * @param {number|string} atId
 */
export function useAssistanceTechnique(atId) {
  const [at,        setAt]        = useState(null)
  const [step1,     setStep1]     = useState(null)
  const [step2,     setStep2]     = useState(null)
  const [step3,     setStep3]     = useState(null)
  const [step4,     setStep4]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)   // load errors only
  const [saveError, setSaveError] = useState(null)   // auto-save errors (non-blocking)

  // Load main AT info
  const loadAT = useCallback(async () => {
    if (!atId) return
    try {
      setLoading(true)
      const data = await getAT(atId)
      setAt(data)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [atId])

  useEffect(() => { loadAT() }, [loadAT])

  // BUG FIX 3: always reload step data from API (don't skip if already in state)
  const loadStep = useCallback(async (stepNum) => {
    if (!atId) return
    try {
      setLoading(true)
      if (stepNum === 1) { const d = await getStep1(atId); setStep1(d) }
      if (stepNum === 2) { const d = await getStep2(atId); setStep2(d) }
      if (stepNum === 3) { const d = await getStep3(atId); setStep3(d) }
      if (stepNum === 4) { const d = await getStep4(atId); setStep4(d) }
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [atId])

  // Debounced save helpers
  const debounceRef = useRef({})

  const debouncedSave = useCallback((stepNum, payload, delay = 800) => {
    clearTimeout(debounceRef.current[stepNum])
    debounceRef.current[stepNum] = setTimeout(async () => {
      try {
        setSaving(true)
        setSaveError(null)
        if (stepNum === 1) { const d = await saveStep1(atId, payload); setStep1(d) }
        if (stepNum === 2) { const d = await saveStep2(atId, payload); setStep2(d) }
        if (stepNum === 3) { const d = await saveStep3(atId, payload); setStep3(d) }
        if (stepNum === 4) { const d = await saveStep4(atId, payload); setStep4(d) }
      } catch (e) {
        setSaveError(e)   // non-blocking: don't replace the whole page
      } finally {
        setSaving(false)
      }
    }, delay)
  }, [atId])

  // Immediate save (on blur or explicit submit)
  const saveNow = useCallback(async (stepNum, payload) => {
    clearTimeout(debounceRef.current[stepNum])
    try {
      setSaving(true)
      setSaveError(null)
      if (stepNum === 1) { const d = await saveStep1(atId, payload); setStep1(d) }
      if (stepNum === 2) { const d = await saveStep2(atId, payload); setStep2(d) }
      if (stepNum === 3) { const d = await saveStep3(atId, payload); setStep3(d) }
      if (stepNum === 4) { const d = await saveStep4(atId, payload); setStep4(d) }
    } catch (e) {
      setSaveError(e)   // non-blocking
      throw e
    } finally {
      setSaving(false)
    }
  }, [atId])

  const handleAdvance = useCallback(async () => {
    const data = await advanceStep(atId)
    setAt(prev => ({ ...prev, current_step: data.current_step, status: data.status }))
    return data
  }, [atId])

  const handleGoBack = useCallback(async () => {
    const data = await goBackStep(atId)
    setAt(prev => ({ ...prev, current_step: data.current_step, status: data.status }))
    return data
  }, [atId])

  return {
    at, step1, step2, step3, step4,
    loading, saving, error, saveError,
    loadStep, debouncedSave, saveNow,
    handleAdvance, handleGoBack, reload: loadAT,
    setStep1, setStep2, setStep3, setStep4,
  }
}