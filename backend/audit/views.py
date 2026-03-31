from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ViewSet):
    """
    API du journal d'audit — admin uniquement.
    GET /api/audit/logs/           → liste paginée avec filtres
    GET /api/audit/logs/stats/     → statistiques résumées
    """
    permission_classes = [permissions.IsAuthenticated]

    def _require_admin(self, request):
        if request.user.role != 'admin':
            return Response(
                {"error": "Accès refusé. Réservé à l'administrateur."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def list(self, request):
        denied = self._require_admin(request)
        if denied:
            return denied

        qs = AuditLog.objects.select_related('user').all()

        # ── Filtres ──────────────────────────────────────────────────────────
        action_filter = request.query_params.get('action')
        user_filter   = request.query_params.get('user')       # email partiel
        date_from     = request.query_params.get('date_from')  # YYYY-MM-DD
        date_to       = request.query_params.get('date_to')    # YYYY-MM-DD
        search        = request.query_params.get('search')     # recherche libre

        if action_filter:
            qs = qs.filter(action=action_filter)
        if user_filter:
            qs = qs.filter(user__email__icontains=user_filter)
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)
        if search:
            qs = qs.filter(
                Q(object_repr__icontains=search) |
                Q(user__email__icontains=search) |
                Q(ip_address__icontains=search)
            )

        # ── Pagination simple ─────────────────────────────────────────────────
        try:
            page     = max(1, int(request.query_params.get('page', 1)))
            per_page = min(100, max(10, int(request.query_params.get('per_page', 25))))
        except (ValueError, TypeError):
            page, per_page = 1, 25

        total  = qs.count()
        offset = (page - 1) * per_page
        logs   = qs[offset: offset + per_page]

        return Response({
            'count':    total,
            'page':     page,
            'per_page': per_page,
            'pages':    (total + per_page - 1) // per_page,
            'results':  AuditLogSerializer(logs, many=True).data,
        })

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        denied = self._require_admin(request)
        if denied:
            return denied

        from django.db.models import Count
        from django.utils import timezone
        from datetime import timedelta

        now    = timezone.now()
        last7  = now - timedelta(days=7)
        last30 = now - timedelta(days=30)

        # Répartition par action
        by_action = (
            AuditLog.objects
            .values('action')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Top utilisateurs actifs (30 derniers jours)
        top_users = (
            AuditLog.objects
            .filter(timestamp__gte=last30, user__isnull=False)
            .values('user__email', 'user__first_name', 'user__last_name')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        # Logins échoués (7 derniers jours) — alerte sécurité
        failed_logins_7d = AuditLog.objects.filter(
            action='LOGIN_FAILED', timestamp__gte=last7
        ).count()

        # Total logs
        total = AuditLog.objects.count()

        return Response({
            'total_logs':        total,
            'failed_logins_7d':  failed_logins_7d,
            'by_action':         list(by_action),
            'top_users_30d':     list(top_users),
        })
