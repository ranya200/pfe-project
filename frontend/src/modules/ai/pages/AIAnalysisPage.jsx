import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAIAnalysis } from '../hooks/useAIAnalysis'
import RiskLevelBadge from '../components/RiskLevelBadge'
import AIFeaturesDetail from '../components/AIFeaturesDetail'

const SEVERITY_CONFIG = {
  critical: {
    bg:     'bg-red-50',
    border: 'border-red-200',
    title:  'text-red-800',
    detail: 'text-red-700',
    iso:    'text-red-400',
    badge:  'bg-red-100 text-red-700',
    icon:   '🔴',
    label:  'Critique',
  },
  warning: {
    bg:     'bg-orange-50',
    border: 'border-orange-200',
    title:  'text-orange-800',
    detail: 'text-orange-700',
    iso:    'text-orange-400',
    badge:  'bg-orange-100 text-orange-700',
    icon:   '🟡',
    label:  'Avertissement',
  },
  info: {
    bg:     'bg-blue-50',
    border: 'border-blue-200',
    title:  'text-blue-800',
    detail: 'text-blue-700',
    iso:    'text-blue-400',
    badge:  'bg-blue-100 text-blue-700',
    icon:   'ℹ️',
    label:  'Info',
  },
}

const AlertCard = ({ alert, onAcknowledge }) => {
  const c = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info

  return (
    <div className={`rounded-lg border p-4 ${c.bg} ${c.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {/* Badge sévérité + titre */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
              {c.icon} {c.label}
            </span>
            <span className={`text-sm font-semibold ${c.title}`}>
              {alert.title}
            </span>
          </div>

          {/* Détail */}
          <p className={`text-sm mt-1 ${c.detail}`}>
            {alert.detail}
          </p>

          {/* Clause ISO */}
          <p className={`text-xs mt-2 font-mono ${c.iso}`}>
            📋 {alert.iso_clause}
          </p>
        </div>

        {/* Bouton acquitter */}
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-gray-300
            bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition font-medium"
        >
          ✓ Acquitter
        </button>
      </div>
    </div>
  )
}

const AIAnalysisPage = () => {
  const { projectId } = useParams()
  const navigate      = useNavigate()
  const {
    result, history, alerts,
    loading, analyzing, error,
    fetchResult, fetchHistory, fetchAlerts,
    runAnalysis, ackAlert,
  } = useAIAnalysis(projectId)

  useEffect(() => {
    fetchResult()
    fetchHistory()
    fetchAlerts()
  }, [fetchResult, fetchHistory, fetchAlerts])

  const criticalAlerts = alerts.filter(a => a.severity === 'critical')
  const warningAlerts  = alerts.filter(a => a.severity === 'warning')
  const infoAlerts     = alerts.filter(a => a.severity === 'info')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── Retour ── */}
      <button
        onClick={() => navigate(`/projects/${projectId}`)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition mb-4"
      >
        ← Retour au projet
      </button>

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            🤖 Analyse IA — Détection de Risques
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Modèle Random Forest · Conforme ISO 9001 §6.1
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium transition
            ${analyzing ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {analyzing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Analyse en cours...
            </>
          ) : '⚡ Lancer l\'analyse'}
        </button>
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Chargement ── */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Chargement...
        </div>
      )}

      {/* ── Résultat principal ── */}
      {!loading && result && result.status === 'completed' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Niveau de risque détecté</p>
              <RiskLevelBadge
                level={result.risk_level}
                score={result.risk_score}
                size="lg"
              />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Dernière analyse</p>
              <p className="text-sm text-gray-600">
                {new Date(result.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Verdict */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-500 text-lg">💡</span>
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">Verdict du policier IA</p>
                <p className="text-sm text-blue-700 whitespace-pre-line">{result.recommendation}</p>
                <p className="text-xs text-blue-400 mt-2">Référence : {result.iso_clause}</p>
              </div>
            </div>
          </div>

          <AIFeaturesDetail features={result.features_used} />
        </div>
      )}

      {/* ── Section Alertes ── */}
      {!loading && alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              🚨 Alertes actives
            </h2>
            <div className="flex gap-2">
              {criticalAlerts.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
                  {criticalAlerts.length} critique{criticalAlerts.length > 1 ? 's' : ''}
                </span>
              )}
              {warningAlerts.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">
                  {warningAlerts.length} avertissement{warningAlerts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {/* Critiques en premier */}
            {criticalAlerts.map(a => (
              <AlertCard key={a.id} alert={a} onAcknowledge={ackAlert} />
            ))}
            {warningAlerts.map(a => (
              <AlertCard key={a.id} alert={a} onAcknowledge={ackAlert} />
            ))}
            {infoAlerts.map(a => (
              <AlertCard key={a.id} alert={a} onAcknowledge={ackAlert} />
            ))}
          </div>
        </div>
      )}

      {/* Aucune alerte = projet sain */}
      {!loading && result?.status === 'completed' && alerts.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-green-800 font-medium">Aucune alerte active</p>
          <p className="text-sm text-green-600 mt-1">
            Le projet respecte tous les seuils de conformité ISO
          </p>
        </div>
      )}

      {/* ── Pas encore d'analyse ── */}
      {!loading && !result && !analyzing && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-gray-600 font-medium mb-2">
            Aucune analyse disponible pour ce projet
          </p>
          <p className="text-sm text-gray-400">
            Cliquez sur "Lancer l'analyse" pour détecter les risques via l'IA
          </p>
        </div>
      )}

      {/* ── Historique ── */}
      {history.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            📋 Historique des analyses
          </h2>
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.result_id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <RiskLevelBadge level={h.risk_level} score={h.risk_score} />
                <span className="text-xs text-gray-400">
                  {new Date(h.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default AIAnalysisPage