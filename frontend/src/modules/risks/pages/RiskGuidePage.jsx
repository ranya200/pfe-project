import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { bulkFromGuide } from '../api/risks.api'

// ── Questions du guide, groupées par processus ─────────────────────────────
const GUIDE_QUESTIONS = [
  // Relations Clients
  { id: 'rc1', process: 'Relations Clients', title: 'Risque de mauvaise compréhension des besoins client', causes: 'Ambiguïté dans les exigences, manque de communication', consequences: 'Non-conformité des livrables, pénalités contractuelles' },
  { id: 'rc2', process: 'Relations Clients', title: 'Risque de changement fréquent des exigences client', causes: 'Client indécis, évolution du marché', consequences: 'Dépassement de délai, surcoût, démotivation des équipes' },
  { id: 'rc3', process: 'Relations Clients', title: 'Risque de conflit ou mésentente avec le client', causes: 'Attentes non alignées, manque de suivi', consequences: 'Résiliation du contrat, perte de confiance' },
  { id: 'rc4', process: 'Relations Clients', title: 'Risque de retard dans la validation des livrables par le client', causes: 'Indisponibilité du client, processus de validation lents', consequences: 'Blocage du projet, glissement du planning' },
  { id: 'rc5', process: 'Relations Clients', title: 'Risque de non-paiement ou litige financier', causes: 'Désaccord sur la facturation, insatisfaction client', consequences: 'Impact sur la trésorerie, procédure judiciaire' },
  // Ressources
  { id: 'rs1', process: 'Ressources', title: 'Risque de manque de compétences techniques dans l\'équipe', causes: 'Recrutement inadapté, nouvelles technologies', consequences: 'Qualité insuffisante, retards, erreurs techniques' },
  { id: 'rs2', process: 'Ressources', title: 'Risque de turnover élevé sur le projet', causes: 'Démission, maladie, mutation', consequences: 'Perte de savoir-faire, surcharge des autres membres' },
  { id: 'rs3', process: 'Ressources', title: 'Risque de sous-effectif ou indisponibilité des ressources', causes: 'Simultanéité de projets, absences imprévues', consequences: 'Délais non tenus, qualité dégradée' },
  { id: 'rs4', process: 'Ressources', title: 'Risque d\'inadéquation des équipements ou infrastructures', causes: 'Matériel obsolète, licences manquantes', consequences: 'Ralentissement du travail, pannes répétées' },
  { id: 'rs5', process: 'Ressources', title: 'Risque de dépassement budgétaire lié aux ressources', causes: 'Estimation initiale incorrecte, dépenses imprévues', consequences: 'Réduction de marge, arbitrages difficiles' },
  // Planification
  { id: 'pl1', process: 'Planification', title: 'Risque de planning irréaliste ou mal estimé', causes: 'Pression client, sous-estimation des tâches', consequences: 'Retards en cascade, stress de l\'équipe' },
  { id: 'pl2', process: 'Planification', title: 'Risque de dépendances inter-projets non maîtrisées', causes: 'Partage de ressources, jalons partagés', consequences: 'Blocage, retard propagé' },
  { id: 'pl3', process: 'Planification', title: 'Risque d\'absence de jalons de contrôle intermédiaires', causes: 'Planning trop global, manque de suivi', consequences: 'Dérive non détectée, corrections tardives et coûteuses' },
  { id: 'pl4', process: 'Planification', title: 'Risque de non-respect des priorités définies', causes: 'Urgences non anticipées, mauvaise gouvernance', consequences: 'Livrables critiques retardés' },
  // Technique
  { id: 'tc1', process: 'Technique', title: 'Risque d\'intégration difficile entre composants', causes: 'Interfaces mal définies, incompatibilités techniques', consequences: 'Bugs critiques, retests coûteux' },
  { id: 'tc2', process: 'Technique', title: 'Risque de performance insuffisante du système', causes: 'Architecture sous-dimensionnée, charge mal estimée', consequences: 'Instabilité en production, insatisfaction client' },
  { id: 'tc3', process: 'Technique', title: 'Risque lié à l\'adoption d\'une nouvelle technologie', causes: 'Choix technologique sans maturité suffisante', consequences: 'Courbe d\'apprentissage longue, bugs non documentés' },
  { id: 'tc4', process: 'Technique', title: 'Risque de dette technique accumulée', causes: 'Développement rapide sans refactoring', consequences: 'Maintenance difficile, régressions fréquentes' },
  { id: 'tc5', process: 'Technique', title: 'Risque de non-validité des tests ou couverture insuffisante', causes: 'Manque de temps, tests incomplets', consequences: 'Défauts en production, coût de correction élevé' },
  // Documentation
  { id: 'dc1', process: 'Documentation', title: 'Risque de documentation incomplète ou obsolète', causes: 'Manque de temps, priorité donnée au code', consequences: 'Difficultés de maintenance, onboarding lent' },
  { id: 'dc2', process: 'Documentation', title: 'Risque d\'erreurs ou incohérences dans les spécifications', causes: 'Rédaction précipitée, manque de relecture', consequences: 'Développements non conformes, retravail' },
  { id: 'dc3', process: 'Documentation', title: 'Risque de mauvaise gestion des versions de documents', causes: 'Absence de GED, processus informels', consequences: 'Utilisation de versions erronées, non-conformité ISO' },
  // Réglementaire
  { id: 'rg1', process: 'Réglementaire', title: 'Risque de non-conformité à la réglementation en vigueur', causes: 'Évolution des lois, méconnaissance des exigences', consequences: 'Sanctions légales, perte de certification' },
  { id: 'rg2', process: 'Réglementaire', title: 'Risque de non-respect des normes ISO 9001/27001', causes: 'Processus non appliqués, manque de formation', consequences: 'Échec d\'audit, retrait de certification' },
  { id: 'rg3', process: 'Réglementaire', title: 'Risque de litige contractuel ou légal', causes: 'Clauses ambiguës, non-respect des engagements', consequences: 'Poursuites judiciaires, pénalités financières' },
  // Sécurité
  { id: 'sc1', process: 'Sécurité', title: 'Risque de fuite ou vol de données sensibles', causes: 'Accès non autorisés, absence de chiffrement', consequences: 'Perte de confidentialité, sanctions RGPD' },
  { id: 'sc2', process: 'Sécurité', title: 'Risque de cyberattaque ou intrusion', causes: 'Vulnérabilités non corrigées, phishing', consequences: 'Interruption de service, perte de données' },
  { id: 'sc3', process: 'Sécurité', title: 'Risque de défaillance du système de sauvegarde', causes: 'Sauvegardes non testées, infrastructure défaillante', consequences: 'Perte irréversible de données critiques' },
  { id: 'sc4', process: 'Sécurité', title: 'Risque d\'accès non autorisé aux systèmes', causes: 'Gestion des droits insuffisante, mots de passe faibles', consequences: 'Compromission des systèmes, violation des données' },
  // Qualité
  { id: 'ql1', process: 'Qualité', title: 'Risque de non-conformité des livrables aux critères qualité', causes: 'Revues insuffisantes, critères mal définis', consequences: 'Rejets client, reprises coûteuses' },
  { id: 'ql2', process: 'Qualité', title: 'Risque de réclamations ou retours client fréquents', causes: 'Qualité insuffisante, communication défaillante', consequences: 'Atteinte à la réputation, coûts de SAV' },
  { id: 'ql3', process: 'Qualité', title: 'Risque de défaut de suivi des indicateurs qualité', causes: 'Tableau de bord absent, données non fiables', consequences: 'Dérive non détectée, non-conformité ISO 9001' },
  { id: 'ql4', process: 'Qualité', title: 'Risque de manque de formation qualité des équipes', causes: 'Budget formation réduit, turnover', consequences: 'Erreurs récurrentes, résistance au changement' },
]

