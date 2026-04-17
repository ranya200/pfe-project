from django.contrib import admin
from .models import Risk, RiskEvaluation, ActionPlan


class RiskEvaluationInline(admin.StackedInline):
    model = RiskEvaluation
    extra = 0
    readonly_fields = ('criticality', 'level')


class ActionPlanInline(admin.TabularInline):
    model = ActionPlan
    extra = 0
    readonly_fields = ('status',)


@admin.register(Risk)
class RiskAdmin(admin.ModelAdmin):
    list_display    = ('code', 'title', 'project', 'process', 'risk_type', 'status', 'created_at')
    list_filter     = ('status', 'process', 'risk_type', 'origin', 'is_deleted')
    search_fields   = ('code', 'title', 'description', 'project__ref_projet', 'project__client')
    readonly_fields = ('code', 'created_at', 'updated_at')
    inlines         = [RiskEvaluationInline, ActionPlanInline]

    def get_queryset(self, request):
        # Montrer tous les risques (y compris soft-deleted) dans l'admin
        return Risk.all_objects.all()


@admin.register(RiskEvaluation)
class RiskEvaluationAdmin(admin.ModelAdmin):
    list_display  = ('risk', 'probability', 'severity', 'criticality', 'level')
    list_filter   = ('level',)
    search_fields = ('risk__code', 'risk__title')
    readonly_fields = ('criticality', 'level')


@admin.register(ActionPlan)
class ActionPlanAdmin(admin.ModelAdmin):
    list_display  = ('risk', 'responsible', 'planned_date', 'progress', 'status')
    list_filter   = ('status',)
    search_fields = ('risk__code', 'risk__title', 'action')
    readonly_fields = ('status', 'created_at')
