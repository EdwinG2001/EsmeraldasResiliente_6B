import uuid
from django.contrib.gis.db import models
from django.conf import settings

class ReporteIncidente(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reportes'
    )
    tipo_evento = models.CharField(max_length=80) # 'INUNDACION', 'DESLIZAMIENTO', etc.
    nivel_gravedad = models.CharField(
        max_length=20,
        choices=[
            ('CRITICO', 'Crítico'),
            ('ALTO', 'Alto'),
            ('MEDIO', 'Medio'),
            ('BAJO', 'Bajo')
        ],
        default='MEDIO'
    )
    descripcion = models.TextField()
    ubicacion = models.PointField(srid=4326)
    precision_gps_metros = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Estimación comunitaria y cálculo geoespacial de buffer
    personas_atrapadas = models.IntegerField(default=0)
    familias_afectadas = models.IntegerField(default=0)
    estimacion_danos_vivienda = models.TextField(null=True, blank=True)

    # Cálculo automático PostGIS por radio perimetral (Cruce con Familias Censadas)
    personas_afectadas_estimadas = models.IntegerField(default=0)
    familias_en_perimetro = models.IntegerField(default=0)
    ninos_en_riesgo = models.IntegerField(default=0)
    adultos_mayores_riesgo = models.IntegerField(default=0)
    discapacitados_riesgo = models.IntegerField(default=0)
    radio_analisis_metros = models.DecimalField(max_digits=6, decimal_places=2, default=25.00)

    # Estados y segregación
    estado = models.CharField(
        max_length=20,
        choices=[
            ('PENDIENTE', 'Pendiente'),
            ('EN_PROCESO', 'En Proceso'),
            ('ATENDIDO', 'Atendido'),
            ('DESCARTADO', 'Descartado')
        ],
        default='PENDIENTE'
    )
    es_simulacion = models.BooleanField(default=False)
    sincronizado_offline = models.BooleanField(default=False)

    # Verificación Anti-Falsos Positivos y Validación Desfase Offline
    score_verosimilitud = models.IntegerField(default=70) # 0 a 100%
    publicado_en_mapa = models.BooleanField(default=True)
    estado_verificacion = models.CharField(
        max_length=30,
        choices=[
            ('VERIFICADO_AUTO', 'Verificado Automáticamente'),
            ('POR_VERIFICAR', 'Por Verificar por Operador COE'),
            ('CONFIRMADO_COE', 'Confirmado Manualmente por COE'),
            ('FALSO_POSITIVO', 'Descartado como Falso Positivo'),
        ],
        default='VERIFICADO_AUTO'
    )
    lluvia_verificada_mm = models.FloatField(default=0.0)
    desfase_horas = models.FloatField(default=0.0)
    motivo_verificacion = models.TextField(null=True, blank=True)

    fecha_incidente = models.DateTimeField()
    fecha_recepcion_servidor = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reportes_incidentes'
        verbose_name = 'Reporte de Incidente'
        verbose_name_plural = 'Reportes de Incidentes'
        ordering = ['-fecha_incidente']

    def __str__(self):
        return f"{self.tipo_evento} - {self.nivel_gravedad} ({self.estado})"

class FotoIncidente(models.Model):
    id = models.AutoField(primary_key=True)
    reporte = models.ForeignKey(ReporteIncidente, on_delete=models.CASCADE, related_name='fotos')
    url_archivo = models.TextField()
    tamano_bytes = models.IntegerField(null=True, blank=True)
    formato_mime = models.CharField(max_length=50, null=True, blank=True)
    fecha_subida = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fotos_incidentes'
        verbose_name = 'Foto de Incidente'
        verbose_name_plural = 'Fotos de Incidentes'

    def __str__(self):
        return f"Foto #{self.id} del reporte {self.reporte_id}"

