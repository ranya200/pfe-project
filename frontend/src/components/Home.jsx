import { useEffect, useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import SentimentSatisfiedAltOutlinedIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import { useAuth } from './AuthContext'
import AxiosInstance from './AxiosInstance'

const ROLE_LABELS = {
  admin:        'Administrateur',
  chef_projet:  'Chef de Projet',
  resp_qualite: 'Responsable Qualité',
}
const ROLE_COLORS = {
  admin:        'error',
  chef_projet:  'primary',
  resp_qualite: 'success',
}
const LEVEL_STYLE = {
  Inacceptable: { color: '#d32f2f', label: 'Inacceptable' },
  Surveiller:   { color: '#f57c00', label: 'À surveiller' },
  Acceptable:   { color: '#388e3c', label: 'Acceptable' },
}
const STATUS_COLORS = {
  Ouvert: '#d32f2f', 'Atténué': '#f57c00', 'Clôturé': '#388e3c',
  IDLE: '#9e9e9e', Blocked: '#d32f2f', 'In Progress': '#1976d2', Done: '#388e3c',
}
const SEVERITY_STYLE = {
  critical: { color: '#d32f2f', bg: '#fef2f2', border: '#fecaca', label: '🔴 Critique' },
  warning:  { color: '#f57c00', bg: '#fff7ed', border: '#fed7aa', label: '🟡 Avertissement' },
  info:     { color: '#1976d2', bg: '#eff6ff', border: '#bfdbfe', label: 'ℹ️ Info' },
}
const GLOBAL_STATUS_COLORS = {
  on_track:      '#388e3c',
  a_surveiller:  '#f57c00',
  en_difficulte: '#d32f2f',
  cloture:       '#616161',
}

function kpiStatus(value, seuil, mode) {
  if (value === null || value === undefined) return 'neutral'
  if (mode === 'abs_max') return Math.abs(value) <= seuil ? 'good' : 'bad'
  if (mode === 'min') return value >= seuil ? 'good' : 'bad'
  return 'neutral'
}
const KPI_STATUS_COLORS = { good: '#388e3c', bad: '#d32f2f', neutral: '#98A2B3' }

function getActivityMeta(action = '') {
  const a = action.toLowerCase()
  if (a.includes('connexion')) return { icon: LoginOutlinedIcon, color: '#1976d2' }
  if (a.includes('créé') || a.includes('créée')) return { icon: AddCircleOutlineIcon, color: '#388e3c' }
  if (a.includes('modifié') || a.includes('mise à jour') || a.includes('mis à jour')) return { icon: EditOutlinedIcon, color: '#f57c00' }
  return { icon: HistoryOutlinedIcon, color: '#9e9e9e' }
}

function StatCard({ icon: Icon, label, value, color, caption }) {
  return (
    <Box sx={{
      position: 'relative', bgcolor: '#fff', borderRadius: '14px',
      p: 2.5, pl: 3, border: '1px solid #e7e9f0',
      boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
      height: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', overflow: 'hidden',
    }}>
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: color }} />
      <Box>
        <Typography sx={{ fontSize: '0.8rem', color: '#667085', mb: 0.5, fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#101828', lineHeight: 1.1 }}>
          {value}
        </Typography>
        {caption && (
          <Typography sx={{ fontSize: '0.7rem', color: '#98A2B3', mt: 0.5, letterSpacing: '0.04em', fontFamily: 'monospace' }}>
            {caption}
          </Typography>
        )}
      </Box>
      <Box sx={{
        bgcolor: `${color}18`, borderRadius: '10px',
        width: 42, height: 42, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon sx={{ color, fontSize: 22 }} />
      </Box>
    </Box>
  )
}

function PanelTitle({ children, count, icon: Icon }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2 }}>
      <Typography component="div" sx={{ fontWeight: 700, color: '#101828', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 1 }}>
        {Icon && <Icon sx={{ fontSize: 18, color: '#98A2B3' }} />}
        {children}
      </Typography>
      {count !== undefined && (
        <Typography sx={{ fontSize: '0.75rem', color: '#98A2B3', fontFamily: 'monospace' }}>
          {count}
        </Typography>
      )}
    </Box>
  )
}

