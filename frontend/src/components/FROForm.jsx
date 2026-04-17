import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Slider from '@mui/material/Slider'
import Divider from '@mui/material/Divider'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'

// ── Poids des questions ───────────────────────────────────────────────────
const POIDS_EXIG = [5, 4, 5, 3, 3, 2, 2, 5, 5, 4, 2, 2, 2, 4, 2, 3]
const POIDS_FAIS = [5, 5, 4, 4, 3, 2, 2, 2, 3, 3, 2, 3, 3, 3, 4, 3, 3]

const QUESTIONS_EXIG = [
    "La description du produit souhaité permet-elle l'étude de faisabilité ?",
    "Les entrées client sont-elles inspectées quant à leur complétude ?",
    "Les exigences exprimées par le client sont-elles référencées et compréhensibles ?",
    "Le niveau de détail des spécifications client est-il suffisant pour l'étude de faisabilité ?",
    "Y a-t-il des exigences identifiées et jugées nécessaires sans être exprimées par le client ?",
    "La nature du produit et les procédures de réalisation induisent-elles des exigences complémentaires ?",
    "Y a-t-il des processus, procédures ou standards du SMQ client (Checklist, template..) qui seront utilisés en globalité ou en partie ?\nY a-t-il des impacts identifiés? Sont ils gérables dans notre périmètre (delais, effort..)?",
    "Y a-t-il des objectifs de performance ou de complexité du produit définis ?",
    "Y a-t-il des exigences qui sont à la limite des connaissances techniques existantes ?",
    "Y a-t-il des exigences qui sont à la limite de la maturité des moyens de réalisation ?",
    "Y a-t-il des exigences qui sont à la limite de la maturité du processus de réalisation ?",
    "Y a-t-il des exigences qui sont à la limite de la capacité technique du produit ?",
    "Le processus de réalisation du produit est-il contraint à des textes légaux et réglementaires (normes, conventions, contrats, ...) ? Si oui, sont-ils identifiés ?",
    "Le client a-t-il exprimé des exigences spécifiques relatives aux livraisons (délais, moyens, contenus, ...) ?",
    "Le client s'est-il exprimé sur des activités d'après livraison (support pour la recette, support en installation ou déploiement, travaux de maintenance, garantie, help desk, ...) ?",
    "Le client a-t-il exprimé des exigences spécifiques relatives à la sécurité de l'information ?",
]

const QUESTIONS_FAIS = [
    "De la complexité technique ?",
    "Des fonctionnalités à implémenter ?",
    "Du niveau de compréhension du besoin ?",
    "Du niveau de connaissance et de maîtrise du métier attendu par les clients et les autres parties intéressées pertinentes (prestataire externe, direction, concurrent...) ?",
    "Du niveau de connaissance et de maîtrise des technologies à utiliser ?",
    "De l'adéquation et de la stabilité des procédures de réalisation existantes ?",
    "Du degré d'implication du client  et des utilisateurs dans le processus de réalisation ?",
    "Des contraintes de coût ?",
    "Des contraintes de délai ?",
    "De la disponibilité des ressources humaines (pour la réalisation et la maintenance) ?",
    "Du niveau du maîtrise des interfaces entres les personnes impliquées dans le processus de réalisation ?",
    "De la compétence des ressources humaines ?",
    "De la disponibilité des outils, environnements et moyens matériels ?",
    "Des contraintes de performances imposées ?",
    "Du niveau de qualité demandé ?",
    "Des risques identifiés ?",
    "De la matrice de conformité incluse dans l'offre ?",
]

const getLegend = (pct) => {
    if (pct < 20) return { label: '[0-20[  — Demande Client non maitrisée: Projet très risqué. L\'avis du Top Management est obligatoire.', color: '#c62828', bg: '#ffebee' }
    if (pct < 40) return { label: '[20-40[ — Demande Client partiellement maitrisée: Projet risqué. Les risques doivent être partagées avec le TOP Management', color: '#e65100', bg: '#fff3e0' }
    if (pct < 60) return { label: '[40-60[ — Risques majeurs sur le projet', color: '#f57f17', bg: '#fffde7' }
    if (pct < 80) return { label: '[60-80[ — Projet faisable: Risques mineurs.', color: '#2e7d32', bg: '#e8f5e9' }
    return          { label: '[80-100] — Demande Client maitrisée. Projet faisable', color: '#1565c0', bg: '#e3f2fd' }
}

