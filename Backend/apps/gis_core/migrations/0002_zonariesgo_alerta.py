import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('gis_core', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='zonariesgo',
            name='alerta_activa',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='zonariesgo',
            name='nivel_alerta',
            field=models.CharField(blank=True, default='ROJA', max_length=20),
        ),
        migrations.AddField(
            model_name='zonariesgo',
            name='mensaje_alerta',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='zonariesgo',
            name='instrucciones_alerta',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='zonariesgo',
            name='fecha_alerta',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='zonariesgo',
            name='emitida_por',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='alertas_emitidas', to=settings.AUTH_USER_MODEL),
        ),
    ]

