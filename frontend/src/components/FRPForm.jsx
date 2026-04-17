import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Slider from '@mui/material/Slider'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

const POIDS_REVUE = [5, 4, 5, 3, 3, 2]
const POIDS_FAIS  = [5, 5, 4, 4, 3, 2, 2]

const QUESTIONS_REVUE = [
    "La description du besoin permet-elle l'étude de faisabilité ?",
    "La description du besoin comprend-il les profils recherchés ?",
    "Y a-t-il des processus, procédures ou standards du SMQ client qui seront utilisés en globalité ou en partie ?",
    "Y a-t-il des outils ou équipements client qui seront utilisés en globalité ou en partie ?",
    "Le processus de réalisation du produit est-il contraint à des textes légaux et réglementaires (normes, conventions, contrats, …) ? Si oui, sont-ils identifiés ?",
    "Y a-t-il des exigences relatives à la sécurité de l'information ?",
]

const QUESTIONS_FAIS = [
    "Du niveau de compréhension du besoin ?",
    "Du niveau de compétences et de maîtrise des technologies demandées ?",
    "Des contraintes de durée de la prestation ?",
    "De la disponibilité des ressources humaines ?",
    "De la disponibilité et maîtrise des outils, environnements et moyens matériels client ?",
    "De la maîtrise des procédures de travail convenues ?",
    "Des risques identifiés ?",
]

const getLegend = (pct) => {
    if (pct < 20) return { label: '[0-20[ — Demande non maîtrisée. Projet très risqué. Avis Top Management obligatoire.', color: '#c62828', bg: '#ffebee' }
    if (pct < 40) return { label: '[20-40[ — Partiellement maîtrisée. Projet risqué. Partager avec Top Management.', color: '#e65100', bg: '#fff3e0' }
    if (pct < 60) return { label: '[40-60[ — Risques majeurs sur le projet.', color: '#f57f17', bg: '#fffde7' }
    if (pct < 80) return { label: '[60-80[ — Projet faisable. Risques mineurs.', color: '#2e7d32', bg: '#e8f5e9' }
    return          { label: '[80-100] — Demande maîtrisée. Projet faisable.', color: '#1565c0', bg: '#e3f2fd' }
}

const getScoreColor = (val, max) => {
    const pct = (val / max) * 100
    if (pct < 40) return '#f44336'
    if (pct < 60) return '#ff9800'
    if (pct < 80) return '#66bb6a'
    return '#1976d2'
}