const getScoreColor = (val, max) => {
    const pct = (val / max) * 100
    if (pct < 40) return '#f44336'
    if (pct < 60) return '#ff9800'
    if (pct < 80) return '#66bb6a'
    return '#1976d2'
}

// ── Ligne question ────────────────────────────────────────────────────────
const QuestionRow = ({ num, question, scoreKey, commentKey, maxScore, form, setForm, isEven, disabled }) => {
    const val   = Number(form[scoreKey] || 0)
    const color = getScoreColor(val, maxScore)
    return (
        <Box sx={{
            display: 'grid', gridTemplateColumns: '32px 1fr 240px 1fr',
            gap: 2, alignItems: 'center', py: 1.8, px: 2,
            bgcolor: isEven ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0',
        }}>
            <Typography sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.88rem', textAlign: 'center' }}>{num}</Typography>
            <Typography sx={{ fontSize: '0.84rem', color: '#333', lineHeight: 1.6 }}>{question}</Typography>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                    <Typography sx={{ fontSize: '0.74rem', color: '#999' }}>Score (0 – {maxScore})</Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color }}>{val} / {maxScore}</Typography>
                </Box>
                <Slider value={val} min={0} max={maxScore} step={1}
                    onChange={disabled ? undefined : (_, v) => setForm(prev => ({ ...prev, [scoreKey]: v }))}
                    disabled={disabled}
                    sx={{ color, '& .MuiSlider-thumb': { width: 16, height: 16 }, '& .MuiSlider-rail': { opacity: 0.3 } }}
                    marks={Array.from({ length: maxScore + 1 }, (_, i) => ({ value: i }))} />
            </Box>
            <TextField size="small" placeholder="Conclusion (optionnel)..."
                value={form[commentKey] || ''}
                onChange={e => setForm(prev => ({ ...prev, [commentKey]: e.target.value }))}
                multiline maxRows={3} disabled={disabled}
                sx={{ '& .MuiInputBase-root': { fontSize: '0.82rem' } }} />
        </Box>
    )
}

// ── En-tête de section ────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, score, maxScore }) => {
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    return (
        <Box sx={{ bgcolor: '#1565c0', px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
                <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{title}</Typography>
                {subtitle && <Typography sx={{ color: '#bbdefb', fontSize: '0.8rem', mt: 0.2 }}>{subtitle}</Typography>}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ color: '#fff', fontWeight: 700 }}>{score} / {maxScore}</Typography>
                <Box sx={{ width: 120, height: 6, bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 3, mt: 0.5, overflow: 'hidden' }}>
                    <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: '#fff', borderRadius: 3 }} />
                </Box>
            </Box>
        </Box>
    )
}

// ── En-têtes colonnes ─────────────────────────────────────────────────────
const ColHeaders = ({ cols }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 240px 1fr', gap: 2, px: 2, py: 1, bgcolor: '#1976d2' }}>
        {cols.map((c, i) => (
            <Typography key={i} sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{c}</Typography>
        ))}
    </Box>
)



const LOCKED_PHASES = ['Archive', 'Kickoff', 'Realisation', 'Cloture']

