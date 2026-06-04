import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import { useAuth } from './AuthContext'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import OutlinedInput from '@mui/material/OutlinedInput'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import ArticleIcon from '@mui/icons-material/Article'
import DeleteIcon from '@mui/icons-material/Delete'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EngineeringIcon from '@mui/icons-material/Engineering'

const PHASE_COLORS = {
    IDLE: 'default', Offre: 'warning',
    Kickoff: 'info', Realisation: 'primary', Cloture: 'success',
}

const LOCKED_PHASES = ['Archive', 'Kickoff', 'Realisation', 'Cloture']

const DEPARTMENT_CHOICES = [
    { value: 'MEDIA',     label: 'Média & Énergie' },
    { value: 'SPACE',     label: 'Space' },
    { value: 'BE',        label: 'BE Electronique' },
    { value: 'MONETIQUE', label: 'Monétique' },
    { value: 'SI',        label: 'SI' },
    { value: 'TELECOM',   label: 'Télécom' },
    { value: 'RH',        label: 'RH' },
    { value: 'QUALITE',   label: 'Qualité' },
    { value: 'ADMIN',     label: 'Admin' },
]
const LANGAGES_LIST    = ['C', 'C++', 'Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'PHP', 'C#', 'Swift', 'Kotlin', 'Ruby', 'Rust', 'VHDL', 'Assembly']
const OS_OUTILS_LIST   = ['Linux embarqué', 'Windows', 'macOS', 'Android', 'FreeRTOS', 'Script Shell', 'Git', 'GDB', 'Docker', 'Kubernetes', 'Jenkins', 'VSCode', 'Eclipse']
const METIER_GEN_LIST  = ['Networking & Protocoles', 'IPv4/6', 'WiFi', 'Bluetooth', 'CAN Bus', 'UART/SPI/I2C', 'PCB', 'Data modele', 'SSW', 'IoT', 'Temps réel', 'Sécurité embarquée']
const METIER_SPEC_LIST = ['PCB design', 'Data modele client', 'SSW client', 'Protocole propriétaire', 'API client', 'Base de données client', 'Workflow métier']
const DEVOPS_LIST      = ['Python', 'Docker', 'GIT', 'CI/CD', 'Jenkins', 'GitLab CI', 'Ansible', 'Terraform', 'SonarQube', 'Grafana', 'Prometheus']
const MANAGEMENT_LIST  = ['Agile (Scrum/Kanban)', 'Gestion équipe', 'Gestion Projet', 'PRINCE2', 'PMP', 'Risk Management', 'Code Review', 'Documentation']

const MultiSelect = ({ label, options, value, onChange }) => (
    <FormControl fullWidth size="small">
        <InputLabel>{label}</InputLabel>
        <Select multiple value={value} onChange={onChange}
            input={<OutlinedInput label={label} />}
            renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(v => <Chip key={v} label={v} size="small" />)}
                </Box>
            )}>
            {options.map(opt => (
                <MenuItem key={opt} value={opt}>
                    <Checkbox checked={value.includes(opt)} size="small" />
                    <ListItemText primary={opt} />
                </MenuItem>
            ))}
        </Select>
    </FormControl>
)

const SectionTitle = ({ children }) => (
    <Typography sx={{
        fontWeight: 700, color: '#1976d2', mb: 2, mt: 3,
        fontSize: '0.95rem', borderBottom: '2px solid #e3f2fd', pb: 1,
    }}>
        {children}
    </Typography>
)

// Composant pour afficher une liste de compétences
const CompSection = ({ title, items }) => {
    if (!items?.length) return null
    return (
        <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.80rem', fontWeight: 700,
                color: '#666', mb: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {title}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
                {items.map(item => (
                    <Chip key={item} label={item} size="small" variant="outlined"
                        sx={{ fontSize: '0.78rem' }} />
                ))}
            </Box>
        </Box>
    )
}

