import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

const DEPT_LABELS = {
    MEDIA: 'Média & Énergie', SPACE: 'Space', BE: 'BE Electronique',
    MONETIQUE: 'Monétique', SI: 'SI', TELECOM: 'Télécom',
    RH: 'RH', QUALITE: 'Qualité', ADMIN: 'Admin',
}

const Row = ({ label, children }) => (
    <Box sx={{ display: 'flex', py: 1.2, borderBottom: '1px solid #f0f0f0' }}>
        <Typography sx={{ width: 210, fontWeight: 700, fontSize: '0.88rem', color: '#222', flexShrink: 0 }}>
            {label}
        </Typography>
        <Box sx={{ flex: 1 }}>{children}</Box>
    </Box>
)

const Personal = () => {
    const { user }                    = useAuth()
    const [projects, setProjects]     = useState([])
    const [projLoading, setProjLoading] = useState(true)

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

    return (
        <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>

            {/* ── Header : avatar + nom ── */}
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 4,
                border: '1px solid #e0e0e0', borderRadius: '14px',
                p: 3, mb: 4, bgcolor: '#fafafa',
            }}>
                <Avatar
                    src={user.image ? `http://localhost:8000${user.image}` : undefined}
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

                    <Row label="Activité / Département">
                        <Typography sx={{ fontSize: '0.88rem', color: '#d32f2f', fontWeight: 600 }}>
                            {deptLabel}
                        </Typography>
                    </Row>

                    <Row label="Projet en cours">
                        {projLoading ? (
                            <Typography sx={{ fontSize: '0.85rem', color: '#aaa' }}>Chargement...</Typography>
                        ) : projects.filter(p => p.phase === 'Realisation').length === 0 ? (
                            <Typography sx={{ fontSize: '0.85rem', color: '#aaa', fontStyle: 'italic' }}>
                                Aucun projet en phase de réalisation
                            </Typography>
                        ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                {projects
                                    .filter(p => p.phase === 'Realisation')
                                    .map(p => (
                                        <Chip key={p.id} label={`${p.ref_projet} — ${p.client}`}
                                            size="small" variant="outlined"
                                            sx={{ fontSize: '0.78rem', color: '#d32f2f', borderColor: '#d32f2f' }} />
                                    ))}
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