const PROCESS_COLORS = {
  'Relations Clients': '#2563EB',
  'Ressources':        '#7C3AED',
  'Planification':     '#0891B2',
  'Technique':         '#D97706',
  'Documentation':     '#059669',
  'Réglementaire':     '#DC2626',
  'Sécurité':          '#DB2777',
  'Qualité':           '#6D28D9',
}

export default function RiskGuidePage() {
  const { id: projectId } = useParams()
  const navigate = useNavigate()

  const [answers, setAnswers]         = useState({})   // { questionId: 'oui'|'non' }
  const [expanded, setExpanded]       = useState({})   // { process: bool }
  const [submitting, setSubmitting]   = useState(false)
  const [success, setSuccess]         = useState(null)
  const [error, setError]             = useState(null)

  // Group questions by process
  const byProcess = GUIDE_QUESTIONS.reduce((acc, q) => {
    if (!acc[q.process]) acc[q.process] = []
    acc[q.process].push(q)
    return acc
  }, {})

  const processes = Object.keys(byProcess)

  const answered    = Object.keys(answers).length
  const ouiCount    = Object.values(answers).filter(v => v === 'oui').length
  const totalQ      = GUIDE_QUESTIONS.length
  const progress    = Math.round((answered / totalQ) * 100)

  const toggle = (qId, val) =>
    setAnswers(prev => ({ ...prev, [qId]: prev[qId] === val ? undefined : val }))

  const toggleSection = (proc) =>
    setExpanded(prev => ({ ...prev, [proc]: !prev[proc] }))

  const handleSubmit = async () => {
    const selected = GUIDE_QUESTIONS.filter(q => answers[q.id] === 'oui')
    if (selected.length === 0) {
      setError('Veuillez répondre "Oui" à au moins une question.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await bulkFromGuide({
        project: Number(projectId),
        risks: selected.map(q => ({
          process: q.process,
          title: q.title,
          causes: q.causes,
          consequences: q.consequences,
          activity: 'SI',
          risk_type: 'Interne',
          origin: 'Telnet',
        })),
      })
      setSuccess(result.created)
      setTimeout(() => navigate(`/projects/${projectId}/risks`), 2000)
    } catch (e) {
      setError('Une erreur est survenue lors de la création des risques.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(`/projects/${projectId}/risks`)}
            className="text-sm text-slate-500 hover:text-[#2563EB] mb-1 flex items-center gap-1"
          >
            ← Retour à la cartographie
          </button>
          <h1 className="text-2xl font-bold text-[#0F2744]">🧭 Guide des risques</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Répondez aux questions ci-dessous. Chaque réponse <strong>"Oui"</strong> génère automatiquement une fiche de risque pré-remplie.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-[#2563EB]">{ouiCount}</div>
          <div className="text-xs text-slate-500">risque(s) identifié(s)</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white px-6 py-3 border-b border-slate-100">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{answered} / {totalQ} questions répondues</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-[#2563EB] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Success banner */}
      {success !== null && (
        <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <div className="font-semibold text-green-800">{success} risque(s) créé(s) avec succès !</div>
            <div className="text-sm text-green-600">Redirection vers la cartographie…</div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Accordion sections */}
      <div className="px-6 pt-6 space-y-3">
        {processes.map((proc) => {
          const questions = byProcess[proc]
          const color = PROCESS_COLORS[proc] || '#2563EB'
          const isOpen = expanded[proc] ?? true
          const procOui = questions.filter(q => answers[q.id] === 'oui').length
          const procAns = questions.filter(q => answers[q.id]).length

          return (
            <div key={proc} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Section header */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                onClick={() => toggleSection(proc)}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="font-semibold text-[#0F2744]">{proc}</span>
                  {procOui > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5 font-medium">
                      {procOui} risque(s)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span>{procAns}/{questions.length}</span>
                  <span>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Questions */}
              {isOpen && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="px-5 py-3 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="text-xs text-slate-400 mr-2">{idx + 1}.</span>
                        <span className="text-sm text-slate-700">{q.title}</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => toggle(q.id, 'oui')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            answers[q.id] === 'oui'
                              ? 'bg-red-500 text-white border-red-500'
                              : 'bg-white text-slate-500 border-slate-300 hover:border-red-400 hover:text-red-500'
                          }`}
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => toggle(q.id, 'non')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            answers[q.id] === 'non'
                              ? 'bg-green-500 text-white border-green-500'
                              : 'bg-white text-slate-500 border-slate-300 hover:border-green-400 hover:text-green-500'
                          }`}
                        >
                          Non
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between z-50">
        <div className="text-sm text-slate-600">
          <span className="font-semibold text-[#0F2744]">{ouiCount}</span> risque(s) seront créés •{' '}
          <span className="text-slate-400">{answered}/{totalQ} questions répondues</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/projects/${projectId}/risks`)}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || ouiCount === 0}
            className="px-5 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Création…' : `Créer ${ouiCount} risque(s)`}
          </button>
        </div>
      </div>
    </div>
  )
}

