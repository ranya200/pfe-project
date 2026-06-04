import React from 'react'

const STEPS = [
  { num: 1, label: 'Lancer',   sub: 'la prestation' },
  { num: 2, label: 'Réaliser', sub: 'la prestation' },
  { num: 3, label: 'Suivre',   sub: 'la prestation' },
  { num: 4, label: 'Évaluer',  sub: 'la prestation' },
]

/**
 * @param {number}   currentStep   - active step (1-4)
 * @param {number[]} completedSteps - array of completed step numbers
 * @param {boolean}  isTerminee    - true when AT status === 'terminee' → step 4 shown in green
 */
export default function ATWorkflowStepper({ currentStep = 1, completedSteps = [], isTerminee = false }) {
  return (
    <div className="w-full flex items-center justify-between px-2 py-4 select-none">
      {STEPS.map((step, idx) => {
        // Step 4 is shown as completed (green ✓) when AT is terminée
        const isCompleted = completedSteps.includes(step.num) || (isTerminee && step.num === 4)
        const isActive    = !isCompleted && step.num === currentStep
        const isFuture    = !isCompleted && step.num > currentStep

        return (
          <React.Fragment key={step.num}>
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${isCompleted ? 'bg-green-600 border-green-600 text-white'
                  : isActive   ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                  :              'bg-white border-gray-300 text-gray-400'}
              `}>
                {isCompleted
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  : step.num
                }
              </div>
              <div className="text-center">
                <div className={`text-xs font-semibold leading-tight
                  ${isCompleted ? 'text-green-700'
                    : isActive   ? 'text-blue-700'
                    :              'text-gray-400'}`}>
                  {step.label}
                </div>
                <div className={`text-xs leading-tight
                  ${isCompleted ? 'text-green-500' : isActive ? 'text-blue-500' : 'text-gray-300'}`}>
                  {step.sub}
                </div>
              </div>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded transition-all
                ${completedSteps.includes(step.num) || (isTerminee && step.num < 4)
                  ? 'bg-green-400'
                  : 'bg-gray-200'}`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}