import { useEffect, useState, useCallback } from 'react'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Tooltip from '@mui/material/Tooltip'
import SecurityIcon from '@mui/icons-material/Security'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PeopleIcon from '@mui/icons-material/People'
import ListAltIcon from '@mui/icons-material/ListAlt'

// ── Constantes ────────────────────────────────────────────────────────────────
const ACTION_CHOICES = [
    { value: '',               label: 'Toutes les actions' },
    { value: 'LOGIN',          label: 'Connexion réussie' },
    { value: 'LOGIN_FAILED',   label: 'Tentative échouée' },
    { value: 'LOGOUT',         label: 'Déconnexion' },
    { value: 'ACCOUNT_LOCKED', label: 'Compte verrouillé' },
    { value: 'PROJECT_CREATE', label: 'Projet créé' },
    { value: 'PROJECT_UPDATE', label: 'Projet modifié' },
    { value: 'PROJECT_DELETE', label: 'Projet supprimé' },
    { value: 'USER_CREATE',    label: 'Utilisateur créé' },
    { value: 'USER_UPDATE',    label: 'Utilisateur modifié' },
    { value: 'USER_DELETE',    label: 'Utilisateur supprimé' },
    { value: 'RCT_CREATE',     label: 'RCT créé' },
    { value: 'RCT_UPDATE',     label: 'RCT mis à jour' },
    { value: 'RCT_FINISH',     label: 'RCT terminé' },
    { value: 'ACCESS_DENIED',  label: 'Accès refusé' },
]

const ACTION_COLORS = {
    LOGIN:          'success',
    LOGIN_FAILED:   'error',
    LOGOUT:         'default',
    ACCOUNT_LOCKED: 'error',
    PROJECT_CREATE: 'primary',
    PROJECT_UPDATE: 'info',
    PROJECT_DELETE: 'error',
    USER_CREATE:    'primary',
    USER_UPDATE:    'info',
    USER_DELETE:    'error',
    RCT_CREATE:     'secondary',
    RCT_UPDATE:     'secondary',
    RCT_FINISH:     'success',
    ACCESS_DENIED:  'warning',
}

function StatCard({ icon, label, value, color = 'primary.main' }) {
    return (
        <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color, fontSize: 36 }}>{icon}</Box>
                <Box>
                    <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Box>
            </CardContent>
        </Card>
    )
}