// ── Page principale ───────────────────────────────────────────────────────
const FROFormPage = () => {
    const { id }   = useParams()
    const navigate = useNavigate()
    const [form, setForm]           = useState({})
    const [loading, setLoading]     = useState(true)
    const [saving, setSaving]       = useState(false)
    const [saved, setSaved]         = useState(false)
    const [isLocked, setIsLocked]   = useState(false)
    const [isTermine, setIsTermine] = useState(false)
    const [postEditMode, setPostEditMode] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const [projRes, rctRes, froRes] = await Promise.all([
                    AxiosInstance.get(`projects/${id}/`),
                    AxiosInstance.get(`projects/${id}/rct/`),
                    AxiosInstance.get(`projects/${id}/rct/fro/`),
                ])
                setIsLocked(LOCKED_PHASES.includes(projRes.data.phase))
                if (rctRes.status !== 204) {
                    setIsTermine(rctRes.data.status === 'termine')
                    setPostEditMode(!!rctRes.data.post_edit_mode)
                } else {
                    setPostEditMode(false)
                }
                setForm(froRes.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const calcScore = (prefix, count) => {
        let total = 0
        for (let i = 1; i <= count; i++) total += Number(form[`${prefix}${i}_score`] || 0)
        return total
    }

    const maxExig    = POIDS_EXIG.reduce((a, b) => a + b, 0)
    const maxFais    = POIDS_FAIS.reduce((a, b) => a + b, 0)
    const scoreExig  = calcScore('exig', 16)
    const scoreFais  = calcScore('fais', 17)
    const scoreTotal = scoreExig + scoreFais
    const maxTotal   = maxExig + maxFais
    const scorePct   = maxTotal > 0 ? Math.round((scoreTotal / maxTotal) * 100) : 0
    const legend     = getLegend(scorePct)

    const handleSave = async () => {
        setSaving(true)
        try {
            await AxiosInstance.patch(`projects/${id}/rct/fro/`, form)
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err) { console.error(err) }
        finally { setSaving(false) }
    }

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>

    const isReadOnly = isLocked && !(isTermine && postEditMode)

    return (
        <Box sx={{ p: 3, maxWidth: 1080, mx: 'auto' }}>
            {/* Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/projects/${id}/rct`)}
                    sx={{ textTransform: 'none', color: '#666' }}>
                    Retour au RCT
                </Button>
                {!isReadOnly && (
                    <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={handleSave}
                        sx={{ textTransform: 'none', fontWeight: 600 }}>
                        {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
                    </Button>
                )}
            </Box>

            {/* Bandeau verrouillé (phase projet) */}
            {isLocked && !isTermine && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1.5, mb: 2, borderRadius: '10px',
                    bgcolor: '#fff3e0', border: '1px solid #ff9800',
                }}>
                    <Typography sx={{ fontSize: '1.1rem' }}>🔒</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#e65100', fontSize: '0.9rem' }}>
                        Formulaire FRO verrouillé — ce projet est en lecture seule.
                    </Typography>
                </Box>
            )}

            {isTermine && !postEditMode && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1.5, mb: 2, borderRadius: '10px',
                    bgcolor: '#e3f2fd', border: '1px solid #1976d2',
                }}>
                    <Typography sx={{ fontSize: '1.1rem' }}>ℹ️</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#1565c0', fontSize: '0.9rem' }}>
                        Formulaire FRO — RCT terminé, consultation uniquement.
                    </Typography>
                </Box>
            )}
            {isTermine && postEditMode && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1.5, mb: 2, borderRadius: '10px',
                    bgcolor: '#fff3e0', border: '1px solid #ff9800',
                }}>
                    <Typography sx={{ fontSize: '1.1rem' }}>✏️</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#e65100', fontSize: '0.9rem' }}>
                        Mode correction RCT — vous pouvez modifier ce formulaire.
                    </Typography>
                </Box>
            )}

            {/* Titre */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ width: 52, height: 52, bgcolor: '#0d47a1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.65rem', textAlign: 'center', lineHeight: 1.2 }}>TEL<br/>NET</Typography>
                </Box>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0d47a1' }}>Formulaire FRO Telnet</Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#888' }}>
                        Fiche de revue de l'offre
                    </Typography>
                </Box>
            </Box>

            {/* Score global */}
            <Box sx={{ p: 2.5, mb: 3, borderRadius: '12px', bgcolor: legend.bg, border: `2px solid ${legend.color}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: legend.color }}>
                            Score global : {scoreTotal} / {maxTotal} ({scorePct}%)
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: legend.color, mt: 0.3 }}>{legend.label}</Typography>
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.78rem', color: '#666', mb: 0.5 }}>
                            Revue des exigences : {scoreExig}/{maxExig} &nbsp;|&nbsp; Faisabilité : {scoreFais}/{maxFais}
                        </Typography>
                        <Box sx={{ width: 240, height: 10, bgcolor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' }}>
                            <Box sx={{ width: `${scorePct}%`, height: '100%', bgcolor: legend.color, borderRadius: 5, transition: 'width 0.4s ease' }} />
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Section 1 — Revue des exigences */}
            <Box sx={{ mb: 3, border: '1px solid #0d47a1', borderRadius: '12px', overflow: 'hidden' }}>
                <SectionHeader title="Revue des exigences" score={scoreExig} maxScore={maxExig} />
                <ColHeaders cols={['N°', 'Items', 'Évaluation', 'Conclusion de revue']} />
                {QUESTIONS_EXIG.map((q, i) => (
                    <QuestionRow key={i} num={i + 1} question={q}
                        scoreKey={`exig${i + 1}_score`} commentKey={`exig${i + 1}_conclusion`}
                        maxScore={POIDS_EXIG[i]} form={form} setForm={setForm} isEven={i % 2 === 0}
                        disabled={isReadOnly} />
                ))}
            </Box>

            {/* Section 2 — Étude de faisabilité */}
            <Box sx={{ mb: 3, border: '1px solid #0d47a1', borderRadius: '12px', overflow: 'hidden' }}>
                <SectionHeader title="Étude de faisabilité"
                    subtitle="La prestation est-elle réalisable en tenant compte :"
                    score={scoreFais} maxScore={maxFais} />
                <ColHeaders cols={['N°', 'La prestation est-elle réalisable...', 'Évaluation', 'Commentaires']} />
                {QUESTIONS_FAIS.map((q, i) => (
                    <QuestionRow key={i} num={i + 1} question={q}
                        scoreKey={`fais${i + 1}_score`} commentKey={`fais${i + 1}_commentaire`}
                        maxScore={POIDS_FAIS[i]} form={form} setForm={setForm} isEven={i % 2 === 0}
                        disabled={isReadOnly} />
                ))}
            </Box>

            {/* Section 3 — Décision */}
            <Box sx={{ mb: 3, border: '1px solid #0d47a1', borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#0d47a1', px: 2.5, py: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Décision</Typography>
                </Box>
                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.8 }}>Faisabilité estimée (%)</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Slider value={Number(form.faisabilite_pct || 0)} min={0} max={100} step={5}
                                onChange={isReadOnly ? undefined : (_, v) => setForm(prev => ({ ...prev, faisabilite_pct: v }))}
                                disabled={isReadOnly}
                                sx={{ flex: 1, color: '#0d47a1' }} />
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0d47a1', minWidth: 48 }}>
                                {Number(form.faisabilite_pct || 0)}%
                            </Typography>
                        </Box>
                    </Box>
                    <TextField fullWidth size="small" label="Estimation de charge (jours/homme, délai, ressources...)"
                        value={form.estimation || ''}
                        onChange={e => setForm(prev => ({ ...prev, estimation: e.target.value }))}
                        multiline rows={2} disabled={isReadOnly} />
                    <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.8 }}>
                            📅 T0 estimé — Date approximative de démarrage
                        </Typography>
                        <TextField
                            type="date"
                            size="small"
                            disabled={isReadOnly}
                            value={form.t0_possible || ''}
                            onChange={e => setForm(prev => ({ ...prev, t0_possible: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: new Date().toISOString().split('T')[0] }}
                            sx={{ width: 220 }}
                            helperText="Date approximative à laquelle le projet pourrait démarrer"
                        />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.8 }}>Décision finale</Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            {[{ label: 'Go', color: '#4caf50' }, { label: 'No Go', color: '#f44336' }, { label: 'En attente', color: '#ff9800' }].map(({ label, color }) => (
                                <Button key={label} size="small" disabled={isReadOnly}
                                    variant={form.decision_fro === label ? 'contained' : 'outlined'}
                                    onClick={() => setForm(prev => ({ ...prev, decision_fro: prev.decision_fro === label ? '' : label }))}
                                    sx={{ textTransform: 'none', fontWeight: 700, ...(form.decision_fro === label ? { bgcolor: color, '&:hover': { bgcolor: color } } : { borderColor: color, color }) }}>
                                    {label}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                    <TextField fullWidth multiline rows={2} size="small" label="Commentaire final (optionnel)"
                        value={form.commentaire_final || ''}
                        onChange={e => setForm(prev => ({ ...prev, commentaire_final: e.target.value }))}
                        disabled={isReadOnly} />
                </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />
            {!isReadOnly && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" size="large" startIcon={<SaveIcon />} disabled={saving} onClick={handleSave}
                        sx={{ textTransform: 'none', fontWeight: 600, px: 5 }}>
                        {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé !' : 'Sauvegarder le formulaire'}
                    </Button>
                </Box>
            )}
        </Box>
    )
}

export default FROFormPage
