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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
const NAME_REGEX   = /^[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s'&.,-]{1,99}$/

// Rejette les saisies "spam" du style "ssssss" ou "aaaaaaa" (un seul caractère répété)
const isRepetitive = (value) => {
    const stripped = value.replace(/\s/g, '')
    return stripped.length > 2 && new Set(stripped.toLowerCase()).size === 1
}

function validateField(field, rawValue, form) {
    const value = (rawValue || '').trim()

    switch (field) {
        case 'nom_client':
            if (!value) return 'Le nom du client est obligatoire.'
            if (value.length < 2) return 'Le nom du client doit contenir au moins 2 caractères.'
            if (isRepetitive(value)) return 'Ce nom ne semble pas valide.'
            if (!NAME_REGEX.test(value)) return 'Utilisez uniquement lettres, chiffres et ponctuation courante.'
            return null

        case 'domaine':
            if (!value) return null
            if (isRepetitive(value)) return 'Ce domaine ne semble pas valide.'
            if (!NAME_REGEX.test(value)) return 'Utilisez uniquement lettres, chiffres et ponctuation courante.'
            return null

        case 'email':
            if (!value) return null
            if (!EMAIL_REGEX.test(value)) return "L'adresse email n'est pas valide."
            if (isRepetitive(value.split('@')[0])) return "Cette adresse email ne semble pas valide."
            return null

        case 'telephone':
            if (!value) return null
            if (isRepetitive(value)) return 'Ce numéro ne semble pas valide.'
            if (!/^(\+?216)?\d{8}$/.test(value.replace(/\s/g, ''))) {
                return 'Numéro invalide : 8 chiffres (ex: 20 123 456), avec +216 en option.'
            }
            return null

        case 'adresse':
            if (!value) return null
            if (value.length > 255) return "L'adresse est trop longue (255 caractères max)."
            if (isRepetitive(value)) return 'Cette adresse ne semble pas valide.'
            return null

        default:
            return null
    }
}

function validateClientForm(form) {
    const errors = {}
    for (const field of Object.keys(form)) {
        const message = validateField(field, form[field], form)
        if (message) errors[field] = [message]
    }
    return errors
}

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
    const [touched, setTouched]   = useState({})

    const fetchClients = () => {
        setLoading(true)
        AxiosInstance.get('clients/')
            .then(r => setClients(r.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchClients() }, [])

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setTouched({}); setOpen(true) }
    const openEdit   = (c)  => { setEditing(c);  setForm({ nom_client: c.nom_client, domaine: c.domaine, email: c.email, telephone: c.telephone, adresse: c.adresse }); setErrors({}); setTouched({}); setOpen(true) }
    const handleClose = ()  => { setOpen(false) }

    const handleChange = (field) => (e) => {
        const value = e.target.value
        setForm(prev => ({ ...prev, [field]: value }))
        if (touched[field]) {
            const message = validateField(field, value, form)
            setErrors(prev => ({ ...prev, [field]: message ? [message] : undefined }))
        }
    }

    const handleBlur = (field) => () => {
        setTouched(prev => ({ ...prev, [field]: true }))
        const message = validateField(field, form[field], form)
        setErrors(prev => ({ ...prev, [field]: message ? [message] : undefined }))
    }

    const handlePhoneChange = (e) => {
        const cleaned = e.target.value.replace(/[^0-9+\s]/g, '')
        setForm(prev => ({ ...prev, telephone: cleaned }))
        if (touched.telephone) {
            const message = validateField('telephone', cleaned, form)
            setErrors(prev => ({ ...prev, telephone: message ? [message] : undefined }))
        }
    }

    const handleSave = async () => {
        const clientErrors = validateClientForm(form)
        setTouched({ nom_client: true, domaine: true, email: true, telephone: true, adresse: true })
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors)
            return
        }

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
                    <TextField
                        label="Nom du client *" size="small" fullWidth
                        value={form.nom_client} onChange={handleChange('nom_client')} onBlur={handleBlur('nom_client')}
                        error={!!errors.nom_client} helperText={errors.nom_client?.[0]}
                        inputProps={{ maxLength: 100 }} />
                    <TextField
                        label="Domaine" size="small" fullWidth
                        value={form.domaine} onChange={handleChange('domaine')} onBlur={handleBlur('domaine')}
                        error={!!errors.domaine} helperText={errors.domaine?.[0]}
                        placeholder="ex: Telecom, Banking, Energy"
                        inputProps={{ maxLength: 100 }} />
                    <TextField
                        label="Email" type="email" size="small" fullWidth
                        value={form.email} onChange={handleChange('email')} onBlur={handleBlur('email')}
                        error={!!errors.email} helperText={errors.email?.[0]}
                        placeholder="exemple@domaine.com" />
                    <TextField
                        label="Téléphone" type="tel" size="small" fullWidth
                        value={form.telephone} onChange={handlePhoneChange} onBlur={handleBlur('telephone')}
                        error={!!errors.telephone} helperText={errors.telephone?.[0]}
                        placeholder="20 123 456 ou +216 20 123 456" inputProps={{ maxLength: 17 }} />
                    <TextField
                        label="Adresse" size="small" fullWidth multiline rows={2}
                        value={form.adresse} onChange={handleChange('adresse')} onBlur={handleBlur('adresse')}
                        error={!!errors.adresse} helperText={errors.adresse?.[0]}
                        inputProps={{ maxLength: 255 }} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Annuler</Button>
                    <Button variant="contained" onClick={handleSave}
                        disabled={saving || Object.keys(validateClientForm(form)).length > 0}
                        sx={{ textTransform: 'none', fontWeight: 600 }}>
                        {saving ? <CircularProgress size={18} color="inherit" /> : (editing ? 'Enregistrer' : 'Créer')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}