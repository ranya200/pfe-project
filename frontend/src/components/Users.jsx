import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'

const ROLE_COLORS = {
    admin:          'error',
    chef_projet:    'primary',
    resp_qualite:   'success',
    developpeur:    'info',
    tech_lead:      'info',
    ingenieur:      'info',
    validateur:     'warning',
    charge_affaires:'warning',
    consultant:     'default',
    stagiaire:      'default',
}

const ROLE_LABELS = {
    admin:          'Administrateur',
    chef_projet:    'Chef de Projet',
    resp_qualite:   'Resp. Qualité',
    developpeur:    'Développeur',
    tech_lead:      'Tech Lead',
    ingenieur:      'Ingénieur',
    validateur:     'Validateur',
    charge_affaires:"Chargé d'Affaires",
    consultant:     'Consultant',
    stagiaire:      'Stagiaire',
}

const DEPT_LABELS = {
    MEDIA:     'Média & Énergie',
    SPACE:     'Space',
    BE:        'BE Electronique',
    MONETIQUE: 'Monétique',
    SI:        'SI',
    TELECOM:   'Télécom',
    RH:        'RH',
    QUALITE:   'Qualité',
    ADMIN:     'Admin',
}

const DEPARTMENT_CHOICES = [
    { value: 'MEDIA',     label: 'Média & Énergie' },
    { value: 'SPACE',     label: 'Space' },
    { value: 'BE',        label: 'BE Electronique' },
    { value: 'MONETIQUE', label: 'Monétique' },
    { value: 'SI',        label: 'SI' },
    { value: 'TELECOM',   label: 'Télécom' },
    { value: 'RH',        label: 'RH' },
    { value: 'QUALITE',   label: 'Qualité' },
    { value: 'ADMIN',     label: 'Admin' },
]

const ROLE_CHOICES = [
    { value: 'chef_projet',     label: 'Chef de Projet' },
    { value: 'resp_qualite',    label: 'Responsable Qualité' },
    { value: 'developpeur',     label: 'Développeur' },
    { value: 'tech_lead',       label: 'Tech Lead' },
    { value: 'ingenieur',       label: 'Ingénieur' },
    { value: 'validateur',      label: 'Validateur' },
    { value: 'charge_affaires', label: "Chargé d'Affaires" },
    { value: 'consultant',      label: 'Consultant' },
    { value: 'stagiaire',       label: 'Stagiaire' },
]

