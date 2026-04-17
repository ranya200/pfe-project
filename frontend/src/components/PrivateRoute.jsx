import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

// ✅ Route protégée par connexion (+ rôle optionnel)
export default function PrivateRoute({
    children,
    requiredRole  = null,   // string  → rôle exact requis
    allowedRoles  = null,   // array   → liste de rôles autorisés
    excludedRole  = null,   // string  → rôle interdit
}) {
    const { user, loading } = useAuth()

    // Attendre que le contexte charge (évite le flash de redirection)
    if (loading) return null

    // Pas connecté → login
    if (!user) return <Navigate to="/login" replace />

    // Rôle insuffisant → dashboard
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" replace />
    }

    // Rôle non dans la liste autorisée → dashboard
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />
    }

    // Rôle exclu (ex: admin ne peut pas accéder) → dashboard
    if (excludedRole && user.role === excludedRole) {
        return <Navigate to="/" replace />
    }

    return children
}