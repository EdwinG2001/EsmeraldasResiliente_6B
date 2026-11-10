from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Sum, Count, Q
from .models import ReporteIncidente
from .serializers import (
    ReporteIncidenteGeoSerializer,
    CrearReporteSerializer,
    ReporteIncidenteListSerializer,
    ActualizarEstadoIncidenteSerializer
)

class ReportesListGeoJSONAPIView(generics.ListAPIView):
    """
    Retorna GeoJSON con los incidentes activos para el mapa del COE y el ciudadano.
    Soporta filtros: ?gravedad=CRITICO&estado=PENDIENTE&simulacion=false
    Por defecto, solo publica incidentes validados (publicado_en_mapa=True).
    """
    serializer_class = ReporteIncidenteGeoSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = ReporteIncidente.objects.all().select_related('usuario').prefetch_related('fotos')
        gravedad = self.request.query_params.get('gravedad')
        estado = self.request.query_params.get('estado')
        simulacion = self.request.query_params.get('simulacion')
        incluir_no_verificados = self.request.query_params.get('todos') or self.request.query_params.get('incluir_pendientes_verificacion')

        # Si no se solicita explícitamente incluir retenidos, filtrar para mostrar solo verificados
        if not incluir_no_verificados or str(incluir_no_verificados).lower() != 'true':
            qs = qs.filter(publicado_en_mapa=True).exclude(estado='DESCARTADO')

        if gravedad:
            qs = qs.filter(nivel_gravedad=gravedad.upper())
        if estado:
            qs = qs.filter(estado=estado.upper())
        if simulacion is not None:
            qs = qs.filter(es_simulacion=(simulacion.lower() == 'true'))

        return qs

class CrearReporteAPIView(generics.CreateAPIView):
    """
    Endpoint para registro directo de un reporte desde la app móvil o web.
    """
    serializer_class = CrearReporteSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        fecha = serializer.validated_data.get('fecha_incidente', timezone.now())
        serializer.save(usuario=user, fecha_incidente=fecha)

class SincronizarLoteOfflineAPIView(APIView):
    """
    RF-02.7: Recibe un lote de reportes acumulados offline en SQLite/IndexedDB
    cuando el móvil recupera conexión.
    Aplica idempotencia por UUID para no duplicar si se reintenta el envío.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        reportes_data = request.data.get('reportes', [])
        if not isinstance(reportes_data, list):
            return Response(
                {'error': 'El payload debe contener una lista en la clave "reportes".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        creados = 0
        actualizados = 0
        errores = []

        for item in reportes_data:
            reporte_id = item.get('id')
            serializer = CrearReporteSerializer(data=item)
            if serializer.is_valid():
                # Verificar si ya existía para garantizar idempotencia (validación segura de UUID)
                existente = None
                if reporte_id:
                    try:
                        import uuid
                        uuid_obj = uuid.UUID(str(reporte_id))
                        existente = ReporteIncidente.objects.filter(id=uuid_obj).first()
                    except (ValueError, TypeError, Exception):
                        existente = None

                if existente:
                    actualizados += 1
                else:
                    user = request.user if request.user.is_authenticated else None
                    serializer.save(
                        usuario=user,
                        sincronizado_offline=True,
                        fecha_incidente=serializer.validated_data.get('fecha_incidente', timezone.now())
                    )
                    creados += 1
            else:
                errores.append({'id': reporte_id, 'errores': serializer.errors})

        return Response({
            'mensaje': 'Sincronización offline procesada.',
            'total_procesados': len(reportes_data),
            'creados': creados,
            'actualizados_idempotentes': actualizados,
            'errores': errores
        }, status=status.HTTP_200_OK if not errores else status.HTTP_207_MULTI_STATUS)

class ReportesTablaListAPIView(generics.ListAPIView):
    """
    Módulo 3: Listado tabular de incidentes con filtros de estado:
    atendidos, pendientes, en proceso, descartados.
    """
    serializer_class = ReporteIncidenteListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = ReporteIncidente.objects.all().select_related('usuario').prefetch_related('fotos')
        estado = self.request.query_params.get('estado')
        gravedad = self.request.query_params.get('gravedad')
        simulacion = self.request.query_params.get('simulacion')
        verificacion = self.request.query_params.get('verificacion')
        solo_retenidos = self.request.query_params.get('solo_retenidos')
        q = self.request.query_params.get('q')

        if estado and estado.upper() != 'TODOS':
            qs = qs.filter(estado=estado.upper())
        if gravedad and gravedad.upper() != 'TODAS':
            qs = qs.filter(nivel_gravedad=gravedad.upper())
        if verificacion and verificacion.upper() != 'TODAS':
            qs = qs.filter(estado_verificacion=verificacion.upper())
        if solo_retenidos and str(solo_retenidos).lower() == 'true':
            qs = qs.filter(publicado_en_mapa=False).exclude(estado='DESCARTADO')
        if simulacion is not None and simulacion != '':
            qs = qs.filter(es_simulacion=(simulacion.lower() == 'true'))
        if q:
            qs = qs.filter(Q(descripcion__icontains=q) | Q(tipo_evento__icontains=q))

        return qs.order_by('-fecha_incidente')

class ReporteIncidenteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Módulo 3: Consulta, actualización de estado (PENDIENTE, EN_PROCESO, ATENDIDO)
    y eliminación de incidentes por el COE / Administrador.
    """
    queryset = ReporteIncidente.objects.all()
    serializer_class = ReporteIncidenteListSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ActualizarEstadoIncidenteSerializer
        return ReporteIncidenteListSerializer

class ReportesKPIsAPIView(APIView):
    """
    Módulo 3: Generación de estadísticas e indicadores de gestión (KPIs) en tiempo real:
    Total, Pendientes, En Proceso, Atendidos, Críticos, Personas y Familias.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        total = ReporteIncidente.objects.count()
        pendientes = ReporteIncidente.objects.filter(estado='PENDIENTE').count()
        en_proceso = ReporteIncidente.objects.filter(estado='EN_PROCESO').count()
        atendidos = ReporteIncidente.objects.filter(estado='ATENDIDO').count()
        descartados = ReporteIncidente.objects.filter(estado='DESCARTADO').count()
        criticos = ReporteIncidente.objects.filter(nivel_gravedad='CRITICO').count()
        por_verificar = ReporteIncidente.objects.filter(publicado_en_mapa=False).exclude(estado='DESCARTADO').count()
        falsos_positivos = ReporteIncidente.objects.filter(estado_verificacion='FALSO_POSITIVO').count()

        aggs = ReporteIncidente.objects.aggregate(
            total_atrapadas=Sum('personas_atrapadas'),
            total_familias=Sum('familias_afectadas')
        )

        return Response({
            'total': total,
            'pendientes': pendientes,
            'en_proceso': en_proceso,
            'atendidos': atendidos,
            'descartados': descartados,
            'criticos': criticos,
            'por_verificar': por_verificar,
            'falsos_positivos': falsos_positivos,
            'personas_atrapadas': aggs.get('total_atrapadas') or 0,
            'familias_afectadas': aggs.get('total_familias') or 0,
            'tasa_resolucion': round((atendidos / total * 100), 1) if total > 0 else 0
        })

