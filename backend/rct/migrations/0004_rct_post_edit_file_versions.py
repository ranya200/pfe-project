from django.db import migrations, models


def backfill_file_versions(apps, schema_editor):
    Step1 = apps.get_model('rct', 'Step1')
    Step2 = apps.get_model('rct', 'Step2')
    Step3 = apps.get_model('rct', 'Step3')
    for s in Step1.objects.all():
        fv = {}
        if s.cahier_charges:
            fv['cahier_charges'] = [s.cahier_charges.name]
        if s.formulaire_interactif:
            fv['formulaire_interactif'] = [s.formulaire_interactif.name]
        if fv:
            s.file_versions = fv
            s.save(update_fields=['file_versions'])
    for s in Step2.objects.all():
        fv = {}
        for attr, key in [
            ('formulaire_qr_final', 'formulaire_qr_final'),
            ('offre_tech_financier', 'offre_tech_financier'),
            ('fiche_revue_offre', 'fiche_revue_offre'),
            ('planning', 'planning'),
            ('cr_reunions', 'cr_reunions'),
            ('exigences_legales_fichier', 'exigences_legales_fichier'),
        ]:
            f = getattr(s, attr, None)
            if f:
                fv[key] = [f.name]
        if fv:
            s.file_versions = fv
            s.save(update_fields=['file_versions'])
    for s in Step3.objects.all():
        fv = {}
        for attr, key in [
            ('derniere_version_offre', 'derniere_version_offre'),
            ('planning', 'planning'),
            ('retour_client', 'retour_client'),
        ]:
            f = getattr(s, attr, None)
            if f:
                fv[key] = [f.name]
        if fv:
            s.file_versions = fv
            s.save(update_fields=['file_versions'])


class Migration(migrations.Migration):

    dependencies = [
        ('rct', '0003_froform'),
    ]

    operations = [
        migrations.AddField(
            model_name='rct',
            name='post_edit_mode',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='step1',
            name='file_versions',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='step2',
            name='exigences_legales_fichier',
            field=models.FileField(blank=True, null=True, upload_to='rct/step2/'),
        ),
        migrations.AddField(
            model_name='step2',
            name='file_versions',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='step3',
            name='file_versions',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.RunPython(backfill_file_versions, migrations.RunPython.noop),
    ]
