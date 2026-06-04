# Add missing fields to ReunionSuivi: date_tenue, statut, objectif, pilote,
# frequence, commentaire, source. Also widen type_reunion to free text (max_length=100).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assistance_technique', '0015_restore_step2_missing_fields'),
    ]

    operations = [
        # Widen type_reunion: was max_length=20 with choices, now free text from step1/step2
        migrations.AlterField(
            model_name='reunionsuivi',
            name='type_reunion',
            field=models.CharField(max_length=100, blank=True, default=''),
        ),
        migrations.AddField(
            model_name='reunionsuivi',
            name='date_tenue',
            field=models.CharField(max_length=20, blank=True),
        ),
        migrations.AddField(
            model_name='reunionsuivi',
            name='statut',
            field=models.CharField(
                max_length=20,
                choices=[('Planifiée','Planifiée'),('Tenue','Tenue'),('Reportée','Reportée'),('Annulée','Annulée')],
                default='Planifiée',
                blank=True,
            ),
        ),
        migrations.AddField(
            model_name='reunionsuivi',
            name='objectif',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='reunionsuivi',
            name='pilote',
            field=models.CharField(max_length=200, blank=True),
        ),
        migrations.AddField(
            model_name='reunionsuivi',
            name='frequence',
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name='reunionsuivi',
            name='commentaire',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='reunionsuivi',
            name='source',
            field=models.CharField(max_length=50, blank=True),
        ),
    ]
