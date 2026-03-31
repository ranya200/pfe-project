import { useEffect, useState } from 'react'
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

// ── Composant upload fichier ──────────────────────────────────────────────
const FileUpload = ({ label, fieldName, existingUrl, onChange, disabled }) => {
    const [file, setFile] = useState(null)
    const handleChange = (e) => {
        const f = e.target.files[0]
        setFile(f)
        onChange(fieldName, f)
    }
    const fileName = file?.name || (existingUrl ? existingUrl.split('/').pop() : null)
    return (
        <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.85rem', color: disabled ? '#aaa' : '#555', mb: 0.8, fontWeight: 600 }}>
                {label}
            </Typography>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                p: 1.5,
                border: `1px ${disabled ? 'solid' : 'dashed'} ${disabled ? '#e0e0e0' : '#bbb'}`,
                borderRadius: '8px',
                bgcolor: disabled ? '#f5f5f5' : '#fafafa',
                cursor: disabled ? 'not-allowed' : 'pointer',
                ...(!disabled && { '&:hover': { borderColor: '#1976d2', bgcolor: '#f0f7ff' } }),
            }} onClick={disabled ? undefined : () => document.getElementById(`file-${fieldName}`).click()}>
                <UploadFileIcon sx={{ color: disabled ? '#ccc' : '#1976d2' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: disabled ? '#aaa' : '#333' }}>
                        {fileName || (disabled ? 'Aucun fichier importé' : 'Cliquer pour importer un fichier')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: disabled ? '#bbb' : '#888' }}>
                        {disabled ? 'Consultation uniquement' : 'PDF, Word, Excel — tous formats'}
                    </Typography>
                </Box>
                {fileName && <CheckCircleIcon sx={{ color: disabled ? '#bbb' : '#4caf50', fontSize: '1.2rem' }} />}
                {existingUrl && !file && (
                    <Button size="small" href={existingUrl} target="_blank"
                        onClick={e => e.stopPropagation()}
                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                        Voir
                    </Button>
                )}
            </Box>
            {!disabled && <input id={`file-${fieldName}`} type="file" hidden onChange={handleChange} />}
        </Box>
    )
}

// ── Section titre ─────────────────────────────────────────────────────────
const SectionTitle = ({ children }) => (
    <Typography sx={{
        fontWeight: 700, color: '#1976d2', mb: 2, mt: 1,
        fontSize: '0.9rem', borderBottom: '2px solid #e3f2fd', pb: 0.8,
    }}>
        {children}
    </Typography>
)

// ── STEP 1 ────────────────────────────────────────────────────────────────
const StepOne = ({ data, onChange, projectId, navigate, disabled }) => (
    <Box>
        <SectionTitle>Étude de faisabilité — Besoins</SectionTitle>

        {/* Bouton FRP interactif */}
        <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            p: 2, mb: 2, bgcolor: '#f0f7ff',
            border: '1px solid #1976d2', borderRadius: '10px',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AssignmentIcon sx={{ color: '#1976d2' }} />
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#1565c0' }}>
                        Formulaire FRP Telnet renseigné
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: '#888', mt: 0.2 }}>
                        Fiche de revue de l'offre d'assistance technique
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

        {/* Bouton FRO interactif */}
        <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            p: 2, mb: 2.5, bgcolor: '#f0f4ff',
            border: '1px solid #0d47a1', borderRadius: '10px',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AssignmentIcon sx={{ color: '#0d47a1' }} />
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#0d47a1' }}>
                        Formulaire FRO Telnet renseigné
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: '#888', mt: 0.2 }}>
                        Fiche de revue de l'offre 
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

        <FileUpload label="📄 Cahier des charges"
            fieldName="cahier_charges" existingUrl={data?.cahier_charges_url} onChange={onChange} disabled={disabled} />
        <FileUpload label="📝 Formulaire interactif question/réponse"
            fieldName="formulaire_interactif" existingUrl={data?.formulaire_interactif_url} onChange={onChange} disabled={disabled} />
    </Box>
)



