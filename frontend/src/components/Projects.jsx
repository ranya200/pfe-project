import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Grid from '@mui/material/Grid'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'

const PHASE_COLORS = {
    IDLE: 'default', Offre: 'warning',
    Kickoff: 'info', Realisation: 'primary', Cloture: 'success',
}

const Projects = () => {
    const navigate  = useNavigate()
    const { user }  = useAuth()
    const [projects, setProjects] = useState([])
    const [loading, setLoading]   = useState(true)

    useEffect(() => {
        AxiosInstance.get('projects/')
            .then(res => setProjects(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>Liste des Projets</Typography>
                    <Typography sx={{ fontSize: '0.88rem', color: '#888', mt: 0.5 }}>
                        {projects.length} projet(s) enregistré(s)
                    </Typography>
                </Box>
                {/* Bouton visible uniquement pour l'admin */}
                {user?.role === 'admin' && (
                    <Button variant="contained" startIcon={<AddIcon />}
                        onClick={() => navigate('/projects/new')}
                        sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Nouveau Projet
                    </Button>
                )}
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress />
                </Box>
            ) : projects.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 10, color: '#bbb' }}>
                    <FolderOpenIcon sx={{ fontSize: 70, mb: 2 }} />
                    <Typography sx={{ fontSize: '1.1rem' }}>Aucun projet pour le moment.</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {projects.map((project) => (
                        <Grid item xs={12} sm={6} md={4} key={project.id}>
                            <Card elevation={0} sx={{
                                border: '1px solid #e0e0e0', borderRadius: '14px',
                                height: '100%', display: 'flex', flexDirection: 'column',
                                transition: 'all 0.2s',
                                '&:hover': { boxShadow: '0 4px 24px rgba(25,118,210,0.10)', borderColor: '#1976d2' }
                            }}>
                                <CardContent sx={{ flex: 1 }}>
                                    {/* REF + Phase */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography sx={{
                                            fontSize: '0.75rem', fontWeight: 700, color: '#1976d2',
                                            bgcolor: '#e3f2fd', px: 1, py: 0.3, borderRadius: '5px',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {project.ref_projet}
                                        </Typography>
                                        <Chip label={project.phase}
                                            color={PHASE_COLORS[project.phase] || 'default'}
                                            size="small" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                                    </Box>

                                    {/* Client */}
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1rem' }}>
                                        {project.client}
                                    </Typography>

                                    {/* Type */}
                                    <Typography sx={{ fontSize: '0.84rem', color: '#666', mb: 1.5 }}>
                                        {project.type_projet === 'forfait' ? 'Forfait' : 'Assistance Technique'}
                                    </Typography>

                                    {/* Département */}
                                    <Chip label={project.dept_display} size="small"
                                        variant="outlined" sx={{ mb: 1.5 }} />

                                    {/* Membres */}
                                    <Typography sx={{ fontSize: '0.82rem', color: '#888' }}>
                                        👥 {project.membres_details?.length || 0} membre(s)
                                    </Typography>
                                </CardContent>

                                <CardActions sx={{ px: 2, pb: 2 }}>
                                    <Button fullWidth variant="outlined" size="small"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
                                        Voir détails
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    )
}

export default Projects