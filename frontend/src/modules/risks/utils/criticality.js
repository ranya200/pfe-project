export const PROCESS_OPTIONS = [
  'Relations Clients',
  'Ressources',
  'Planification',
  'Technique',
  'Documentation',
  'Réglementaire',
  'Sécurité',
  'Qualité',
]

export const STATUS_OPTIONS = ['Ouvert', 'Attenue', 'Cloture']
export const DECISION_OPTIONS = ['Acceptation', 'Reduction', 'Eradication']

export const clamp14 = (n) => Math.min(4, Math.max(1, Number(n || 1)))
export const criticality = (p, g) => clamp14(p) * clamp14(g)

export const criticalityMeta = (value) => {
  if (value <= 4) return { label: 'Acceptable', bg: '#DCFCE7', color: '#166534' }
  if (value <= 8) return { label: 'A surveiller', bg: '#FEF3C7', color: '#92400E' }
  return { label: 'Inacceptable', bg: '#FEE2E2', color: '#991B1B' }
}

export const autoMeasureText = (value) => {
  if (value >= 8) return 'Risque inacceptable: plan de contingence'
  if (value >= 4) return "A surveiller: plan d'attenuation"
  return 'Risque acceptable: Cloture autorisee'
}

export const reductionPct = (initial, residual) => {
  const i = Number(initial || 0)
  const r = Number(residual || 0)
  if (!i) return 0
  return Math.round(((i - r) / i) * 100)
}