const Users = () => {
    const navigate = useNavigate()
    const [users, setUsers]               = useState([])
    const [loading, setLoading]           = useState(true)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [editTarget, setEditTarget]     = useState(null)   // ✅ user en cours d'édition
    const [editForm, setEditForm]         = useState({})     // ✅ données du formulaire édition
    const [editErrors, setEditErrors]     = useState({})
    const [editLoading, setEditLoading]   = useState(false)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await AxiosInstance.get('users/')
            setUsers(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchUsers() }, [])

    // ── Supprimer ─────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await AxiosInstance.delete(`users/${deleteTarget.id}/`)
            setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
        } catch (err) {
            console.error(err)
        } finally {
            setDeleteTarget(null)
        }
    }

    // ── Ouvrir dialog édition ─────────────────────────────────────────────
    const handleEditOpen = (user) => {
        setEditTarget(user)
        setEditForm({
            first_name:   user.first_name,
            last_name:    user.last_name,
            title:        user.title,
            phone_number: user.phone_number,
            department:   user.department,
            role:         user.role,
            email:        user.email,
        })
        setEditErrors({})
    }

    // ── Sauvegarder modification ──────────────────────────────────────────
    const handleEditSave = async () => {
        setEditLoading(true)
        try {
            const res = await AxiosInstance.patch(`users/${editTarget.id}/`, editForm)
            // Mettre à jour la liste localement
            setUsers(prev => prev.map(u => u.id === editTarget.id ? res.data : u))
            setEditTarget(null)
        } catch (err) {
            if (err && typeof err === 'object') {
                setEditErrors(err)
            }
        } finally {
            setEditLoading(false)
        }
    }

    const handleEditChange = (field) => (e) => {
        setEditForm(prev => ({ ...prev, [field]: e.target.value }))
        setEditErrors(prev => ({ ...prev, [field]: '' }))
    }

    return (
        <Box sx={{ p: 3 }}>

            {/* ── Header ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Liste des Utilisateurs</Typography>
                    <Typography sx={{ fontSize: '0.88rem', color: '#888', mt: 0.5 }}>
                        {users.length} utilisateur(s) enregistré(s)
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<PersonAddIcon />}
                    onClick={() => navigate('/register')}
                    sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Ajouter un utilisateur
                </Button>
            </Box>

            {/* ── Tableau ── */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress />
                </Box>
            ) : users.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 8, color: '#aaa' }}>
                    <Typography>Aucun utilisateur trouvé.</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0}
                    sx={{ border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Utilisateur</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Rôle</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Département</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Téléphone</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar
                                                src={user.image ? `http://localhost:8000${user.image}` : undefined}
                                                sx={{ width: 38, height: 38, bgcolor: '#1976d2', fontSize: '0.9rem' }}>
                                                {!user.image && `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()}
                                            </Avatar>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                {user.title === 'MR' ? 'M.' : 'Mme'} {user.first_name} {user.last_name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.88rem', color: '#555' }}>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip label={ROLE_LABELS[user.role] || user.role}
                                            color={ROLE_COLORS[user.role] || 'default'}
                                            size="small" sx={{ fontWeight: 600 }} />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.88rem' }}>
                                        {DEPT_LABELS[user.department] || user.department}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.88rem' }}>{user.phone_number}</TableCell>
                                    <TableCell>
                                        <Chip label={user.is_active ? 'Actif' : 'Inactif'}
                                            color={user.is_active ? 'success' : 'default'}
                                            size="small" variant="outlined" />
                                    </TableCell>

                                    {/* ✅ Actions : Modifier + Supprimer */}
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                            <IconButton size="small" color="primary"
                                                onClick={() => handleEditOpen(user)}
                                                title="Modifier">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error"
                                                onClick={() => setDeleteTarget(user)}
                                                title="Supprimer">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ── Dialog Supprimer ── */}
            <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
                <DialogTitle sx={{ fontWeight: 700 }}>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Voulez-vous vraiment supprimer <strong>{deleteTarget?.first_name} {deleteTarget?.last_name}</strong> ?
                        Cette action est irréversible.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: 'none' }}>Annuler</Button>
                    <Button onClick={handleDelete} color="error" variant="contained"
                        sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Dialog Modifier ── */}
            <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Modifier — {editTarget?.first_name} {editTarget?.last_name}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.82rem', color: '#555', mb: 0.5 }}>Prénom</Typography>
                            <TextField fullWidth size="small"
                                value={editForm.first_name || ''}
                                onChange={handleEditChange('first_name')}
                                error={!!editErrors.first_name}
                                helperText={editErrors.first_name?.[0] || ''} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.82rem', color: '#555', mb: 0.5 }}>Nom</Typography>
                            <TextField fullWidth size="small"
                                value={editForm.last_name || ''}
                                onChange={handleEditChange('last_name')}
                                error={!!editErrors.last_name}
                                helperText={editErrors.last_name?.[0] || ''} />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.82rem', color: '#555', mb: 0.5 }}>Titre</Typography>
                            <TextField fullWidth select size="small"
                                value={editForm.title || ''}
                                onChange={handleEditChange('title')}>
                                <MenuItem value="MR">Mr</MenuItem>
                                <MenuItem value="MS">Ms</MenuItem>
                            </TextField>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.82rem', color: '#555', mb: 0.5 }}>Téléphone</Typography>
                            <TextField fullWidth size="small"
                                value={editForm.phone_number || ''}
                                onChange={handleEditChange('phone_number')}
                                error={!!editErrors.phone_number}
                                helperText={editErrors.phone_number?.[0] || ''} />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.82rem', color: '#555', mb: 0.5 }}>Département</Typography>
                            <TextField fullWidth select size="small"
                                value={editForm.department || ''}
                                onChange={handleEditChange('department')}>
                                {DEPARTMENT_CHOICES.map(d => (
                                    <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontSize: '0.82rem', color: '#555', mb: 0.5 }}>Rôle</Typography>
                            <TextField fullWidth select size="small"
                                value={editForm.role || ''}
                                onChange={handleEditChange('role')}>
                                {ROLE_CHOICES.map(r => (
                                    <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#555', mb: 0.5 }}>Email</Typography>
                        <TextField fullWidth size="small"
                            value={editForm.email || ''}
                            onChange={handleEditChange('email')}
                            error={!!editErrors.email}
                            helperText={editErrors.email?.[0] || ''} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setEditTarget(null)} sx={{ textTransform: 'none' }}>
                        Annuler
                    </Button>
                    <Button onClick={handleEditSave} variant="contained" disabled={editLoading}
                        sx={{ textTransform: 'none', fontWeight: 600 }}>
                        {editLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    )
}

export default Users