import django.contrib.gis.db.models.fields
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('humanitarian_aid', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SolicitudCenso',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('jefe_familia_nombre', models.CharField(max_length=180)),
                ('jefe_familia_cedula', models.CharField(max_length=10)),
                ('telefono_contacto', models.CharField(blank=True, max_length=20, null=True)),
                ('barrio_sector', models.CharField(max_length=120)),
                ('direccion_referencia', models.TextField(blank=True, null=True)),
                ('latitud', models.DecimalField(blank=True, decimal_places=6, max_digits=10, null=True)),
                ('longitud', models.DecimalField(blank=True, decimal_places=6, max_digits=10, null=True)),
                ('ubicacion', django.contrib.gis.db.models.fields.PointField(blank=True, null=True, srid=4326)),
                ('estado', models.CharField(choices=[('PENDIENTE', 'Pendiente (48h)'), ('EN_CAMINO', 'Brigada en Camino'), ('ATENDIDO', 'Censado / Atendido'), ('DESCARTADO', 'Descartado')], default='PENDIENTE', max_length=20)),
                ('observaciones', models.TextField(blank=True, null=True)),
                ('fecha_solicitud', models.DateTimeField(auto_now_add=True)),
                ('fecha_atencion', models.DateTimeField(blank=True, null=True)),
                ('atendido_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='solicitudes_atendidas', to=settings.AUTH_USER_MODEL)),
                ('usuario', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='solicitudes_censo', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Solicitud de Censo',
                'verbose_name_plural': 'Solicitudes de Censo',
                'db_table': 'solicitudes_censo',
                'ordering': ['-fecha_solicitud'],
            },
        ),
    ]

