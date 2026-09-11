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
import RiskMap from './modules/risks/pages/RiskMap.jsx'
import RiskDashboard from './modules/risks/pages/RiskDashboard.jsx'
import ActionPlanTracker from './modules/risks/pages/ActionPlanTracker.jsx'
import RiskDetailPage from './modules/risks/pages/RiskDetailPage.jsx'
import RiskGuidePage from './modules/risks/pages/RiskGuidePage.jsx'
import ATListPage from './features/assistanceTechnique/pages/ATListPage.jsx'
import AssistanceTechniquePage from './features/assistanceTechnique/pages/AssistanceTechniquePage.jsx'
import ClientsPage from './components/ClientsPage.jsx'
import AIAnalysisPage from './modules/ai/pages/AIAnalysisPage.jsx'
import BilanActionsProjet from './components/BilanActionsProjet';
import ChatWidget from "./components/ChatWidget";

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
        <>
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
                {/* ── Gestion des Risques → admin, resp_qualite, chef_projet seulement ── */}
                <Route path="/projects/:id/risks" element={
                    <PrivateRoute allowedRoles={['admin', 'resp_qualite', 'chef_projet']}>
                        <Navbar content={<RiskMap />} />
                    </PrivateRoute>
                }/>
                <Route path="/projects/:id/risks/dashboard" element={
                    <PrivateRoute allowedRoles={['admin', 'resp_qualite', 'chef_projet']}>
                        <Navbar content={<RiskDashboard />} />
                    </PrivateRoute>
                }/>
                <Route path="/projects/:id/risks/action-plans" element={
                    <PrivateRoute allowedRoles={['admin', 'resp_qualite', 'chef_projet']}>
                        <Navbar content={<ActionPlanTracker />} />
                    </PrivateRoute>
                }/>
                <Route path="/projects/:id/risks/guide" element={
                    <PrivateRoute allowedRoles={['admin', 'resp_qualite', 'chef_projet']}>
                        <Navbar content={<RiskGuidePage />} />
                    </PrivateRoute>
                }/>
                <Route path="/projects/:projectId/risks/:riskId" element={
                    <PrivateRoute allowedRoles={['admin', 'resp_qualite', 'chef_projet']}>
                        <Navbar content={<RiskDetailPage />} />
                    </PrivateRoute>
                }/>
                {/* ── Bilan d'actions globales → admin, resp_qualite, chef_projet seulement ── */}
                <Route path="/projects/:id/bilan-actions" element={
                    <PrivateRoute allowedRoles={['admin', 'resp_qualite', 'chef_projet']}>
                        <Navbar content={<BilanActionsProjet />} />
                    </PrivateRoute>
                }/>
                {/* ── Assistance Technique ── */}
                <Route path="/projects/:projectId/assistance-technique" element={
                    <PrivateRoute allowedRoles={['admin', 'resp_qualite', 'chef_projet']}>
                        <Navbar content={<ATListPage />} />
                    </PrivateRoute>
                }/>


                {/* ── Module IA ── */}
                <Route path="/projects/:projectId/ai-analysis" element={
                    <PrivateRoute allowedRoles={['admin', 'resp_qualite', 'chef_projet']}>
                        <Navbar content={<AIAnalysisPage />} />
                    </PrivateRoute>
                }/>
                <Route path="/projects/:projectId/assistance-technique/:id" element={
                    <PrivateRoute allowedRoles={['admin', 'resp_qualite', 'chef_projet']}>
                        <Navbar content={<AssistanceTechniquePage />} />
                    </PrivateRoute>
                }/>
                {/* ── Clients ── */}
                <Route path="/clients" element={
                    <PrivateRoute><Navbar content={<ClientsPage />} /></PrivateRoute>
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
            <ChatWidget />
        </>
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