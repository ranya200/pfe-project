import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAssistanceTechnique } from '../hooks/useAssistanceTechnique'
import ATOverview from '../components/ATOverview'
import Step1Lancement from '../components/steps/Step1Lancement'
import Step2Realisation from '../components/steps/Step2Realisation'
import Step3Suivi from '../components/steps/Step3Suivi'
import Step4Evaluation from '../components/steps/Step4Evaluation'

export default function AssistanceTechniquePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [view,        setView]        = useState('overview') // 'overview' | 'step'
  const [activeStep,  setActiveStep]  = useState(null)       // which step is currently shown

  const {
    at, step1, step2, step3, step4,
    loading, saving, error, saveError,
    loadStep, debouncedSave, saveNow,
    handleAdvance, handleGoBack,
    setStep1, setStep2, setStep3, setStep4,
  } = useAssistanceTechnique(id)

  // Load step data whenever we switch to a specific step
  // BUG FIX 1: force reload on every step change (don't rely on cached state)
  useEffect(() => {
    if (view === 'step' && activeStep) {
      loadStep(activeStep)
      // Pre-load previous steps needed for context
      if (activeStep === 2) loadStep(1)
      if (activeStep === 3) {
        loadStep(1)
        loadStep(2)
      }
    }
  }, [view, activeStep]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSave1 = useCallback((p) => saveNow(1, p), [saveNow])
  const onSave2 = useCallback((p) => saveNow(2, p), [saveNow])
  const onSave3 = useCallback((p) => saveNow(3, p), [saveNow])
  const onSave4 = useCallback((p) => saveNow(4, p), [saveNow])

  const goToOverview = () => {
    setView('overview')
    setActiveStep(null)
  }

  // Called from the CTA button — go to current step
  const goToCurrentStep = () => {
    setActiveStep(at.current_step)
    setView('step')
  }

  // Called when clicking a specific step card in ATOverview
  const goToStep = (stepNum) => {
    setActiveStep(stepNum)
    setView('step')
  }

  const advance = async () => {
    try {
      const data = await handleAdvance()

      // FIN DE PRESTATION — AT is now terminée
      if (data.status === 'terminee') {
        goToOverview()
        return
      }

      // Normal advance — go to the next step
      setActiveStep(data.current_step)
      await loadStep(data.current_step)
    } catch (e) {
      console.error(e)
    }
  }

  const goBack = async () => {
    // BUG FIX 2: if AT is terminée, going "back" from step 4 should only
    // navigate to overview — NEVER call go_back_step on the backend,
    // because that would decrement current_step and reset the project phase.
    if (at?.status === 'terminee') {
      goToOverview()
      return
    }

    // If we're viewing a step different from current (e.g. viewing step 1 while current is 4),
    // just go back to overview without changing AT state
    if (activeStep !== at?.current_step) {
      goToOverview()
      return
    }

    if (at?.current_step <= 1) {
      goToOverview()
    } else {
      try {
        const data = await handleGoBack()
        setActiveStep(data.current_step)
        await loadStep(data.current_step)
      } catch (e) {
        goToOverview()
      }
    }
  }

  if (loading && !at) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-700 font-semibold">Erreur de chargement</p>
          <p className="text-red-500 text-sm mt-1">{error?.detail || 'Une erreur est survenue.'}</p>
          <button onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
            ← Retour
          </button>
        </div>
      </div>
    )
  }

  if (!at) return null

  // For the "Retour" button inside a step:
  // - If AT is terminée → always go to overview (never mutate backend)
  // - If viewing a past/future step (not the current one) → just go back to overview
  // - If viewing the current step and it's step 1 → go to overview
  // - Otherwise → go back in AT workflow
  const isViewingNonCurrentStep = activeStep !== null && activeStep !== at.current_step
  const onBackForStep = at?.status === 'terminee'
    ? goToOverview
    : isViewingNonCurrentStep
      ? goToOverview
      : (view === 'step' && at.current_step === 1 ? goToOverview : goBack)

  // When viewing a non-current step (read/edit mode on a completed step),
  // hide the "advance" button — user cannot advance from a past step
  const stepProps = {
    at,
    saving,
    onAdvance: isViewingNonCurrentStep ? null : advance,
    onBack: onBackForStep,
    readOnly: false, // allow edits even on completed steps
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {saveError && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-800">
          <span>❌</span>
          <span>Erreur lors de la sauvegarde — veuillez réessayer.</span>
          <span className="ml-auto text-xs text-red-600 font-mono">
            {saveError?.detail || saveError?.message || 'Erreur inconnue.'}
          </span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate('/projects')} className="hover:text-blue-600">Projets</button>
        <span>/</span>
        <button onClick={goToOverview} className="hover:text-blue-600">Assistance Technique</button>
        {view === 'step' && activeStep && (
          <>
            <span>/</span>
            <span className="text-gray-900 font-medium">Étape {activeStep}</span>
            {activeStep !== at.current_step && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Consultation / Modification
              </span>
            )}
          </>
        )}
      </div>

      {view === 'overview' && (
        <ATOverview
          at={at}
          onStart={goToCurrentStep}
          onGoToStep={goToStep}
        />
      )}

      {view === 'step' && activeStep === 1 && (
        <Step1Lancement {...stepProps} step1Data={step1} onSave={onSave1} />
      )}
      {view === 'step' && activeStep === 2 && (
        <Step2Realisation {...stepProps} step2Data={step2} step1Data={step1} onSave={onSave2} />
      )}
      {view === 'step' && activeStep === 3 && (
        <Step3Suivi {...stepProps} step3Data={step3} step2Data={step2} step1Data={step1} onSave={onSave3} />
      )}
      {view === 'step' && activeStep === 4 && (
        <Step4Evaluation {...stepProps} step4Data={step4} onSave={onSave4} />
      )}
    </div>
  )
}