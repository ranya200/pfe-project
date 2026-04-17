import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { criticality } from './criticality'

// ── Helpers ──────────────────────────────────────────────────────────────────

function critLevel(c) {
  if (!c) return '—'
  return c <= 4 ? 'Acceptable' : c <= 8 ? 'À surveiller' : 'Inacceptable'
}

function getResponsible(ap) {
  const d = ap?.responsible_detail
  if (!d) return ap?.responsible_name || '—'
  return `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.email || '—'
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── CSV core ─────────────────────────────────────────────────────────────────

function buildCsv(headers, rows) {
  return [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(';'))
    .join('\n')
}

function downloadCsv(filename, headers, rows) {
  const csv = buildCsv(headers, rows)
  triggerDownload(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

// ── PDF core ─────────────────────────────────────────────────────────────────

function downloadPdf(filename, title, headers, rows, subtitle = '') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header band
  doc.setFillColor(15, 39, 68)
  doc.rect(0, 0, 297, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Telnet — Système de Management des Risques', 10, 8)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }), 10, 15)

  // Title
  doc.setTextColor(15, 39, 68)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 10, 30)
  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(subtitle, 10, 37)
  }

  autoTable(doc, {
    startY: subtitle ? 42 : 35,
    head: [headers],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 246, 249] },
    tableLineColor: [203, 213, 225],
    tableLineWidth: 0.2,
    margin: { left: 10, right: 10 },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const val = String(data.cell.raw)
        if (val === 'Inacceptable') { data.cell.styles.textColor = [153, 27, 27]; data.cell.styles.fontStyle = 'bold' }
        else if (val === 'À surveiller') { data.cell.styles.textColor = [146, 64, 14]; data.cell.styles.fontStyle = 'bold' }
        else if (val === 'Acceptable') { data.cell.styles.textColor = [22, 101, 52] }
      }
    },
  })

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Page ${i} / ${pageCount}`, 287, 205, { align: 'right' })
    doc.text('ISO 9001 / ISO 27001 — Confidentiel', 10, 205)
  }

  doc.save(filename)
}

// ── Exports spécialisés ───────────────────────────────────────────────────────

// 1. RiskMap — liste des risques
export function exportRisks(risks, projectId, format) {
  const headers = ['Code', 'Identification du risque', 'Processus', 'Prob.', 'Grav.', 'Criticité', 'Niveau', 'Décision', 'État']
  const rows = risks.map((r) => {
    const c = criticality(r?.evaluation?.probability, r?.evaluation?.severity)
    return [
      r.code || `R${r.id}`,
      r.title || '',
      r.process || '',
      r?.evaluation?.probability || '—',
      r?.evaluation?.severity || '—',
      c || '—',
      critLevel(c),
      r?.evaluation?.decision || '—',
      r.status || '',
    ]
  })
  if (format === 'csv') {
    downloadCsv(`risques_projet_${projectId}.csv`, headers, rows)
  } else {
    downloadPdf(`risques_projet_${projectId}.pdf`, 'Cartographie des Risques', headers, rows, `Projet #${projectId} — ${risks.length} risque(s)`)
  }
}

// 2. ActionPlanTracker — suivi des plans d'action
export function exportActionPlans(plans, projectId, format) {
  const headers = ['Code risque', 'Action corrective', 'Responsable', 'Date planifiée', 'Date actualisée', '% Réalisation', 'Statut', 'Commentaire']
  const rows = plans.map((r) => [
    r.risk_code || `R${r.risk}`,
    r.action || '—',
    getResponsible(r),
    r.planned_date || '—',
    r.actual_date || '—',
    r.progress != null ? `${r.progress}%` : '—',
    r.status || '—',
    r.comment || '—',
  ])
  if (format === 'csv') {
    downloadCsv(`plans_action_projet_${projectId}.csv`, headers, rows)
  } else {
    downloadPdf(`plans_action_projet_${projectId}.pdf`, 'Suivi des Plans d\'Action', headers, rows, `Projet #${projectId} — ${plans.length} action(s)`)
  }
}

// 3. Dashboard — comparaison initiale/résiduelle
export function exportDashboard(radarRows, rawRisks, projectId, format) {
  const headers = ['Code', 'Identification', 'Criticité initiale', 'Niveau initial', 'Criticité résiduelle', 'Niveau résiduel', 'Évolution']
  const rows = radarRows.map((r) => {
    const match = rawRisks.find((x) => (x.code || `R${x.id}`) === r.code)
    const diff = r.residuelle - r.initiale
    return [
      r.code,
      match?.title || match?.identification || '—',
      r.initiale || '—',
      critLevel(r.initiale),
      r.residuelle || '—',
      critLevel(r.residuelle),
      diff <= 0 ? `↓ Réduction (${Math.abs(diff)})` : `↑ Aggravation (+${diff})`,
    ]
  })
  if (format === 'csv') {
    downloadCsv(`dashboard_risques_projet_${projectId}.csv`, headers, rows)
  } else {
    downloadPdf(`dashboard_risques_projet_${projectId}.pdf`, 'Dashboard Analyse des Risques', headers, rows, `Projet #${projectId}`)
  }
}

// 4. RiskDetailPage — fiche complète d'un risque
export function exportRiskDetail(risk, format) {
  const eval_ = risk.evaluation || {}
  const residual = risk.residual || {}
  const ap = risk.action_plan || {}
  const initC = criticality(eval_.probability, eval_.severity)
  const resC = criticality(residual.probability, residual.severity)

  const headers = ['Champ', 'Valeur']
  const rows = [
    ['Code', risk.code || `R${risk.id}`],
    ['Identification', risk.title || '—'],
    ['Processus', risk.process || '—'],
    ['Activité / Département', risk.activity || '—'],
    ['Type', risk.risk_type || '—'],
    ['Origine', risk.origin || '—'],
    ['État', risk.status || '—'],
    ['Causes', risk.causes || '—'],
    ['Conséquences', risk.consequences || '—'],
    ['Mesures existantes', risk.existing_measures || '—'],
    ['— Évaluation —', ''],
    ['Probabilité initiale', eval_.probability || '—'],
    ['Gravité initiale', eval_.severity || '—'],
    ['Criticité initiale', initC || '—'],
    ['Niveau initial', critLevel(initC)],
    ['Décision', eval_.decision || '—'],
    ['— Plan d\'action —', ''],
    ['Action', ap.action || '—'],
    ['Responsable', getResponsible(ap)],
    ['Date planifiée', ap.planned_date || '—'],
    ['Date actualisée', ap.actual_date || '—'],
    ['Avancement', ap.progress != null ? `${ap.progress}%` : '—'],
    ['Statut plan', ap.status || '—'],
    ['— Risque résiduel —', ''],
    ['Probabilité résiduelle', residual.probability || '—'],
    ['Gravité résiduelle', residual.severity || '—'],
    ['Criticité résiduelle', resC || '—'],
    ['Niveau résiduel', critLevel(resC)],
  ]

  if (format === 'csv') {
    downloadCsv(`fiche_risque_${risk.code || risk.id}.csv`, headers, rows)
  } else {
    downloadPdf(
      `fiche_risque_${risk.code || risk.id}.pdf`,
      `Fiche de Risque — ${risk.code || `R${risk.id}`}`,
      headers,
      rows,
      risk.title || ''
    )
  }
}

