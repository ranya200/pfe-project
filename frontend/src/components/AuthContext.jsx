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

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)