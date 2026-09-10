import { useState } from 'react'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Menu from '@mui/material/Menu'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import CircleIcon from '@mui/icons-material/Circle'
import { useNavigate } from 'react-router-dom'
import useNotifications from './useNotifications'

function timeAgo(dateStr) {
    const diffMs  = Date.now() - new Date(dateStr).getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return "À l'instant"
    if (diffMin < 60) return `il y a ${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `il y a ${diffH} h`
    const diffJ = Math.floor(diffH / 24)
    return `il y a ${diffJ} j`
}

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
    const [anchorEl, setAnchorEl] = useState(null)
    const navigate = useNavigate()

    const handleClickNotif = (notif) => {
        if (!notif.is_read) markAsRead(notif.id)
        setAnchorEl(null)
        if (notif.link_url) navigate(notif.link_url)
    }

    return (
        <>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ color: '#fff' }}>
                <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsNoneOutlinedIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { width: 380, maxHeight: 480, mt: 1 } }}
            >
                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 700 }}>Notifications</Typography>
                    {unreadCount > 0 && (
                        <Button size="small" onClick={markAllAsRead} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                            Tout marquer comme lu
                        </Button>
                    )}
                </Box>
                <Divider />

                {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography sx={{ color: '#98A2B3', fontSize: '0.85rem' }}>Aucune notification.</Typography>
                    </Box>
                ) : (
                    notifications.slice(0, 20).map((n) => (
                        <Box
                            key={n.id}
                            onClick={() => handleClickNotif(n)}
                            sx={{
                                display: 'flex', gap: 1, px: 2, py: 1.25, cursor: 'pointer',
                                bgcolor: n.is_read ? 'transparent' : '#eff6ff',
                                '&:hover': { bgcolor: '#F5F6F9' },
                                borderBottom: '1px solid #F0F1F5',
                            }}
                        >
                            {!n.is_read && (
                                <CircleIcon sx={{ fontSize: 8, color: '#1976d2', mt: 0.7, flexShrink: 0 }} />
                            )}
                            <Box sx={{ minWidth: 0, ml: n.is_read ? '16px' : 0 }}>
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: n.is_read ? 500 : 700, color: '#101828' }}>
                                    {n.title}
                                </Typography>
                                <Typography sx={{ fontSize: '0.78rem', color: '#667085', mt: 0.2 }} noWrap>
                                    {n.message}
                                </Typography>
                                <Typography sx={{ fontSize: '0.68rem', color: '#98A2B3', mt: 0.3 }}>
                                    {timeAgo(n.created_at)}
                                </Typography>
                            </Box>
                        </Box>
                    ))
                )}
            </Menu>
        </>
    )
}