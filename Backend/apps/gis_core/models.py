from django.contrib.gis.db import models
from django.conf import settings

class ZonaRiesgo(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    tipo_evento = models.CharField(max_length=80, default='INUNDACION')
    nivel_riesgo = models.CharField(
        max_length=20,
        choices=[('ALTO', 'Alto'), ('MEDIO', 'Medio'), ('BAJO', 'Bajo')],
        default='ALTO'
    )
    descripcion = models.TextField(null=True, blank=True)
    geometria = models.PolygonField(srid=4326)
    activo = models.BooleanField(default=True)
    fecha_levantamiento = models.DateField(null=True, blank=True)
    fuente_informacion = models.CharField(max_length=150, null=True, blank=True)

    # Gobernanza dinámica de alerta (Activada por Gestor / Operador / Admin)
    alerta_activa = models.BooleanField(default=False)
    nivel_alerta = models.CharField(max_length=20, default='ROJA', blank=True)
    mensaje_alerta = models.TextField(null=True, blank=True)
    instrucciones_alerta = models.TextField(null=True, blank=True)
    fecha_alerta = models.DateTimeField(null=True, blank=True)
    emitida_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas_emitidas'
    )

    class Meta:
        db_table = 'zonas_riesgo'
        verbose_name = 'Zona de Riesgo'
        verbose_name_plural = 'Zonas de Riesgo'

    def __str__(self):
        return f"{self.nombre} ({self.nivel_riesgo})"

class CapaHidricaVial(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    tipo = models.CharField(max_length=50) # 'RIO', 'ESTERO', 'PUENTE', 'CARRETERA_PRINCIPAL'
    geometria = models.LineStringField(srid=4326)
    caudal_referencia = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    observaciones = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'capas_hidricas_viales'
        verbose_name = 'Capa Hídrica o Vial'
        verbose_name_plural = 'Capas Hídricas y Viales'

    def __str__(self):
        return f"{self.nombre} [{self.tipo}]"

class InfraestructuraEsencial(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=180)
    tipo = models.CharField(max_length=60) # 'HOSPITAL', 'BOMBEROS'
    direccion = models.TextField(null=True, blank=True)
    telefono_contacto = models.CharField(max_length=30, null=True, blank=True)
    contacto_responsable = models.CharField(max_length=120, null=True, blank=True)
    capacidad_atencion = models.IntegerField(null=True, blank=True)
    ubicacion = models.PointField(srid=4326)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'infraestructuras_esenciales'
        verbose_name = 'Infraestructura Esencial'
        verbose_name_plural = 'Infraestructuras Esenciales'

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"

