import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'

const PHASE_COLORS = {
    IDLE: 'default', Offre: 'warning',
    Kickoff: 'info', Realisation: 'primary',
    Cloture: 'success', Archive: 'error',
}

const PHASES = ['IDLE', 'Offre', 'Kickoff', 'Realisation', 'Cloture', 'Archive']

const DEPARTMENTS = [
    { value: 'MEDIA',     label: 'MEDIA' },
    { value: 'SPACE',     label: 'SPACE' },
    { value: 'BE',        label: 'BE' },
    { value: 'MONETIQUE', label: 'MONETIQUE' },
    { value: 'SI',        label: 'SI' },
    { value: 'TELECOM',   label: 'TELECOM' },
    { value: 'RH',        label: 'RH' },
    { value: 'QUALITE',   label: 'QUALITE' },
    { value: 'ADMIN',     label: 'ADMIN' },
]

const EMPTY_FILTERS = { search: '', phase: '', type_projet: '', departement: '' }

const Projects = () => {
    const navigate       = useNavigate()
    const { user }       = useAuth()
    const [projects, setProjects] = useState([])
    const [loading, setLoading]   = useState(true)
    const [filters, setFilters]   = useState(EMPTY_FILTERS)

    useEffect(() => {
        AxiosInstance.get('projects/')
            .then(res => setProjects(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    const handleFilter = (field) => (e) =>
        setFilters(prev => ({ ...prev, [field]: e.target.value }))

    const handleReset = () => setFilters(EMPTY_FILTERS)

    const hasActiveFilters = Object.values(filters).some(v => v !== '')

    const filtered = useMemo(() => {
        return projects.filter(p => {
            const q = filters.search.toLowerCase()
            const matchSearch = !q ||
                p.client?.toLowerCase().includes(q) ||
                p.ref_projet?.toLowerCase().includes(q)
            const matchPhase  = !filters.phase       || p.phase       === filters.phase
            const matchType   = !filters.type_projet || p.type_projet === filters.type_projet
            const matchDept   = !filters.departement || p.departement === filters.departement
            return matchSearch && matchPhase && matchType && matchDept
        })
    }, [projects, filters])

    return (
        <Box sx={{ p: 3 }}>
            {/* ── Header ───────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Liste des Projets</Typography>
                    <Typography sx={{ fontSize: '0.88rem', color: '#888', mt: 0.5 }}>
                        {filtered.length} / {projects.length} projet(s) affiché(s)
                    </Typography>
                </Box>
                {user?.role === 'admin' && (
                    <Button variant="contained" startIcon={<AddIcon />}
                        onClick={() => navigate('/projects/new')}
                        sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Nouveau Projet
                    </Button>
                )}
            </Box>

            {/* ── Barre de filtres ─────────────────────────────────── */}
            <Box sx={{
                display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center',
                p: 2, mb: 3, bgcolor: '#f8fafc',
                border: '1px solid #e3eaf3', borderRadius: '12px',
            }}>
                <FilterListIcon sx={{ color: '#1976d2', fontSize: '1.2rem' }} />

                {/* Recherche libre */}
                <TextField size="small" placeholder="Client ou référence..."
                    value={filters.search} onChange={handleFilter('search')}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: '1rem', color: '#aaa' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ minWidth: 200 }} />

                {/* Phase */}
                <TextField select size="small" label="Phase"
                    value={filters.phase} onChange={handleFilter('phase')}
                    sx={{ minWidth: 140 }}>
                    <MenuItem value="">Toutes les phases</MenuItem>
                    {PHASES.map(p => (
                        <MenuItem key={p} value={p}>
                            <Chip label={p} color={PHASE_COLORS[p] || 'default'}
                                size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                        </MenuItem>
                    ))}
                </TextField>

                {/* Type */}
                <TextField select size="small" label="Type"
                    value={filters.type_projet} onChange={handleFilter('type_projet')}
                    sx={{ minWidth: 160 }}>
                    <MenuItem value="">Tous les types</MenuItem>
                    <MenuItem value="forfait">Forfait</MenuItem>
                    <MenuItem value="assistance">Assistance Technique</MenuItem>
                </TextField>

                {/* Département */}
                <TextField select size="small" label="Département"
                    value={filters.departement} onChange={handleFilter('departement')}
                    sx={{ minWidth: 150 }}>
                    <MenuItem value="">Tous les depts</MenuItem>
                    {DEPARTMENTS.map(d => (
                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                    ))}
                </TextField>

                {/* Reset */}
                {hasActiveFilters && (
                    <Button size="small" startIcon={<ClearIcon />} onClick={handleReset}
                        sx={{ textTransform: 'none', color: '#e53935' }}>
                        Réinitialiser
                    </Button>
                )}
            </Box>

            {/* ── Contenu ───────────────────────────────────────────── */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress />
                </Box>
            ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 10, color: '#bbb' }}>
                    <FolderOpenIcon sx={{ fontSize: 70, mb: 2 }} />
                    <Typography sx={{ fontSize: '1.1rem' }}>
                        {hasActiveFilters
                            ? 'Aucun projet ne correspond à ces filtres.'
                            : 'Aucun projet pour le moment.'}
                    </Typography>
                    {hasActiveFilters && (
                        <Button size="small" onClick={handleReset}
                            sx={{ textTransform: 'none', mt: 1 }}>
                            Effacer les filtres
                        </Button>
                    )}
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {filtered.map((project) => (
                        <Grid item xs={12} sm={6} md={4} key={project.id}>
                            <Card elevation={0} sx={{
                                border: '1px solid #e0e0e0', borderRadius: '14px',
                                height: '100%', display: 'flex', flexDirection: 'column',
                                transition: 'all 0.2s',
                                '&:hover': { boxShadow: '0 4px 24px rgba(25,118,210,0.10)', borderColor: '#1976d2' }
                            }}>
                                <CardContent sx={{ flex: 1 }}>
                                    {/* REF + Phase */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography sx={{
                                            fontSize: '0.75rem', fontWeight: 700, color: '#1976d2',
                                            bgcolor: '#e3f2fd', px: 1, py: 0.3, borderRadius: '5px',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {project.ref_projet}
                                        </Typography>
                                        <Chip label={project.phase}
                                            color={PHASE_COLORS[project.phase] || 'default'}
                                            size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                                    </Box>

                                    {/* Client */}
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
                                        {project.client}
                                    </Typography>

                                    {/* Type */}
                                    <Typography sx={{ fontSize: '0.84rem', color: '#666', mb: 1.5 }}>
                                        {project.type_projet === 'forfait' ? 'Forfait' : 'Assistance Technique'}
                                    </Typography>

                                    {/* Département */}
                                    <Chip label={project.dept_display} size="small"
                                        variant="outlined" sx={{ mb: 1.5 }} />

                                    {/* Membres */}
                                    <Typography sx={{ fontSize: '0.82rem', color: '#888' }}>
                                        👥 {project.membres_details?.length || 0} membre(s)
                                    </Typography>
                                </CardContent>

                                <CardActions sx={{ px: 2, pb: 2 }}>
                                    <Button fullWidth variant="outlined" size="small"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
                                        Voir détails
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    )
}

export default Projects
