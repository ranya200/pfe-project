import os
from django.core.files.base import ContentFile
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import RCT, Step1, Step2, Step3, FRPForm, FROForm
from .serializers import RCTSerializer, Step1Serializer, Step2Serializer, Step3Serializer, FRPFormSerializer, FROFormSerializer
from projects.models import Project
from projects.views import LOCKED_PHASES
from audit.models import AuditLog
from audit.middleware import get_audit_context
from risk_management.models import Risk as RiskModel

def _ordered_uploads(request, field):
    files = []
    i = 0
    while True:
        key = f"{field}__{i}"
        if key in request.FILES:
            files.append(request.FILES[key])
            i += 1
        else:
            break
    return files

def _step1_form_decided(rct):
    t = rct.project.type_projet
    if t == 'forfait':
        try:
            return bool(rct.fro.decision_fro)
        except Exception:
            return False
    try:
        return bool(rct.frp.decision_frp)
    except Exception:
        return False


def _has_any_file(file_field, versions, key):
    if file_field and getattr(file_field, 'name', None):
        return True
    p = (versions or {}).get(key) or []
    if isinstance(p, str):
        p = [p]
    return bool(p)


def _step_is_complete(step, n):
    if n == 1:
        return bool(
            step.cahier_charges and step.formulaire_interactif and
            _step1_form_decided(step.rct)
        )
    if n == 2:
        rct = step.rct
        s1 = rct.step1
        ex_txt = step.exigences_legales and step.exigences_legales.strip()
        ex_f = _has_any_file(step.exigences_legales_fichier, step.file_versions, 'exigences_legales_fichier')
        if not (ex_txt or ex_f):
            return False
        if not (s1.formulaire_interactif or _has_any_file(None, s1.file_versions, 'formulaire_interactif')):
            return False
        if not _step1_form_decided(rct):
            return False
        return bool(
            step.offre_tech_financier and
            step.planning and step.cr_reunions
        )
    if n == 3:
        s2 = step.rct.step2
        offre_ok = _has_any_file(step.derniere_version_offre, step.file_versions, 'derniere_version_offre') or \
            bool(s2.offre_tech_financier or _has_any_file(None, s2.file_versions, 'offre_tech_financier'))
        plan_ok = _has_any_file(step.planning, step.file_versions, 'planning') or \
            bool(s2.planning or _has_any_file(None, s2.file_versions, 'planning'))
        ret_ok = _has_any_file(step.retour_client, step.file_versions, 'retour_client')
        return bool(offre_ok and plan_ok and ret_ok)
    return False


def _dup_filefield_to(src_inst, src_attr, dest_inst, dest_attr):
    src_f = getattr(src_inst, src_attr)
    if not src_f or not getattr(src_f, 'name', None):
        return
    dest_f = getattr(dest_inst, dest_attr)
    src_f.open('rb')
    try:
        content = src_f.read()
    finally:
        src_f.close()
    base = os.path.basename(src_f.name)
    dest_f.save(base, ContentFile(content), save=False)
    dest_inst.save()


def _copy_step2_to_step3(rct):
    s2 = rct.step2
    s3 = rct.step3
    _dup_filefield_to(s2, 'offre_tech_financier', s3, 'derniere_version_offre')
    _dup_filefield_to(s2, 'planning', s3, 'planning')
    fv = dict(s3.file_versions or {})
    if s3.derniere_version_offre and s3.derniere_version_offre.name:
        fv['derniere_version_offre'] = [s3.derniere_version_offre.name]
    if s3.planning and s3.planning.name:
        fv['planning'] = [s3.planning.name]
    s3.file_versions = fv
    s3.save(update_fields=['file_versions', 'updated_at'])


def _rct_write_allowed(rct):
    blocked = ['Archive', 'Kickoff', 'Realisation']
    if rct.project.phase in blocked:
        return rct.status == 'termine' and rct.post_edit_mode
    return True


def _frp_fro_write_allowed(rct):
    if rct.project.phase not in LOCKED_PHASES:
        return True
    return rct.status == 'termine' and rct.post_edit_mode