// ── STEP 2 ────────────────────────────────────────────────────────────────
const StepTwo = ({ data, step1Data, onChange, exigences, setExigences, competences, disabled }) => (
    <Box>
        <SectionTitle>Développement de l'offre</SectionTitle>
        <FileUpload label="📝 Formulaire Q/R version finale"
            fieldName="formulaire_qr_final" existingUrl={data?.formulaire_qr_final_url} onChange={onChange} disabled={disabled} />

        {step1Data?.cahier_charges_url && (
            <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#f0f7ff', borderRadius: '8px',
                border: '1px solid #d0e8ff', display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon sx={{ color: '#1976d2' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>📄 Cahier des charges (Step 1)</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>Importé à l'étape précédente</Typography>
                </Box>
                <Button size="small" href={step1Data.cahier_charges_url} target="_blank"
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}>Consulter</Button>
            </Box>
        )}

        <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 0.8, fontWeight: 600 }}>
                ⚖️ Exigences légales et réglementaires
            </Typography>
            <TextField fullWidth multiline rows={4} size="small"
                placeholder="Insérer les exigences légales et réglementaires..."
                value={exigences} onChange={e => setExigences(e.target.value)}
                disabled={disabled} />
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

        <FileUpload label="💼 Offre technique et financière"
            fieldName="offre_tech_financier" existingUrl={data?.offre_tech_financier_url} onChange={onChange} disabled={disabled} />
        <FileUpload label="📋 Fiche revue de l'offre"
            fieldName="fiche_revue_offre" existingUrl={data?.fiche_revue_offre_url} onChange={onChange} disabled={disabled} />
        <FileUpload label="📅 Fichier planning"
            fieldName="planning" existingUrl={data?.planning_url} onChange={onChange} disabled={disabled} />
        <FileUpload label="📞 CR des réunions de suivi de l'offre avec client"
            fieldName="cr_reunions" existingUrl={data?.cr_reunions_url} onChange={onChange} disabled={disabled} />
    </Box>
)

