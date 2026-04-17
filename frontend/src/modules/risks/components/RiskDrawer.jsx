import { useEffect, useMemo, useRef, useState } from 'react'
import RiskStepper from './RiskStepper'
import Step1Analyse from './steps/Step1Analyse'
import Step2Evaluation from './steps/Step2Evaluation'
import Step3ActionPlan from './steps/Step3ActionPlan'
import Step4Residual from './steps/Step4Residual'
import { criticality } from '../utils/criticality'
import {
  createRisk,
  getProjectMembers,
  getRiskFull,
  upsertActionPlan,
  upsertEvaluation,
  upsertResidual,
  updateRisk,
} from '../api/risks.api'
import { useRiskUi } from '../context/RiskContext'

export function getCompletedSteps(full) {
  if (!full || !full.id) return 0
  const hasStep1 = full.title && full.process && full.activity
  if (!hasStep1) return 0
  const hasStep2 = full.evaluation?.probability && full.evaluation?.severity
  if (!hasStep2) return 1
  const hasStep3 =
    full.action_plan?.action &&
    full.action_plan?.responsible &&
    full.action_plan?.planned_date
  if (!hasStep3) return 2
  const hasStep4 = full.residual?.probability && full.residual?.severity
  if (!hasStep4) return 3
  return 4
}

export default function RiskDrawer({ open, riskId, projectId, onClose, onSaved }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [members, setMembers] = useState([])
  const [currentRiskId, setCurrentRiskId] = useState(riskId || null)
  const [completedSteps, setCompletedSteps] = useState(0)
  const { showToast } = useRiskUi()

  // Empêche le double appel React StrictMode
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      loadedRef.current = false
      return
    }
    if (loadedRef.current) return
    loadedRef.current = true

    setCurrentRiskId(riskId || null)

    const load = async () => {
      setLoading(true)
      try {
        const [full, mem] = await Promise.all([
          riskId ? getRiskFull(riskId) : Promise.resolve({}),
          getProjectMembers(projectId),
        ])
        const completed = getCompletedSteps(full)
        setCompletedSteps(completed)
        setStep(completed < 4 ? completed + 1 : 1)
        setForm({
          ...(full || {}),
          risk_status: full?.status || 'Ouvert',
          ...(full?.evaluation || {}),
          ...(full?.action_plan
            ? { ...full.action_plan, ap_status: full.action_plan.status || 'IDLE' }
            : { ap_status: 'IDLE' }),
          ...(full?.residual
            ? {
                residual_probability: full.residual.probability,
                residual_severity: full.residual.severity,
              }
            : {}),
        })
        setMembers(Array.isArray(mem) ? mem : mem?.results || [])
      } catch {
        showToast('error', 'Erreur de chargement du risque.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open, riskId, projectId, showToast])

  const saveStep = async (targetStep = step) => {
    setSaving(true)
    try {
      if (targetStep === 1) {
        if (!(form.title || '').trim()) {
          showToast('error', 'Le nom du risque est obligatoire.')
          return false
        }
        const payload = {
          project: Number(projectId),
          process: form.process || '',
          activity: form.activity || '',
          title: form.title,
          risk_type: form.risk_type || 'Interne',
          origin: form.origin || 'Telnet',
          causes: form.causes || '',
          consequences: form.consequences || '',
          existing_measures: form.existing_measures || '',
          status: form.risk_status || 'Ouvert',
        }
        if (currentRiskId) {
          await updateRisk(currentRiskId, payload)
        } else {
          const created = await createRisk(payload)
          setCurrentRiskId(created.id)
        }
        setCompletedSteps((s) => Math.max(s, 1))
      }

      if (targetStep === 2 && currentRiskId) {
        await upsertEvaluation(currentRiskId, {
          probability: Number(form.probability || 1),
          severity: Number(form.severity || 1),
          decision: form.decision || '',
          justification: form.justification || '',
        })
        setCompletedSteps((s) => Math.max(s, 2))
      }

      if (targetStep === 3 && currentRiskId) {
        await upsertActionPlan(currentRiskId, {
          action: form.action || '',
          responsible: form.responsible || null,
          planned_date: form.planned_date || null,
          actual_date: form.actual_date || null,
          progress: Number(form.progress || 0),
          status: form.ap_status || 'IDLE',
          effectiveness_criteria: form.effectiveness_criteria || '',
          initial_value: form.initial_value || '',
          comment: form.comment || '',
        })
        setCompletedSteps((s) => Math.max(s, 3))
      }

      if (targetStep === 4 && currentRiskId) {
        // Résiduel d'abord
        await upsertResidual(currentRiskId, {
          probability: Number(form.residual_probability || 1),
          severity: Number(form.residual_severity || 1),
        })
        // Puis status uniquement — c'est ce qui causait le 400
        await updateRisk(currentRiskId, { status: form.risk_status || 'Ouvert' })
        setCompletedSteps(4)
      }

      showToast('success', `Étape ${targetStep} enregistrée.`)
      onSaved()
      return true
    } catch (err) {
      const detail = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || 'Erreur inconnue'
      showToast('error', `Échec étape ${targetStep} : ${detail}`)
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    const ok = await saveStep(step)
    if (ok) setStep((s) => Math.min(4, s + 1))
  }

  const handleSaveAndClose = async () => {
    const ok = await saveStep(step)
    if (ok) onClose()
  }

  const initialC = useMemo(
    () => criticality(form.probability, form.severity),
    [form.probability, form.severity],
  )

  if (!open) return null

  const isComplete = completedSteps === 4

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/30"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute right-0 top-0 flex h-full w-[620px] flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-[#0F2744]">
              {currentRiskId ? 'Modifier le risque' : 'Nouveau risque'}
            </h3>
            {currentRiskId && !isComplete && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Brouillon — étape {completedSteps}/4
              </span>
            )}
            {currentRiskId && isComplete && (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Complet
              </span>
            )}
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Stepper */}
        <div className="border-b border-slate-100 px-5 py-3">
          <RiskStepper
            step={step}
            completedSteps={completedSteps}
            onStepClick={(s) => { if (s <= completedSteps + 1) setStep(s) }}
          />
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : (
            <>
              {step === 1 && <Step1Analyse form={form} setForm={setForm} />}
              {step === 2 && <Step2Evaluation form={form} setForm={setForm} />}
              {step === 3 && <Step3ActionPlan form={form} setForm={setForm} members={members} />}
              {step === 4 && <Step4Residual form={form} setForm={setForm} initialCriticality={initialC} />}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              disabled={step === 1 || saving}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              ← Précédent
            </button>

            <div className="flex items-center gap-2">
              {currentRiskId && (
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  disabled={saving}
                  onClick={handleSaveAndClose}
                >
                  Enregistrer et fermer
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  className="rounded-lg bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  disabled={saving}
                  onClick={handleNext}
                >
                  {saving ? 'Enregistrement…' : 'Suivant →'}
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-lg bg-[#16A34A] px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                  disabled={saving}
                  onClick={handleSaveAndClose}
                >
                  {saving ? 'Enregistrement…' : '✓ Terminer'}
                </button>
              )}
            </div>
          </div>

          {!currentRiskId && (
            <p className="mt-2 text-center text-xs text-slate-400">
              Remplissez au moins le nom du risque pour sauvegarder un brouillon
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