function criticityInfo(p, g) {
  const c = p * g
  if (c >= 8) return { color: '#d32f2f', label: 'Inacceptable' }
  if (c >= 4) return { color: '#f57c00', label: 'À surveiller' }
  return { color: '#388e3c', label: 'Acceptable' }
}

function MatrixLegendDot({ color, label }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: color }} />
      <Typography sx={{ fontSize: '0.72rem', color: '#667085' }}>{label}</Typography>
    </Stack>
  )
}

function RiskMatrix({ matrix = [] }) {
  const rows = [1, 2, 3, 4]
  const cols = [1, 2, 3, 4]
  const lookup = {}
  matrix.forEach((m) => { lookup[`${m.probabilite}-${m.gravite}`] = m.count })
  return (
    <Box>
      <Typography sx={{ fontSize: '0.72rem', color: '#98A2B3', mb: 1.25 }}>
        Lignes : probabilité — Colonnes : gravité
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: `28px repeat(${cols.length}, 1fr)`, gap: 0.6, mb: 1 }}>
        <Box />
        {cols.map((g) => (
          <Typography key={`g-${g}`} sx={{ fontSize: '0.68rem', color: '#98A2B3', textAlign: 'center' }}>G{g}</Typography>
        ))}
        {rows.map((p) => (
          <Fragment key={`row-${p}`}>
            <Typography sx={{ fontSize: '0.68rem', color: '#98A2B3', alignSelf: 'center' }}>P{p}</Typography>
            {cols.map((g) => {
              const count = lookup[`${p}-${g}`] || 0
              const { color, label } = criticityInfo(p, g)
              return (
                <Box key={`${p}-${g}`}
                  title={`Probabilité ${p}, gravité ${g} — ${count} risque(s) (${label})`}
                  sx={{
                    height: 34, borderRadius: '6px',
                    bgcolor: count ? `${color}22` : '#F5F6F9',
                    color, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem',
                  }}>
                  {count > 0 ? count : ''}
                </Box>
              )
            })}
          </Fragment>
        ))}
      </Box>
      <Stack direction="row" spacing={2}>
        <MatrixLegendDot color="#388e3c" label="Acceptable" />
        <MatrixLegendDot color="#f57c00" label="À surveiller" />
        <MatrixLegendDot color="#d32f2f" label="Inacceptable" />
      </Stack>
    </Box>
  )
}

