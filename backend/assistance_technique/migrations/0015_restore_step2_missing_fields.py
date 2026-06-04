# Restore fields that were incorrectly removed in migration 0014.
# Adds back: pc_branches_qa, pc_versioning_docs_items, pc_versioning_src_items, amp_assets

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assistance_technique', '0014_remove_step2_realisation_amp_assets_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='step2_realisation',
            name='pc_branches_qa',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='step2_realisation',
            name='pc_versioning_docs_items',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='step2_realisation',
            name='pc_versioning_src_items',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='step2_realisation',
            name='amp_assets',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
