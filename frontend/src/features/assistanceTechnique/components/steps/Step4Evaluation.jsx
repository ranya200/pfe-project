import { useState, useEffect, useCallback, useRef } from 'react'
import ATWorkflowStepper from '../ATWorkflowStepper'
import { exportStep4PDF } from '../../utils/atPdfExport'
import { uploadATAttachment } from '../../api/assistanceTechniqueApi'

// ── Constants ─────────────────────────────────────────────────────────────────
const INPUT    = 'border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400'
const TEXTAREA = INPUT + ' resize-none'
const REPONSE_OPTS = ['Oui', 'Non', 'Partiel', 'N/A']

const SCORE_MAP = { 1: 0.2, 2: 0.3, 3: 0.8, 4: 1.0 }

const LEVEL_STYLE = {
  1: { bg: 'bg-red-100',    text: 'text-red-800',    badge: 'bg-red-500 text-white'    },
  2: { bg: 'bg-yellow-100', text: 'text-yellow-900', badge: 'bg-yellow-400 text-white' },
  3: { bg: 'bg-lime-100',   text: 'text-lime-900',   badge: 'bg-lime-500 text-white'   },
  4: { bg: 'bg-green-100',  text: 'text-green-900',  badge: 'bg-green-600 text-white'  },
}

const CATEGORIE_LABELS = {
  organisation_processus:   'Organisation / Processus',
  taches:                   'Tâches',
  moyens:                   'Moyens',
  comportement_competences: 'Comportement et compétences',
  securite_information:     "Sécurité de l'information",
}

const CRITERE_SATISFACTIONS = [
  { 1: "1- L'offre ne répond pas aux attentes", 2: "2- L'offre répond partiellement aux attentes", 3: "3- L'offre répond exactement aux attentes", 4: "4- L'offre excède les attentes" },
  { 1: "1- Les processus applicables ne sont pas connus par toute l'équipe", 2: "2- Les processus applicables sont connus mais partiellement appliqués par l'équipe", 3: "3- Les processus applicables sont connus et appliqués", 4: "4- Les processus applicables sont connus et parfaitement appliqués et des axes d'amélioration sont proposés" },
  { 1: "1- Des décalages importants dans la soumission des tâches sont observés (>12%)", 2: "2- Des décalages dans la soumission des tâches sont observés (<12%) et ayant un impact chez le client", 3: "3- Des décalages dans la soumission des tâches sont observés (<12%) et n'ayant pas d'impact chez le client", 4: "4- Les délais de soumission des tâches sont respectés" },
  { 1: "1- Les tâches soumises ne sont pas exploitables dans l'état", 2: "2- Les tâches soumises sont exploitables mais elles présentent quelques problèmes majeurs", 3: "3- Les tâches soumises sont exploitables mais elles présentent quelques problèmes mineurs", 4: "4- Les tâches soumises sont parfaites" },
  { 1: "1- Les outils utilisés ne sont pas maîtrisés par l'équipe", 2: "2- Les outils utilisés sont moyennement maîtrisés", 3: "3- Les outils utilisés sont globalement maîtrisés avec un support minimal du client", 4: "4- Les outils utilisés sont parfaitement maîtrisés. Aucun support n'est nécessaire" },
  { 1: "1- Les compétences disponibles ne sont pas conformes aux compétences requises", 2: "2- Les compétences disponibles sont proches des compétences requises et doivent être améliorées", 3: "3- Les compétences disponibles sont parfaitement conformes aux compétences requises mais un support ponctuel est nécessaire", 4: "4- Les compétences disponibles sont parfaitement conformes aux compétences requises. Aucun support n'est nécessaire" },
  { 1: "1- Les communications avec l'équipe sont presque absentes", 2: "2- Les communications avec l'équipe existent mais d'une façon irrégulière", 3: "3- Les communications avec l'équipe existent d'une façon régulière", 4: "4- Les communications avec l'équipe sont faciles, fréquentes, régulières et profitables" },
  { 1: "1- Les questions/demandes restent souvent sans réponse. Des relances sont nécessaires pour obtenir des réponses", 2: "2- Les questions/demandes sont prises en charge lentement mais sans relance", 3: "3- Les questions/demandes sont prises en charge dans un délai raisonnable", 4: "4- Les questions/demandes sont prises en charge rapidement" },
  { 1: "1- Un support permanent a été nécessaire pour permettre à l'équipe de réaliser les travaux", 2: "2- Un support raisonnable a été nécessaire pour permettre à l'équipe de réaliser les travaux", 3: "3- L'équipe est autonome sur plusieurs aspects", 4: "4- L'équipe est complètement autonome" },
  { 1: "1- Un ou plusieurs incidents relatifs à la sécurité de l'information ont été reportés. Aucun plan de traitement", 2: "2- Un ou plusieurs incidents relatifs à la sécurité de l'information ont été reportés. Plan de traitement entrepris", 3: "3- Aucun incident relatif à la sécurité de l'information n'a été reporté, mais des mesures de sécurité insuffisantes ou absentes", 4: "4- Aucun incident relatif à la sécurité de l'information n'a été reporté. Des mesures de sécurité sont en place" },
]