// ── Panneau Alertes IA ──────────────────────────────────────────────
function AIAlertsPanel({ alerts, onNavigate }) {
  if (!alerts || alerts.length === 0) return null

  const critiques = alerts.filter(a => a.severity === 'critical')
  const warnings  = alerts.filter(a => a.severity === 'warning')

  const byProject = {}
  alerts.forEach(a => {
    if (!byProject[a.project_id]) byProject[a.project_id] = {
      project_id:   a.project_id,
      project_name: a.project_name,
      project_ref:  a.project_ref,
      alerts:       [],
    }
    byProject[a.project_id].alerts.push(a)
  })

  return (
    <Paper sx={{ ...panelSx, border: '1px solid #fecaca', mb: 3 }} elevation={0}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontWeight: 700, color: '#101828', fontSize: '0.95rem' }}>
            🚨 Alertes IA — Mes projets
          </Typography>
          {critiques.length > 0 && (
            <Chip
              label={`${critiques.length} critique${critiques.length > 1 ? 's' : ''}`}
              size="small"
              sx={{ bgcolor: '#fef2f2', color: '#d32f2f', fontWeight: 700, fontSize: '0.72rem' }}
            />
          )}
          {warnings.length > 0 && (
            <Chip
              label={`${warnings.length} avertissement${warnings.length > 1 ? 's' : ''}`}
              size="small"
              sx={{ bgcolor: '#fff7ed', color: '#f57c00', fontWeight: 700, fontSize: '0.72rem' }}
            />
          )}
        </Box>
        <Typography sx={{ fontSize: '0.72rem', color: '#98A2B3', fontFamily: 'monospace' }}>
          {alerts.length} alerte{alerts.length > 1 ? 's' : ''} active{alerts.length > 1 ? 's' : ''}
        </Typography>
      </Box>

      <Stack divider={<Divider />} spacing={0}>
        {Object.values(byProject).map((proj) => (
          <Box key={proj.project_id} sx={{ py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{
                  fontSize: '0.72rem', fontWeight: 700, color: '#1976d2',
                  bgcolor: '#e3f2fd', px: 1, py: 0.3, borderRadius: '4px',
                  fontFamily: 'monospace',
                }}>
                  {proj.project_ref}
                </Typography>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#101828' }}>
                  {proj.project_name}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onNavigate(`/projects/${proj.project_id}/ai-analysis`)}
                sx={{
                  textTransform: 'none', fontSize: '0.75rem',
                  borderColor: '#7c3aed', color: '#7c3aed',
                  '&:hover': { bgcolor: '#f5f3ff', borderColor: '#6d28d9' },
                  py: 0.3, px: 1.2,
                }}
              >
                Voir l'analyse →
              </Button>
            </Box>

            <Stack spacing={0.7}>
              {proj.alerts.map(a => {
                const s = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.info
                return (
                  <Box key={a.id} sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 1.5,
                    p: 1.2, borderRadius: '8px',
                    bgcolor: s.bg, border: `1px solid ${s.border}`,
                  }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>
                          {s.label}
                        </Typography>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#101828' }} noWrap>
                          {a.title}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.7rem', color: '#667085', fontFamily: 'monospace' }}>
                        {a.iso_clause}
                      </Typography>
                    </Box>
                  </Box>
                )
              })}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}

// ── KPI (Indicateurs de performance) ────────────────────────────────
function KpiCard({ icon: Icon, title, value, seuil, mode, suffix = '%' }) {
  const status = kpiStatus(value, seuil, mode)
  const color = KPI_STATUS_COLORS[status]

  return (
    <Box sx={{
      bgcolor: '#fff', borderRadius: '14px', p: 2.5,
      border: '1px solid #e7e9f0', boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
      height: '100%',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{
          bgcolor: `${color}18`, borderRadius: '10px', width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon sx={{ color, fontSize: 18 }} />
        </Box>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#101828' }}>{title}</Typography>
      </Box>
      <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, color: value === null ? '#98A2B3' : '#101828', lineHeight: 1.1 }}>
        {value === null || value === undefined ? '—' : `${value > 0 ? '+' : ''}${value}${suffix}`}
      </Typography>
    </Box>
  )
}

// ── État global des projets ─────────────────────────────────────────
function GlobalStatusPanel({ counts, labels }) {
  const entries = Object.entries(counts || {})
  const total = entries.reduce((sum, [, c]) => sum + c, 0)
  return (
    <Paper sx={panelSx} elevation={0}>
      <PanelTitle count={`${total} projets`}>État global des projets</PanelTitle>
      <Stack spacing={1.25}>
        {entries.map(([key, count]) => {
          const pct = total ? Math.round((count / total) * 100) : 0
          return (
            <Box key={key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#344054', fontWeight: 500 }}>
                  {labels?.[key] || key}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#667085', fontFamily: 'monospace' }}>
                  {count}
                </Typography>
              </Box>
              <Box sx={{ height: 7, borderRadius: 4, bgcolor: '#F0F1F5', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: GLOBAL_STATUS_COLORS[key] || '#9e9e9e', borderRadius: 4 }} />
              </Box>
            </Box>
          )
        })}
      </Stack>
    </Paper>
  )
}

// ── Planning & Jalons ───────────────────────────────────────────────
function PlanningJalonsPanel({ avgProgress, jalons, onNavigate }) {
  return (
    <Paper sx={panelSx} elevation={0}>
      <PanelTitle icon={TrendingUpOutlinedIcon}>Planning & Jalons</PanelTitle>

      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#344054', fontWeight: 500 }}>
            % d'avancement moyen
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#1976d2', fontWeight: 700 }}>
            {avgProgress === null ? '—' : `${avgProgress}%`}
          </Typography>
        </Box>
        <Box sx={{ height: 8, borderRadius: 4, bgcolor: '#F0F1F5', overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${avgProgress || 0}%`, bgcolor: '#1976d2', borderRadius: 4 }} />
        </Box>
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
        <Box sx={{ flex: 1, textAlign: 'center', bgcolor: '#f0fdf4', borderRadius: '8px', py: 1 }}>
          <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#388e3c' }}>{jalons.realises}</Typography>
          <Typography sx={{ fontSize: '0.68rem', color: '#667085' }}>Jalons réalisés</Typography>
        </Box>
        <Box sx={{ flex: 1, textAlign: 'center', bgcolor: '#fff7ed', borderRadius: '8px', py: 1 }}>
          <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#f57c00' }}>{jalons.prevus}</Typography>
          <Typography sx={{ fontSize: '0.68rem', color: '#667085' }}>Jalons à venir</Typography>
        </Box>
      </Box>

      {jalons.prochaines_echeances?.length > 0 && (
        <>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#98A2B3', mb: 1, textTransform: 'uppercase' }}>
            Prochaines échéances
          </Typography>
          <Stack spacing={0.75}>
            {jalons.prochaines_echeances.map((j, i) => (
              <Box key={i}
                onClick={() => onNavigate(`/projects/${j.project_id}`)}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  p: 1, borderRadius: '8px', cursor: 'pointer',
                  bgcolor: j.en_retard ? '#fef2f2' : '#F5F6F9',
                  '&:hover': { bgcolor: j.en_retard ? '#fee2e2' : '#EEF1F5' },
                }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  <FlagOutlinedIcon sx={{ fontSize: 15, color: j.en_retard ? '#d32f2f' : '#98A2B3', flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.78rem', color: '#101828', fontWeight: 500 }} noWrap>
                      {j.id_jalon} — {j.description}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#98A2B3', fontFamily: 'monospace' }}>
                      {j.project_ref}
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: j.en_retard ? '#d32f2f' : '#667085', fontWeight: 600, flexShrink: 0 }}>
                  {j.date_prevue || 'Sans date'}
                </Typography>
              </Box>
            ))}
          </Stack>
        </>
      )}
    </Paper>
  )
}

// ── Principaux risques ──────────────────────────────────────────────
function TopRisksPanel({ risks, onNavigate }) {
  return (
    <Paper sx={panelSx} elevation={0}>
      <PanelTitle count={`${risks.length}`} icon={ReportProblemOutlinedIcon}>Principaux risques</PanelTitle>
      {risks.length === 0 ? (
        <Typography sx={{ color: '#98A2B3', fontSize: '0.85rem' }}>Aucun risque ouvert.</Typography>
      ) : (
        <Stack divider={<Divider />} spacing={0}>
          {risks.map((r) => {
            const style = LEVEL_STYLE[r.level] || LEVEL_STYLE.Acceptable
            return (
              <Box key={r.id}
                onClick={() => onNavigate(`/projects/${r.project_id}`)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: '#F5F6F9' } }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.2 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1976d2', bgcolor: '#e3f2fd', px: 0.8, py: 0.1, borderRadius: '4px', fontFamily: 'monospace' }}>
                      {r.code}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#98A2B3', fontFamily: 'monospace' }}>{r.project_ref}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.82rem', color: '#101828' }} noWrap>{r.title}</Typography>
                </Box>
                <Chip label={`${style.label} (${r.criticality})`} size="small"
                  sx={{ bgcolor: `${style.color}18`, color: style.color, fontWeight: 700, fontSize: '0.68rem', flexShrink: 0, ml: 1 }} />
              </Box>
            )
          })}
        </Stack>
      )}
    </Paper>
  )
}

// ── Actions prioritaires ────────────────────────────────────────────
function PriorityActionsPanel({ actions, onNavigate }) {
  return (
    <Paper sx={panelSx} elevation={0}>
      <PanelTitle count={`${actions.length}`} icon={AssignmentTurnedInOutlinedIcon}>Actions prioritaires</PanelTitle>
      {actions.length === 0 ? (
        <Typography sx={{ color: '#98A2B3', fontSize: '0.85rem' }}>Aucune action en cours.</Typography>
      ) : (
        <Stack divider={<Divider />} spacing={0}>
          {actions.map((a) => (
            <Box key={a.id}
              onClick={() => onNavigate(`/projects/${a.project_id || ''}`)}
              sx={{ py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: '#F5F6F9' } }}>
              <Typography sx={{ fontSize: '0.82rem', color: '#101828' }} noWrap>{a.action}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.3 }}>
                <Typography sx={{ fontSize: '0.68rem', color: '#98A2B3', fontFamily: 'monospace' }}>
                  {a.risk_code} · {a.project_ref}
                </Typography>
                {a.responsible && (
                  <Typography sx={{ fontSize: '0.68rem', color: '#667085' }}>👤 {a.responsible}</Typography>
                )}
                {a.planned_date && (
                  <Typography sx={{ fontSize: '0.68rem', color: '#f57c00', fontWeight: 600 }}>📅 {a.planned_date}</Typography>
                )}
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  )
}

// ───────────────────────────────────────────────────────────────────
const panelSx = {
  p: 3, borderRadius: '14px',
  border: '1px solid #e7e9f0',
  boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
}
const tooltipStyle = { borderRadius: 8, border: '1px solid #e7e9f0', fontSize: 12 }

// ── Composant principal ─────────────────────────────────────────────
const Home = () => {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [data,     setData]     = useState(null)
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [aiAlerts, setAiAlerts] = useState([])

  useEffect(() => {
    AxiosInstance.get('projects/dashboard/summary/')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || 'Erreur de chargement du dashboard'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    AxiosInstance.get('ai/my-alerts/')
      .then((res) => setAiAlerts(res.data))
      .catch(() => setAiAlerts([]))
  }, [])

  if (!user) return null

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()

  const riskLevelData = data
    ? data.risks.by_level.map((r) => ({
        name:  LEVEL_STYLE[r.evaluation__level]?.label || r.evaluation__level,
        value: r.count,
        color: LEVEL_STYLE[r.evaluation__level]?.color || '#9e9e9e',
      }))
    : []

  const actionStatusData = data
    ? data.actions.by_status.map((a) => ({
        name:  a.status,
        count: a.count,
        color: STATUS_COLORS[a.status] || '#9e9e9e',
      }))
    : []

  return (
    <Box sx={{ p: 4, bgcolor: '#F5F6F9', minHeight: '100%' }}>

      {/* ── Carte de bienvenue ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 3,
        bgcolor: '#fff', borderRadius: '16px',
        p: 4, mb: 4, border: '1px solid #e7e9f0',
        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', right: -40, top: -40,
          width: 160, height: 160, borderRadius: '50%',
          bgcolor: '#1976d2', opacity: 0.05,
        }} />
        <Avatar sx={{
          width: 68, height: 68, bgcolor: '#1976d2',
          fontSize: '1.6rem', fontWeight: 700, border: '3px solid #e3f2fd',
        }}>
          {user.image
            ? <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.image}`}
                alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : initials
          }
        </Avatar>
        <Box sx={{ zIndex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#101828' }}>
            Bonjour, {user.first_name} {user.last_name} 👋
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.75 }}>
            <Typography sx={{ color: '#667085', fontSize: '0.9rem' }}>{user.email}</Typography>
            <Chip
              label={ROLE_LABELS[user.role] || user.role}
              color={ROLE_COLORS[user.role] || 'default'}
              size="small" sx={{ fontWeight: 600 }}
            />
          </Stack>
          <Typography sx={{ color: '#98A2B3', fontSize: '0.8rem', mt: 0.5, fontFamily: 'monospace' }}>
            Département : {user.department || '—'}
          </Typography>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>{error}</Alert>
      )}

      {data && (
        <>
          {/* ── Cartes résumé ── */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={FolderOpenOutlinedIcon} label="Projets actifs" value={data.projects.total} color="#1976d2" caption="TOUS DÉPARTEMENTS" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={ReportProblemOutlinedIcon} label="Risques ouverts" value={data.risks.open} color="#d32f2f" caption="À TRAITER" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={AccessTimeOutlinedIcon} label="Actions en retard" value={data.actions.overdue} color="#f57c00" caption="SUR PLANS ACTIFS" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard icon={GroupsOutlinedIcon} label="Clients" value={data.projects.total_clients} color="#388e3c" caption="ACTIFS" />
            </Grid>
          </Grid>

          {/* ── Graphiques ── */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={panelSx} elevation={0}>
                <PanelTitle count={`${data.risks.open} ouverts`} icon={GridViewOutlinedIcon}>
                  Matrice des risques
                </PanelTitle>
                {data.risks.matrix?.length ? (
                  <RiskMatrix matrix={data.risks.matrix} />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={riskLevelData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                        {riskLevelData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: '#475467' }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={panelSx} elevation={0}>
                <PanelTitle count={`${data.risks.by_level.reduce((s, r) => s + r.count, 0)} évalués`}>
                  Répartition des risques par niveau
                </PanelTitle>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={riskLevelData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {riskLevelData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: '#475467' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={panelSx} elevation={0}>
                <PanelTitle count={`${data.actions.overdue} en retard`}>Plans d'action par statut</PanelTitle>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={actionStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF1F5" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F5F6F9' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {actionStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* ── Indicateurs de performance (KPI) ── */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <KpiCard
                icon={SpeedOutlinedIcon}
                title="Écart d'effort / Effort"
                value={data.kpis.ecart_effort.value}
                seuil={data.kpis.ecart_effort.seuil}
                mode="abs_max"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KpiCard
                icon={AccessTimeOutlinedIcon}
                title="Écart délai / Schedule Variance"
                value={data.kpis.ecart_delai.value}
                seuil={data.kpis.ecart_delai.seuil}
                mode="abs_max"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KpiCard
                icon={SentimentSatisfiedAltOutlinedIcon}
                title="Customer Satisfaction Index"
                value={data.kpis.satisfaction_client.value}
                seuil={data.kpis.satisfaction_client.seuil}
                mode="min"
              />
            </Grid>
          </Grid>

          {/* ── État global / Planning & Jalons ── */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} md={5}>
              <GlobalStatusPanel counts={data.global_status.counts} labels={data.global_status.labels} />
            </Grid>
            <Grid item xs={12} md={7}>
              <PlanningJalonsPanel
                avgProgress={data.planning.avg_progress_pct}
                jalons={data.jalons}
                onNavigate={navigate}
              />
            </Grid>
          </Grid>

          {/* ── Principaux risques / Actions prioritaires ── */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <TopRisksPanel risks={data.risks.top_risks} onNavigate={navigate} />
            </Grid>
            <Grid item xs={12} md={6}>
              <PriorityActionsPanel actions={data.actions.priority_actions} onNavigate={navigate} />
            </Grid>
          </Grid>

          {/* ── Panneau Alertes IA ── */}
          <AIAlertsPanel alerts={aiAlerts} onNavigate={navigate} />

          {/* ── Activité récente (Admin uniquement) ── */}
          {user.role === 'admin' && (
            <Paper sx={panelSx} elevation={0}>
              <PanelTitle count={`${data.recent_activity.length} évènements`}>Activité récente</PanelTitle>
              {data.recent_activity.length === 0 && (
                <Typography sx={{ color: '#98A2B3', fontSize: '0.9rem' }}>Aucune activité récente.</Typography>
              )}
              <Stack divider={<Divider />}>
                {data.recent_activity.map((log) => {
                  const { icon: Icon, color } = getActivityMeta(log.action)
                  return (
                    <Box key={log.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5 }}>
                      <Box sx={{
                        bgcolor: `${color}18`, borderRadius: '50%', width: 28, height: 28,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25,
                      }}>
                        <Icon sx={{ fontSize: 15, color }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#101828' }}>
                          <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#667085' }}>
                            {log.user}
                          </Box>
                          {'  —  '}
                          <Box component="span" sx={{ fontWeight: 600 }}>{log.action}</Box>
                        </Typography>
                        {log.object_repr && (
                          <Typography sx={{ fontSize: '0.75rem', color: '#667085', fontFamily: 'monospace' }} noWrap>
                            {log.object_repr}
                          </Typography>
                        )}
                      </Box>
                      <Typography sx={{ fontSize: '0.7rem', color: '#98A2B3', fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </Typography>
                    </Box>
                  )
                })}
              </Stack>
            </Paper>
          )}
        </>
      )}
    </Box>
  )
}

export default Home