// ── STEP 3 ────────────────────────────────────────────────────────────────
const StepThree = ({ data, onChange, decision, setDecision, disabled }) => (
    <Box>
        <SectionTitle>Clôture de la réponse à l'offre</SectionTitle>
        <FileUpload label="📄 Dernière version de l'offre envoyée"
            fieldName="derniere_version_offre" existingUrl={data?.derniere_version_offre_url} onChange={onChange} disabled={disabled} />
        <FileUpload label="📅 Fichier planning"
            fieldName="planning" existingUrl={data?.planning_url} onChange={onChange} disabled={disabled} />
        <FileUpload label="📨 Retour du client"
            fieldName="retour_client" existingUrl={data?.retour_client_url} onChange={onChange} disabled={disabled} />
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
    const [files, setFiles]           = useState({})
    const [exigences, setExigences]   = useState('')
    const [decision, setDecision]     = useState('en_attente')
    const [viewStep, setViewStep]     = useState(1)

    useEffect(() => {
        const load = async () => {
            try {
                const projRes = await AxiosInstance.get(`projects/${id}/`)
                setProject(projRes.data)
                const rctRes = await AxiosInstance.get(`projects/${id}/rct/`)
                if (rctRes.status !== 204) {
                    setRct(rctRes.data)
                    setExigences(rctRes.data.step2?.exigences_legales || '')
                    setDecision(rctRes.data.step3?.decision || 'en_attente')
                    // When RCT is terminated start viewing from step 1
                    if (rctRes.data.status === 'termine') setViewStep(1)
                    else setViewStep(rctRes.data.current_step || 1)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        load()
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

    const handleFileChange = (field, file) => {
        setFiles(prev => ({ ...prev, [field]: file }))
    }

    const handleSave = async (action) => {
        setSaving(true)
        const step = rct.current_step
        const data = new FormData()
        Object.entries(files).forEach(([k, v]) => { if (v) data.append(k, v) })
        if (step === 2) data.append('exigences_legales', exigences)
        if (step === 3) data.append('decision', decision)
        data.append('action', action)
        try {
            const res = await AxiosInstance.patch(`projects/${id}/rct/step/${step}/`, data)
            setRct(res.data)
            setFiles({})
            if (res.data.step2) setExigences(res.data.step2.exigences_legales || '')
            if (res.data.step3) setDecision(res.data.step3.decision || 'en_attente')
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
    // In read-only mode navigate using viewStep; otherwise follow current_step
    const activeStep  = isTermine ? viewStep : currentStep
    // Cloture = step 3 en cours → pas encore verrouillé pour les actions RCT
    const isLocked    = ['Archive', 'Kickoff', 'Realisation'].includes(project?.phase)

    // Vérifie si tous les champs requis de l'étape courante sont remplis
    // Un champ est rempli si un fichier vient d'être uploadé (files[x]) OU s'il existe déjà en base (rct.stepN?.xxx_url)
    const hasFile = (field, urlField, stepKey) =>
        !!(files[field] || rct?.[stepKey]?.[urlField])

    const canProceed = (() => {
        if (!rct) return false
        if (currentStep === 1) {
            return hasFile('cahier_charges',       'cahier_charges_url',        'step1') &&
                   hasFile('formulaire_interactif', 'formulaire_interactif_url', 'step1') &&
                   !!rct?.step1?.frp_filled &&
                   !!rct?.step1?.fro_filled
        }
        if (currentStep === 2) {
            return hasFile('formulaire_qr_final',   'formulaire_qr_final_url',   'step2') &&
                   exigences.trim() !== ''                                                  &&
                   hasFile('offre_tech_financier',  'offre_tech_financier_url',  'step2') &&
                   hasFile('fiche_revue_offre',     'fiche_revue_offre_url',     'step2') &&
                   hasFile('planning',              'planning_url',              'step2') &&
                   hasFile('cr_reunions',           'cr_reunions_url',           'step2')
        }
        if (currentStep === 3) {
            return hasFile('derniere_version_offre', 'derniere_version_offre_url', 'step3') &&
                   hasFile('planning',               'planning_url',               'step3') &&
                   hasFile('retour_client',          'retour_client_url',          'step3')
        }
        return true
    })()

    return (
        <Box sx={{ p: 3, maxWidth: 860, mx: 'auto' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/projects/${id}`)}
                sx={{ textTransform: 'none', color: '#666', mb: 2 }}>
                Retour au projet
            </Button>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Réponse à un appel d'offre : RCT
            </Typography>

            {project && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                    bgcolor: '#f0f7ff', border: '1px solid #d0e8ff', borderRadius: '10px', mb: 3, mt: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>Projet concerné</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{project.client} — {project.ref_projet}</Typography>
                    {rct && (
                        <Chip
                            label={rct.status === 'en_cours' ? 'En cours' : rct.status === 'pause' ? 'En pause' : 'Terminé'}
                            color={rct.status === 'en_cours' ? 'primary' : rct.status === 'pause' ? 'warning' : 'success'}
                            size="small" sx={{ ml: 'auto', fontWeight: 600 }} />
                    )}
                </Box>
            )}

            {/* ── Bandeau verrouillé (phase projet) ── */}
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

            {/* ── Bandeau RCT terminé (lecture seule) ── */}
            {isTermine && (
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1.5, mb: 2, borderRadius: '10px',
                    bgcolor: '#e3f2fd', border: '1px solid #1976d2',
                }}>
                    <Typography sx={{ fontSize: '1.1rem' }}>ℹ️</Typography>
                    <Box>
                        <Typography sx={{ fontWeight: 700, color: '#1565c0', fontSize: '0.9rem' }}>
                            RCT terminé — consultation uniquement
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: '#1976d2' }}>
                            Cliquez sur une étape du stepper pour naviguer entre les étapes.
                        </Typography>
                    </Box>
                </Box>
            )}

            {!rct ? (
                <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed #bbb', borderRadius: '14px' }}>
                    <Typography sx={{ fontSize: '1rem', color: '#666', mb: 2 }}>
                        Aucune réponse d'offre n'a été initiée pour ce projet.
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
                            <StepOne data={rct.step1} onChange={handleFileChange}
                                projectId={id} navigate={navigate} disabled={isTermine} />
                        )}
                        {activeStep === 2 && (
                            <StepTwo data={rct.step2} step1Data={rct.step1}
                                onChange={handleFileChange} exigences={exigences}
                                setExigences={setExigences} competences={project} disabled={isTermine} />
                        )}
                        {activeStep === 3 && (
                            <StepThree data={rct.step3} onChange={handleFileChange}
                                decision={decision} setDecision={setDecision} disabled={isTermine} />
                        )}
                    </Box>

                    {/* ── Boutons d'action (cachés si terminé ou verrouillé) ── */}
                    {isTermine && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                            <Chip label="✅ RCT Terminé" color="success" sx={{ fontWeight: 700, fontSize: '0.95rem', px: 1 }} />
                        </Box>
                    )}
                    {!isLocked && !isTermine && (
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
                </>
            )}
        </Box>
    )
}

export default RCTPage
