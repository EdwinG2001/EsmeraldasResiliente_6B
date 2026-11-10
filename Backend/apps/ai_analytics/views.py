from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import ConsultaIA
from .assistant_service import AIAssistantService, get_services

class ConsultaIAView(APIView):
    """
    Endpoint principal para interactuar con el Asistente de IA del COE.
    Guarda cada consulta y respuesta en la base de datos PostgreSQL.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        pregunta = request.data.get('pregunta', '').strip()
        if not pregunta:
            return Response({'error': 'Debes ingresar una pregunta o consulta.'}, status=status.HTTP_400_BAD_REQUEST)

        usuario = request.user if request.user.is_authenticated else None
        resultado = AIAssistantService.procesar_consulta(pregunta, usuario=usuario)
        return Response(resultado, status=status.HTTP_201_CREATED)

class HistorialConsultasIAView(APIView):
    """
    Historial de preguntas y respuestas almacenadas en PostgreSQL.
    Cada usuario autenticado tiene acceso estricto y único a su propio historial.
    Si no hay usuario autenticado (modo invitado/anónimo), devuelve lista vacía.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response([], status=status.HTTP_200_OK)

        consultas = ConsultaIA.objects.filter(usuario=request.user)[:50]
        data = [
            {
                'id': str(c.id),
                'pregunta': c.pregunta,
                'respuesta': c.respuesta,
                'categoria': c.categoria,
                'datos_contexto': c.datos_contexto,
                'fecha_creacion': c.fecha_creacion.isoformat(),
                'almacenado': True
            }
            for c in consultas
        ]
        return Response(data, status=status.HTTP_200_OK)

    def delete(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({'mensaje': 'No hay historial para borrar.'}, status=status.HTTP_200_OK)

        eliminados, _ = ConsultaIA.objects.filter(usuario=request.user).delete()
        return Response(
            {'mensaje': f'Se han borrado {eliminados} consultas de tu historial personal.'},
            status=status.HTTP_200_OK
        )

# ================= ENDPOINTS TÉCNICOS ESPECÍFICOS DEL MÓDULO 6 =================

class ResumenHistoricoAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        hist, _, _, _, _, _ = get_services()
        return Response({
            "resumen_general": hist.resumen_global(),
            "serie_anual": hist.serie_temporal_anual(),
            "eventos_historicos_criticos": hist.top_eventos_catastroficos()
        })

class SectoresRecurrentesAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        _, rec, _, _, _, _ = get_services()
        sectores = rec.calcular_sectores_recurrentes()
        return Response({
            "total_sectores_evaluados": len(sectores),
            "sectores_recurrentes": sectores
        })

class TendenciasAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        _, _, _, trd, _, _ = get_services()
        return Response({
            "estacionalidad_mensual": trd.tendencias_mensuales(),
            "tendencia_interanual_el_nino": trd.tendencia_interanual_y_pendiente()
        })

class PatronesGeoTemporalesAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        _, _, _, _, geo, _ = get_services()
        return Response({
            "hotspots_clusters_dbscan": geo.obtener_clusters_geograficos(),
            "patron_horario_24h": geo.distribucion_temporal_horaria()
        })

class SimularEscenarioAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        _, _, _, _, _, sim = get_services()
        lluvia_param = request.query_params.get('lluvia_24h') or request.query_params.get('lluvia_mm') or 120.0
        try:
            lluvia = float(lluvia_param)
        except ValueError:
            lluvia = 120.0

        nivel_rio = request.query_params.get('nivel_rio')
        nivel_rio_val = None
        if nivel_rio:
            try:
                nivel_rio_val = float(nivel_rio)
            except ValueError:
                nivel_rio_str = str(nivel_rio).upper()
                nivel_rio_val = 5.5 if 'ALT' in nivel_rio_str or 'CRIT' in nivel_rio_str else 3.5

        resultado = sim.simular_escenario_precipitacion(lluvia, nivel_rio_val)
        return Response(resultado)

class ClasificarIncidenteAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        _, _, clf, _, _, _ = get_services()
        datos = request.data
        if not datos:
            return Response({'error': 'Cuerpo JSON no proporcionado.'}, status=status.HTTP_400_BAD_REQUEST)
        resultado = clf.clasificar_incidente(datos)
        return Response(resultado)

