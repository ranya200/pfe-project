import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AxiosInstance from './AxiosInstance'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepButton from '@mui/material/StepButton'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PauseIcon from '@mui/icons-material/Pause'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AddIcon from '@mui/icons-material/Add'

// ── Imports groupés (versions + files en attente) ─────────────────────────
const MultiVersionUpload = ({ label, fieldName, urls = [], disabled, onQueueChange }) => {
    const [rows, setRows] = useState([{ file: null }])

    // Reset quand le champ change
    useEffect(() => {
        if (!disabled) setRows([{ file: null }])
    }, [fieldName])

    // Notifier le parent APRÈS le render, pas pendant
    useEffect(() => {
        const queued = rows.map(r => r.file).filter(Boolean)
        onQueueChange(fieldName, queued)
    }, [rows])

    const pushRow = () => setRows(prev => [...prev, { file: null }])

    const setRowFile = (idx, file) => {
        setRows(prev => prev.map((r, i) => (i === idx ? { file } : r)))
        // ← plus d'appel à onQueueChange ici, le useEffect s'en charge
    }

    return (
        <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.85rem', color: disabled ? '#aaa' : '#555', mb: 0.8, fontWeight: 600 }}>
                {label}
            </Typography>
            {urls.length > 0 && (
                <Box sx={{ mb: 1 }}>
                    {urls.map((u, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip size="small" label={`Version ${i + 1}`} sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                            <Button size="small" href={u} target="_blank" rel="noreferrer"
                                sx={{ textTransform: 'none', fontSize: '0.75rem' }}>Voir</Button>
                        </Box>
                    ))}
                </Box>
            )}
            {!disabled && (
                <>
                    {rows.map((row, idx) => (
                        <Box key={idx} sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            p: 1.2, mb: 1,
                            border: '1px dashed #bbb', borderRadius: '8px', bgcolor: '#fafafa',
                            cursor: 'pointer',
                        }} onClick={() => document.getElementById(`file-${fieldName}-${idx}`)?.click()}>
                            <UploadFileIcon sx={{ color: '#1976d2', fontSize: '1.2rem' }} />
                            <Typography sx={{ flex: 1, fontSize: '0.8rem' }}>
                                {row.file?.name || `Nouveau fichier (emplacement ${idx + 1})`}
                            </Typography>
                            {row.file && <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1.1rem' }} />}
                            <input id={`file-${fieldName}-${idx}`} type="file" hidden
                                onChange={e => setRowFile(idx, e.target.files?.[0] || null)} />
                        </Box>
                    ))}
                    <Button size="small" startIcon={<AddIcon />} onClick={pushRow}
                        sx={{ textTransform: 'none', mt: 0.5 }}>
                        Ajouter une version
                    </Button>
                </>
            )}
            {disabled && urls.length === 0 && (
                <Typography sx={{ fontSize: '0.8rem', color: '#aaa' }}>Aucun fichier</Typography>
            )}
        </Box>
    )
}

const SectionTitle = ({ children }) => (
    <Typography sx={{
        fontWeight: 700, color: '#1976d2', mb: 2, mt: 1,
        fontSize: '0.9rem', borderBottom: '2px solid #e3f2fd', pb: 0.8,
    }}>
        {children}
    </Typography>
)

const AutoDocBanner = ({ title, subtitle, urls, emptyText }) => {
    const list = urls || []
    if (!list.length) {
        return (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fff8e1', borderRadius: '8px', border: '1px solid #ffe082' }}>
                <Typography sx={{ fontSize: '0.8rem' }}>{emptyText}</Typography>
            </Box>
        )
    }
    const last = list[list.length - 1]
    return (
        <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#f0f7ff', borderRadius: '8px',
            border: '1px solid #d0e8ff', display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircleIcon sx={{ color: '#1976d2' }} />
            <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{title}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>{subtitle}</Typography>
                {list.length > 1 && (
                    <Typography sx={{ fontSize: '0.72rem', color: '#1976d2', mt: 0.5 }}>
                        {list.length} version(s) — la dernière est utilisée automatiquement aux étapes suivantes.
                    </Typography>
                )}
            </Box>
            <Button size="small" href={last} target="_blank" rel="noreferrer"
                sx={{ textTransform: 'none', fontSize: '0.75rem' }}>Voir (dernière)</Button>
        </Box>
    )
}

