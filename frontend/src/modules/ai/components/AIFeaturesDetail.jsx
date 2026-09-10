import React, { useState } from 'react'

const FEATURE_LABELS = {
  nb_risks_open: 'Risques ouverts',
  avg_criticality_open: 'Criticité moyenne',
  ratio_risks_inacceptable: 'Ratio risques inacceptables',
  ratio_actions_late: 'Taux actions en retard',
  ratio_actions_stuck: 'Taux actions bloquées à 0%',
  satisfaction_index: 'Indice satisfaction client',
  at_step_normalized: 'Avancement AT',
  at_status_terminee: 'AT terminée',
  project_age_normalized: 'Ancienneté projet',
}

const FEATURE_ISO = {
  nb_risks_open: 'ISO 9001 §6.1',
  avg_criticality_open: 'ISO 9001 §6.1',
  ratio_risks_inacceptable: 'ISO 9001 §6.1',
  ratio_actions_late: 'ISO 9001 §10.2',
  ratio_actions_stuck: 'ISO 9001 §10.2',
  satisfaction_index: 'ISO 9001 §9.1.2',
  at_step_normalized: 'ISO 9001 §8.1',
  at_status_terminee: 'ISO 9001 §8.1',
  project_age_normalized: 'ISO 9001 §7.1',
}

const getBarColor = (key, value) => {
  if (key === 'satisfaction_index' || key === 'at_step_normalized' || key === 'at_status_terminee') {
    if (value >= 0.7) return 'bg-green-500'
    if (value >= 0.4) return 'bg-orange-400'
    return 'bg-red-500'
  }
  if (value <= 0.1) return 'bg-green-500'
  if (value <= 0.4) return 'bg-orange-400'
  return 'bg-red-500'
}

const AIFeaturesDetail = ({ features }) => {
  const [open, setOpen] = useState(false)

  if (!features || Object.keys(features).length === 0) return null

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-gray-700"
      >
        <span>🔍 Détail des indicateurs utilisés (traçabilité ISO 9001 §7.5)</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="divide-y divide-gray-100">
          {Object.entries(features).map(([key, value]) => {
            const pct = Math.min(Math.round(
              (key === 'nb_risks_open' ? Math.min(value / 8, 1) : value) * 100
            ), 100)
            const barColor = getBarColor(key, value)

            return (
              <div key={key} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-medium text-gray-800">
                      {FEATURE_LABELS[key] || key}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {FEATURE_ISO[key]}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-gray-600">{value}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${barColor} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AIFeaturesDetail