/** Génère un uid stable pour chaque besoin ponctuel */
const genUid = () => `bp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

const QuestionRow = ({ num, question, scoreKey, commentKey, maxScore, form, setForm, isEven, disabled }) => {
    const val   = Number(form[scoreKey] || 0)
    const color = getScoreColor(val, maxScore)
    return (
        <Box sx={{
            display: 'grid', gridTemplateColumns: '32px 1fr 240px 1fr',
            gap: 2, alignItems: 'center', py: 1.8, px: 2,
            bgcolor: isEven ? '#fafafa' : '#fff', borderBottom: '1px solid #f0f0f0',
        }}>
            <Typography sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.88rem', textAlign: 'center' }}>
                {num}
            </Typography>
            <Typography sx={{ fontSize: '0.84rem', color: '#333', lineHeight: 1.6 }}>
                {question}
            </Typography>
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
            <TextField size="small" placeholder="Commentaire (optionnel)..."
                value={form[commentKey] || ''}
                onChange={e => setForm(prev => ({ ...prev, [commentKey]: e.target.value }))}
                multiline maxRows={3} disabled={disabled}
                sx={{ '& .MuiInputBase-root': { fontSize: '0.82rem' } }} />
        </Box>
    )
}

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

const ColHeaders = ({ cols, template }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: template || '32px 1fr 240px 1fr', gap: 2, px: 2, py: 1, bgcolor: '#1976d2' }}>
        {cols.map((c, i) => (
            <Typography key={i} sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{c}</Typography>
        ))}
    </Box>
)

const OuiNonAutre = ({ value, onChange, disabled }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        {[{ val: 'Oui', color: '#4caf50' }, { val: 'Non', color: '#f44336' }, { val: 'Autre', color: '#ff9800' }].map(({ val, color }) => (
            <Button key={val} size="small" disabled={disabled}
                variant={value === val ? 'contained' : 'outlined'}
                onClick={() => onChange(value === val ? '' : val)}
                sx={{
                    fontSize: '0.68rem', py: 0.2, px: 0.8, textTransform: 'none', fontWeight: 700, minWidth: 0,
                    ...(value === val
                        ? { bgcolor: color, '&:hover': { bgcolor: color } }
                        : { borderColor: color, color })
                }}>
                {val}
            </Button>
        ))}
    </Box>
)

const LOCKED_PHASES = ['Archive', 'Kickoff', 'Realisation', 'Cloture']

const FRPFormPage = () => {
    const { id }   = useParams()
    const navigate = useNavigate()
    const [form, setForm]           = useState({})
    const [besoins, setBesoins]     = useState([])
    const [loading, setLoading]     = useState(true)
    const [saving, setSaving]       = useState(false)
    const [saved, setSaved]         = useState(false)
    const [isLocked, setIsLocked]   = useState(false)
    const [isTermine, setIsTermine] = useState(false)
    const [postEditMode, setPostEditMode] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const [projRes, rctRes, frpRes] = await Promise.all([
                    AxiosInstance.get(`projects/${id}/`),
                    AxiosInstance.get(`projects/${id}/rct/`),
                    AxiosInstance.get(`projects/${id}/rct/frp/`),
                ])
                setIsLocked(LOCKED_PHASES.includes(projRes.data.phase))
                if (rctRes.status !== 204) {
                    setIsTermine(rctRes.data.status === 'termine')
                    setPostEditMode(!!rctRes.data.post_edit_mode)
                } else {
                    setPostEditMode(false)
                }
                setForm(frpRes.data)
                setBesoins(frpRes.data.besoins_ponctuels || [])
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

    const maxRevue   = POIDS_REVUE.reduce((a, b) => a + b, 0)
    const maxFais    = POIDS_FAIS.reduce((a, b) => a + b, 0)
    const scoreRevue = calcScore('rev', 6)
    const scoreFais  = calcScore('fais', 7)
    const scoreTotal = scoreRevue + scoreFais
    const maxTotal   = maxRevue + maxFais
    const scorePct   = maxTotal > 0 ? Math.round((scoreTotal / maxTotal) * 100) : 0
    const legend     = getLegend(scorePct)

    // ── Besoins ponctuels ─────────────────────────────────────────────────

    const addBesoin = () => setBesoins(prev => [
        ...prev, {
            uid: genUid(),
            description: '', date: '', comprehension: '', competences: '',
            maitrise: '', decision: 'Go', actions: '',
            // risk_id et risk_code seront remplis par le backend après la première sauvegarde
        }
    ])

    const updateBesoin = (idx, field, val) =>
        setBesoins(prev => prev.map((b, i) => i === idx ? { ...b, [field]: val } : b))

    const removeBesoin = (idx) => setBesoins(prev => prev.filter((_, i) => i !== idx))

    // ── Sauvegarde ────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await AxiosInstance.patch(
                `projects/${id}/rct/frp/`,
                { ...form, besoins_ponctuels: besoins }
            )
            // Le backend renvoie les besoins enrichis avec risk_id / risk_code
            setForm(res.data)
            setBesoins(res.data.besoins_ponctuels || [])
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
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

            {/* Bandeau verrouillé */}
            {isLocked && !isTermine && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 2, borderRadius: '10px', bgcolor: '#fff3e0', border: '1px solid #ff9800' }}>
                    <Typography sx={{ fontSize: '1.1rem' }}>🔒</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#e65100', fontSize: '0.9rem' }}>
                        Formulaire FRP verrouillé — ce projet est en lecture seule.
                    </Typography>
                </Box>
            )}

            {/* Bandeau RCT terminé */}
            {isTermine && !postEditMode && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 2, borderRadius: '10px', bgcolor: '#e3f2fd', border: '1px solid #1976d2' }}>
                    <Typography sx={{ fontSize: '1.1rem' }}>ℹ️</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#1565c0', fontSize: '0.9rem' }}>
                        Formulaire FRP — RCT terminé, consultation uniquement.
                    </Typography>
                </Box>
            )}
            {isTermine && postEditMode && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 2, borderRadius: '10px', bgcolor: '#fff3e0', border: '1px solid #ff9800' }}>
                    <Typography sx={{ fontSize: '1.1rem' }}>✏️</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#e65100', fontSize: '0.9rem' }}>
                        Mode correction RCT — vous pouvez modifier ce formulaire.
                    </Typography>
                </Box>
            )}

            {/* Titre */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ width: 52, height: 52, bgcolor: '#1565c0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.75rem', textAlign: 'center', lineHeight: 1.2 }}>TEL<br/>NET</Typography>
                </Box>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1565c0' }}>Formulaire FRP Telnet</Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#888' }}>Fiche de revue de l'offre d'assistance technique</Typography>
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
                            Revue du besoin : {scoreRevue}/{maxRevue} &nbsp;|&nbsp; Étude de faisabilité : {scoreFais}/{maxFais}
                        </Typography>
                        <Box sx={{ width: 240, height: 10, bgcolor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' }}>
                            <Box sx={{ width: `${scorePct}%`, height: '100%', bgcolor: legend.color, borderRadius: 5, transition: 'width 0.4s ease' }} />
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Section 1 — Revue et analyse du besoin */}
            <Box sx={{ mb: 3, border: '1px solid #1565c0', borderRadius: '12px', overflow: 'hidden' }}>
                <SectionHeader title="Revue et analyse du besoin" score={scoreRevue} maxScore={maxRevue} />
                <ColHeaders cols={['N°', 'Items', 'Score', 'Conclusion de revue']} />
                {QUESTIONS_REVUE.map((q, i) => (
                    <QuestionRow key={i} num={i + 1} question={q}
                        scoreKey={`rev${i + 1}_score`} commentKey={`rev${i + 1}_conclusion`}
                        maxScore={POIDS_REVUE[i]} form={form} setForm={setForm} isEven={i % 2 === 0}
                        disabled={isReadOnly} />
                ))}
            </Box>

            {/* Section 2 — Étude de faisabilité */}
            <Box sx={{ mb: 3, border: '1px solid #1565c0', borderRadius: '12px', overflow: 'hidden' }}>
                <SectionHeader title="Étude de faisabilité" subtitle="La prestation est-elle réalisable en tenant compte :" score={scoreFais} maxScore={maxFais} />
                <ColHeaders cols={['N°', 'La prestation est-elle réalisable...', 'Score', 'Commentaires']} />
                {QUESTIONS_FAIS.map((q, i) => (
                    <QuestionRow key={i} num={i + 1} question={q}
                        scoreKey={`fais${i + 1}_score`} commentKey={`fais${i + 1}_commentaire`}
                        maxScore={POIDS_FAIS[i]} form={form} setForm={setForm} isEven={i % 2 === 0}
                        disabled={isReadOnly} />
                ))}
            </Box>

            {/* Section 3 — Décision */}
            <Box sx={{ mb: 3, border: '1px solid #1565c0', borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#1565c0', px: 2.5, py: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Décision</Typography>
                </Box>
                <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Décision finale :</Typography>
                        {[{ label: 'Go', color: '#4caf50' }, { label: 'No Go', color: '#f44336' }, { label: 'En attente', color: '#ff9800' }].map(({ label, color }) => (
                            <Button key={label} size="small" disabled={isReadOnly}
                                variant={form.decision_frp === label ? 'contained' : 'outlined'}
                                onClick={() => setForm(prev => ({ ...prev, decision_frp: prev.decision_frp === label ? '' : label }))}
                                sx={{ textTransform: 'none', fontWeight: 700, ...(form.decision_frp === label ? { bgcolor: color, '&:hover': { bgcolor: color } } : { borderColor: color, color }) }}>
                                {label}
                            </Button>
                        ))}
                    </Box>
                    <TextField fullWidth multiline rows={2} size="small" label="Commentaire final (optionnel)"
                        value={form.commentaire_final || ''}
                        onChange={e => setForm(prev => ({ ...prev, commentaire_final: e.target.value }))}
                        disabled={isReadOnly} />
                </Box>
            </Box>

            {/* Section 4 — Besoins Ponctuels */}
            <Box sx={{ mb: 3, border: '1px solid #1565c0', borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#1565c0', px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Besoins Ponctuels</Typography>
                        <Typography sx={{ color: '#bbdefb', fontSize: '0.75rem', mt: 0.2 }}>
                            Chaque besoin ajouté génère automatiquement un risque dans le registre des risques
                        </Typography>
                    </Box>
                    {!isReadOnly && (
                        <Button size="small" startIcon={<AddIcon />} onClick={addBesoin} variant="outlined"
                            sx={{ color: '#fff', borderColor: '#fff', textTransform: 'none', fontSize: '0.8rem' }}>
                            Ajouter un besoin
                        </Button>
                    )}
                </Box>

                {/* En-têtes colonnes */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '36px 2fr 110px 100px 100px 100px 90px 1.5fr 36px',
                    gap: 1, px: 1.5, py: 1, bgcolor: '#1976d2',
                }}>
                    {['N°', 'Description Besoin', 'Date', 'Compréhension', 'Compétences', 'Maîtrise', 'Décision', 'Risques/Actions', ''].map((c, i) => (
                        <Typography key={i} sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{c}</Typography>
                    ))}
                </Box>

                {besoins.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography sx={{ color: '#bbb', fontStyle: 'italic' }}>
                            Aucun besoin ponctuel. Cliquez sur "Ajouter un besoin".
                        </Typography>
                    </Box>
                ) : besoins.map((b, idx) => (
                    <Box key={b.uid || idx} sx={{
                        display: 'grid',
                        gridTemplateColumns: '36px 2fr 110px 100px 100px 100px 90px 1.5fr 36px',
                        gap: 1, px: 1.5, py: 1.2, alignItems: 'start',
                        bgcolor: idx % 2 === 0 ? '#fff' : '#fafafa',
                        borderBottom: '1px solid #f0f0f0',
                    }}>
                        {/* N° */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1, gap: 0.5 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1976d2', fontSize: '0.85rem' }}>{idx + 1}</Typography>
                            {/* Icône risque si besoin non encore sauvegardé */}
                            {b.uid && !b.risk_id && (
                                <Tooltip title="Sauvegardez pour créer le risque associé">
                                    <WarningAmberIcon sx={{ fontSize: '0.9rem', color: '#ff9800' }} />
                                </Tooltip>
                            )}
                        </Box>

                        {/* Description + badge risque */}
                        <Box>
                            <TextField size="small" placeholder="Description du besoin..." value={b.description}
                                onChange={e => updateBesoin(idx, 'description', e.target.value)}
                                disabled={isReadOnly} fullWidth
                                sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }} />
                            {/* Badge risque lié — affiché après la première sauvegarde */}
                            {b.risk_code && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.6 }}>
                                    <WarningAmberIcon sx={{ fontSize: '0.75rem', color: '#f57f17' }} />
                                    <Typography sx={{ fontSize: '0.68rem', color: '#888' }}>Risque lié :</Typography>
                                    <Chip
                                        label={b.risk_code}
                                        size="small"
                                        icon={<OpenInNewIcon style={{ fontSize: '0.65rem' }} />}
                                        onClick={() => navigate(`/projects/${id}/risks`)}
                                        sx={{
                                            fontSize: '0.65rem', height: 18, cursor: 'pointer',
                                            bgcolor: '#e3f2fd', color: '#1565c0',
                                            border: '1px solid #90caf9',
                                            '& .MuiChip-icon': { color: '#1565c0', ml: '4px' },
                                            '&:hover': { bgcolor: '#bbdefb' },
                                        }}
                                    />
                                </Box>
                            )}
                            {/* Indication "non encore sauvegardé" */}
                            {b.uid && !b.risk_id && (
                                <Typography sx={{ fontSize: '0.65rem', color: '#bbb', mt: 0.4, fontStyle: 'italic' }}>
                                    Risque créé à la prochaine sauvegarde
                                </Typography>
                            )}
                        </Box>

                        {/* Date */}
                        <TextField size="small" type="date" value={b.date}
                            onChange={e => updateBesoin(idx, 'date', e.target.value)}
                            disabled={isReadOnly}
                            sx={{ '& .MuiInputBase-root': { fontSize: '0.78rem' } }} />

                        {/* Compréhension / Compétences / Maîtrise */}
                        {['comprehension', 'competences', 'maitrise'].map(field => (
                            <OuiNonAutre key={field} value={b[field]} onChange={val => updateBesoin(idx, field, val)} disabled={isReadOnly} />
                        ))}

                        {/* Décision Go/NoGo */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                            {[{ val: 'Go', color: '#4caf50' }, { val: 'NoGo', color: '#f44336' }].map(({ val, color }) => (
                                <Button key={val} size="small" disabled={isReadOnly}
                                    variant={b.decision === val ? 'contained' : 'outlined'}
                                    onClick={() => updateBesoin(idx, 'decision', val)}
                                    sx={{ fontSize: '0.7rem', py: 0.2, textTransform: 'none', fontWeight: 700, ...(b.decision === val ? { bgcolor: color, '&:hover': { bgcolor: color } } : { borderColor: color, color }) }}>
                                    {val}
                                </Button>
                            ))}
                        </Box>

                        {/* Risques / Actions */}
                        <TextField size="small" placeholder="Risques/Actions..." value={b.actions}
                            onChange={e => updateBesoin(idx, 'actions', e.target.value)} multiline maxRows={3}
                            disabled={isReadOnly}
                            sx={{ '& .MuiInputBase-root': { fontSize: '0.78rem' } }} />

                        {/* Supprimer */}
                        {!isReadOnly ? (
                            <Tooltip title={b.risk_id ? `Supprime aussi le risque ${b.risk_code}` : 'Supprimer ce besoin'}>
                                <IconButton size="small" color="error" onClick={() => removeBesoin(idx)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        ) : <Box />}
                    </Box>
                ))}

                {/* Info globale sur les risques liés */}
                {besoins.some(b => b.risk_id) && (
                    <Box sx={{ px: 2, py: 1.5, bgcolor: '#f3f8ff', borderTop: '1px solid #e3f2fd', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningAmberIcon sx={{ fontSize: '0.9rem', color: '#1565c0' }} />
                        <Typography sx={{ fontSize: '0.78rem', color: '#1565c0' }}>
                            {besoins.filter(b => b.risk_id).length} risque(s) généré(s) depuis les besoins ponctuels —{' '}
                            <span
                                style={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                                onClick={() => navigate(`/projects/${id}/risks`)}
                            >
                                voir le registre des risques
                            </span>
                        </Typography>
                    </Box>
                )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Sauvegarde bas */}
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

export default FRPFormPage
