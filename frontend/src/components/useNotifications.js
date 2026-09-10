import { useState, useEffect, useRef, useCallback } from 'react'
import AxiosInstance from './AxiosInstance'

function getWsBaseUrl() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    return apiUrl.replace(/^http/, 'ws')
}

export default function useNotifications() {
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount]     = useState(0)
    const wsRef                = useRef(null)
    const reconnectTimeoutRef  = useRef(null)

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await AxiosInstance.get('notifications/')
            setNotifications(res.data)
            setUnreadCount(res.data.filter((n) => !n.is_read).length)
        } catch (e) {
            console.error('Erreur chargement notifications', e)
        }
    }, [])

    const markAsRead = useCallback(async (id) => {
        try {
            await AxiosInstance.patch(`notifications/${id}/mark_as_read/`)
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
            setUnreadCount((prev) => Math.max(0, prev - 1))
        } catch (e) {
            console.error('Erreur mark_as_read', e)
        }
    }, [])

    const markAllAsRead = useCallback(async () => {
        try {
            await AxiosInstance.patch('notifications/mark_all_as_read/')
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (e) {
            console.error('Erreur mark_all_as_read', e)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()

        const token = sessionStorage.getItem('knox_token')
        if (!token) return

        let isUnmounted = false

        function connect() {
            const wsUrl = `${getWsBaseUrl()}/ws/notifications/?token=${token}`
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.notification) {
                        setNotifications((prev) => [data.notification, ...prev])
                        setUnreadCount((prev) => prev + 1)
                    }
                } catch (e) {
                    console.error('Erreur parsing notification WS', e)
                }
            }

            ws.onclose = () => {
                // Reconnexion automatique après 5s (coupure réseau, redémarrage backend, etc.)
                if (!isUnmounted) {
                    reconnectTimeoutRef.current = setTimeout(connect, 5000)
                }
            }

            ws.onerror = () => {
                ws.close()
            }
        }

        connect()

        return () => {
            isUnmounted = true
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
            if (wsRef.current) wsRef.current.close()
        }
    }, [fetchNotifications])

    return { notifications, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications }
}