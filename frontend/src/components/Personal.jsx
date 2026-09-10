import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

const DEPT_LABELS = {
    MEDIA: 'Média & Énergie', SPACE: 'Space', BE: 'BE Electronique',
    MONETIQUE: 'Monétique', SI: 'SI', TELECOM: 'Télécom',
    RH: 'RH', QUALITE: 'Qualité', ADMIN: 'Admin',
}

// Phases qui indiquent qu'un projet est actif (démarré, pas encore archivé)
const ACTIVE_PHASES = ['Kickoff', 'Realisation', 'Cloture']

const Row = ({ label, children }) => (
    <Box sx={{ display: 'flex', py: 1.2, borderBottom: '1px solid #f0f0f0' }}>
        <Typography sx={{ width: 210, fontWeight: 700, fontSize: '0.88rem', color: '#222', flexShrink: 0 }}>
            {label}
        </Typography>
        <Box sx={{ flex: 1 }}>{children}</Box>
    </Box>
)

const Personal = () => {
    const { user, updateUser }          = useAuth()
    const [projects, setProjects]       = useState([])
    const [projLoading, setProjLoading] = useState(true)
    const [savingNotif, setSavingNotif] = useState(false)

    useEffect(() => {
        AxiosInstance.get('projects/')
            .then(res => setProjects(res.data))
            .catch(() => setProjects([]))
            .finally(() => setProjLoading(false))
    }, [])

    if (!user) return null

    const titleLabel = user.title === 'MR' ? 'Mr.' : 'Ms.'
    const deptLabel  = DEPT_LABELS[user.department] || user.department
    const roleLabel  = user.role === 'chef_projet' ? 'Chef de Projet' : 'Responsable Qualité'
    const regNumber  = String(user.id).padStart(4, '0')

    // Projets actifs : du Kickoff jusqu'à Cloture inclus (l'user en fait partie)
    const activeProjects = projects.filter(p => ACTIVE_PHASES.includes(p.phase))

    const handleToggleEmailNotif = (event) => {
        const newValue = event.target.checked
        const previousValue = user.email_notifications_enabled
        updateUser({ email_notifications_enabled: newValue })   // optimiste
        setSavingNotif(true)

        AxiosInstance.patch(`me/${user.id}/`, { email_notifications_enabled: newValue })
            .catch(() => updateUser({ email_notifications_enabled: previousValue }))   // rollback si échec
            .finally(() => setSavingNotif(false))

    }

    return (
        <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>

            {/* ── Header : avatar + nom ── */}
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 4,
                border: '1px solid #e0e0e0', borderRadius: '14px',
                p: 3, mb: 4, bgcolor: '#fafafa',
            }}>
                <Avatar
                    src={user.image ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.image}` : undefined}
                    sx={{ width: 90, height: 90, bgcolor: '#1976d2', fontSize: '2rem',
                          border: '2px solid #d0e8ff' }}
                />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#111' }}>
                    {user.first_name} {user.last_name}
                </Typography>
            </Box>

            {/* ── Section Personal info ── */}
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: '14px', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#f5f5f5', px: 3, py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Personal info</Typography>
                </Box>

                <Box sx={{ px: 4, py: 2 }}>
                    <Row label="Title">
                        <Typography sx={{ fontSize: '0.88rem', color: '#333' }}>{titleLabel}</Typography>
                    </Row>

                    <Row label="Last Name">
                        <Typography sx={{ fontSize: '0.88rem', color: '#333' }}>{user.last_name}</Typography>
                    </Row>

                    <Row label="First Name">
                        <Typography sx={{ fontSize: '0.88rem', color: '#333' }}>{user.first_name}</Typography>
                    </Row>

                    <Row label="Registration number">
                        <Typography sx={{ fontSize: '0.88rem', color: '#333' }}>{regNumber}</Typography>
                    </Row>

                    <Row label="Email">
                        <Typography sx={{ fontSize: '0.88rem', color: '#333' }}>{user.email}</Typography>
                    </Row>

                    <Row label="Notifications par mail">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={user.email_notifications_enabled ?? true}
                                    onChange={handleToggleEmailNotif}
                                    disabled={savingNotif}
                                    color="primary"
                                />
                            }
                            label={user.email_notifications_enabled ? 'Activées' : 'Désactivées'}
                            sx={{ ml: 0 }}
                        />
                    </Row>

                    <Row label="Activité / Département">
                        <Typography sx={{ fontSize: '0.88rem', color: '#d32f2f', fontWeight: 600 }}>
                            {deptLabel}
                        </Typography>
                    </Row>

                    {/* ── Projets en cours (Kickoff → Cloture) ── */}
                    <Row label="Projet en cours">
                        {projLoading ? (
                            <Typography sx={{ fontSize: '0.85rem', color: '#aaa' }}>Chargement...</Typography>
                        ) : activeProjects.length === 0 ? (
                            <Typography sx={{ fontSize: '0.85rem', color: '#aaa', fontStyle: 'italic' }}>
                                Aucun projet en cours
                            </Typography>
                        ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                {activeProjects.map(p => {
                                    const isTermine = p.phase === 'Cloture'
                                    return (
                                        <Chip
                                            key={p.id}
                                            label={`${p.ref_projet} — ${p.client}${isTermine ? ' ✓' : ''}`}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                fontSize: '0.78rem',
                                                color:       isTermine ? '#2e7d32' : '#d32f2f',
                                                borderColor: isTermine ? '#2e7d32' : '#d32f2f',
                                                bgcolor:     isTermine ? '#f1f8f1' : 'transparent',
                                            }}
                                        />
                                    )
                                })}
                            </Box>
                        )}
                    </Row>

                    <Row label="Rôle Projet - client">
                        <Typography sx={{ fontSize: '0.88rem', color: '#d32f2f', fontWeight: 600 }}>
                            {roleLabel}
                        </Typography>
                    </Row>
                </Box>
            </Box>

            <Divider sx={{ mt: 4 }} />
            <Typography sx={{ mt: 1.5, fontSize: '0.78rem', color: '#bbb', textAlign: 'right' }}>
                Membre depuis le {new Date(user.date_joined).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                })}
            </Typography>
        </Box>
    )
}

export default Personal