import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import { useAuth } from './AuthContext'
import '../App.css'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CircularProgress from '@mui/material/CircularProgress'
import { Link } from 'react-router-dom'

const Login = () => {
    const navigate = useNavigate()
    const { login } = useAuth()

    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail]               = useState('')
    const [password, setPassword]         = useState('')
    const [serverError, setServerError]   = useState('')
    const [loading, setLoading]           = useState(false)

    // ── Plus de contrôles saisie côté frontend — le backend gère tout ──
    const handleSubmit = async () => {
        setServerError('')
        setLoading(true)
        try {
            const res = await AxiosInstance.post('login/', { email, password })
            // Sauvegarde token + user via AuthContext
            login(res.data.user, res.data.token)
            navigate('/')
        } catch (err) {
            if (!err || typeof err !== 'object') {
                setServerError('Erreur réseau. Vérifie que le serveur est démarré.')
            } else if (err.locked_until) {
                setServerError(err.error)
            } else {
                const msg = err.error || err.non_field_errors?.[0] || 'Email ou mot de passe incorrect.'
                const attemptsLeft = err.attempts_left !== undefined ? ` (${err.attempts_left} tentative(s) restante(s))` : ''
                setServerError(msg + attemptsLeft)
            }
        } finally {
            setLoading(false)
        }
    }

    // Soumettre avec la touche Entrée
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit()
    }

    return (
        <Box className="login-page">
            <Box className="login-header">
                <Box className="login-logo">
                    <img src="/logo192.png" alt="TelTrack" style={{ width: 28, height: 28, borderRadius: 6 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#222' }}>
                        TelTrack
                    </Typography>
                </Box>
            </Box>

            <Box className="login-blob" />

            <Box className="login-card">
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#222', mb: 3 }}>
                    Login
                </Typography>

                <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Email Address</Typography>
                <TextField
                    fullWidth
                    placeholder="nom@telnet.com"
                    size="small"
                    sx={{ mb: 2 }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="email"
                />

                <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.5 }}>Password</Typography>
                <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    size="small"
                    sx={{ mb: 2 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="current-password"
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                        {showPassword
                                            ? <VisibilityIcon fontSize="small"/>
                                            : <VisibilityOffIcon fontSize="small"/>}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }
                    }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <FormControlLabel
                        control={<Checkbox size="small" />}
                        label={<Typography sx={{ fontSize: '0.85rem', color: '#555' }}>Keep me sign in</Typography>}
                    />
                    <Link to="#" style={{ color: '#d4820a', textDecoration: 'none', fontSize: '0.85rem' }}>
                        Forgot Password?
                    </Link>
                </Box>

                {serverError && (
                    <Typography sx={{ color: '#d32f2f', fontSize: '0.85rem', mb: 1.5, textAlign: 'center' }}>
                        {serverError}
                    </Typography>
                )}

                <Button
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{ py: 1.2, textTransform: 'none', fontWeight: 600, fontSize: '1rem', borderRadius: '6px' }}
                    onClick={handleSubmit}
                >
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Login'}
                </Button>
            </Box>

            <Box className="login-footer">
                <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>TelTrack © 2026</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <a href="#" style={{ color: '#555', textDecoration: 'none', fontSize: '0.8rem' }}>Terms and Conditions</a>
                    <a href="#" style={{ color: '#555', textDecoration: 'none', fontSize: '0.8rem' }}>Privacy Policy</a>
                </Box>
            </Box>
        </Box>
    )
}

export default Login