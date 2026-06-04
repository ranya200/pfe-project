import { useState, useEffect } from 'react'
import AxiosInstance from './AxiosInstance'
import { useAuth } from './AuthContext'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import BusinessIcon from '@mui/icons-material/Business'

const EMPTY_FORM = { nom_client: '', domaine: '', email: '', telephone: '', adresse: '' }

export default function ClientsPage() {
    const { user } = useAuth()
    const isAdmin  = user?.role === 'admin'

    const [clients, setClients]   = useState([])
    const [loading, setLoading]   = useState(true)
    const [open, setOpen]         = useState(false)
    const [editing, setEditing]   = useState(null)   // null = création, object = édition
    const [form, setForm]         = useState(EMPTY_FORM)
    const [saving, setSaving]     = useState(false)
    const [errors, setErrors]     = useState({})

    const fetchClients = () => {
        setLoading(true)
        AxiosInstance.get('clients/')
            .then(r => setClients(r.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchClients() }, [])

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setOpen(true) }
    const openEdit   = (c)  => { setEditing(c);  setForm({ nom_client: c.nom_client, domaine: c.domaine, email: c.email, telephone: c.telephone, adresse: c.adresse }); setErrors({}); setOpen(true) }
    const handleClose = ()  => { setOpen(false) }

    const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

    const handleSave = async () => {
        setSaving(true); setErrors({})
        try {
            if (editing) {
                await AxiosInstance.patch(`clients/${editing.id}/`, form)
            } else {
                await AxiosInstance.post('clients/', form)
            }
            setOpen(false)
            fetchClients()
        } catch (err) {
            if (err?.response?.data) setErrors(err.response.data)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce client ?')) return
        await AxiosInstance.delete(`clients/${id}/`)
        fetchClients()
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <BusinessIcon sx={{ color: '#1976d2', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Gestion des Clients</Typography>
                </Box>
                {isAdmin && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
                        Nouveau client
                    </Button>
                )}
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
            ) : clients.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 6, color: '#aaa' }}>
                    <BusinessIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography>Aucun client enregistré.</Typography>
                </Box>
            ) : (
                <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5' }}>
                                {['Nom', 'Domaine', 'Email', 'Téléphone', 'Adresse', ''].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{c.nom_client}</td>
                                    <td style={{ padding: '10px 14px', color: '#555' }}>{c.domaine || '—'}</td>
                                    <td style={{ padding: '10px 14px', color: '#555' }}>{c.email || '—'}</td>
                                    <td style={{ padding: '10px 14px', color: '#555' }}>{c.telephone || '—'}</td>
                                    <td style={{ padding: '10px 14px', color: '#555', maxWidth: 200 }}>{c.adresse || '—'}</td>
                                    <td style={{ padding: '10px 14px' }}>
                                        {isAdmin && (
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="Modifier"><IconButton size="small" onClick={() => openEdit(c)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                            </Box>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>
            )}

            {/* Dialog création/édition */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
                    <TextField label="Nom du client *" size="small" fullWidth value={form.nom_client} onChange={handleChange('nom_client')} error={!!errors.nom_client} helperText={errors.nom_client?.[0]} />
                    <TextField label="Domaine" size="small" fullWidth value={form.domaine} onChange={handleChange('domaine')} placeholder="ex: Telecom, Banking, Energy" />
                    <TextField label="Email" size="small" fullWidth value={form.email} onChange={handleChange('email')} error={!!errors.email} helperText={errors.email?.[0]} />
                    <TextField label="Téléphone" size="small" fullWidth value={form.telephone} onChange={handleChange('telephone')} />
                    <TextField label="Adresse" size="small" fullWidth multiline rows={2} value={form.adresse} onChange={handleChange('adresse')} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Annuler</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600 }}>
                        {saving ? <CircularProgress size={18} color="inherit" /> : (editing ? 'Enregistrer' : 'Créer')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

