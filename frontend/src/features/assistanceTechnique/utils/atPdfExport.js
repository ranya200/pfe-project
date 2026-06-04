import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function pdfHeader(doc, title, subtitle = '') {
  doc.setFillColor(15, 39, 68)
  doc.rect(0, 0, 297, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Telnet — Assistance Technique', 10, 8)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }), 10, 15)

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
  return subtitle ? 42 : 35
}

function pdfFooter(doc) {
  const n = doc.internal.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Page ${i} / ${n}`, 287, 205, { align: 'right' })
    doc.text('ISO 9001 / ISO 27001 — Confidentiel', 10, 205)
  }
}

function table(doc, startY, head, body) {
  autoTable(doc, {
    startY,
    head: [head],
    body,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 246, 249] },
    tableLineColor: [203, 213, 225],
    tableLineWidth: 0.2,
    margin: { left: 10, right: 10 },
  })
  return doc.lastAutoTable.finalY + 8
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
export function exportStep1PDF(form, at) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = pdfHeader(doc, 'Étape 1 — Lancement de la prestation', `AT-${at?.id || '?'} | ${form.nom_projet || ''}`)

  // Info générale
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
  doc.text('Informations générales', 10, y); y += 5
  autoTable(doc, {
    startY: y,
    body: [
      ['Projet', form.nom_projet || '—', 'Référence', form.reference_document || '—'],
      ['Auteur', form.auteur || '—', 'Date', form.date_document || '—'],
      ['Date T0', form.date_t0 || '—', 'Durée', form.duree_planifiee || '—'],
    ],
    styles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 35 } },
    margin: { left: 10, right: 10 },
  })
  y = doc.lastAutoTable.finalY + 6

  // Membres
  if (form.membres?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('Organisation de l\'équipe', 10, y); y += 3
    y = table(doc, y, ['Rôle', 'Nom', 'Responsabilités'],
      form.membres.map(m => [m.role, m.nom, m.responsabilites || '—']))
  }

  // Risques
  if (form.risques?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('Risques identifiés', 10, y); y += 3
    y = table(doc, y, ['#', 'Description', 'Atténuation'],
      form.risques.map((r, i) => [i + 1, r.description, r.attenuation || '—']))
  }

  // Points ouverts
  if (form.points_ouverts?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('Points ouverts / Actions', 10, y); y += 3
    y = table(doc, y, ['#', 'Description', 'Responsable', 'Délai'],
      form.points_ouverts.map((p, i) => [i + 1, p.description, p.responsable || '—', p.delai || '—']))
  }

  pdfFooter(doc)
  doc.save(`AT-${at?.id || 'X'}-Step1-Lancement.pdf`)
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
export function exportStep2PDF(form, at) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const y = pdfHeader(doc, 'Étape 2 — Réalisation de la prestation', `AT-${at?.id || '?'}`)

  autoTable(doc, {
    startY: y,
    body: [
      [{ content: 'Notes de réalisation', styles: { fontStyle: 'bold' } }, form.notes_realisation || '—'],
      [{ content: 'Livrables produits', styles: { fontStyle: 'bold' } }, form.livrables || '—'],
      [{ content: 'Points bloquants', styles: { fontStyle: 'bold' } }, form.points_bloquants || '—'],
      [{ content: 'Remarques', styles: { fontStyle: 'bold' } }, form.remarques || '—'],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 50, fillColor: [244, 246, 249] } },
    margin: { left: 10, right: 10 },
  })

  pdfFooter(doc)
  doc.save(`AT-${at?.id || 'X'}-Step2-Realisation.pdf`)
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
export function exportStep3PDF(form, at) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = pdfHeader(doc, 'Étape 3 — Suivi de la prestation', `AT-${at?.id || '?'}`)

  if (form.charges?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('Charge de travail (heures)', 10, y); y += 3
    y = table(doc, y, ['Ressource', 'Rôle', 'S1', 'S2', 'S3', 'S4', 'Total'],
      form.charges.map(c => [c.ressource, c.role || '—', c.s1 || 0, c.s2 || 0, c.s3 || 0, c.s4 || 0, c.total || 0]))
  }

  if (form.equipements?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('Équipements ECME', 10, y); y += 3
    y = table(doc, y, ['ID ECME', 'Désignation', 'Type', 'Fournisseur', 'Statut'],
      form.equipements.map(e => [e.id_ecme, e.designation, e.type || '—', e.fournisseur || '—', e.statut]))
  }

  if (form.reunions?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('Réunions de suivi', 10, y); y += 3
    y = table(doc, y, ['Date', 'Type', 'Participants', 'Actions', 'Compte rendu'],
      form.reunions.map(r => [r.date, r.type, r.participants, r.actions || '—', r.compte_rendu || '—']))
  }

  pdfFooter(doc)
  doc.save(`AT-${at?.id || 'X'}-Step3-Suivi.pdf`)
}

// ── PV de Libération ──────────────────────────────────────────────────────────
export function exportPVLiberationPDF(form, at) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ── Cover header ──────────────────────────────────────────────────────────
  doc.setFillColor(15, 39, 68)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text('Telnet — Assistance Technique', 10, 9)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }), 10, 17)

  // ── Title block ───────────────────────────────────────────────────────────
  doc.setFillColor(235, 240, 250)
  doc.rect(0, 22, 210, 18, 'F')
  doc.setTextColor(15, 39, 68)
  doc.setFontSize(15); doc.setFont('helvetica', 'bold')
  doc.text('Procès Verbal de Revue de Libération', 10, 31)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
  doc.text(form.pv_reference || 'Référence non définie', 10, 37)

  let y = 46

  // ── 1. Informations générales ─────────────────────────────────────────────
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
  doc.text('1. Informations générales', 10, y); y += 3

  const TYPE_LABELS = {
    documents: 'Documents', logiciels: 'Logiciels', sources: 'Sources',
    correctif: 'Correctif', materiel: 'Matériel', systeme: 'Système',
  }
  autoTable(doc, {
    startY: y,
    body: [
      ['Nom du projet',       form.pv_nom_projet      || '—', 'Référence PV',   form.pv_reference       || '—'],
      ['Date de revue',       form.pv_date_revue       || '—', 'Type de livraison', TYPE_LABELS[form.pv_type_livraison] || '—'],
      ['Objet de la livraison', { content: form.pv_objet_livraison || '—', colSpan: 3 }],
    ],
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42, fillColor: [244, 246, 249] }, 2: { fontStyle: 'bold', cellWidth: 38, fillColor: [244, 246, 249] } },
    margin: { left: 10, right: 10 },
  })
  y = doc.lastAutoTable.finalY + 6

  // ── 2. Participants ───────────────────────────────────────────────────────
  if (form.pv_participants?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('2. Participants à la revue', 10, y); y += 3
    y = table(doc, y, ['Rôle', 'Nom', 'Organisation'],
      form.pv_participants.map(p => [p.role || '—', p.nom || '—', p.organisation || '—']))
  }

  // ── 3. Critères de conformité ─────────────────────────────────────────────
  const criteres = form.pv_criteres || []
  if (criteres.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('3. Critères de conformité', 10, y); y += 3

    const CAT_LABELS = { A: 'A — Exigences clients', B: 'B — Vérification du livrable', C: 'C — Maîtrise de la livraison' }
    const cats = ['A', 'B', 'C']
    for (const cat of cats) {
      const rows = criteres.filter(c => (c.categorie || 'A') === cat)
      if (!rows.length) continue
      doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(80, 80, 80)
      doc.text(CAT_LABELS[cat] || cat, 10, y); y += 2
      autoTable(doc, {
        startY: y,
        head: [['Critère', 'Preuve / Référence', 'Commentaire', 'Conforme']],
        body: rows.map(r => [
          r.critere || '—',
          r.preuve  || '—',
          r.commentaire || '—',
          r.conforme === 'oui' ? 'OUI' : r.conforme === 'non' ? 'NON' : 'N/A',
        ]),
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 60 }, 1: { cellWidth: 42 }, 2: { cellWidth: 60 },
          3: { cellWidth: 18, halign: 'center' },
        },
        didParseCell(data) {
          if (data.column.index === 3 && data.section === 'body') {
            const v = data.cell.raw
            data.cell.styles.textColor = v === 'OUI' ? [39, 80, 10] : v === 'NON' ? [121, 31, 19] : [80, 80, 80]
            data.cell.styles.fontStyle = 'bold'
          }
        },
        margin: { left: 10, right: 10 },
      })
      y = doc.lastAutoTable.finalY + 4
    }
  }

  // ── 4. Décision ───────────────────────────────────────────────────────────
  const DECISION_MAP = { accepte: '✓ Accepté', accepte_reserves: '⚠ Accepté avec réserves', rejete: '✗ Rejeté' }
  const decisionText = DECISION_MAP[form.pv_decision] || '— Non définie —'
  const decisionColor = form.pv_decision === 'accepte' ? [234, 243, 222] : form.pv_decision === 'rejete' ? [252, 235, 235] : [250, 238, 218]
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
  doc.text('4. Décision de libération', 10, y); y += 3
  autoTable(doc, {
    startY: y,
    body: [
      [{ content: decisionText, styles: { fillColor: decisionColor, fontStyle: 'bold', fontSize: 11, halign: 'center' } }],
      [{ content: form.pv_commentaire || '(Aucun commentaire)', styles: { fontSize: 8, cellPadding: 3 } }],
    ],
    margin: { left: 10, right: 10 },
  })
  y = doc.lastAutoTable.finalY + 6

  // ── 5. Actions ────────────────────────────────────────────────────────────
  if (form.pv_actions?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('5. Actions à mener', 10, y); y += 3
    table(doc, y, ['Action', 'Responsable', 'Délai'],
      form.pv_actions.map(a => [a.action || '—', a.responsable || '—', a.delai || '—']))
  }

  pdfFooter(doc)
  doc.save(`PVL-${at?.id || 'X'}-${form.pv_nom_projet || 'Liberation'}.pdf`)
}

// ── Step 4 ────────────────────────────────────────────────────────────────────
export function exportStep4PDF(form, at) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = pdfHeader(doc, 'Étape 4 — Évaluation de la prestation', `AT-${at?.id || '?'}`)

  // Critères satisfaction
  if (form.criteres?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('Enquête de satisfaction client', 10, y); y += 3
    y = table(doc, y, ['Catégorie', 'N°', 'Critère', 'Satisfaction', 'Score', 'Commentaire'],
      form.criteres.map((c, i) => [c.categorie || '—', i + 1, c.critere, c.satisfaction || '—', c.score ?? '—', c.commentaire || '—']))
  }

  // Bilan méthodes
  if (form.bilan_questions?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('Bilan des méthodes / moyens', 10, y); y += 3
    y = table(doc, y, ['N°', 'Question', 'Réponse', 'Commentaire'],
      form.bilan_questions.map((q, i) => [i + 1, q.question, q.reponse || '—', q.commentaire || '—']))
  }

  // Actions bilan
  if (form.actions_bilan?.length) {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 39, 68)
    doc.text('Actions correctives / préventives', 10, y); y += 3
    y = table(doc, y, ['ID', 'Type', 'Action', 'Échéance', 'Responsable'],
      form.actions_bilan.map(a => [a.id_action, a.type, a.action, a.due_date || '—', a.responsable || '—']))
  }

  pdfFooter(doc)
  doc.save(`AT-${at?.id || 'X'}-Step4-Evaluation.pdf`)
}