const ProjectDetail = () => {
    const { id }   = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()


    // Seul l'admin peut modifier les métadonnées du projet
    const canEditProject = user?.role === 'admin'

    // admin, resp_qualite, chef_projet peuvent accéder à la gestion des risques
    const canAccessRisks = ['admin', 'resp_qualite', 'chef_projet'].includes(user?.role)

    // admin, resp_qualite, chef_projet peuvent accéder à l'Assistance Technique
    // seulement si le projet est en phase Kickoff, Réalisation ou Clôture (offre acceptée)
    const canAccessAT = ['admin', 'resp_qualite', 'chef_projet'].includes(user?.role)
    const AT_PHASES = ['Kickoff', 'Realisation', 'Cloture']

    // chef_projet et resp_qualite membres du projet peuvent accéder au RCT
    const canAccessRCT = (proj) => {
        if (!user || !proj) return false
        if (user.role === 'admin') return true
        if (['chef_projet', 'resp_qualite'].includes(user.role)) {
            return proj.membres_details?.some(m => m.id === user.id) ?? false
        }
        return false
    }

    const [project,       setProject]       = useState(null)
    const [loading,       setLoading]       = useState(true)
    const [editMode,      setEditMode]      = useState(false)
    const [editForm,      setEditForm]      = useState({})
    const [deptUsers,     setDeptUsers]     = useState([])
    const [editSaving,    setEditSaving]    = useState(false)
    const [deleteDialog,  setDeleteDialog]  = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    useEffect(() => {
        AxiosInstance.get(`projects/${id}/`)
            .then(res => setProject(res.data))
            .catch(() => navigate('/projects'))
            .finally(() => setLoading(false))
    }, [id])

    const fetchDeptUsers = (dept) => {
        if (!dept) return
        AxiosInstance.get(`users-by-dept/${dept}/`)
            .then(res => setDeptUsers(res.data))
            .catch(() => setDeptUsers([]))
    }

    const openEditMode = () => {
        setEditForm({
            client:            project.client,
            type_projet:       project.type_projet,
            departement:       project.departement,
            phase:             project.phase,
            langages:          project.langages          || [],
            os_outils:         project.os_outils         || [],
            metier_generique:  project.metier_generique  || [],
            metier_specifique: project.metier_specifique || [],
            devops:            project.devops            || [],
            management:        project.management        || [],
            membres:           project.membres_details?.map(m => m.id) || [],
        })
        fetchDeptUsers(project.departement)
        setEditMode(true)
    }

    const handleDeptChange = (newDept) => {
        setEditForm(f => ({ ...f, departement: newDept, membres: [] }))
        fetchDeptUsers(newDept)
    }

    const toggleMembre = (userId) => {
        setEditForm(f => ({
            ...f,
            membres: f.membres.includes(userId)
                ? f.membres.filter(uid => uid !== userId)
                : [...f.membres, userId],
        }))
    }

    const handleEditSubmit = async () => {
        setEditSaving(true)
        try {
            const res = await AxiosInstance.patch(`projects/${id}/`, editForm)
            setProject(res.data)
            setEditMode(false)
        } catch (err) {
            console.error(err)
        } finally {
            setEditSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleteLoading(true)
        try {
            await AxiosInstance.delete(`projects/${id}/`)
            navigate('/projects')
        } catch (err) {
            console.error(err)
            setDeleteLoading(false)
            setDeleteDialog(false)
        }
    }

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 12 }}>
            <CircularProgress />
        </Box>
    )
    if (!project) return null

    /* ══════════════════════════════════════════
       EDIT MODE  (admin only)
    ══════════════════════════════════════════ */
    if (editMode) return (
        <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => setEditMode(false)}
                sx={{ textTransform: 'none', color: '#666', mb: 2 }}>
                Annuler les modifications
            </Button>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                ✏️ Modifier le projet — {project.ref_projet}
            </Typography>

            {/* Informations générales */}
            <Box sx={{ bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: '14px', p: 3, mb: 3 }}>
                <SectionTitle>Informations générales</SectionTitle>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField label="Client" value={editForm.client} size="small" fullWidth
                        onChange={e => setEditForm(f => ({ ...f, client: e.target.value }))} />
                    <TextField select label="Type de projet" value={editForm.type_projet} size="small" fullWidth
                        onChange={e => setEditForm(f => ({ ...f, type_projet: e.target.value }))}>
                        <MenuItem value="forfait">Forfait</MenuItem>
                        <MenuItem value="assistance">Assistance Technique</MenuItem>
                    </TextField>
                    <TextField select label="Département" value={editForm.departement} size="small" fullWidth
                        onChange={e => handleDeptChange(e.target.value)}>
                        {DEPARTMENT_CHOICES.map(d => (
                            <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                        ))}
                    </TextField>
                    <Box sx={{
                        border: '1px solid #e0e0e0', borderRadius: '4px', p: '8.5px 14px',
                        bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                        <Typography sx={{ fontSize: '0.75rem', color: '#888', mr: 'auto' }}>
                            Phase (gérée automatiquement par le RCT)
                        </Typography>
                        <Chip
                            label={project.phase}
                            color={PHASE_COLORS[project.phase] || 'default'}
                            size="small" sx={{ fontWeight: 600 }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Compétences */}
            <Box sx={{ bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: '14px', p: 3, mb: 3 }}>
                <SectionTitle>Compétences requises</SectionTitle>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <MultiSelect label="Langages" options={LANGAGES_LIST}
                        value={editForm.langages}
                        onChange={e => setEditForm(f => ({ ...f, langages: e.target.value }))} />
                    <MultiSelect label="OS & Outils" options={OS_OUTILS_LIST}
                        value={editForm.os_outils}
                        onChange={e => setEditForm(f => ({ ...f, os_outils: e.target.value }))} />
                    <MultiSelect label="Métier générique" options={METIER_GEN_LIST}
                        value={editForm.metier_generique}
                        onChange={e => setEditForm(f => ({ ...f, metier_generique: e.target.value }))} />
                    <MultiSelect label="Métier spécifique" options={METIER_SPEC_LIST}
                        value={editForm.metier_specifique}
                        onChange={e => setEditForm(f => ({ ...f, metier_specifique: e.target.value }))} />
                    <MultiSelect label="DevOps" options={DEVOPS_LIST}
                        value={editForm.devops}
                        onChange={e => setEditForm(f => ({ ...f, devops: e.target.value }))} />
                    <MultiSelect label="Management" options={MANAGEMENT_LIST}
                        value={editForm.management}
                        onChange={e => setEditForm(f => ({ ...f, management: e.target.value }))} />
                </Box>
            </Box>

            {/* Membres */}
            <Box sx={{ bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: '14px', p: 3, mb: 3 }}>
                <SectionTitle>Membres de l'équipe</SectionTitle>
                {!deptUsers.length ? (
                    <Typography sx={{ color: '#bbb', fontStyle: 'italic' }}>
                        Aucun employé trouvé pour ce département.
                    </Typography>
                ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1 }}>
                        {deptUsers.map(u => {
                            const selected = editForm.membres.includes(u.id)
                            return (
                                <Box key={u.id} onClick={() => toggleMembre(u.id)} sx={{
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    p: 1, borderRadius: '8px', cursor: 'pointer',
                                    bgcolor: selected ? '#e3f2fd' : '#f9f9f9',
                                    border: selected ? '1px solid #1976d2' : '1px solid #e0e0e0',
                                    transition: 'all 0.15s',
                                }}>
                                    <Checkbox size="small" checked={selected}
                                        onChange={() => toggleMembre(u.id)}
                                        onClick={e => e.stopPropagation()} />
                                    <Avatar src={u.image ? `http://localhost:8000${u.image}` : undefined}
                                        sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: '#1976d2' }}>
                                        {!u.image && `${u.first_name?.[0]}${u.last_name?.[0]}`}
                                    </Avatar>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                            {u.first_name} {u.last_name}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>
                                            {u.role_display || u.role}
                                        </Typography>
                                    </Box>
                                </Box>
                            )
                        })}
                    </Box>
                )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => setEditMode(false)}
                    sx={{ textTransform: 'none' }}>
                    Annuler
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />}
                    disabled={editSaving} onClick={handleEditSubmit}
                    sx={{ textTransform: 'none', fontWeight: 600 }}>
                    {editSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
            </Box>
        </Box>
    )

    /* ══════════════════════════════════════════
       VIEW MODE
    ══════════════════════════════════════════ */
    const hasCompetences = project.langages?.length || project.os_outils?.length ||
        project.metier_generique?.length || project.metier_specifique?.length ||
        project.devops?.length || project.management?.length

    return (
        <Box sx={{ p: 3, maxWidth: 960, mx: 'auto' }}>
            {/* Barre du haut */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')}
                    sx={{ textTransform: 'none', color: '#666' }}>
                    Retour aux projets
                </Button>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    {/* Bouton RCT : visible pour admin et membres chef_projet/resp_qualite */}
                    {canAccessRCT(project) && (
                        <Button variant="contained" startIcon={<ArticleIcon />}
                            onClick={() => navigate(`/projects/${id}/rct`)}
                            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#1565c0' }}>
                            Réponse à l'appel d'offre
                        </Button>
                    )}
                    {canAccessRisks && (
                        <Button variant="outlined" startIcon={<WarningAmberIcon />}
                            onClick={() => navigate(`/projects/${id}/risks`)}
                            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#2563EB', color: '#2563EB' }}>
                            Gestion des risques
                        </Button>
                    )}
                    {/* Bouton AT : visible quand le projet est en phase Kickoff/Réalisation/Clôture */}
                    {canAccessAT && AT_PHASES.includes(project.phase) && (
                        <Button variant="contained" startIcon={<EngineeringIcon />}
                            onClick={() => navigate(`/projects/${id}/assistance-technique`)}
                            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#047857',
                                '&:hover': { bgcolor: '#065f46' } }}>
                            Assistance Technique
                        </Button>
                    )}
                    {/* Bouton Modifier : admin uniquement */}
                    {canEditProject && !LOCKED_PHASES.includes(project.phase) && (
                        <Button variant="contained" startIcon={<EditIcon />} onClick={openEditMode}
                            sx={{ textTransform: 'none', fontWeight: 600 }}>
                            Modifier le projet
                        </Button>
                    )}
                    {/* Bouton Supprimer : admin uniquement */}
                    {canEditProject && (
                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />}
                            onClick={() => setDeleteDialog(true)}
                            sx={{ textTransform: 'none', fontWeight: 600 }}>
                            Supprimer
                        </Button>
                    )}
                </Box>
            </Box>

            {/* ── Bandeau verrouillé ── */}
            {LOCKED_PHASES.includes(project.phase) && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1.5, mb: 2, borderRadius: '10px',
                    bgcolor: '#fff3e0', border: '1px solid #ff9800',
                }}>
                    <Typography sx={{ fontSize: '1.2rem' }}>🔒</Typography>
                    <Box>
                        <Typography sx={{ fontWeight: 700, color: '#e65100', fontSize: '0.95rem' }}>
                            Projet verrouillé — phase « {project.phase} »
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* ── Header card ── */}
            <Box sx={{ bgcolor: '#f0f7ff', borderRadius: '16px', p: 3, mb: 3, border: '1px solid #d0e8ff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography sx={{
                            fontSize: '0.78rem', fontWeight: 700, color: '#1976d2',
                            bgcolor: '#e3f2fd', px: 1.2, py: 0.4, borderRadius: '5px',
                            display: 'inline-block', mb: 1.2, letterSpacing: '0.5px',
                        }}>
                            {project.ref_projet}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {project.client}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            <Chip label={project.type_projet === 'forfait' ? 'Forfait' : 'Assistance Technique'}
                                size="small" variant="outlined" />
                            <Chip label={project.dept_display} size="small" variant="outlined" />
                        </Box>
                        <Typography sx={{ fontSize: '0.82rem', color: '#999' }}>
                            Créé par <strong>{project.created_by_name}</strong> le{' '}
                            {new Date(project.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: 'long', year: 'numeric',
                            })}
                        </Typography>
                    </Box>

                    {/* Phase — lecture seule en mode view */}
                    <Box>
                        <Typography sx={{ fontSize: '0.78rem', color: '#888', mb: 0.8, fontWeight: 600 }}>
                            PHASE
                        </Typography>
                        <Chip label={project.phase}
                            color={PHASE_COLORS[project.phase] || 'default'}
                            sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
                    </Box>
                </Box>
            </Box>

            {/* ── Deux colonnes ── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Compétences */}
                <Box sx={{ bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: '14px', p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>
                        🛠 Compétences projet
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {hasCompetences ? (
                        <>
                            <CompSection title="Langages de programmation" items={project.langages} />
                            <CompSection title="OS & Outils" items={project.os_outils} />
                            <CompSection title="Connaissances métier génériques" items={project.metier_generique} />
                            <CompSection title="Connaissances métier spécifiques" items={project.metier_specifique} />
                            <CompSection title="DevOps" items={project.devops} />
                            <CompSection title="Management" items={project.management} />
                        </>
                    ) : (
                        <Typography sx={{ color: '#bbb', fontStyle: 'italic', textAlign: 'center', mt: 3 }}>
                            Aucune compétence renseignée.
                        </Typography>
                    )}
                </Box>

                {/* Équipe */}
                <Box sx={{ bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: '14px', p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>
                        👥 Équipe projet ({project.membres_details?.length || 0} membres)
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {!project.membres_details?.length ? (
                        <Typography sx={{ color: '#bbb', fontStyle: 'italic', textAlign: 'center', mt: 3 }}>
                            Aucun membre assigné.
                        </Typography>
                    ) : (
                        project.membres_details.map((m, i) => (
                            <Box key={m.id} sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 2,
                                borderBottom: i < project.membres_details.length - 1
                                    ? '1px solid #f0f0f0' : 'none',
                            }}>
                                <Typography sx={{ color: '#ccc', fontSize: '0.8rem', minWidth: 22 }}>
                                    #{i + 1}
                                </Typography>
                                <Avatar src={m.image ? `http://localhost:8000${m.image}` : undefined}
                                    sx={{ width: 38, height: 38, bgcolor: '#1976d2', fontSize: '0.82rem' }}>
                                    {!m.image && `${m.first_name?.[0]}${m.last_name?.[0]}`}
                                </Avatar>
                                <Box>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {m.first_name} {m.last_name}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>
                                        {m.role_display || m.role}
                                    </Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Box>

            {/* ── Dialogue de confirmation de suppression ── */}
            <Dialog open={deleteDialog} onClose={() => !deleteLoading && setDeleteDialog(false)}>
                <DialogTitle sx={{ fontWeight: 700, color: '#c62828' }}>
                    🗑 Supprimer le projet ?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Cette action est <strong>irréversible</strong>. Le projet{' '}
                        <strong>« {project.client} »</strong> ainsi que toutes ses données
                        (RCT, FRO, FRP, fichiers) seront définitivement supprimés.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setDeleteDialog(false)} disabled={deleteLoading}
                        sx={{ textTransform: 'none' }}>
                        Annuler
                    </Button>
                    <Button variant="contained" color="error" startIcon={<DeleteIcon />}
                        onClick={handleDelete} disabled={deleteLoading}
                        sx={{ textTransform: 'none', fontWeight: 700 }}>
                        {deleteLoading ? 'Suppression...' : 'Oui, supprimer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default ProjectDetail