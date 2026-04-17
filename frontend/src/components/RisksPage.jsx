import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

const RisksPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [risks, setRisks] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        AxiosInstance.get(`projects/${id}/risks/`)
            .then(res => setRisks(res.data))
            .catch(() => setRisks([]))
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return <CircularProgress />

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Gestion des risques
            </Typography>

            <Button
                variant="contained"
                sx={{ mb: 3 }}
                onClick={() => navigate(`/projects/${id}/risks/new`)}
            >
                + Ajouter un risque
            </Button>

            {risks.length === 0 ? (
                <Typography>Aucun risque pour ce projet</Typography>
            ) : (
                risks.map(risk => (
                    <Box key={risk.id} sx={{
                        p: 2,
                        mb: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: '10px'
                    }}>
                        <Typography sx={{ fontWeight: 600 }}>
                            {risk.title}
                        </Typography>

                        <Typography sx={{ fontSize: '0.9rem', color: '#777' }}>
                            {risk.description}
                        </Typography>

                        <Button
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={() => navigate(`/projects/${id}/risks/${risk.id}`)}
                        >
                            Voir détail
                        </Button>
                    </Box>
                ))
            )}
        </Box>
    )
}

export default RisksPage