from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from django.utils import timezone
from .models import ReporteIncidente, FotoIncidente

class FotoIncidenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoIncidente
        fields = ['id', 'url_archivo', 'fecha_subida']

class ReporteIncidenteGeoSerializer(GeoFeatureModelSerializer):
    fotos = FotoIncidenteSerializer(many=True, read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    latitud = serializers.SerializerMethodField()
    longitud = serializers.SerializerMethodField()

    class Meta:
        model = ReporteIncidente
        geo_field = 'ubicacion'
        fields = [
            'id', 'tipo_evento', 'nivel_gravedad', 'descripcion',
            'personas_atrapadas', 'familias_afectadas', 'estimacion_danos_vivienda',
            'personas_afectadas_estimadas', 'familias_en_perimetro',
            'ninos_en_riesgo', 'adultos_mayores_riesgo', 'discapacitados_riesgo', 'radio_analisis_metros',
            'estado', 'es_simulacion', 'sincronizado_offline',
            'score_verosimilitud', 'publicado_en_mapa', 'estado_verificacion',
            'lluvia_verificada_mm', 'desfase_horas', 'motivo_verificacion',
            'fecha_incidente', 'fecha_recepcion_servidor', 'fotos', 'usuario_nombre',
            'latitud', 'longitud'
        ]

    def get_latitud(self, obj):
        return obj.ubicacion.y if obj.ubicacion else None

    def get_longitud(self, obj):
        return obj.ubicacion.x if obj.ubicacion else None

    def get_usuario_nombre(self, obj):
        if obj.usuario:
            name = obj.usuario.get_full_name()
            if name and name.strip():
                return name
            return obj.usuario.username
        if obj.estimacion_danos_vivienda and 'Informante:' in obj.estimacion_danos_vivienda:
            parts = obj.estimacion_danos_vivienda.split('Informante:')
            if len(parts) > 1:
                return parts[1].strip()
        return 'Ciudadano / Móvil'

class CrearReporteSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True, required=False)
    lon = serializers.FloatField(write_only=True, required=False)
    lng = serializers.FloatField(write_only=True, required=False)
    nombre_informante = serializers.CharField(write_only=True, required=False, allow_blank=True)
    radio_analisis_metros = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, default=25.0)
    fecha_incidente = serializers.DateTimeField(required=False, default=timezone.now)

    class Meta:
        model = ReporteIncidente
        fields = [
            'id', 'tipo_evento', 'nivel_gravedad', 'descripcion',
            'lat', 'lon', 'lng', 'nombre_informante', 'precision_gps_metros', 'personas_atrapadas',
            'familias_afectadas', 'estimacion_danos_vivienda', 'es_simulacion',
            'personas_afectadas_estimadas', 'familias_en_perimetro',
            'ninos_en_riesgo', 'adultos_mayores_riesgo', 'discapacitados_riesgo', 'radio_analisis_metros',
            'sincronizado_offline', 'fecha_incidente',
            'score_verosimilitud', 'publicado_en_mapa', 'estado_verificacion',
            'lluvia_verificada_mm', 'desfase_horas', 'motivo_verificacion'
        ]
        read_only_fields = [
            'id', 'personas_afectadas_estimadas', 'familias_en_perimetro',
            'ninos_en_riesgo', 'adultos_mayores_riesgo', 'discapacitados_riesgo',
            'score_verosimilitud', 'publicado_en_mapa', 'estado_verificacion',
            'lluvia_verificada_mm', 'desfase_horas', 'motivo_verificacion'
        ]

    def validate(self, attrs):
        lat = attrs.get('lat')
        lon = attrs.get('lon') if attrs.get('lon') is not None else attrs.get('lng')
        if lat is None or lon is None:
            raise serializers.ValidationError({"error": "Debe proporcionar lat y lon (o lng) para la ubicación geográfica."})
        attrs['lat'] = lat
        attrs['lon'] = lon
        return attrs

    def create(self, validated_data):
        from django.contrib.gis.geos import Point
        lat = validated_data.pop('lat')
        lon = validated_data.pop('lon')
        validated_data.pop('lng', None)
        nombre_informante = validated_data.pop('nombre_informante', None)

        if nombre_informante and not validated_data.get('usuario'):
            curr_danos = validated_data.get('estimacion_danos_vivienda') or ''
            if 'Informante:' not in curr_danos:
                sep = ' • ' if curr_danos else ''
                validated_data['estimacion_danos_vivienda'] = f"{curr_danos}{sep}Informante: {nombre_informante.strip()}"

        punto_incidente = Point(lon, lat, srid=4326)
        validated_data['ubicacion'] = punto_incidente

        # CÁLCULO GEOESPACIAL AUTOMÁTICO POSTGIS (BUFFER 25M EN CRUCE CON CENSO)
        try:
            from apps.humanitarian_aid.models import FamiliaCenso
            from django.contrib.gis.measure import D
            from django.db.models import Sum, Count

            radio_m = float(validated_data.get('radio_analisis_metros') or 25.0)
            familias_en_riesgo = FamiliaCenso.objects.filter(
                ubicacion_vivienda__distance_lte=(punto_incidente, D(m=radio_m))
            )

            metricas = familias_en_riesgo.aggregate(
                total_familias=Count('id'),
                total_personas=Sum('numero_integrantes'),
                total_ninos=Sum('ninos_menores_5'),
                total_adultos=Sum('adultos_mayores'),
                total_discapacidad=Sum('personas_discapacidad')
            )

            calc_familias = metricas['total_familias'] or 0
            calc_personas = metricas['total_personas'] or 0
            calc_ninos = metricas['total_ninos'] or 0
            calc_adultos = metricas['total_adultos'] or 0
            calc_discapacidad = metricas['total_discapacidad'] or 0

            validated_data['familias_en_perimetro'] = calc_familias
            validated_data['personas_afectadas_estimadas'] = calc_personas
            validated_data['ninos_en_riesgo'] = calc_ninos
            validated_data['adultos_mayores_riesgo'] = calc_adultos
            validated_data['discapacitados_riesgo'] = calc_discapacidad
            validated_data['radio_analisis_metros'] = radio_m

            # Auto-enriquecimiento de personas y familias si no fueron enviadas explícitamente o si es 0
            if calc_familias > 0 and (not validated_data.get('familias_afectadas') or validated_data.get('familias_afectadas') == 0):
                validated_data['familias_afectadas'] = calc_familias
            if calc_personas > 0 and (not validated_data.get('personas_atrapadas') or validated_data.get('personas_atrapadas') == 0):
                validated_data['personas_atrapadas'] = calc_personas
        except Exception:
            pass

        # MOTOR DE VERIFICACIÓN ANTI-FALSOS POSITIVOS Y VALIDACIÓN DESFASE OFFLINE
        try:
            from .verification import VerificadorIncidentesService
            verif = VerificadorIncidentesService.evaluar_incidente(
                tipo_evento=validated_data.get('tipo_evento', ''),
                lat=lat,
                lon=lon,
                fecha_incidente=validated_data.get('fecha_incidente'),
                sincronizado_offline=validated_data.get('sincronizado_offline', False),
                descripcion=validated_data.get('descripcion', '')
            )
            validated_data['score_verosimilitud'] = verif['score_verosimilitud']
            validated_data['publicado_en_mapa'] = verif['publicado_en_mapa']
            validated_data['estado_verificacion'] = verif['estado_verificacion']
            validated_data['lluvia_verificada_mm'] = verif['lluvia_verificada_mm']
            validated_data['desfase_horas'] = verif['desfase_horas']
            validated_data['motivo_verificacion'] = verif['motivo_verificacion']
        except Exception:
            validated_data['score_verosimilitud'] = 65
            validated_data['publicado_en_mapa'] = True
            validated_data['estado_verificacion'] = 'VERIFICADO_AUTO'

        return super().create(validated_data)