// ── Tableau des risques préliminaires ─────────────────────────────────────
const CRIT_COLOR = (c) => {
    if (!c) return { bg: '#F1F5F9', color: '#475569' }
    if (c <= 4)  return { bg: '#DCFCE7', color: '#166534' }
    if (c <= 8)  return { bg: '#FEF3C7', color: '#92400E' }
    return { bg: '#FEE2E2', color: '#991B1B' }
}
const CRIT_LABEL = (c) => {
    if (!c) return '—'
    if (c <= 4)  return 'Acceptable'
    if (c <= 8)  return 'À surveiller'
    return 'Inacceptable'
}
const STATUS_CHIP = {
    'Ouvert':  { bg: '#FEE2E2', color: '#991B1B' },
    'Atténué': { bg: '#FEF3C7', color: '#92400E' },
    'Clôturé': { bg: '#DCFCE7', color: '#166534' },
}

const PreliminaryRisksTable = ({ risks, loading }) => {
    if (loading) {
        return (
            <Box sx={{ mt: 1 }}>
                {[1, 2, 3].map(i => (
                    <Box key={i} sx={{ height: 32, bgcolor: '#f0f4fa', borderRadius: '6px', mb: 0.8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
            </Box>
        )
    }
    if (!risks || risks.length === 0) {
        return (
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Aucun risque identifié pour ce projet.
                </Typography>
            </Box>
        )
    }

    const thStyle = { fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', background: '#f8fafc' }
    const tdStyle = { fontSize: '0.78rem', padding: '7px 10px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }

    return (
        <Box sx={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {['Code', 'Identification', 'Processus', 'P', 'G', 'Criticité', 'Niveau', 'État'].map(h => (
                            <th key={h} style={thStyle}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {risks.map((r, idx) => {
                        const p = r.evaluation?.probability
                        const g = r.evaluation?.severity
                        const c = (p && g) ? p * g : null
                        const cc = CRIT_COLOR(c)
                        const sc = STATUS_CHIP[r.status] || { bg: '#F1F5F9', color: '#475569' }
                        return (
                            <tr key={r.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                                <td style={tdStyle}><span style={{ fontWeight: 700, color: '#1e40af', fontFamily: 'monospace' }}>{r.code || `R${r.id}`}</span></td>
                                <td style={{ ...tdStyle, maxWidth: 200 }}><span style={{ color: '#1e293b' }}>{r.title}</span></td>
                                <td style={tdStyle}><span style={{ fontSize: '0.72rem', color: '#475569' }}>{r.process}</span></td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{p || '—'}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{g || '—'}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '0.72rem', background: cc.bg, color: cc.color }}>
                                        {c || '—'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontSize: '0.72rem', color: cc.color }}>{CRIT_LABEL(c)}</span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, background: sc.bg, color: sc.color }}>
                                        {r.status || '—'}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </Box>
    )
}

// ── STEP 1 ────────────────────────────────────────────────────────────────
const StepOne = ({ data, projectType, projectId, navigate, disabled, onQueueChange, risks, risksLoading }) => {
    const isForfait = projectType === 'forfait'
    const showFrp = !isForfait
    const showFro = isForfait
    const formOk = isForfait ? data?.fro_filled : data?.frp_filled

    return (
        <Box>
            <SectionTitle>Étude de faisabilité — Besoins</SectionTitle>

            {showFrp && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    p: 2, mb: 2, bgcolor: '#f0f7ff',
                    border: '1px solid #1976d2', borderRadius: '10px',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <AssignmentIcon sx={{ color: '#1976d2' }} />
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#1565c0' }}>
                                Formulaire FRP Telnet
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#888', mt: 0.2 }}>
                                Fiche de revue de l&apos;offre d&apos;assistance technique (projet Assistance Technique)
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {data?.frp_filled && (
                            <Chip label="✓ Rempli" color="success" size="small" sx={{ fontWeight: 600 }} />
                        )}
                        <Button variant={disabled ? 'outlined' : 'contained'}
                            onClick={() => navigate(`/projects/${projectId}/rct/frp`)}
                            sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {disabled ? 'Consulter le formulaire' : (data?.frp_filled ? 'Modifier le formulaire' : 'Remplir le formulaire')}
                        </Button>
                    </Box>
                </Box>
            )}

            {showFro && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    p: 2, mb: 2.5, bgcolor: '#f0f4ff',
                    border: '1px solid #0d47a1', borderRadius: '10px',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <AssignmentIcon sx={{ color: '#0d47a1' }} />
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#0d47a1' }}>
                                Formulaire FRO Telnet
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#888', mt: 0.2 }}>
                                Fiche de revue de l&apos;offre (projet Forfait)
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {data?.fro_filled && (
                            <Chip label="✓ Rempli" color="success" size="small" sx={{ fontWeight: 600 }} />
                        )}
                        <Button variant={disabled ? 'outlined' : 'contained'}
                            onClick={() => navigate(`/projects/${projectId}/rct/fro`)}
                            sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', ...(disabled ? {} : { bgcolor: '#0d47a1', '&:hover': { bgcolor: '#1565c0' } }) }}>
                            {disabled ? 'Consulter le formulaire' : (data?.fro_filled ? 'Modifier le formulaire' : 'Remplir le formulaire')}
                        </Button>
                    </Box>
                </Box>
            )}

            {!formOk && !disabled && (
                <Typography sx={{ fontSize: '0.78rem', color: '#c62828', mb: 1 }}>
                    Renseignez le formulaire {isForfait ? 'FRO' : 'FRP'} correspondant au type de projet avant de continuer.
                </Typography>
            )}

            <MultiVersionUpload label="📄 Cahier des charges"
                fieldName="cahier_charges" urls={data?.cahier_charges_urls || []}
                onQueueChange={onQueueChange} disabled={disabled} />
            <MultiVersionUpload label="📝 Formulaire interactif question/réponse"
                fieldName="formulaire_interactif" urls={data?.formulaire_interactif_urls || []}
                onQueueChange={onQueueChange} disabled={disabled} />

            {/* ── Tableau des risques préliminaires ── */}
            <Divider sx={{ my: 2.5 }} />
            <Box sx={{ mb: 1 }}>
                <Typography sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5, fontSize: '0.9rem', borderBottom: '2px solid #e3f2fd', pb: 0.8 }}>
                    ⚠️ Risques préliminaires du projet
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#888', mb: 1.5 }}>
                    Récapitulatif des risques identifiés pour ce projet. Utilisez la{' '}
                    <span
                        onClick={() => navigate(`/projects/${projectId}/risks`)}
                        style={{ color: '#1976d2', cursor: 'pointer', fontWeight: 600 }}>
                        cartographie des risques
                    </span>{' '}
                    pour les gérer.
                </Typography>
                <PreliminaryRisksTable risks={risks} loading={risksLoading} />
            </Box>
        </Box>
    )
}

// ── STEP 2 ────────────────────────────────────────────────────────────────
const StepTwo = ({
    data, step1Data, projectType, onQueueChange, exigences, setExigences, competences, disabled, projectId, navigate,
}) => {
    const cahierUrls = step1Data?.cahier_charges_urls || []
    const qrUrls = data?.formulaire_qr_final_urls || []
    const isForfait = projectType === 'forfait'

    return (
        <Box>
            <SectionTitle>Développement de l&apos;offre</SectionTitle>

            <AutoDocBanner
                title="📝 Formulaire Q/R — version finale"
                subtitle="Reprise automatique du formulaire interactif de l&apos;étape 1 (dernière version)."
                urls={qrUrls}
                emptyText="Importez d&apos;abord le formulaire interactif à l&apos;étape 1."
            />

            <AutoDocBanner
                title="📄 Cahier des charges (étape 1)"
                subtitle="Dernière version importée à l&apos;étape précédente."
                urls={cahierUrls}
                emptyText="Aucun cahier des charges à l&apos;étape 1."
            />

            <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.8, fontWeight: 600 }}>
                    ⚖️ Exigences légales et réglementaires
                </Typography>
                <TextField fullWidth multiline rows={4} size="small"
                    placeholder="Saisie libre et/ou complément aux pièces importées..."
                    value={exigences} onChange={e => setExigences(e.target.value)}
                    disabled={disabled}
                    sx={{ mb: 1.5 }} />
                <MultiVersionUpload label="📎 Pièces jointes (optionnel, plusieurs versions)"
                    fieldName="exigences_legales_fichier"
                    urls={data?.exigences_legales_fichier_urls || []}
                    onQueueChange={onQueueChange} disabled={disabled} />
            </Box>

            {competences && (
                <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1 }}>🛠 Ressources et compétences du projet</Typography>
                    {[
                        { label: 'Langages', items: competences.langages },
                        { label: 'OS & Outils', items: competences.os_outils },
                        { label: 'DevOps', items: competences.devops },
                        { label: 'Management', items: competences.management },
                    ].map(({ label, items }) => items?.length > 0 && (
                        <Box key={label} sx={{ mb: 0.8 }}>
                            <Typography sx={{ fontSize: '0.78rem', color: '#888', mb: 0.4 }}>{label}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {items.map(i => <Chip key={i} label={i} size="small" variant="outlined" sx={{ fontSize: '0.74rem' }} />)}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}

            <MultiVersionUpload label="💼 Offre technique et financière"
                fieldName="offre_tech_financier" urls={data?.offre_tech_financier_urls || []}
                onQueueChange={onQueueChange} disabled={disabled} />

            <Box sx={{
                mb: 2.5, p: 2, bgcolor: '#f5f5f5', borderRadius: '10px',
                border: '1px solid #cfd8dc',
            }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 1 }}>📋 Fiche revue de l&apos;offre</Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#666', mb: 1.5 }}>
                    Données saisies à l&apos;étape 1 ({isForfait ? 'formulaire FRO' : 'formulaire FRP'}). Aucune import manuelle.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button variant="outlined" size="small"
                        onClick={() => navigate(isForfait ? `/projects/${projectId}/rct/fro` : `/projects/${projectId}/rct/frp`)}
                        sx={{ textTransform: 'none' }}>
                        Consulter la fiche étape 1
                    </Button>
                    {((isForfait ? step1Data?.fro_filled : step1Data?.frp_filled)) && (
                        <Chip size="small" label="Liée à l&apos;étape 1" color="success" sx={{ fontWeight: 600 }} />
                    )}
                </Box>
            </Box>

            <MultiVersionUpload label="📅 Fichier planning prévisionnel"
                fieldName="planning" urls={data?.planning_urls || []}
                onQueueChange={onQueueChange} disabled={disabled} />
            <MultiVersionUpload label="📞 CR des réunions de suivi de l'offre avec le client"
                fieldName="cr_reunions" urls={data?.cr_reunions_urls || []}
                onQueueChange={onQueueChange} disabled={disabled} />
        </Box>
    )
}

// ── STEP 3 ────────────────────────────────────────────────────────────────
const StepThree = ({ data, onQueueChange, decision, setDecision, disabled }) => (
    <Box>
        <SectionTitle>Clôture de la réponse à l&apos;offre</SectionTitle>

        <AutoDocBanner
            title="📄 Dernière version de l'offre envoyée"
            subtitle="Reprise automatique de l&apos;offre technique et financière de l&apos;étape 2 (dernière version)."
            urls={data?.derniere_version_offre_urls || []}
            emptyText="Complétez d&apos;abord l&apos;offre à l&apos;étape 2, ou passez à l&apos;étape suivante depuis l&apos;étape 2 pour synchroniser."
        />

        <AutoDocBanner
            title="📅 Fichier planning prévisionnel"
            subtitle="Reprise automatique du planning de l&apos;étape 2 (dernière version)."
            urls={data?.planning_urls || []}
            emptyText="Importez le planning prévisionnel à l&apos;étape 2."
        />

        <MultiVersionUpload label="📨 Retour du client"
            fieldName="retour_client" urls={data?.retour_client_urls || []}
            onQueueChange={onQueueChange} disabled={disabled} />
        <Divider sx={{ my: 2 }} />
        <Box>
            <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.8, fontWeight: 600 }}>🏁 Décision finale</Typography>
            <TextField fullWidth select size="small" value={decision}
                onChange={e => setDecision(e.target.value)} disabled={disabled}>
                <MenuItem value="en_attente">⏳ En attente</MenuItem>
                <MenuItem value="acceptee">✅ Offre acceptée</MenuItem>
                <MenuItem value="refusee">❌ Offre refusée</MenuItem>
            </TextField>
        </Box>
    </Box>
)

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────────
const RCTPage = () => {
    const { id }      = useParams()
    const navigate    = useNavigate()
    const [rct, setRct]               = useState(null)
    const [project, setProject]       = useState(null)
    const [loading, setLoading]       = useState(true)
    const [saving, setSaving]         = useState(false)
    const [pendingUploads, setPendingUploads] = useState({})
    const [exigences, setExigences]   = useState('')
    const [decision, setDecision]     = useState('en_attente')
    const [viewStep, setViewStep]     = useState(1)
    const [risks, setRisks]           = useState([])
    const [risksLoading, setRisksLoading] = useState(false)

    const setFieldQueue = useCallback((field, files) => {
        setPendingUploads(prev => ({ ...prev, [field]: files }))
    }, [])

    useEffect(() => {
        const load = async () => {
            try {
                const [projRes, rctRes] = await Promise.all([
                    AxiosInstance.get(`projects/${id}/`),
                    AxiosInstance.get(`projects/${id}/rct/`),
                ])
                setProject(projRes.data)
                if (rctRes.status !== 204) {
                    setRct(rctRes.data)
                    setExigences(rctRes.data.step2?.exigences_legales || '')
                    setDecision(rctRes.data.step3?.decision || 'en_attente')
                    if (rctRes.data.status === 'termine') setViewStep(1)
                    else setViewStep(rctRes.data.current_step || 1)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        const loadRisks = async () => {
            setRisksLoading(true)
            try {
                const res = await AxiosInstance.get(`risks/?project=${id}`)
                setRisks(res.data?.results ?? res.data ?? [])
            } catch {
                // Risques non accessibles (rôle non autorisé) → on garde [] silencieusement
                setRisks([])
            } finally {
                setRisksLoading(false)
            }
        }

        load()
        loadRisks()
    }, [id])

    const handleCreate = async () => {
        setSaving(true)
        try {
            const res = await AxiosInstance.post(`projects/${id}/rct/`)
            setRct(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    const appendFilesToFormData = (data, field, files) => {
        if (!files || !files.length) return
        files.forEach((f, i) => {
            if (f) data.append(`${field}__${i}`, f)
        })
    }

    const handleSave = async (action) => {
        if (!rct) return
        setSaving(true)
        const isTermine = rct.status === 'termine'
        const inPostEdit = isTermine && rct.post_edit_mode
        const stepToSave = inPostEdit ? viewStep : rct.current_step
        const data = new FormData()
        Object.entries(pendingUploads).forEach(([field, files]) => appendFilesToFormData(data, field, files))
        if (stepToSave === 2) data.append('exigences_legales', exigences)
        if (stepToSave === 3) data.append('decision', decision)
        data.append('action', action)
        try {
            const res = await AxiosInstance.patch(`projects/${id}/rct/step/${stepToSave}/`, data)
            setRct(res.data)
            setPendingUploads({})
            if (res.data.step2) setExigences(res.data.step2.exigences_legales || '')
            if (res.data.step3) setDecision(res.data.step3.decision || 'en_attente')
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    const unlockPostEdit = async () => {
        setSaving(true)
        try {
            const res = await AxiosInstance.patch(`projects/${id}/rct/`, { post_edit_mode: true })
            setRct(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
        </Box>
    )

    const currentStep = rct?.current_step || 1
    const isTermine   = rct?.status === 'termine'
    const activeStep  = isTermine ? viewStep : currentStep
    const isLocked    = ['Archive', 'Kickoff', 'Realisation'].includes(project?.phase)
    // Après « Terminer », la phase peut être Kickoff/Archive : le RCT reste réouvrable en correction.
    const isEditable  = (!isTermine && !isLocked) || (!!isTermine && !!rct?.post_edit_mode)

    const hasVersions = (stepKey, urlsKey, singleUrlKey) => {
        const step = rct?.[stepKey]
        const arr = step?.[urlsKey]
        if (Array.isArray(arr) && arr.length > 0) return true
        if (step?.[singleUrlKey]) return true
        return false
    }

    const hasPending = (field) => {
        const q = pendingUploads[field]
        return Array.isArray(q) && q.some(Boolean)
    }

    const projectType = rct?.project_type || project?.type_projet

    const step1FormOk = projectType === 'forfait'
        ? !!rct?.step1?.fro_filled
        : !!rct?.step1?.frp_filled

    const canProceed = (() => {
        if (!rct) return false
        if (currentStep === 1) {
            return (hasVersions('step1', 'cahier_charges_urls', 'cahier_charges_url') || hasPending('cahier_charges')) &&
                (hasVersions('step1', 'formulaire_interactif_urls', 'formulaire_interactif_url') || hasPending('formulaire_interactif')) &&
                step1FormOk
        }
        if (currentStep === 2) {
            const exOk = (exigences && exigences.trim() !== '') ||
                hasVersions('step2', 'exigences_legales_fichier_urls', 'exigences_legales_fichier_url') ||
                hasPending('exigences_legales_fichier')
            const qrOk = hasVersions('step2', 'formulaire_qr_final_urls', 'formulaire_qr_final_url') ||
                hasVersions('step1', 'formulaire_interactif_urls', 'formulaire_interactif_url') ||
                hasPending('formulaire_interactif')
            return exOk && qrOk && step1FormOk &&
                (hasVersions('step2', 'offre_tech_financier_urls', 'offre_tech_financier_url') || hasPending('offre_tech_financier')) &&
                (hasVersions('step2', 'planning_urls', 'planning_url') || hasPending('planning')) &&
                (hasVersions('step2', 'cr_reunions_urls', 'cr_reunions_url') || hasPending('cr_reunions'))
        }
        if (currentStep === 3) {
            return (hasVersions('step3', 'derniere_version_offre_urls', 'derniere_version_offre_url') || hasPending('derniere_version_offre')) &&
                (hasVersions('step3', 'planning_urls', 'planning_url') || hasPending('planning')) &&
                (hasVersions('step3', 'retour_client_urls', 'retour_client_url') || hasPending('retour_client'))
        }
        return true
    })()

    const showFlowActions = !isLocked && !isTermine
    const showPostEditSave = isTermine && rct?.post_edit_mode

    return (
        <Box sx={{ p: 3, maxWidth: 860, mx: 'auto' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/projects/${id}`)}
                sx={{ textTransform: 'none', color: '#666', mb: 2 }}>
                Retour au projet
            </Button>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Réponse à un appel d&apos;offre : RCT
            </Typography>

            {project && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                    bgcolor: '#f0f7ff', border: '1px solid #d0e8ff', borderRadius: '10px', mb: 3, mt: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>Projet concerné</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{project.client} — {project.ref_projet}</Typography>
                    <Chip size="small" label={project.type_projet === 'forfait' ? 'Forfait' : 'Assistance technique'} sx={{ fontWeight: 600 }} />
                    {rct && (
                        <Chip
                            label={rct.status === 'en_cours' ? 'En cours' : rct.status === 'pause' ? 'En pause' : 'Terminé'}
                            color={rct.status === 'en_cours' ? 'primary' : rct.status === 'pause' ? 'warning' : 'success'}
                            size="small" sx={{ ml: 'auto', fontWeight: 600 }} />
                    )}
                </Box>
            )}

            {isLocked && !isTermine && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1.5, mb: 2, borderRadius: '10px',
                    bgcolor: '#fff3e0', border: '1px solid #ff9800',
                }}>
                    <Typography sx={{ fontSize: '1.1rem' }}>🔒</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#e65100', fontSize: '0.9rem' }}>
                        Projet verrouillé — les formulaires RCT sont en lecture seule.
                    </Typography>
                </Box>
            )}

            {isTermine && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                    flexWrap: 'wrap',
                    p: 1.5, mb: 2, borderRadius: '10px',
                    bgcolor: '#e3f2fd', border: '1px solid #1976d2',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '1.1rem' }}>ℹ️</Typography>
                        <Box>
                            <Typography sx={{ fontWeight: 700, color: '#1565c0', fontSize: '0.9rem' }}>
                                {rct?.post_edit_mode
                                    ? 'Mode correction — enregistrez pour revenir en consultation seule.'
                                    : 'RCT terminé — consultation uniquement si tu veux modifier clique sur le bouton ci-dessous'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#1976d2' }}>
                                Cliquez sur une étape du stepper pour naviguer.
                            </Typography>
                        </Box>
                    </Box>
                    {!rct?.post_edit_mode && (
                        <Button variant="contained" disabled={saving} onClick={unlockPostEdit}
                        sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#455a64', '&:hover': { bgcolor: '#37474f' } }}>
                        Modifier le RCT
                        </Button>
                    )}
                </Box>
            )}

            {!rct ? (
                <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed #bbb', borderRadius: '14px' }}>
                    <Typography sx={{ fontSize: '1rem', color: '#666', mb: 2 }}>
                        Aucune réponse d&apos;offre n&apos;a été initiée pour ce projet.
                    </Typography>
                    <Button variant="contained" disabled={saving} onClick={handleCreate}
                        sx={{ textTransform: 'none', fontWeight: 600 }}>
                        {saving ? 'Création...' : "Démarrer la réponse à l'offre"}
                    </Button>
                </Box>
            ) : (
                <>
                    <Stepper activeStep={activeStep - 1} nonLinear={isTermine} sx={{ mb: 4 }}>
                        {[
                            'STEP #1\nÉtude de faisabilité\nBesoin',
                            "STEP #2\nDéveloppement de l'offre",
                            "STEP #3\nClôture de la réponse à l'offre",
                        ].map((label, i) => (
                            <Step key={i} completed={
                                (i === 0 && rct.step1?.completed) ||
                                (i === 1 && rct.step2?.completed) ||
                                (i === 2 && rct.step3?.completed)
                            }>
                                {isTermine ? (
                                    <StepButton onClick={() => setViewStep(i + 1)}
                                        sx={{ borderRadius: '8px', '&:hover': { bgcolor: '#f0f7ff' } }}>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'pre-line' }}>
                                            {label}
                                        </Typography>
                                    </StepButton>
                                ) : (
                                    <StepLabel>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'pre-line' }}>
                                            {label}
                                        </Typography>
                                    </StepLabel>
                                )}
                            </Step>
                        ))}
                    </Stepper>

                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: '14px', p: 3, mb: 3 }}>
                        {activeStep === 1 && (
                            <StepOne data={rct.step1} projectType={projectType} projectId={id}
                                navigate={navigate} disabled={!isEditable} onQueueChange={setFieldQueue}
                                risks={risks} risksLoading={risksLoading} />
                        )}
                        {activeStep === 2 && (
                            <StepTwo data={rct.step2} step1Data={rct.step1} projectType={projectType}
                                onQueueChange={setFieldQueue} exigences={exigences}
                                setExigences={setExigences} competences={project} disabled={!isEditable}
                                projectId={id} navigate={navigate} />
                        )}
                        {activeStep === 3 && (
                            <StepThree data={rct.step3} onQueueChange={setFieldQueue}
                                decision={decision} setDecision={setDecision} disabled={!isEditable} />
                        )}
                    </Box>

                    {isTermine && !rct.post_edit_mode && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                            <Chip label="✅ RCT Terminé" color="success" sx={{ fontWeight: 700, fontSize: '0.95rem', px: 1 }} />
                        </Box>
                    )}

                    {showFlowActions && (
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {currentStep > 1 && (
                                    <Button variant="outlined" disabled={saving}
                                        onClick={() => handleSave('prev')}
                                        sx={{ textTransform: 'none' }}>
                                        ← Précédent
                                    </Button>
                                )}
                                {rct.status !== 'termine' && (
                                    <Button variant="outlined" color="warning" startIcon={<PauseIcon />}
                                        disabled={saving} onClick={() => handleSave('pause')}
                                        sx={{ textTransform: 'none' }}>
                                        Pause
                                    </Button>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="outlined" disabled={saving}
                                    onClick={() => handleSave('save')}
                                    sx={{ textTransform: 'none' }}>
                                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                                </Button>
                                {currentStep < 3 ? (
                                    <Button variant="contained" disabled={saving || !canProceed}
                                        onClick={() => handleSave('next')}
                                        sx={{ textTransform: 'none', fontWeight: 600 }}>
                                        {saving ? '...' : 'Suivant →'}
                                    </Button>
                                ) : (
                                    <Button variant="contained" color="success" disabled={saving || !canProceed}
                                        startIcon={<CheckCircleIcon />}
                                        onClick={() => handleSave('finish')}
                                        sx={{ textTransform: 'none', fontWeight: 600 }}>
                                        {saving ? '...' : 'Terminer'}
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    )}

                    {showPostEditSave && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                            <Button variant="contained" disabled={saving}
                                onClick={() => handleSave('save')}
                                sx={{ textTransform: 'none', fontWeight: 600 }}>
                                {saving ? 'Sauvegarde...' : 'Sauvegarder et quitter le mode correction'}
                            </Button>
                        </Box>
                    )}
                </>
            )}
        </Box>
    )
}

export default RCTPage