const BILAN_COMPETENCES_QUESTIONS = [
  'Lien de la matrice des compétences',
  "Est-ce qu'il y a des nouvelles compétences et/ou connaissances qui ont été acquises par les ressources du projet?",
  "Est-ce qu'il y a des enregistrements à mettre à jour? (CV, Fiche Fonction,…)",
  "Est-ce qu'il y a des formations à planifier?",
  "Est-ce qu'il y a une nécessité de recrutement?",
]

const BILAN_METHODES_QUESTIONS = [
  "Est-ce que les procédures client appliquées sont bien maîtrisées?",
  "Est-ce que les procédures internes appliquées ont satisfait les besoins et les spécificités de la prestation?",
  "Est-ce que les outils client de développement et/ou de validation utilisés sont bien maîtrisés?",
  "Est-ce que les outils client de gestion de projet (gestion de configuration, gestion des exigences, gestion des bugs….) utilisés sont bien maîtrisés?",
  "Est-ce que les outils internes utilisés pour la réalisation de la prestation et la gestion du projet ont été efficaces?",
  "Est-ce que l'utilisation du matériel et des équipements client est maîtrisée?",
  "Est-ce que les moyens de communication mis en place ont été efficaces?",
  "Est-ce qu'il y a des matériels ou des équipements à vérifier?",
  "Est-ce qu'il y a une nécessité d'ajouter des outils?",
  "Est-ce qu'il y a des procédures à mettre à jour?",
]

const ACTION_TYPES = ['Corrective', 'preventive', 'Améliorative']

const TYPE_BADGE = {
  Corrective:   'bg-red-100 text-red-700 border-red-300',
  preventive:   'bg-amber-100 text-amber-700 border-amber-300',
  Améliorative: 'bg-blue-100 text-blue-700 border-blue-300',
}

const TABS = [
  { id: 'enquete', label: '📊 Enquête satisfaction' },
  { id: 'bilan',   label: '📋 Bilan de prestation'  },
]

// ── FIX BUG 2 : mapping API → valeurs UI du select ───────────────────────────
const TYPE_API_TO_UI = {
  'corrective':   'Corrective',
  'preventive':   'preventive',
  'amelioration': 'Améliorative',
  // cas où la valeur UI est déjà stockée telle quelle
  'Corrective':   'Corrective',
  'Améliorative': 'Améliorative',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Section({ title, children, info }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h3>
      {info && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4 text-xs text-blue-700">{info}</div>
      )}
      {children}
    </div>
  )
}

function SatisfactionSelector({ value, critereIndex, onChange }) {
  const current = value ? Number(value) : null
  const style   = current ? LEVEL_STYLE[current] : null
  const desc    = current ? (CRITERE_SATISFACTIONS[critereIndex]?.[current] ?? `Niveau ${current}`) : null

  const up   = () => onChange(current ? Math.min(current + 1, 4) : 1)
  const down = () => onChange(current ? Math.max(current - 1, 1) : 1)

  return (
    <div className="flex items-stretch gap-0 min-w-[260px]">
      <div className={`flex-1 px-3 py-2 text-xs font-semibold rounded-l-md border border-r-0 border-gray-200 flex items-center min-h-[48px]
        ${style ? `${style.bg} ${style.text} border-transparent` : 'bg-gray-50 text-gray-400 italic'}`}>
        {desc || 'Sélectionner un niveau…'}
      </div>
      {current && (
        <div className={`flex items-center justify-center w-8 text-sm font-black border-y border-gray-200
          ${style ? `${style.badge}` : 'bg-gray-100 text-gray-500'}`}>
          {current}
        </div>
      )}
      <div className="flex flex-col border border-gray-200 rounded-r-md overflow-hidden">
        <button type="button" onClick={up} disabled={current === 4}
          className="flex-1 px-2 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed border-b border-gray-200 flex items-center justify-center transition-colors"
          title="Augmenter le niveau">
          <svg width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M5 0L10 7H0L5 0Z" fill="#374151"/></svg>
        </button>
        <button type="button" onClick={down} disabled={current === 1}
          className="flex-1 px-2 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          title="Diminuer le niveau">
          <svg width="10" height="7" viewBox="0 0 10 7" fill="none"><path d="M5 7L0 0H10L5 7Z" fill="#374151"/></svg>
        </button>
      </div>
    </div>
  )
}

