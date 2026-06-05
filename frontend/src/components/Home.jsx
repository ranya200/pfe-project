import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import { useAuth } from './AuthContext'

const ROLE_LABELS = {
    admin:          'Administrateur',
    chef_projet:    'Chef de Projet',
    resp_qualite:   'Responsable Qualité',
}

const ROLE_COLORS = {
    admin:        'error',
    chef_projet:  'primary',
    resp_qualite: 'success',
}

const Home = () => {
    const { user } = useAuth()

    if (!user) return null

    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()

    return (
        <Box sx={{ p: 4 }}>
            {/* Carte de bienvenue */}
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 3,
                bgcolor: '#f0f7ff', borderRadius: '16px',
                p: 4, mb: 4, border: '1px solid #d0e8ff'
            }}>
                <Avatar sx={{ width: 72, height: 72, bgcolor: '#1976d2', fontSize: '1.8rem' }}>
                    {user.image
                        ? <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.image}`} alt="profil"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : initials
                    }
                </Avatar>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1565c0' }}>
                        Bonjour, {user.first_name} {user.last_name} 👋
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                        <Typography sx={{ color: '#555', fontSize: '0.95rem' }}>
                            {user.email}
                        </Typography>
                        <Chip
                            label={ROLE_LABELS[user.role] || user.role}
                            color={ROLE_COLORS[user.role] || 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                        />
                    </Box>
                    <Typography sx={{ color: '#777', fontSize: '0.9rem', mt: 0.5 }}>
                        Département : {user.department}
                    </Typography>
                </Box>
            </Box>

            {/* Cartes stats rapides */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
                {[
                    { label: 'Projets actifs',       value: '—', color: '#1976d2' },
                    { label: 'Tâches en cours',      value: '—', color: '#388e3c' },
                    { label: 'Non-conformités',      value: '—', color: '#f57c00' },
                ].map((card) => (
                    <Box key={card.label} sx={{
                        bgcolor: '#fff', borderRadius: '12px',
                        p: 3, border: '1px solid #e0e0e0',
                        borderLeft: `4px solid ${card.color}`
                    }}>
                        <Typography sx={{ fontSize: '0.9rem', color: '#777', mb: 1 }}>{card.label}</Typography>
                        <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: card.color }}>{card.value}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}

export default Home