export default function AuditDashboard() {
    // ── Filtres ───────────────────────────────────────────────────────────────
    const [filters, setFilters] = useState({
        action: '', user: '', date_from: '', date_to: '', search: '',
    })
    const [page, setPage]     = useState(1)
    const PER_PAGE            = 25

    // ── Données ───────────────────────────────────────────────────────────────
    const [logs, setLogs]     = useState([])
    const [total, setTotal]   = useState(0)
    const [pages, setPages]   = useState(1)
    const [stats, setStats]   = useState(null)
    const [loading, setLoading] = useState(false)

    // ── Chargement logs ───────────────────────────────────────────────────────
    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const params = { page, per_page: PER_PAGE, ...filters }
            // Supprimer les valeurs vides
            Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
            const res = await AxiosInstance.get('/audit/logs/', { params })
            setLogs(res.data.results)
            setTotal(res.data.count)
            setPages(res.data.pages)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [filters, page])

    // ── Chargement stats ──────────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const res = await AxiosInstance.get('/audit/logs/stats/')
            setStats(res.data)
        } catch (e) {
            console.error(e)
        }
    }, [])

    useEffect(() => { fetchLogs() }, [fetchLogs])
    useEffect(() => { fetchStats() }, [fetchStats])

    const handleFilterChange = (field) => (e) => {
        setFilters(f => ({ ...f, [field]: e.target.value }))
        setPage(1)
    }

    const handleReset = () => {
        setFilters({ action: '', user: '', date_from: '', date_to: '', search: '' })
        setPage(1)
    }

    const fmt = (iso) => {
        if (!iso) return '—'
        const d = new Date(iso)
        return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            {/* ── En-tête ───────────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <SecurityIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h5" fontWeight={700}>Journal d'audit</Typography>
                <Chip label="ISO 9001 / ISO 27001" size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
            </Box>

            {/* ── Cartes stats ──────────────────────────────────────────── */}
            {stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard icon={<ListAltIcon fontSize="inherit" />}
                            label="Total des actions enregistrées"
                            value={stats.total_logs}
                            color="primary.main" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard icon={<WarningAmberIcon fontSize="inherit" />}
                            label="Tentatives échouées (7 jours)"
                            value={stats.failed_logins_7d}
                            color={stats.failed_logins_7d > 10 ? 'error.main' : 'warning.main'} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard icon={<PeopleIcon fontSize="inherit" />}
                            label="Utilisateurs actifs (30 jours)"
                            value={stats.top_users_30d?.length ?? 0}
                            color="success.main" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard icon={<SecurityIcon fontSize="inherit" />}
                            label="Types d'actions distincts"
                            value={stats.by_action?.length ?? 0}
                            color="secondary.main" />
                    </Grid>
                </Grid>
            )}

            {/* ── Filtres ───────────────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField select fullWidth size="small" label="Action"
                            value={filters.action} onChange={handleFilterChange('action')}>
                            {ACTION_CHOICES.map(a => (
                                <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField fullWidth size="small" label="Utilisateur (email)"
                            value={filters.user} onChange={handleFilterChange('user')} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField fullWidth size="small" label="Date depuis" type="date"
                            InputLabelProps={{ shrink: true }}
                            value={filters.date_from} onChange={handleFilterChange('date_from')} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField fullWidth size="small" label="Date jusqu'à" type="date"
                            InputLabelProps={{ shrink: true }}
                            value={filters.date_to} onChange={handleFilterChange('date_to')} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField fullWidth size="small" label="Recherche libre (IP, objet…)"
                            value={filters.search} onChange={handleFilterChange('search')} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={1}>
                        <Button fullWidth variant="outlined" size="small" onClick={handleReset}>
                            Réinitialiser
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* ── Tableau ───────────────────────────────────────────────── */}
            <Paper variant="outlined">
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Date / Heure</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Utilisateur</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Objet</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Adresse IP</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Détails</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            Aucun log trouvé pour ces critères.
                                        </TableCell>
                                    </TableRow>
                                ) : logs.map(log => (
                                    <TableRow key={log.id} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                                            {fmt(log.timestamp)}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {log.user_fullname || '—'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {log.user_email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={log.action_label || log.action}
                                                color={ACTION_COLORS[log.action] || 'default'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 200 }}>
                                            <Tooltip title={log.object_repr || ''} placement="top">
                                                <Typography variant="body2" noWrap>
                                                    {log.object_repr || <em style={{ color: '#999' }}>—</em>}
                                                </Typography>
                                            </Tooltip>
                                            {log.model_name && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {log.model_name}
                                                    {log.object_id ? ` #${log.object_id}` : ''}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>
                                            {log.ip_address || '—'}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 220 }}>
                                            {(log.new_values || log.extra) && (
                                                <Tooltip
                                                    title={
                                                        <pre style={{ fontSize: 11, margin: 0 }}>
                                                            {JSON.stringify(log.new_values || log.extra, null, 2)}
                                                        </pre>
                                                    }
                                                    placement="left"
                                                >
                                                    <Typography variant="caption"
                                                        sx={{ cursor: 'help', color: 'primary.main', textDecoration: 'underline dotted' }}>
                                                        Voir détails
                                                    </Typography>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* ── Pagination ────────────────────────────────────────── */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                        {total} entrée{total !== 1 ? 's' : ''} trouvée{total !== 1 ? 's' : ''}
                    </Typography>
                    <Pagination
                        count={pages}
                        page={page}
                        onChange={(_, v) => setPage(v)}
                        color="primary"
                        size="small"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            </Paper>
        </Box>
    )
}

