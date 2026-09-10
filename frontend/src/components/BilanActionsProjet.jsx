import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const STATUT_COLORS = {
    'Done':          'success',
    'In Progress':   'primary',
    'Blocked':       'error',
    'IDLE':          'default',
    'En cours':      'primary',
    'À planifier':   'warning',
    'À définir':     'warning',
}

const BilanActionsProjet = () => {
    const { id: projectId } = useParams()
    const navigate = useNavigate()

    const [items,   setItems]   = useState([])
    const [loading, setLoading] = useState(true)

    const [filterType,    setFilterType]    = useState('Tous')
    const [filterOrigine, setFilterOrigine] = useState('Tous')
    const [filterStatut,  setFilterStatut]  = useState('Tous')

    useEffect(() => {
        AxiosInstance.get(`projects/${projectId}/bilan-actions/`)
            .then(res => setItems(res.data))
            .finally(() => setLoading(false))
    }, [projectId])

    const types    = useMemo(() => ['Tous', ...new Set(items.map(i => i.type))], [items])
    const origines = useMemo(() => ['Tous', ...new Set(items.map(i => i.origine))], [items])
    const statuts  = useMemo(() => ['Tous', ...new Set(items.map(i => i.statut))], [items])

    const filtered = items.filter(i =>
        (filterType === 'Tous' || i.type === filterType) &&
        (filterOrigine === 'Tous' || i.origine === filterOrigine) &&
        (filterStatut === 'Tous' || i.statut === filterStatut)
    )

    return (
        <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/projects/${projectId}`)}
                    sx={{ textTransform: 'none', color: '#666' }}>
                    Retour au projet
                </Button>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    📋 Bilan d'actions globales
                </Typography>
                <Box sx={{ width: 160 }} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField select label="Type" size="small" value={filterType}
                    onChange={e => setFilterType(e.target.value)} sx={{ minWidth: 160 }}>
                    {types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField select label="Origine" size="small" value={filterOrigine}
                    onChange={e => setFilterOrigine(e.target.value)} sx={{ minWidth: 200 }}>
                    {origines.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
                <TextField select label="Statut" size="small" value={filterStatut}
                    onChange={e => setFilterStatut(e.target.value)} sx={{ minWidth: 180 }}>
                    {statuts.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '14px', border: '1px solid #e0e0e0' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Origine</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Responsable</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date prévue</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((item, idx) => (
                                <TableRow key={idx} hover>
                                    <TableCell>
                                        {item.origine}
                                        <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>
                                            {item.sous_origine}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{item.type}</TableCell>
                                    <TableCell sx={{ maxWidth: 380 }}>{item.description}</TableCell>
                                    <TableCell>{item.responsable || '—'}</TableCell>
                                    <TableCell>{item.date_prevue || '—'}</TableCell>
                                    <TableCell>
                                        <Chip label={item.statut} size="small"
                                            color={STATUT_COLORS[item.statut] || 'default'} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: 'center', color: '#bbb', py: 5, fontStyle: 'italic' }}>
                                        Aucune action pour ce projet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    )
}

export default BilanActionsProjet