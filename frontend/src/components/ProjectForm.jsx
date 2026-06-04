import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import OutlinedInput from '@mui/material/OutlinedInput'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'

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

const LANGAGES_LIST   = ['C', 'C++', 'Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'PHP', 'C#', 'Swift', 'Kotlin', 'Ruby', 'Rust', 'VHDL', 'Assembly']
const OS_OUTILS_LIST  = ['Linux embarqué', 'Windows', 'macOS', 'Android', 'FreeRTOS', 'Script Shell', 'Git', 'GDB', 'Docker', 'Kubernetes', 'Jenkins', 'VSCode', 'Eclipse']
const METIER_GEN_LIST = ['Networking & Protocoles', 'IPv4/6', 'WiFi', 'Bluetooth', 'CAN Bus', 'UART/SPI/I2C', 'PCB', 'Data modele', 'SSW', 'IoT', 'Temps réel', 'Sécurité embarquée']
const METIER_SPEC_LIST= ['PCB design', 'Data modele client', 'SSW client', 'Protocole propriétaire', 'API client', 'Base de données client', 'Workflow métier']
const DEVOPS_LIST     = ['Python', 'Docker', 'GIT', 'CI/CD', 'Jenkins', 'GitLab CI', 'Ansible', 'Terraform', 'SonarQube', 'Grafana', 'Prometheus']
const MANAGEMENT_LIST = ['Agile (Scrum/Kanban)', 'Gestion équipe', 'Gestion Projet', 'PRINCE2', 'PMP', 'Risk Management', 'Code Review', 'Documentation']

// Composant Select multiple réutilisable
const MultiSelect = ({ label, options, value, onChange }) => (
    <FormControl fullWidth size="small">
        <InputLabel>{label}</InputLabel>
        <Select multiple value={value} onChange={onChange}
            input={<OutlinedInput label={label} />}
            renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(v => <Chip key={v} label={v} size="small" />)}
                </Box>
            )}>
            {options.map(opt => (
                <MenuItem key={opt} value={opt}>
                    <Checkbox checked={value.includes(opt)} size="small" />
                    <ListItemText primary={opt} />
                </MenuItem>
            ))}
        </Select>
    </FormControl>
)

const SectionTitle = ({ children }) => (
    <Typography sx={{
        fontWeight: 700, color: '#1976d2', mb: 2, mt: 3,
        fontSize: '0.95rem', borderBottom: '2px solid #e3f2fd', pb: 1
    }}>
        {children}
    </Typography>
)

