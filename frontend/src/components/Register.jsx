import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import '../App.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import VisibilityIcon from '@mui/icons-material/Visibility'

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

// Tous les rôles assignables (admin = BDD uniquement via create_superuser)
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

const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '#e0e0e0' }
    let score = 0
    if (pwd.length >= 8)  score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    if (score <= 1) return { score: 1, label: 'Faible', color: '#f44336' }
    if (score === 2) return { score: 2, label: 'Moyen',  color: '#ff9800' }
    if (score === 3) return { score: 3, label: 'Bon',    color: '#2196f3' }
    return              { score: 4, label: 'Fort',   color: '#4caf50' }
}

const Register = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        firstName: '', lastName: '', title: '',
        email: '', phone: '', department: '',
        role: '',   // ✅ nouveau champ
        password: '', image: null,
    })
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors]             = useState({})
    const [serverError, setServerError]   = useState('')
    const [loading, setLoading]           = useState(false)

    const NAME_MAX     = 30
    const EMAIL_MAX    = 50
    const PASSWORD_MAX = 20
    const PHONE_MAX    = 8

    const handleName = (field) => (e) => {
        const val = e.target.value
        if (val.length > NAME_MAX) return
        if (val && !/^[A-Za-zÀ-ÿ\s'-]+$/.test(val)) return
        setForm(prev => ({ ...prev, [field]: val }))
        setErrors(prev => ({ ...prev, [field]: val.length < 2 && val ? 'Minimum 2 caractères' : '' }))
    }

    const handlePhone = (e) => {
        const val = e.target.value
        if (!/^[0-9]*$/.test(val)) return
        if (val.length > PHONE_MAX) return
        setForm(prev => ({ ...prev, phone: val }))
        setErrors(prev => ({ ...prev, phone: val && val.length < PHONE_MAX ? `${val.length}/${PHONE_MAX} chiffres requis` : '' }))
    }

    const handleEmail = (e) => {
        const val = e.target.value
        if (val.length > EMAIL_MAX) return
        setForm(prev => ({ ...prev, email: val }))
        const fmt = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        setErrors(prev => ({ ...prev, email: val && !fmt.test(val) ? 'Email invalide' : '' }))
    }

    const handlePassword = (e) => {
        const val = e.target.value
        if (val.length > PASSWORD_MAX) return
        setForm(prev => ({ ...prev, password: val }))
        setErrors(prev => ({ ...prev, password: val && val.length < 8 ? 'Minimum 8 caractères' : '' }))
    }

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }))
        setErrors(prev => ({ ...prev, [field]: '' }))
    }

    const handleSubmit = async () => {
        setServerError('')
        setLoading(true)

        const data = new FormData()
        data.append('first_name',   form.firstName)
        data.append('last_name',    form.lastName)
        data.append('title',        form.title)
        data.append('email',        form.email)
        data.append('phone_number', form.phone)
        data.append('department',   form.department)
        data.append('role',         form.role)       // ✅ envoi du rôle
        data.append('password',     form.password)
        if (form.image) data.append('image', form.image)

        try {
            await AxiosInstance.post('register/', data)
            navigate('/users')   // ✅ retour vers la liste après création
        } catch (err) {
            if (!err || typeof err !== 'object' || Array.isArray(err)) {
                setServerError('Erreur réseau. Vérifie que le serveur est démarré.')
                return
            }
            const fieldMap = {
                first_name:   'firstName',
                last_name:    'lastName',
                phone_number: 'phone',
                title:        'title',
                department:   'department',
                email:        'email',
                password:     'password',
                image:        'image',
                role:         'role',       // ✅
            }
            const backendErrors = {}
            let generic = ''
            Object.entries(err).forEach(([key, val]) => {
                const msg   = Array.isArray(val) ? val[0] : String(val)
                const front = fieldMap[key]
                if (front) backendErrors[front] = msg
                else if (key !== 'user' && key !== 'message') generic = msg
            })
            if (Object.keys(backendErrors).length) setErrors(backendErrors)
            if (generic) setServerError(generic)
        } finally {
            setLoading(false)
        }
    }

    const strength = getPasswordStrength(form.password)

    return (
        <Box className="login-page">
            <Box className="login-header">
                <Box className="login-logo">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <rect x="4" y="14" width="14" height="14" rx="2" transform="rotate(-45 4 14)" fill="#1976d2"/>
                    </svg>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#222' }}>TelNet</Typography>
                </Box>
            </Box>

            <Box className="login-blob" />

            <Box className="login-card" sx={{ maxWidth: '520px !important' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#222', mb: 3 }}>
                    Ajouter un utilisateur
                </Typography>

                {/* Nom + Prénom */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Prénom*</Typography>
                        <TextField fullWidth size="small"
                            value={form.firstName} onChange={handleName('firstName')}
                            error={!!errors.firstName}
                            helperText={errors.firstName || `${form.firstName.length}/${NAME_MAX}`} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Nom*</Typography>
                        <TextField fullWidth size="small"
                            value={form.lastName} onChange={handleName('lastName')}
                            error={!!errors.lastName}
                            helperText={errors.lastName || `${form.lastName.length}/${NAME_MAX}`} />
                    </Box>
                </Box>

                {/* Titre + Téléphone */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Titre*</Typography>
                        <TextField fullWidth select size="small" value={form.title} onChange={handleChange('title')}
                            error={!!errors.title} helperText={errors.title}>
                            <MenuItem value="MR">Mr</MenuItem>
                            <MenuItem value="MS">Ms</MenuItem>
                        </TextField>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Téléphone*</Typography>
                        <TextField fullWidth placeholder="12345678" size="small"
                            value={form.phone} onChange={handlePhone}
                            error={!!errors.phone}
                            helperText={errors.phone || `${form.phone.length}/${PHONE_MAX} chiffres`} />
                    </Box>
                </Box>

                {/* Email */}
                <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Email*</Typography>
                <TextField fullWidth placeholder="nom@telnet.com" size="small" sx={{ mb: 2 }}
                    value={form.email} onChange={handleEmail}
                    error={!!errors.email}
                    helperText={errors.email || `${form.email.length}/${EMAIL_MAX}`} />

                {/* Département + Rôle — côte à côte */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Département*</Typography>
                        <TextField fullWidth select size="small" value={form.department}
                            onChange={handleChange('department')}
                            error={!!errors.department} helperText={errors.department}>
                            {DEPARTMENT_CHOICES.map(d => (
                                <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        {/* ✅ Champ rôle */}
                        <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Rôle*</Typography>
                        <TextField fullWidth select size="small" value={form.role}
                            onChange={handleChange('role')}
                            error={!!errors.role} helperText={errors.role}>
                            {ROLE_CHOICES.map(r => (
                                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </Box>

                {/* Password */}
                <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Mot de passe*</Typography>
                <TextField fullWidth size="small" sx={{ mb: 1 }}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password} onChange={handlePassword}
                    error={!!errors.password}
                    helperText={errors.password || `${form.password.length}/${PASSWORD_MAX}`}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                        {showPassword ? <VisibilityIcon fontSize="small"/> : <VisibilityOffIcon fontSize="small"/>}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }
                    }}
                />
                {form.password && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#e0e0e0', overflow: 'hidden' }}>
                            <Box sx={{ width: `${(strength.score / 4) * 100}%`, height: '100%',
                                bgcolor: strength.color, transition: 'all 0.3s' }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.8rem', color: strength.color, fontWeight: 600, minWidth: 40 }}>
                            {strength.label}
                        </Typography>
                    </Box>
                )}

                {/* Photo de profil */}
                <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Photo de profil</Typography>
                <Box sx={{
                    border: '1px dashed #bbb', borderRadius: '8px', p: 2, mb: 3,
                    display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer',
                    bgcolor: '#fafafa', '&:hover': { borderColor: '#1976d2', bgcolor: '#f0f7ff' }
                }}
                    onClick={() => document.getElementById('image-upload').click()}>
                    {form.image ? (
                        <img src={URL.createObjectURL(form.image)} alt="preview"
                            style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#e3eaf5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ fontSize: '1.6rem' }}>👤</Typography>
                        </Box>
                    )}
                    <Box>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>
                            {form.image ? form.image.name : 'Cliquer pour choisir une image'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>JPG, PNG — optionnel</Typography>
                    </Box>
                    <input id="image-upload" type="file" accept="image/*" hidden
                        onChange={(e) => setForm(prev => ({ ...prev, image: e.target.files[0] || null }))} />
                </Box>

                {serverError && (
                    <Typography sx={{ color: '#d32f2f', fontSize: '0.85rem', mb: 1.5, textAlign: 'center' }}>
                        {serverError}
                    </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button fullWidth variant="outlined"
                        sx={{ py: 1.2, textTransform: 'none', fontWeight: 600 }}
                        onClick={() => navigate('/users')}>
                        Annuler
                    </Button>
                    <Button fullWidth variant="contained" disabled={loading}
                        sx={{ py: 1.2, textTransform: 'none', fontWeight: 600, borderRadius: '6px' }}
                        onClick={handleSubmit}>
                        {loading ? 'Création...' : 'Créer le compte'}
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

export default Register