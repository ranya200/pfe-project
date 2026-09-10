from django.shortcuts import render
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from knox.auth import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from .models import AIResult, AIAlert
from .tasks import analyze_project_risk
from projects.models import Project
from django.db.models import Q


class AnalyzeProjectRiskView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({'error': 'Projet non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        ai_result = AIResult.objects.create(project=project, status='pending')
        task = analyze_project_risk.delay(project_id, ai_result.id)
        ai_result.task_id = task.id
        ai_result.save(update_fields=['task_id'])

        return Response({
            'message': 'Analyse lancée',
            'task_id': task.id,
            'result_id': ai_result.id,
        }, status=status.HTTP_202_ACCEPTED)


class ProjectRiskResultView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        result = AIResult.objects.filter(project_id=project_id).first()

        if not result:
            return Response(
                {'error': 'Aucune analyse disponible pour ce projet'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'result_id':    result.id,
            'status':       result.status,
            'risk_level':   result.risk_level,
            'risk_score':   result.risk_score,
            'recommendation': result.recommendation,
            'iso_clause':   result.iso_clause,
            'features_used': result.features_used,
            'created_at':   result.created_at,
        })


class ProjectRiskHistoryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        results = AIResult.objects.filter(project_id=project_id, status='completed')

        data = [{
            'result_id':   r.id,
            'risk_level':  r.risk_level,
            'risk_score':  r.risk_score,
            'recommendation': r.recommendation,
            'iso_clause':  r.iso_clause,
            'features_used': r.features_used,
            'created_at':  r.created_at,
        } for r in results]

        return Response(data)


class ProjectAlertsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request, project_id):
        alerts = AIAlert.objects.filter(project_id=project_id, status='open')
        data = [{
            'id':                a.id,
            'severity':          a.severity,
            'title':             a.title,
            'detail':            a.detail,
            'iso_clause':        a.iso_clause,
            'feature_triggered': a.feature_triggered,
            'created_at':        a.created_at,
        } for a in alerts]
        return Response(data)


class AcknowledgeAlertView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request, alert_id):
        try:
            alert = AIAlert.objects.get(id=alert_id)
        except AIAlert.DoesNotExist:
            return Response({'error': 'Alerte non trouvée'}, status=404)

        alert.status          = 'acknowledged'
        alert.acknowledged_by = request.user
        alert.acknowledged_at = timezone.now()
        alert.save()
        return Response({'message': 'Alerte acquittée', 'id': alert_id})

class MyProjectAlertsView(APIView):
    """Toutes les alertes IA ouvertes des projets de l'utilisateur connecté."""
    authentication_classes = [TokenAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        user_projects = Project.objects.filter(
            Q(membres=request.user) | Q(created_by=request.user)
        ).distinct()

        alerts = AIAlert.objects.filter(
            project__in=user_projects,
            status='open'
        ).select_related('project').order_by('-severity', '-created_at')

        data = [{
            'id':           a.id,
            'severity':     a.severity,
            'title':        a.title,
            'iso_clause':   a.iso_clause,
            'project_id':   a.project.id,
            'project_name': a.project.client,
            'project_ref':  a.project.ref_projet,
            'created_at':   a.created_at,
        } for a in alerts]
        return Response(data)