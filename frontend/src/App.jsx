import './App.css'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Register  from './components/Register.jsx'
import Home      from './components/Home.jsx'
import Login     from './components/Login.jsx'
import Navbar    from './components/Navbar.jsx'
import Personal  from './components/Personal.jsx'
import Projects  from './components/Projects.jsx'
import Users     from './components/Users.jsx'
import ProjectForm     from './components/ProjectForm.jsx'
import ProjectDetail   from './components/ProjectDetail.jsx'
import RCTPage         from './components/RCTPage.jsx'
import FRPFormPage     from './components/FRPForm.jsx'
import FROFormPage     from './components/FROForm.jsx'
import AuditDashboard  from './components/AuditDashboard.jsx'

function AppContent() {
    const location = useLocation()
    const noNavbar = location.pathname === '/login' || location.pathname === '/register'

    return noNavbar ? (
        <Routes>
            {/* ✅ Page login accessible sans connexion */}
            <Route path="/login" element={<Login />} />

            {/* ✅ /register → admin seulement */}
            <Route path="/register" element={
                <PrivateRoute requiredRole="admin">
                    <Register />
                </PrivateRoute>
            }/>

            {/* ✅ Toute autre route inconnue → login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    ) : (
        <Routes>
            {/* ✅ Toutes les pages internes → connexion obligatoire */}
            <Route path="/" element={
                <PrivateRoute>
                    <Navbar content={<Home />} />
                </PrivateRoute>
            }/>
            <Route path="/personal-infos" element={
                <PrivateRoute excludedRole="admin">
                    <Navbar content={<Personal />} />
                </PrivateRoute>
            }/>
            {/* ── Projets ── */}
            <Route path="/projects" element={
                <PrivateRoute><Navbar content={<Projects />} /></PrivateRoute>
            }/>
            <Route path="/projects/new" element={
                <PrivateRoute requiredRole="admin">
                    <Navbar content={<ProjectForm />} />
                </PrivateRoute>
            }/>
            <Route path="/projects/:id" element={
                <PrivateRoute><Navbar content={<ProjectDetail />} /></PrivateRoute>
            }/>
            <Route path="/projects/:id/rct" element={
                <PrivateRoute><Navbar content={<RCTPage />} /></PrivateRoute>
            }/>
            <Route path="/projects/:id/rct/frp" element={
                <PrivateRoute><Navbar content={<FRPFormPage />} /></PrivateRoute>
            }/>
            <Route path="/projects/:id/rct/fro" element={
                <PrivateRoute><Navbar content={<FROFormPage />} /></PrivateRoute>
            }/>
            {/* ✅ /users → admin seulement */}
            <Route path="/users" element={
                <PrivateRoute requiredRole="admin">
                    <Navbar content={<Users />} />
                </PrivateRoute>
            }/>
            {/* ✅ /audit → admin seulement — Journal d'audit ISO 9001/27001 */}
            <Route path="/audit" element={
                <PrivateRoute requiredRole="admin">
                    <Navbar content={<AuditDashboard />} />
                </PrivateRoute>
            }/>

            {/* ✅ Route inconnue → dashboard (qui redirige vers login si pas connecté) */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    )
}

export default App