import { createContext, useState, useContext, useEffect } from 'react'
import AxiosInstance from './AxiosInstance'

const AuthContext = createContext({
    user: null,
    login: () => {},
    logout: () => {},
    loading: true,
})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Au démarrage : récupère l'user depuis localStorage
    useEffect(() => {
        // ✅ sessionStorage : si le navigateur est fermé → vide automatiquement
        const stored = sessionStorage.getItem('knox_user')
        const token  = sessionStorage.getItem('knox_token')
        if (stored && token) {
            try {
                setUser(JSON.parse(stored))
            } catch {
                sessionStorage.removeItem('knox_user')
                sessionStorage.removeItem('knox_token')
            }
        }
        setLoading(false)
    }, [])

    const login = (userData, token) => {
        sessionStorage.setItem('knox_token', token)
        sessionStorage.setItem('knox_user', JSON.stringify(userData))
        setUser(userData)
    }

    const logout = async () => {
        try {
            await AxiosInstance.post('logout/')
        } finally {
            sessionStorage.removeItem('knox_token')
            sessionStorage.removeItem('knox_user')
            setUser(null)
        }
    }
    const updateUser = (partialData) => {
    setUser(prev => {
        const updated = { ...prev, ...partialData }
        sessionStorage.setItem('knox_user', JSON.stringify(updated))
        return updated
    })
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)