import uuid
from django.contrib.gis.db import models
from django.conf import settings

class FamiliaCenso(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo_censo = models.CharField(max_length=50, unique=True)
    
    jefe_familia_nombre = models.CharField(max_length=180)
    jefe_familia_cedula = models.CharField(max_length=10)
    telefono_contacto = models.CharField(max_length=15, null=True, blank=True)
    
    canton = models.CharField(max_length=50, default='Esmeraldas')
    parroquia = models.CharField(max_length=80, null=True, blank=True)
    barrio_sector = models.CharField(max_length=120, null=True, blank=True)
    direccion_referencia = models.TextField(null=True, blank=True)
    ubicacion_vivienda = models.PointField(srid=4326, null=True, blank=True)

    numero_integrantes = models.SmallIntegerField(default=1)
    ninos_menores_5 = models.SmallIntegerField(default=0)
    adultos_mayores = models.SmallIntegerField(default=0)
    personas_discapacidad = models.SmallIntegerField(default=0)

    danos_vivienda = models.CharField(max_length=50, default='PARCIAL')
    requiere_evacuacion_inmediata = models.BooleanField(default=False)
    albergue_asignado = models.ForeignKey(
        'evacuation.AlbergueTemporal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    censador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    fecha_censo = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'familias_censo'
        verbose_name = 'Familia Censada'
        verbose_name_plural = 'Familias Censadas'

    def __str__(self):
        return f"{self.codigo_censo} - {self.jefe_familia_nombre} ({self.numero_integrantes} miembros)"

class BodegaAcopio(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    responsable = models.CharField(max_length=150, null=True, blank=True)
    telefono = models.CharField(max_length=30, null=True, blank=True)
    direccion = models.TextField(null=True, blank=True)
    ubicacion = models.PointField(srid=4326)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'bodegas_acopio'
        verbose_name = 'Bodega de Acopio'
        verbose_name_plural = 'Bodegas de Acopio'

    def __str__(self):
        return self.nombre

class SuministroCatalogo(models.Model):
    id = models.AutoField(primary_key=True)
    codigo_sku = models.CharField(max_length=50, unique=True)
    nombre_suministro = models.CharField(max_length=150)
    tipo = models.CharField(max_length=40)
    unidad_medida = models.CharField(max_length=30)
    peso_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    descripcion = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'suministros_catalogo'
        verbose_name = 'Suministro en Catálogo'
        verbose_name_plural = 'Catálogo de Suministros'

    def __str__(self):
        return f"{self.nombre_suministro} ({self.codigo_sku})"

class InventarioBodega(models.Model):
    id = models.AutoField(primary_key=True)
    bodega = models.ForeignKey(BodegaAcopio, on_delete=models.CASCADE)
    suministro = models.ForeignKey(SuministroCatalogo, on_delete=models.CASCADE)
    cantidad_disponible = models.IntegerField(default=0)
    stock_minimo_alerta = models.IntegerField(default=15)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventario_bodega'
        unique_together = ('bodega', 'suministro')
        verbose_name = 'Inventario en Bodega'
        verbose_name_plural = 'Inventarios en Bodegas'

    def __str__(self):
        return f"{self.bodega.nombre}: {self.suministro.nombre_suministro} ({self.cantidad_disponible})"

class SolicitudCenso(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente (48h)'),
        ('EN_CAMINO', 'Brigada en Camino'),
        ('ATENDIDO', 'Censado / Atendido'),
        ('DESCARTADO', 'Descartado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes_censo'
    )
    jefe_familia_nombre = models.CharField(max_length=180)
    jefe_familia_cedula = models.CharField(max_length=10)
    telefono_contacto = models.CharField(max_length=20, null=True, blank=True)
    barrio_sector = models.CharField(max_length=120)
    direccion_referencia = models.TextField(null=True, blank=True)
    latitud = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    ubicacion = models.PointField(srid=4326, null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    atendido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes_atendidas'
    )
    observaciones = models.TextField(null=True, blank=True)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_atencion = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'solicitudes_censo'
        verbose_name = 'Solicitud de Censo'
        verbose_name_plural = 'Solicitudes de Censo'
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"{self.jefe_familia_nombre} ({self.jefe_familia_cedula}) - {self.barrio_sector} [{self.estado}]"