function RadarChart({ criteres, projectName }) {
  const points = criteres || []
  const n = points.length
  if (n < 3) return <p className="text-xs text-gray-400 italic">Besoin d'au moins 3 critères pour générer le radar graphique.</p>

  const W = 650, H = 650, cx = 325, cy = 325, maxR = 150, levels = 4
  const angle = (i, total) => (i * 2 * Math.PI) / total - Math.PI / 2
  const coordAt = (i, r, cX, cY, total) => {
    const a = angle(i, total)
    return { x: cX + r * Math.cos(a), y: cY + r * Math.sin(a) }
  }
  const wrapLabel = (str, maxLen = 14) => {
    if (!str) return []
    const words = str.split(' ')
    const lines = []
    let curr = ''
    words.forEach(w => {
      if ((curr + ' ' + w).trim().length > maxLen) { if (curr) lines.push(curr); curr = w }
      else { curr = curr ? curr + ' ' + w : w }
    })
    if (curr) lines.push(curr)
    return lines
  }

  const dataPoly = points
    .map((c, i) => {
      const sat = c.satisfaction ? Number(c.satisfaction) : 0
      if (sat === 0) return null
      const r = (sat / 4) * maxR
      const { x, y } = coordAt(i, r, cx, cy, n)
      return `${x},${y}`
    })
    .filter(Boolean).join(' ')

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50/50 rounded-xl p-4 border border-gray-100 w-full overflow-x-auto">
      {projectName && <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wide">Radar : {projectName}</h4>}
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible" style={{ maxWidth: '600px', height: 'auto' }}>
        {Array.from({ length: levels }, (_, i) => {
          const r = (maxR * (i + 1)) / levels
          const pointsStr = Array.from({ length: n }, (_, j) => {
            const { x, y } = coordAt(j, r, cx, cy, n); return `${x},${y}`
          }).join(' ')
          return <polygon key={i} points={pointsStr} fill={i % 2 === 0 ? 'rgba(241,245,249,0.4)' : 'none'} stroke="#e2e8f0" strokeWidth="1" />
        })}
        {Array.from({ length: n }, (_, i) => {
          const { x, y } = coordAt(i, maxR + 8, cx, cy, n)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4,4" />
        })}
        {Array.from({ length: levels }, (_, i) => {
          const r = (maxR * (i + 1)) / levels
          const { x, y } = coordAt(0, r, cx, cy, n)
          return <text key={i} x={x + 6} y={y + 4} fontSize="10" fill="#94a3b8" fontWeight="600">{i + 1}</text>
        })}
        {points.some(c => c.satisfaction > 0) && (
          <>
            <polygon points={dataPoly} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />
            {points.map((c, i) => {
              if (!c.satisfaction || c.satisfaction === 0) return null
              const sat = Number(c.satisfaction)
              const r = (sat / 4) * maxR
              const { x, y } = coordAt(i, r, cx, cy, n)
              const colors = { 1: '#ef4444', 2: '#eab308', 3: '#84cc16', 4: '#22c55e' }
              return <circle key={i} cx={x} cy={y} r={5} fill={colors[sat] || '#3b82f6'} stroke="white" strokeWidth="2" />
            })}
          </>
        )}
        {points.map((c, i) => {
          const rad = angle(i, n)
          const labelR = maxR + 35
          const { x, y } = coordAt(i, labelR, cx, cy, n)
          const lines = wrapLabel(c.critere, 15)
          const lineH = 13
          let anchor = 'middle', offsetX = 0, offsetY = 0
          const cosA = Math.cos(rad), sinA = Math.sin(rad)
          if (cosA > 0.3) { anchor = 'start'; offsetX = 10 }
          else if (cosA < -0.3) { anchor = 'end'; offsetX = -10 }
          if (sinA > 0.8) offsetY = 10
          else if (sinA < -0.8) offsetY = -(lines.length * lineH)
          else offsetY = -((lines.length * lineH) / 2) + 4
          return (
            <g key={i}>
              <line x1={coordAt(i, maxR + 6, cx, cy, n).x} y1={coordAt(i, maxR + 6, cx, cy, n).y}
                x2={coordAt(i, maxR + 22, cx, cy, n).x} y2={coordAt(i, maxR + 22, cx, cy, n).y}
                stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2,2" />
              <text textAnchor={anchor} fontSize="11" fill="#334155" fontWeight="500">
                {lines.map((l, li) => (
                  <tspan key={li} x={x + offsetX} y={y + offsetY + (li * lineH)}>{l}</tspan>
                ))}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function EnqueteTab({ form, onChange, at }) {
  const criteres = form.criteres || []

  const updateCritere = (globalIdx, field, val) => {
    const arr = criteres.map((c, i) => i === globalIdx ? { ...c, [field]: val } : c)
    onChange('criteres', arr)
  }

  const updateSatisfaction = (globalIdx, satVal) => {
    const arr = criteres.map((c, i) =>
      i === globalIdx ? { ...c, satisfaction: satVal, score: SCORE_MAP[satVal] ?? 0 } : c
    )
    onChange('criteres', arr)
  }

  const filledCriteres = criteres.filter(c => c.satisfaction && [1,2,3,4].includes(Number(c.satisfaction)))
  const scores      = filledCriteres.map(c => SCORE_MAP[Number(c.satisfaction)])
  const indice      = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const indicePct   = Math.round(indice * 100)
  const indiceColor = indicePct >= 80 ? 'text-green-600' : indicePct >= 50 ? 'text-amber-600' : 'text-red-600'
  const indiceBg    = indicePct >= 80 ? 'bg-green-50 border-green-200' : indicePct >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  const grouped = criteres.reduce((acc, c, idx) => {
    const cat = c.categorie || 'autre'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push({ ...c, _idx: idx })
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700 italic text-center font-medium">
        Nous vous remercions d'avance de l'intérêt que vous portez à cette enquête, ceci contribuera à l'amélioration de nos services
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'nom_projet_eval', label: 'Nom du projet', req: true },
          { key: 'date_eval',       label: 'Date', type: 'date' },
        ].map(({ key, label, req, type }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {label}{req && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input type={type || 'text'} className={INPUT}
              value={form[key] || ''} required={req}
              onChange={e => onChange(key, e.target.value)} placeholder={label} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-gray-500">Scores :</span>
        {[1,2,3,4].map(v => {
          const s = LEVEL_STYLE[v]
          return (
            <span key={v} className={`text-xs px-2 py-1 rounded-full font-semibold ${s.badge}`}>
              Niv. {v} → {SCORE_MAP[v]}
            </span>
          )
        })}
      </div>

      {/* Évaluation client — document importé (optionnel) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Évaluation client</h4>
        <p className="text-xs text-gray-500 mb-3">
          Importer le document d'évaluation rempli par le client (enquête de satisfaction signée, retour formel…).
        </p>
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={e => { const file = e.target.files?.[0]; if (file) onChange('document_evaluation_client', file) }}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-white file:text-blue-700 hover:file:bg-blue-50 cursor-pointer" />

        {form.document_evaluation_client_url && !(form.document_evaluation_client instanceof File) && (
          <p className="mt-2 text-xs text-blue-700 font-medium">
            📎 Document déjà importé :{' '}
            <a href={form.document_evaluation_client_url} target="_blank" rel="noreferrer" className="underline hover:text-blue-900">
              Voir le document
            </a>
          </p>
        )}
        {form.document_evaluation_client instanceof File && (
          <p className="mt-2 text-xs text-green-700 font-medium">
            ✅ Nouveau document sélectionné : {form.document_evaluation_client.name}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th colSpan={6} className="px-4 py-2 text-center text-xs font-bold text-blue-700 bg-blue-50 border-b border-blue-100">
                CRITÈRES D'ÉVALUATION
              </th>
            </tr>
            <tr className="bg-blue-700 text-white">
              <th className="px-3 py-3 text-left text-xs font-bold border-r border-blue-600 w-36">CATÉGORIES</th>
              <th className="px-2 py-3 text-center text-xs font-bold border-r border-blue-600 w-8">N°</th>
              <th className="px-3 py-3 text-left text-xs font-bold border-r border-blue-600 w-44">DESCRIPTION</th>
              <th className="px-3 py-3 text-center text-xs font-bold border-r border-blue-600">SATISFACTION</th>
              <th className="px-3 py-3 text-center text-xs font-bold border-r border-blue-600 w-16">SCORE</th>
              <th className="px-3 py-3 text-left text-xs font-bold w-36">COMMENTAIRES</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([cat, items]) =>
              items.map((c, catIdx) => {
                const globalIdx = c._idx
                const sat       = c.satisfaction ? Number(c.satisfaction) : null
                const style     = sat ? LEVEL_STYLE[sat] : null
                const score     = sat ? SCORE_MAP[sat] : null
                return (
                  <tr key={globalIdx} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                    {catIdx === 0 && (
                      <td rowSpan={items.length} className="px-3 py-2 border-r border-gray-200 align-middle text-center bg-blue-50">
                        <span className="text-xs font-bold text-blue-700 italic leading-tight">
                          {CATEGORIE_LABELS[cat] || cat}
                        </span>
                      </td>
                    )}
                    <td className="px-2 py-3 text-center text-xs font-bold text-blue-700 border-r border-gray-100">{c.numero}</td>
                    <td className="px-3 py-3 border-r border-gray-100 text-xs font-semibold text-blue-800">{c.critere}</td>
                    <td className={`px-3 py-2 border-r border-gray-100 ${style ? style.bg : ''}`}>
                      <SatisfactionSelector value={sat} critereIndex={globalIdx} onChange={(v) => updateSatisfaction(globalIdx, v)} />
                    </td>
                    <td className={`px-3 py-3 text-center border-r border-gray-100 ${style ? style.bg : ''}`}>
                      {score !== null
                        ? <span className={`text-sm font-black ${style?.text ?? 'text-gray-700'}`}>{score.toFixed(1)}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-2 py-2">
                      <textarea value={c.commentaire || ''} onChange={e => updateCritere(globalIdx, 'commentaire', e.target.value)}
                        placeholder="Commentaire…" rows={2}
                        className="border border-gray-200 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={`flex items-center justify-between px-6 py-4 rounded-xl border-2 shadow-sm ${indiceBg}`}>
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Indice de satisfaction global</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {scores.length} / {criteres.length} critère(s) renseigné(s)
          </p>
        </div>
        <div className="text-right">
          <span className={`text-4xl font-black ${indiceColor}`}>
            {scores.length > 0 ? `${indicePct}%` : '—'}
          </span>
          {scores.length > 0 && (
            <p className={`text-xs font-semibold mt-0.5 ${indiceColor}`}>{indice.toFixed(2)} / 1.0</p>
          )}
        </div>
      </div>

      {scores.length > 0 && indicePct < 90 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <label className="block text-sm font-semibold text-amber-800 mb-2">
            ⚠️ Indice &lt; 90% — Fichier plan d'action <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-amber-600 mb-3">
            L'indice de satisfaction est inférieur à 90%. Veuillez joindre un plan d'action correctif.
          </p>
          <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={e => { const file = e.target.files?.[0]; if (file) onChange('plan_action_file', file) }}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-amber-300 file:text-sm file:font-semibold file:bg-white file:text-amber-700 hover:file:bg-amber-50 cursor-pointer" />

          {/* ✅ FIX BUG 1 — typeof null === 'object' en JS, on utilise instanceof File */}
          {form.plan_action_file_url && !(form.plan_action_file instanceof File) && (
            <p className="mt-2 text-xs text-blue-700 font-medium">
              📎 Fichier déjà joint :{' '}
              <a href={form.plan_action_file_url} target="_blank" rel="noreferrer" className="underline hover:text-blue-900">
                Voir le fichier
              </a>
            </p>
          )}
          {form.plan_action_file instanceof File && (
            <p className="mt-2 text-xs text-green-700 font-medium">
              ✅ Nouveau fichier sélectionné : {form.plan_action_file.name}
            </p>
          )}
        </div>
      )}

      {criteres.some(c => c.satisfaction) && (
        <Section title="📈 Présentation graphique — Radar de satisfaction">
          <RadarChart
            criteres={criteres}
            projectName={form.nom_projet_eval || at?.step1?.nom_projet || at?.project_nom || ''}
          />
        </Section>
      )}
    </div>
  )
}

function ActionsBilanInline({ actions = [], onChange, members = [] }) {
  const nextId = () => {
    const nums = actions
      .map(a => parseInt((a.id_action || '').replace('ACT-', ''), 10))
      .filter(n => !isNaN(n))
    const max = nums.length ? Math.max(...nums) : 0
    return `ACT-${String(max + 1).padStart(2, '0')}`
  }

  const add = () => onChange([...actions, { id_action: nextId(), type_action: '', action: '', date: '', responsable: '' }])
  const update = (i, field, val) => onChange(actions.map((a, idx) => idx === i ? { ...a, [field]: val } : a))
  const remove = (i) => onChange(actions.filter((_, idx) => idx !== i))

  return (
    <div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['ID', 'Type', 'Action', 'Date', 'Responsable', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actions.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-4 text-xs">
                  Aucune action — cliquez sur + Ajouter
                </td>
              </tr>
            )}
            {actions.map((a, idx) => (
              <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50 align-top">
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-semibold">
                    {a.id_action || '—'}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <select value={a.type_action || ''} onChange={e => update(idx, 'type_action', e.target.value)}
                    className={`${INPUT} bg-white ${a.type_action ? TYPE_BADGE[a.type_action] : ''}`}>
                    <option value="">— Type —</option>
                    {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1.5" style={{ minWidth: 220 }}>
                  <textarea value={a.action || ''} onChange={e => update(idx, 'action', e.target.value)}
                    placeholder="Description de l'action…" rows={2}
                    className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
                </td>
                <td className="px-2 py-1.5">
                  <input type="date" value={a.date || ''} onChange={e => update(idx, 'date', e.target.value)} className={INPUT} />
                </td>
                <td className="px-2 py-1.5" style={{ minWidth: 160 }}>
                  {members.length > 0 ? (
                    <select value={a.responsable || ''} onChange={e => update(idx, 'responsable', e.target.value)}
                      className={`${INPUT} bg-white`}>
                      <option value="">— Choisir —</option>
                      {members.map((m, i) => {
                        const name = typeof m === 'string'
                          ? m
                          : (`${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email || '')
                        return <option key={i} value={name}>{name}{m.role ? ` — ${m.role}` : ''}</option>
                      })}
                    </select>
                  ) : (
                    <input value={a.responsable || ''} onChange={e => update(idx, 'responsable', e.target.value)}
                      placeholder="Responsable…" className={INPUT} />
                  )}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={add}
        className="mt-2 border border-dashed border-gray-300 text-sm px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 text-gray-600">
        <span className="text-base leading-none">+</span> Ajouter une action
      </button>
    </div>
  )
}

function BilanTab({ form, onChange, at, members = [] }) {
  useEffect(() => {
    if (!at) return
    const updates = {}
    if (!form.bilan_projet)   updates.bilan_projet   = at.project_nom || at.project_name || ''
    if (!form.bilan_client)   updates.bilan_client   = at.project_client || at.project_client_name || ''
    if (!form.bilan_activite) updates.bilan_activite = at.project_departement || at.departement || ''
    if (!form.bilan_etat)     updates.bilan_etat     = 'En cours'
    Object.entries(updates).forEach(([k, v]) => { if (v) onChange(k, v) })
  }, [at])

  const updateCompetence = (idx, val) => {
    const arr = [...(form.bilan_competences || [])]
    arr[idx] = { ...arr[idx], reponse: val }
    onChange('bilan_competences', arr)
  }

  const updateMethode = (idx, field, val) => {
    const arr = [...(form.bilan_questions || [])]
    arr[idx] = { ...arr[idx], [field]: val }
    onChange('bilan_questions', arr)
  }

  const updateAppreciation = (idx, field, val) => {
    const arr = [...(form.appreciations || [])]
    arr[idx] = { ...arr[idx], [field]: val }
    onChange('appreciations', arr)
  }

  return (
    <div className="space-y-6">
      <Section title="B1 — Bilan de prestation — Présentation générale">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Projet <span className="ml-1 text-blue-500 text-[10px] font-normal">(auto)</span>
            </label>
            <input className={`${INPUT} bg-blue-50 text-blue-800 font-medium`}
              value={form.bilan_projet || ''} onChange={e => onChange('bilan_projet', e.target.value)} placeholder="Nom du projet…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Client <span className="ml-1 text-blue-500 text-[10px] font-normal">(auto)</span>
            </label>
            <input className={`${INPUT} bg-blue-50 text-blue-800 font-medium`}
              value={form.bilan_client || ''} onChange={e => onChange('bilan_client', e.target.value)} placeholder="Nom du client…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Activité <span className="ml-1 text-blue-500 text-[10px] font-normal">(département, auto)</span>
            </label>
            <input className={`${INPUT} bg-blue-50 text-blue-800 font-medium`}
              value={form.bilan_activite || ''} onChange={e => onChange('bilan_activite', e.target.value)} placeholder="Département / activité…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">État du projet</label>
            <div className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-semibold
              ${form.bilan_etat === 'Clôturé' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-amber-50 border-amber-300 text-amber-700'}`}>
              <span className="text-base">{form.bilan_etat === 'Clôturé' ? '✅' : '🔄'}</span>
              {form.bilan_etat || 'En cours'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Période du bilan</label>
            <input className={INPUT} value={form.bilan_periode || ''}
              onChange={e => onChange('bilan_periode', e.target.value)} placeholder="ex: Jan 2024 — Juin 2024" />
          </div>
          <div className="col-span-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea className={TEXTAREA} rows={3} value={form.bilan_description || ''}
              onChange={e => onChange('bilan_description', e.target.value)} placeholder="Description du bilan…" />
          </div>
        </div>
      </Section>

      <Section title="B2 — Bilan de compétences">
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-indigo-700 border-b w-8">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-indigo-700 border-b">Question</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-indigo-700 border-b w-64">Réponse</th>
              </tr>
            </thead>
            <tbody>
              {BILAN_COMPETENCES_QUESTIONS.map((question, idx) => {
                const row = (form.bilan_competences || [])[idx] || {}
                return (
                  <tr key={idx} className={`border-b last:border-b-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50/30'}`}>
                    <td className="px-3 py-3 text-xs font-bold text-indigo-400 align-top">{idx + 1}</td>
                    <td className="px-3 py-3 text-sm text-gray-800 align-top leading-relaxed">{question}</td>
                    <td className="px-2 py-2 align-top">
                      {idx === 0 ? (
                        <div>
                          <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                            onChange={e => { const file = e.target.files?.[0]; if (file) onChange('lien_matrice_competences_file', file) }}
                            className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-white file:text-indigo-700 hover:file:bg-indigo-50 cursor-pointer" />
                          {row.reponse && !(form.lien_matrice_competences_file instanceof File) && (
                            <p className="mt-1.5 text-xs text-blue-700 font-medium">
                              📎 <a href={row.reponse} target="_blank" rel="noreferrer" className="underline hover:text-blue-900">Voir la matrice importée</a>
                            </p>
                          )}
                          {form.lien_matrice_competences_file instanceof File && (
                            <p className="mt-1.5 text-xs text-green-700 font-medium">
                              ✅ {form.lien_matrice_competences_file.name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <textarea value={row.reponse || ''} onChange={e => updateCompetence(idx, e.target.value)}
                          placeholder="Réponse…" rows={2}
                          className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none" />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="B3 — Bilan des méthodes / moyens">
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b w-8">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Question</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 border-b w-36">Réponse</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b w-64">Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {BILAN_METHODES_QUESTIONS.map((question, idx) => {
                const row = (form.bilan_questions || [])[idx] || {}
                const rep = row.reponse || ''
                return (
                  <tr key={idx} className={`border-b last:border-b-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-3 py-3 text-xs font-bold text-gray-400 align-top">{idx + 1}</td>
                    <td className="px-3 py-3 text-sm text-gray-800 align-top leading-relaxed">{question}</td>
                    <td className="px-2 py-2 align-top text-center">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {['Oui', 'Non', 'N/A'].map(opt => (
                          <button key={opt} type="button" onClick={() => updateMethode(idx, 'reponse', opt)}
                            className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors
                              ${rep === opt
                                ? (opt === 'Oui' ? 'bg-green-100 text-green-800 border-green-400' :
                                   opt === 'Non' ? 'bg-red-100 text-red-800 border-red-400' :
                                   'bg-gray-200 text-gray-600 border-gray-400')
                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <textarea value={row.commentaire || ''} onChange={e => updateMethode(idx, 'commentaire', e.target.value)}
                        placeholder="Commentaire…" rows={2}
                        className="border border-gray-200 rounded px-2 py-1.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="B4 — Appréciation du client">
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Élément', 'Réponse', 'Lien archivage'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(form.appreciations || []).map((a, idx) => (
                <tr key={idx} className="hover:bg-gray-50 border-b last:border-b-0">
                  <td className="px-3 py-2 text-sm text-gray-800">{a.element}</td>
                  <td className="px-2 py-1.5">
                    <select value={a.reponse || ''} onChange={e => updateAppreciation(idx, 'reponse', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                      <option value="">-- Choisir --</option>
                      {REPONSE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input value={a.lien_archivage || ''} onChange={e => updateAppreciation(idx, 'lien_archivage', e.target.value)}
                      placeholder="URL ou référence"
                      className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="B5 — Capitalisation / Bonnes pratiques">
        <textarea className={TEXTAREA} rows={4} value={form.capitalisation || ''}
          onChange={e => onChange('capitalisation', e.target.value)}
          placeholder="Décrire les bonnes pratiques identifiées, leçons apprises, points à capitaliser…" />
      </Section>

      <Section title="B6 — Actions correctives / curatives / d'amélioration">
        <ActionsBilanInline
          actions={form.actions_bilan || []}
          onChange={v => onChange('actions_bilan', v)}
          members={members}
        />
      </Section>
    </div>
  )
}

// ── Helper : construit le form initialisé depuis step4Data ────────────────────
function buildInitialForm(step4Data, at) {
  const legacyMap = { tres_satisfait: 4, satisfait: 3, insatisfait: 2, tres_insatisfait: 1, na: null }

  const migratedCriteres = (step4Data.criteres || []).map(c => {
    const sat = [1,2,3,4].includes(Number(c.satisfaction))
      ? Number(c.satisfaction)
      : (legacyMap[c.satisfaction] ?? null)
    return { ...c, satisfaction: sat, score: sat ? SCORE_MAP[sat] : 0 }
  })

  const bilanQuestions = BILAN_METHODES_QUESTIONS.map((question, idx) => {
    const saved = (step4Data.bilan_methodes || [])[idx] || {}
    let rep = saved.reponse || ''
    if (rep === 'oui') rep = 'Oui'
    if (rep === 'non') rep = 'Non'
    if (rep === 'na')  rep = 'N/A'
    return {
      question,
      reponse:     rep,
      commentaire: saved.commentaire || '',
      ...(saved.id ? { id: saved.id } : {}),
    }
  })

  const bilanCompetences = BILAN_COMPETENCES_QUESTIONS.map((question, idx) => {
    const saved = (step4Data.bilan_competences || [])[idx] || {}
    return { question, reponse: saved.reponse || '' }
  })

  const migratedAppreciations = (step4Data.appreciations || []).map(a => {
    let rep = a.reponse || ''
    if (rep === 'oui') rep = 'Oui'
    if (rep === 'non') rep = 'Non'
    if (rep === '-')   rep = 'N/A'
    return { ...a, reponse: rep }
  })

  // ✅ FIX BUG 2 — normaliser type_action API (minuscules) → valeurs UI du <select>
  const normalizedActions = (step4Data.actions_bilan || []).map(a => ({
    ...a,
    id_action:   a.id_action  || a.action_id  || '',
    date:        a.date       || a.due_date   || '',
    type_action: TYPE_API_TO_UI[a.type_action] || a.type_action || '',
  }))

  const {
    criteres:           _c,
    bilan_methodes:     _bm,
    bilan_competences:  _bc,
    actions_bilan:      _ab,
    appreciations:      _ap,
    ...scalarFields
  } = step4Data

  return {
    ...scalarFields,

    nom_projet_eval:   scalarFields.nom_projet       || at?.step1?.nom_projet || at?.project_nom || '',
    cdc_ref:           scalarFields.cdc_ref_commande || '',
    date_eval:         scalarFields.date_evaluation  || new Date().toISOString().split('T')[0],
    client_referent:   scalarFields.client_referent  || '',
    fonction_client:   scalarFields.fonction         || '',
    bilan_description: scalarFields.commentaire_general           || '',
    capitalisation:    scalarFields.capitalisation_bonne_pratique || '',
    bilan_periode:     scalarFields.bilan_periode    || '',

    bilan_projet:    scalarFields.bilan_projet   || at?.project_nom          || at?.project_name       || '',
    bilan_client:    scalarFields.bilan_client   || at?.project_client       || at?.project_client_name || '',
    bilan_activite:  scalarFields.bilan_activite || at?.project_departement  || at?.departement        || '',
    bilan_etat:      scalarFields.bilan_etat     || 'En cours',

    criteres:          migratedCriteres,
    bilan_questions:   bilanQuestions,
    bilan_competences: bilanCompetences,
    appreciations:     migratedAppreciations,
    actions_bilan:     normalizedActions,

    plan_action_file:     null,
    plan_action_file_url: scalarFields.plan_action_file_url || '',

    document_evaluation_client:     null,
    document_evaluation_client_url: scalarFields.document_evaluation_client_url || '',

    lien_matrice_competences_file: null,
  }
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function Step4Evaluation({ at, step4Data, saving, onSave, onAdvance, onBack }) {
  const [activeTab, setActiveTab] = useState('enquete')
  const [form, setForm]           = useState({})
  const [isDirty, setIsDirty]     = useState(false)

  const members = Array.isArray(at?.project_membres) ? at.project_membres : []

  useEffect(() => {
    if (!step4Data || isDirty) return
    setForm(buildInitialForm(step4Data, at))
    setIsDirty(false)
  }, [step4Data, at, isDirty])

  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    const SAT_NUM_TO_STR = { 1: 'tres_insatisfait', 2: 'insatisfait', 3: 'satisfait', 4: 'tres_satisfait' }

    try {
      const payload = {
        nom_projet:       form.nom_projet_eval    || '',
        cdc_ref_commande: form.cdc_ref            || '',
        date_evaluation:  form.date_eval          || null,
        client_referent:  form.client_referent    || '',
        fonction:         form.fonction_client    || '',

        bilan_projet:                  form.bilan_projet       || '',
        bilan_client:                  form.bilan_client       || '',
        bilan_activite:                form.bilan_activite     || '',
        bilan_etat:                    form.bilan_etat         || 'En cours',
        bilan_periode:                 form.bilan_periode      || '',
        commentaire_general:           form.bilan_description  || '',
        capitalisation_bonne_pratique: form.capitalisation     || '',

        criteres: (form.criteres || []).map(c => {
          const numSat = c.satisfaction ? Number(c.satisfaction) : null
          return {
            ...c,
            satisfaction: (numSat && SAT_NUM_TO_STR[numSat]) ? SAT_NUM_TO_STR[numSat] : 'na',
            score: numSat ? (SCORE_MAP[numSat] ?? 0) : 0,
          }
        }),

        bilan_methodes: (form.bilan_questions || []).map(q => ({
          question:    q.question    || '',
          reponse:     q.reponse     || '-',
          commentaire: q.commentaire || '',
          ...(q.id ? { id: q.id } : {}),
        })),

        bilan_competences: (form.bilan_competences || []).map((c, i) => ({
          question: BILAN_COMPETENCES_QUESTIONS[i] || '',
          reponse:  c.reponse || '',
        })),

        appreciations: (form.appreciations || []).map(a => {
          const repMap = { 'Oui': 'oui', 'Non': 'non', 'N/A': '-', 'Partiel': '-', '-': '-' }
          return {
            element:        a.element        || '',
            reponse:        repMap[a.reponse] ?? '-',
            lien_archivage: a.lien_archivage || '',
            ...(a.id ? { id: a.id } : {}),
          }
        }),

        // ✅ FIX BUG 2 — typeMap complet UI → API
        actions_bilan: (form.actions_bilan || []).filter(a => a.action).map(a => {
          const typeMap = {
            'Corrective':   'corrective',
            'corrective':   'corrective',
            'preventive':   'preventive',
            'Préventive':   'preventive',
            'Améliorative': 'amelioration',
            'amelioration': 'amelioration',
          }
          return {
            action_id:   a.id_action   || a.action_id  || '',
            type_action: typeMap[a.type_action] || 'corrective',
            action:      a.action      || '',
            due_date:    a.date        || a.due_date   || null,
            responsable: a.responsable || '',
            ...(a.id ? { id: a.id } : {}),
          }
        }),
      }

      // ✅ FIX BUG 1 — instanceof File au lieu de typeof !== 'object'
      if (form.plan_action_file instanceof File) {
        const uploadRes = await uploadATAttachment(at.id, form.plan_action_file)
        payload.plan_action_file_url = uploadRes.url
      } else if (form.plan_action_file_url) {
        payload.plan_action_file_url = form.plan_action_file_url
      }

      if (form.document_evaluation_client instanceof File) {
        const uploadRes = await uploadATAttachment(at.id, form.document_evaluation_client)
        payload.document_evaluation_client_url = uploadRes.url
      } else if (form.document_evaluation_client_url) {
        payload.document_evaluation_client_url = form.document_evaluation_client_url
      }

      // Bilan de compétences — Q1 "Lien de la matrice des compétences" est un fichier importé
      if (form.lien_matrice_competences_file instanceof File && payload.bilan_competences?.[0]) {
        const uploadRes = await uploadATAttachment(at.id, form.lien_matrice_competences_file)
        payload.bilan_competences[0].reponse = uploadRes.url
      }

      console.log('📤 Step4 payload:', JSON.stringify(payload, null, 2))
      await onSave(payload)
      setIsDirty(false)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde Step 4 :', error)
      if (error instanceof Response) {
        const errorData = await error.json().catch(() => null)
        console.log('Détails de la validation backend :', errorData)
      }
      alert("Une erreur est survenue lors de l'enregistrement. Vérifiez la console réseau.")
    }
  }, [form, onSave, at])

  const handleAdvance = useCallback(async () => {
    try {
      await handleSave()
    } catch {
      // handleSave affiche déjà une alerte en cas d'erreur
    }
    onAdvance()
  }, [handleSave, onAdvance])

  const completedSteps = Array.from({ length: (at?.current_step || 4) - 1 }, (_, i) => i + 1)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <ATWorkflowStepper currentStep={at?.current_step || 4} completedSteps={completedSteps} />
      </div>

      {isDirty && !saving && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
          ⚠️ Modifications non sauvegardées — pensez à sauvegarder
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeTab === 'enquete' && <EnqueteTab form={form} onChange={handleChange} at={at} />}
          {activeTab === 'bilan'   && <BilanTab   form={form} onChange={handleChange} at={at} members={members} />}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex items-center justify-between">
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          ← Retour à l'étape 3
        </button>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => exportStep4PDF(form, at)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            📄 Exporter PDF
          </button>
          <button type="button" onClick={handleSave} disabled={saving || !isDirty}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg shadow transition-colors
              ${isDirty && !saving ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {saving ? (
              <>
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Sauvegarde…
              </>
            ) : '💾 Sauvegarder'}
          </button>
          <button type="button" onClick={handleAdvance}
            className="flex items-center gap-2 px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg shadow transition-colors">
            ✓ FIN de la prestation
          </button>
        </div>
      </div>
    </div>
  )
}