class RCTView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, project_id):
        try:
            project = Project.objects.get(pk=project_id)
            rct = RCT.objects.get(project=project)
            return Response(RCTSerializer(rct, context={'request': request}).data)
        except Project.DoesNotExist:
            return Response({'error': 'Projet introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        except RCT.DoesNotExist:
            return Response(None, status=status.HTTP_204_NO_CONTENT)

    def post(self, request, project_id):
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({'error': 'Projet introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.role == 'admin':
            pass
        elif user.role in ['chef_projet', 'resp_qualite']:
            if not project.membres.filter(id=user.id).exists():
                return Response({'error': 'Accès refusé : vous n\'êtes pas membre de ce projet.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

        if RCT.objects.filter(project=project).exists():
            return Response({'error': 'Un RCT existe déjà pour ce projet.'}, status=status.HTTP_400_BAD_REQUEST)

        rct = RCT.objects.create(project=project, created_by=request.user)
        Step1.objects.create(rct=rct)
        Step2.objects.create(rct=rct)
        Step3.objects.create(rct=rct)
        FRPForm.objects.create(rct=rct)
        FROForm.objects.create(rct=rct)

        project.phase = 'Offre'
        project.save()

        ctx = get_audit_context()
        AuditLog.objects.create(
            user=request.user,
            action='RCT_CREATE',
            model_name='RCT',
            object_id=str(rct.id),
            object_repr=str(rct),
            new_values={'project': project.ref_projet, 'type': project.type_projet},
            ip_address=ctx.get('ip_address'),
            user_agent=ctx.get('user_agent', ''),
        )

        return Response(RCTSerializer(rct, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def patch(self, request, project_id):
        try:
            rct = RCT.objects.select_related('project').get(project_id=project_id)
        except RCT.DoesNotExist:
            return Response({'error': 'RCT introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if rct.status != 'termine':
            return Response({'error': 'Le mode correction n est disponible que pour un RCT terminé.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        project = rct.project
        if user.role == 'admin':
            pass
        elif user.role in ['chef_projet', 'resp_qualite']:
            if not project.membres.filter(id=user.id).exists():
                return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)

        pe = request.data.get('post_edit_mode')
        if pe is None:
            return Response({'error': 'post_edit_mode est requis (true/false).'}, status=status.HTTP_400_BAD_REQUEST)
        if isinstance(pe, str):
            rct.post_edit_mode = pe.lower() in ('true', '1', 'yes', 'on')
        else:
            rct.post_edit_mode = bool(pe)
        rct.save(update_fields=['post_edit_mode', 'updated_at'])
        return Response(RCTSerializer(rct, context={'request': request}).data)


class RCTStepView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, project_id, step_number):
        try:
            rct = RCT.objects.get(project_id=project_id)
        except RCT.DoesNotExist:
            return Response({'error': 'RCT introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if not _rct_write_allowed(rct):
            return Response({'error': 'Ce projet est verrouillé et ne peut plus être modifié.'}, status=status.HTTP_403_FORBIDDEN)

        if step_number == 1:
            step = rct.step1
            s    = Step1Serializer(step, data=request.data, partial=True, context={'request': request})
        elif step_number == 2:
            step = rct.step2
            s    = Step2Serializer(step, data=request.data, partial=True, context={'request': request})
        elif step_number == 3:
            step = rct.step3
            s    = Step3Serializer(step, data=request.data, partial=True, context={'request': request})
        else:
            return Response({'error': 'Étape invalide (1, 2 ou 3).'}, status=status.HTTP_400_BAD_REQUEST)

        if s.is_valid():
            s.save()
        else:
            return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action')
        project = rct.project

        if action == 'save' and rct.status == 'termine' and rct.post_edit_mode:
            rct.post_edit_mode = False
            rct.save(update_fields=['post_edit_mode', 'updated_at'])

        if action == 'next' and step_number < 3:
            if not _step_is_complete(step, step_number):
                return Response(
                    {'error': 'Tous les champs sont obligatoires avant de passer à l\'étape suivante.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            step.completed = True
            step.save()
            rct.current_step = step_number + 1
            rct.status = 'en_cours'
            rct.save()
            if step_number == 2:
                project.phase = 'Cloture'
                project.save()
                rct.refresh_from_db()
                _copy_step2_to_step3(rct)

        elif action == 'prev' and step_number > 1:
            rct.current_step = step_number - 1
            rct.save()

        elif action == 'pause':
            rct.status = 'pause'
            rct.save()

        elif action == 'finish' and step_number == 3:
            if not _step_is_complete(step, 3):
                return Response(
                    {'error': 'Tous les champs sont obligatoires avant de terminer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            step.completed = True
            step.save()
            rct.status = 'termine'
            rct.save()
            if step.decision == 'acceptee':
                project.phase = 'Kickoff'
            elif step.decision == 'refusee':
                project.phase = 'Archive'
            project.save()

        ctx = get_audit_context()
        action_map = {
            'next':   'avance à l\'étape suivante',
            'prev':   'recule à l\'étape précédente',
            'pause':  'mise en pause',
            'finish': 'terminé',
            'save':   'sauvegarde',
        }

        FIELD_LABELS = {
            'cahier_charges':           'Cahier des charges',
            'formulaire_interactif':    'Formulaire interactif Q/R',
            'offre_tech_financier':     'Offre technique et financière',
            'planning':                 'Planning prévisionnel',
            'cr_reunions':              'CR réunions',
            'exigences_legales_fichier':'Exigences légales (fichier)',
            'retour_client':            'Retour client',
            'derniere_version_offre':   'Dernière version offre',
        }
        fichiers_importes = {}
        for field, label in FIELD_LABELS.items():
            uploads = _ordered_uploads(request, field)
            if uploads:
                fv = getattr(step, 'file_versions', {}) or {}
                existing = fv.get(field, [])
                if isinstance(existing, str):
                    existing = [existing]
                base_version = len(existing)
                fichiers_importes[label] = [
                    f"Version {base_version + i + 1} — {f.name}"
                    for i, f in enumerate(uploads)
                ]

        new_values = {
            'etape':  step_number,
            'action': action_map.get(action, action),
        }
        if fichiers_importes:
            new_values['fichiers_importes'] = fichiers_importes

        AuditLog.objects.create(
            user=request.user,
            action='RCT_UPDATE' if action != 'finish' else 'RCT_FINISH',
            model_name='RCT',
            object_id=str(rct.id),
            object_repr=str(rct),
            new_values=new_values,
            ip_address=ctx.get('ip_address'),
            user_agent=ctx.get('user_agent', ''),
        )

        return Response(RCTSerializer(rct, context={'request': request}).data)


class FRPFormView(APIView):
    """GET/PATCH pour lire et mettre à jour le formulaire FRP d'un projet."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [JSONParser, MultiPartParser, FormParser]

    def _get_frp(self, project_id):
        try:
            rct = RCT.objects.get(project_id=project_id)
            try:
                return rct.frp
            except FRPForm.DoesNotExist:
                return FRPForm.objects.create(rct=rct)
        except RCT.DoesNotExist:
            return None

    def get(self, request, project_id):
        frp = self._get_frp(project_id)
        if frp is None:
            return Response({'error': 'Formulaire FRP introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(FRPFormSerializer(frp).data)

    def patch(self, request, project_id):
        frp = self._get_frp(project_id)
        if frp is None:
            return Response({'error': 'Formulaire FRP introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if not _frp_fro_write_allowed(frp.rct):
            return Response({'error': 'Ce projet est verrouillé et ne peut plus être modifié.'}, status=status.HTTP_403_FORBIDDEN)

        # ── Capturer les anciens besoins AVANT la sauvegarde ─────────────
        old_besoins = list(frp.besoins_ponctuels or [])

        s = FRPFormSerializer(frp, data=request.data, partial=True)
        if s.is_valid():
            s.save(updated_by=request.user)
            frp.refresh_from_db()

            new_besoins = list(frp.besoins_ponctuels or [])
            needs_save = False

            # ── Créer un Risk pour chaque nouveau besoin ponctuel ─────────
            for i, besoin in enumerate(new_besoins):
                uid = besoin.get('uid')
                if not uid:
                    continue  # besoin sans uid → ignoré (ancienne donnée)
                if besoin.get('risk_id'):
                    continue  # déjà synchronisé

                consequences_text = (
                    f"Compréhension: {besoin.get('comprehension') or 'N/A'}, "
                    f"Compétences: {besoin.get('competences') or 'N/A'}, "
                    f"Maîtrise: {besoin.get('maitrise') or 'N/A'}"
                )

                risk = RiskModel.objects.create(
                    project=frp.rct.project,
                    process='Relations Clients',
                    activity='SI',
                    title=besoin.get('description') or 'Besoin ponctuel',
                    risk_type='Interne',
                    origin='Client',
                    causes=besoin.get('actions', ''),
                    consequences=consequences_text,
                    existing_measures='',
                    status='Ouvert',
                    created_by=request.user,
                )

                new_besoins[i] = {**besoin, 'risk_id': risk.id, 'risk_code': risk.code}
                needs_save = True

            # ── Soft-delete les risques des besoins supprimés ─────────────
            new_uids = {b.get('uid') for b in new_besoins if b.get('uid')}
            for old_b in old_besoins:
                uid = old_b.get('uid')
                if uid and uid not in new_uids and old_b.get('risk_id'):
                    try:
                        risk = RiskModel.objects.get(pk=old_b['risk_id'])
                        risk.delete(deleted_by=request.user)
                    except Exception:
                        pass

            if needs_save:
                frp.besoins_ponctuels = new_besoins
                frp.save(update_fields=['besoins_ponctuels', 'updated_at'])

            ctx = get_audit_context()
            AuditLog.objects.create(
                user=request.user,
                action='RCT_UPDATE',
                model_name='FRPForm',
                object_id=str(frp.id),
                object_repr=f'FRP — {frp.rct}',
                new_values={'decision_frp': s.data.get('decision_frp')},
                ip_address=ctx.get('ip_address'),
                user_agent=ctx.get('user_agent', ''),
            )
            return Response(FRPFormSerializer(frp).data)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


class FROFormView(APIView):
    """GET/PATCH pour lire et mettre à jour le formulaire FRO d'un projet."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [JSONParser, MultiPartParser, FormParser]

    def _get_fro(self, project_id):
        try:
            rct = RCT.objects.get(project_id=project_id)
            try:
                return rct.fro
            except FROForm.DoesNotExist:
                return FROForm.objects.create(rct=rct)
        except RCT.DoesNotExist:
            return None

    def get(self, request, project_id):
        fro = self._get_fro(project_id)
        if fro is None:
            return Response({'error': 'Formulaire FRO introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(FROFormSerializer(fro).data)

    def patch(self, request, project_id):
        fro = self._get_fro(project_id)
        if fro is None:
            return Response({'error': 'Formulaire FRO introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if not _frp_fro_write_allowed(fro.rct):
            return Response({'error': 'Ce projet est verrouillé et ne peut plus être modifié.'}, status=status.HTTP_403_FORBIDDEN)
        s = FROFormSerializer(fro, data=request.data, partial=True)
        if s.is_valid():
            s.save(updated_by=request.user)
            ctx = get_audit_context()
            AuditLog.objects.create(
                user=request.user,
                action='RCT_UPDATE',
                model_name='FROForm',
                object_id=str(fro.id),
                object_repr=f'FRO — {fro.rct}',
                new_values={'decision_fro': s.data.get('decision_fro'), 't0_possible': s.data.get('t0_possible')},
                ip_address=ctx.get('ip_address'),
                user_agent=ctx.get('user_agent', ''),
            )
            return Response(s.data)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)