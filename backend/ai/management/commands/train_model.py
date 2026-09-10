from django.core.management.base import BaseCommand
from ai.ml_model import train_model


class Command(BaseCommand):
    help = 'Entraîne le modèle Random Forest de détection de risques projet'

    def handle(self, *args, **kwargs):
        self.stdout.write('Démarrage de l\'entraînement du modèle IA...')
        try:
            train_model()
            self.stdout.write(self.style.SUCCESS(
                'Modèle entraîné et sauvegardé avec succès ✅'
            ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Erreur : {e}'))