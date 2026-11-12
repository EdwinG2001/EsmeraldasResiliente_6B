from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import ZonaRiesgo, CapaHidricaVial, InfraestructuraEsencial

class ZonaRiesgoGeoSerializer(GeoFeatureModelSerializer):
    """
    Serializa polígonos de riesgo a GeoJSON FeatureCollection para Leaflet.
    Incluye propiedades para la semaforización (ALTO=Rojo, MEDIO=Amarillo, BAJO=Verde).
    """
    class Meta:
        model = ZonaRiesgo
        geo_field = 'geometria'
        fields = [
            'id', 'nombre', 'tipo_evento', 'nivel_riesgo',
            'descripcion', 'activo', 'fecha_levantamiento', 'fuente_informacion',
            'alerta_activa', 'nivel_alerta', 'mensaje_alerta', 'instrucciones_alerta', 'fecha_alerta'
        ]

class CapaHidricaVialGeoSerializer(GeoFeatureModelSerializer):
    """
    Serializa ríos, esteros y carreteras a GeoJSON LineString.
    """
    class Meta:
        model = CapaHidricaVial
        geo_field = 'geometria'
        fields = ['id', 'nombre', 'tipo', 'caudal_referencia', 'observaciones']

class InfraestructuraEsencialGeoSerializer(GeoFeatureModelSerializer):
    """
    Serializa hospitales, bomberos y policía a GeoJSON Point.
    """
    class Meta:
        model = InfraestructuraEsencial
        geo_field = 'ubicacion'
        fields = [
            'id', 'nombre', 'tipo', 'direccion',
            'telefono_contacto', 'contacto_responsable', 'capacidad_atencion', 'activo'
        ]