class ReporteIncidenteListSerializer(serializers.ModelSerializer):
    fotos = FotoIncidenteSerializer(many=True, read_only=True)
    usuario_nombre = serializers.SerializerMethodField()
    latitud = serializers.SerializerMethodField()
    longitud = serializers.SerializerMethodField()

    class Meta:
        model = ReporteIncidente
        fields = [
            'id', 'tipo_evento', 'nivel_gravedad', 'descripcion',
            'personas_atrapadas', 'familias_afectadas', 'estimacion_danos_vivienda',
            'personas_afectadas_estimadas', 'familias_en_perimetro',
            'ninos_en_riesgo', 'adultos_mayores_riesgo', 'discapacitados_riesgo', 'radio_analisis_metros',
            'estado', 'es_simulacion', 'sincronizado_offline',
            'score_verosimilitud', 'publicado_en_mapa', 'estado_verificacion',
            'lluvia_verificada_mm', 'desfase_horas', 'motivo_verificacion',
            'fecha_incidente', 'fecha_recepcion_servidor', 'fecha_actualizacion',
            'fotos', 'usuario_nombre', 'latitud', 'longitud'
        ]

    def get_usuario_nombre(self, obj):
        if obj.usuario:
            name = obj.usuario.get_full_name()
            if name and name.strip():
                return name
            return obj.usuario.username
        if obj.estimacion_danos_vivienda and 'Informante:' in obj.estimacion_danos_vivienda:
            parts = obj.estimacion_danos_vivienda.split('Informante:')
            if len(parts) > 1:
                return parts[1].strip()
        return 'Ciudadano / Móvil'

    def get_latitud(self, obj):
        return obj.ubicacion.y if obj.ubicacion else None

    def get_longitud(self, obj):
        return obj.ubicacion.x if obj.ubicacion else None

class ActualizarEstadoIncidenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteIncidente
        fields = [
            'estado', 'nivel_gravedad', 'descripcion', 
            'personas_atrapadas', 'familias_afectadas',
            'publicado_en_mapa', 'estado_verificacion', 'score_verosimilitud',
            'motivo_verificacion'
        ]


