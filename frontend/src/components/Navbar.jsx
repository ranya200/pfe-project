import { useState } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import AppBar from '@mui/material/AppBar'
import CssBaseline from '@mui/material/CssBaseline'
import Toolbar from '@mui/material/Toolbar'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import FormatListBulletedAddIcon from '@mui/icons-material/FormatListBulletedAdd'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import LogoutIcon from '@mui/icons-material/Logout'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SecurityIcon from '@mui/icons-material/Security'
import BusinessIcon from '@mui/icons-material/Business'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import NotificationBell from './NotificationBell'

const drawerWidth = 240

export default function Navbar({ content }) {
    const location  = useLocation()
    const navigate  = useNavigate()
    const { user, logout } = useAuth()
    const path      = location.pathname

    const [anchorEl, setAnchorEl] = useState(null)

    const handleLogout = async () => {
        setAnchorEl(null)
        await logout()
        navigate('/login')
    }

    const initials = user
        ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
        : ''

    const navItems = [
        { to: '/',          label: 'Dashboard',        icon: <DashboardIcon /> },
        // Informations : masqué pour l'admin
        ...(user?.role !== 'admin'
            ? [{ to: '/personal-infos', label: 'Informations', icon: <AccountCircleIcon /> }]
            : []),
        { to: '/projects',  label: 'Liste des Projets', icon: <FormatListBulletedAddIcon /> },
        { to: '/clients',   label: 'Clients',           icon: <BusinessIcon /> },
        // Utilisateurs + Audit : visibles uniquement pour l'admin
        ...(user?.role === 'admin'
            ? [
                { to: '/users', label: 'Utilisateurs', icon: <GroupAddIcon /> },
                { to: '/audit', label: 'Journal d\'audit', icon: <SecurityIcon /> },
              ]
            : []),
    ]

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            {/* ── AppBar ── */}
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <img src="/logo192.png" alt="TelTrack" style={{ width: 32, height: 32, borderRadius: 8 }} />
                        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
                            TelTrack
                        </Typography>
                    </Box>

                    {/* Notifications + Avatar + menu déconnexion */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationBell />
                        <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>
                            {user?.first_name} {user?.last_name}
                        </Typography>
                        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#fff', color: '#1976d2', fontWeight: 700, fontSize: '0.9rem' }}>
                                {initials}
                            </Avatar>
                        </IconButton>
                    </Box>

                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography sx={{ fontWeight: 600 }}>{user?.first_name} {user?.last_name}</Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>{user?.email}</Typography>
                        </Box>
                        <Divider />
                        <MenuItem onClick={handleLogout} sx={{ color: '#d32f2f', gap: 1 }}>
                            <LogoutIcon fontSize="small" /> Se déconnecter
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* ── Drawer ── */}
            <Drawer variant="permanent" sx={{
                width: drawerWidth, flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}>
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {navItems.map((item) => (
                            <ListItem key={item.to} disablePadding>
                                <ListItemButton component={Link} to={item.to} selected={path === item.to}>
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>

            {/* ── Contenu ── */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                {content}
            </Box>
        </Box>
    )
}