const ProjectForm = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        nom_projet: '', client: '', type_projet: '', departement: '',
        langages: [], os_outils: [], metier_generique: [],
        metier_specifique: [], devops: [], management: [],
        membres: [],
    })
    const [deptUsers, setDeptUsers] = useState([])
    const [errors, setErrors]       = useState({})
    const [loading, setLoading]     = useState(false)

    // Charger les users du département sélectionné
    useEffect(() => {
        if (!form.departement) { setDeptUsers([]); return }
        AxiosInstance.get(`users-by-dept/${form.departement}/`)
            .then(res => setDeptUsers(res.data))
            .catch(() => setDeptUsers([]))
    }, [form.departement])

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }))
        setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const handleMulti = (field) => (e) => {
        const val = typeof e.target.value === 'string'
            ? e.target.value.split(',') : e.target.value
        setForm(prev => ({ ...prev, [field]: val }))
    }

    const toggleMembre = (userId) => {
        setForm(prev => ({
            ...prev,
            membres: prev.membres.includes(userId)
                ? prev.membres.filter(id => id !== userId)
                : [...prev.membres, userId]
        }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        setErrors({})
        try {
            await AxiosInstance.post('projects/', form)
            navigate('/projects')
        } catch (err) {
            if (err && typeof err === 'object') setErrors(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ p: 3, maxWidth: 820, mx: 'auto' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Nouveau Projet</Typography>
            <Typography sx={{ color: '#888', fontSize: '0.88rem', mb: 2 }}>
                La REF projet sera générée automatiquement · Phase par défaut : IDLE
            </Typography>

            {/* ── Infos générales ── */}
            <SectionTitle>Informations générales</SectionTitle>

            <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Nom du projet*</Typography>
                <TextField fullWidth size="small" placeholder="Nom du projet"
                    value={form.nom_projet} onChange={handleChange('nom_projet')}
                    error={!!errors.nom_projet} helperText={errors.nom_projet?.[0]} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 2 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Client*</Typography>
                    <TextField fullWidth size="small" placeholder="Nom du client"
                        value={form.client} onChange={handleChange('client')}
                        error={!!errors.client} helperText={errors.client?.[0]} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Type de projet*</Typography>
                    <TextField fullWidth select size="small"
                        value={form.type_projet} onChange={handleChange('type_projet')}
                        error={!!errors.type_projet} helperText={errors.type_projet?.[0]}>
                        <MenuItem value="forfait">Forfait</MenuItem>
                        <MenuItem value="assistance">Assistance Technique</MenuItem>
                    </TextField>
                </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Activité / Département*</Typography>
                <TextField fullWidth select size="small"
                    value={form.departement} onChange={handleChange('departement')}
                    error={!!errors.departement} helperText={errors.departement?.[0]}>
                    {DEPARTMENT_CHOICES.map(d => (
                        <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* ── Compétences ── */}
            <SectionTitle>Compétences projet</SectionTitle>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Langages de programmation</Typography>
                    <MultiSelect label="Langages" options={LANGAGES_LIST}
                        value={form.langages} onChange={handleMulti('langages')} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>OS & Outils</Typography>
                    <MultiSelect label="OS & Outils" options={OS_OUTILS_LIST}
                        value={form.os_outils} onChange={handleMulti('os_outils')} />
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Connaissances métier génériques</Typography>
                    <MultiSelect label="Métier générique" options={METIER_GEN_LIST}
                        value={form.metier_generique} onChange={handleMulti('metier_generique')} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Connaissances métier spécifiques client</Typography>
                    <MultiSelect label="Métier spécifique" options={METIER_SPEC_LIST}
                        value={form.metier_specifique} onChange={handleMulti('metier_specifique')} />
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>DevOps</Typography>
                    <MultiSelect label="DevOps" options={DEVOPS_LIST}
                        value={form.devops} onChange={handleMulti('devops')} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Management</Typography>
                    <MultiSelect label="Management" options={MANAGEMENT_LIST}
                        value={form.management} onChange={handleMulti('management')} />
                </Box>
            </Box>

            {/* ── Composition équipe ── */}
            <SectionTitle>Composition de l'équipe</SectionTitle>

            {!form.departement ? (
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '8px', mb: 2,
                    border: '1px dashed #ddd', textAlign: 'center' }}>
                    <Typography sx={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.88rem' }}>
                        Sélectionnez d'abord un département pour voir les membres disponibles.
                    </Typography>
                </Box>
            ) : deptUsers.length === 0 ? (
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: '8px', mb: 2,
                    border: '1px dashed #ddd', textAlign: 'center' }}>
                    <Typography sx={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.88rem' }}>
                        Aucun utilisateur dans ce département.
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                    {deptUsers.map(u => {
                        const selected = form.membres.includes(u.id)
                        return (
                            <Box key={u.id} onClick={() => toggleMembre(u.id)} sx={{
                                display: 'flex', alignItems: 'center', gap: 1.2,
                                px: 1.5, py: 0.8, borderRadius: '10px', cursor: 'pointer',
                                border: selected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                bgcolor: selected ? '#e3f2fd' : '#fff',
                                transition: 'all 0.15s',
                                '&:hover': { borderColor: '#1976d2' }
                            }}>
                                <Avatar
                                    src={u.image ? `http://localhost:8000${u.image}` : undefined}
                                    sx={{ width: 32, height: 32, bgcolor: '#1976d2', fontSize: '0.78rem' }}>
                                    {!u.image && `${u.first_name?.[0]}${u.last_name?.[0]}`}
                                </Avatar>
                                <Box>
                                    <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, lineHeight: 1.2 }}>
                                        {u.first_name} {u.last_name}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.73rem', color: '#888' }}>
                                        {u.role === 'chef_projet' ? 'Chef Projet' : 'Resp. Qualité'}
                                    </Typography>
                                </Box>
                                {selected && (
                                    <Typography sx={{ color: '#1976d2', fontSize: '0.9rem', ml: 0.5 }}>✓</Typography>
                                )}
                            </Box>
                        )
                    })}
                </Box>
            )}

            {form.membres.length > 0 && (
                <Typography sx={{ fontSize: '0.82rem', color: '#1976d2', mb: 2 }}>
                    ✓ {form.membres.length} membre(s) sélectionné(s)
                </Typography>
            )}

            {/* Boutons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button fullWidth variant="outlined"
                    sx={{ py: 1.2, textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                    onClick={() => navigate('/projects')}>
                    Annuler
                </Button>
                <Button fullWidth variant="contained" disabled={loading}
                    sx={{ py: 1.2, textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                    onClick={handleSubmit}>
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Créer le projet'}
                </Button>
            </Box>
        </Box>
    )
}

export default ProjectForm