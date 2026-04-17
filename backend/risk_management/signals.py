"""
Signals — Risk Management
Auto-génération du code R1, R2... par projet + audit logging ISO 9001/27001
"""
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Risk


@receiver(pre_save, sender=Risk)
def auto_generate_risk_code(sender, instance, **kwargs):
    """
    Auto-génère un code unique par projet (R1, R2, R3...) avant la création.
    Le code est incrémental par projet — R1 pour Project A ≠ R1 pour Project B.
    """
    if not instance.pk and not instance.code:
        # Compter tous les risques du projet (y compris soft-deleted)
        last = (
            Risk.all_objects
            .filter(project=instance.project)
            .order_by('id')
            .values_list('code', flat=True)
        )
        # Extraire le numéro max et incrémenter
        numbers = []
        for code in last:
            if code and code.startswith('R'):
                try:
                    numbers.append(int(code[1:]))
                except ValueError:
                    pass
        next_num = max(numbers, default=0) + 1
        instance.code = f"R{next_num}"

