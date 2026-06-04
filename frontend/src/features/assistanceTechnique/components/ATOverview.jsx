import { useNavigate } from 'react-router-dom'
import ATWorkflowStepper from './ATWorkflowStepper'

const STEP_INFO = [
  { num: 1, icon: '🚀', title: 'Lancer la prestation',   desc: "Définir les objectifs, l'équipe, les contacts et les risques initiaux." },
  { num: 2, icon: '⚙️', title: 'Réaliser la prestation', desc: 'Exécuter les tâches planifiées et produire les livrables attendus.' },
  { num: 3, icon: '📊', title: 'Suivre la prestation',   desc: 'Suivre la charge de travail, les équipements et les réunions de suivi.' },
  { num: 4, icon: '✅', title: 'Évaluer la prestation',  desc: "Évaluer la satisfaction client et réaliser le bilan de l'assistance." },
]

export default function ATOverview({ at, onStart, onGoToStep }) {
  const navigate = useNavigate()
  const isTerminee = at.status === 'terminee'

  const completedSteps = isTerminee
    ? [1, 2, 3, 4]
    : Array.from({ length: at.current_step - 1 }, (_, i) => i + 1)

  const handleStepClick = (stepNum) => {
    if (onGoToStep) {
      onGoToStep(stepNum)
    } else {
      onStart()
    }
  }

  return (
    <div className="space-y-6">
      {/* Info card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{at.type_prestation}</h2>
            <p className="text-sm text-gray-500 mt-1">Référence AT-{at.id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium
            ${isTerminee ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {isTerminee ? '✓ Terminée' : 'En cours'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Client',               value: at.client },
            { label: "Directeur d'activité", value: at.directeur_activite || '—' },
            { label: 'Étape actuelle',        value: isTerminee ? 'Terminée' : `Étape ${at.current_step} / 4` },
            { label: 'Statut',               value: isTerminee ? 'Terminée' : 'En cours' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Progression du workflow</h3>
        <ATWorkflowStepper
          currentStep={at.current_step}
          completedSteps={completedSteps}
          isTerminee={isTerminee}
        />
      </div>

      {/* Clickable step cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEP_INFO.map(step => {
          const isDone      = isTerminee ? true : step.num < at.current_step
          const isActive    = !isTerminee && step.num === at.current_step
          const isClickable = isDone || isActive || isTerminee

          return (
            <button
              key={step.num}
              type="button"
              onClick={() => handleStepClick(step.num)}
              className={`rounded-lg border p-4 text-left transition-all w-full
                ${isDone
                  ? 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 hover:shadow-md cursor-pointer'
                  : isActive
                    ? 'border-blue-200 bg-blue-50 ring-2 ring-blue-100 hover:bg-blue-100 hover:shadow-md cursor-pointer'
                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'}
              `}
              disabled={!isClickable}
              title={isClickable ? `Ouvrir l'étape ${step.num}` : `Étape ${step.num} non encore disponible`}
            >
              <div className="text-2xl mb-2">{step.icon}</div>
              <h4 className={`text-sm font-semibold mb-1
                ${isDone ? 'text-green-800' : isActive ? 'text-blue-800' : 'text-gray-500'}`}>
                Étape {step.num} — {step.title}
              </h4>
              <p className="text-xs text-gray-500">{step.desc}</p>

              {isDone && (
                <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                  ✓ Complétée
                  <span className="ml-auto text-green-400 text-xs">→ Modifier</span>
                </p>
              )}
              {isActive && (
                <p className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
                  → En cours
                  <span className="ml-auto text-blue-400 text-xs">→ Ouvrir</span>
                </p>
              )}
              {!isDone && !isActive && (
                <p className="text-xs text-gray-400 font-medium mt-2">⏳ Non démarrée</p>
              )}
            </button>
          )
        })}
      </div>

      {/* CTA — show when not terminée */}
      {!isTerminee && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => handleStepClick(at.current_step)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow transition-colors flex items-center gap-2 text-sm">
            {at.current_step === 1 ? "🚀 Commencer l'étape 1" : `▶ Reprendre l'étape ${at.current_step}`}
          </button>
        </div>
      )}

      {/* Done banner */}
      {isTerminee && (
        <div className="flex items-center justify-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-green-800 font-semibold text-sm">Prestation terminée</p>
            <p className="text-green-600 text-xs">Toutes les étapes ont été complétées avec succès.</p>
          </div>
        </div>
      )}
    </div>
  )
}