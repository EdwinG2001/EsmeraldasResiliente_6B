from django.utils import timezone
from django.db import models
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import FamiliaCenso, BodegaAcopio, SuministroCatalogo, InventarioBodega, SolicitudCenso
from .serializers import (
    FamiliaCensoGeoSerializer,
    FamiliaCensoSimpleSerializer,
    BodegaAcopioSerializer,
    SuministroCatalogoSerializer,
    InventarioBodegaSerializer,
    SolicitudCensoSerializer
)

class FamiliasCensoListCreateAPIView(generics.ListCreateAPIView):
    """
    Censo digital de familias damnificadas (Módulo 5).
    Soporta filtro por cédula: ?cedula=0801234567
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        # Si el cliente solicita formato simple o envía json estándar
        format_param = self.request.query_params.get('formato')
        if format_param == 'simple':
            return FamiliaCensoSimpleSerializer
        return FamiliaCensoGeoSerializer

    def get_queryset(self):
        qs = FamiliaCenso.objects.all().order_by('-fecha_censo')
        cedula = self.request.query_params.get('cedula')
        if cedula:
            qs = qs.filter(jefe_familia_cedula=cedula.strip())
        return qs

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(censador=user)

class VerificarCensoCiudadanoAPIView(APIView):
    """
    Verifica si una cédula de identidad consta en el padrón censal ('familias_censo').
    Permite el flujo condicional para la App Móvil: Caso A (No censado) / Caso B (Sí censado).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, cedula=None):
        cedula_query = cedula or request.query_params.get('cedula')
        if not cedula_query:
            return Response(
                {'error': 'Debe proporcionar una cédula para consultar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        familia = FamiliaCenso.objects.filter(jefe_familia_cedula=cedula_query.strip()).first()
        if familia:
            return Response({
                'censado': True,
                'mensaje': 'Ciudadano registrado satisfactoriamente en el padrón censal.',
                'familia': {
                    'id': str(familia.id),
                    'codigo_censo': familia.codigo_censo,
                    'jefe_familia_nombre': familia.jefe_familia_nombre,
                    'jefe_familia_cedula': familia.jefe_familia_cedula,
                    'telefono_contacto': familia.telefono_contacto,
                    'parroquia': familia.parroquia,
                    'barrio_sector': familia.barrio_sector,
                    'numero_integrantes': familia.numero_integrantes,
                    'ninos_menores_5': familia.ninos_menores_5,
                    'adultos_mayores': familia.adultos_mayores,
                    'personas_discapacidad': familia.personas_discapacidad,
                    'danos_vivienda': familia.danos_vivienda,
                    'fecha_censo': familia.fecha_censo,
                }
            }, status=status.HTTP_200_OK)

        return Response({
            'censado': False,
            'mensaje': 'Aún usted no ha sido censado en el sistema de gestión de riesgos'
        }, status=status.HTTP_200_OK)

class BodegasAcopioListCreateAPIView(generics.ListCreateAPIView):
    """
    CRUD Bodegas de Acopio: Permite listar y registrar nuevas bodegas.
    """
    queryset = BodegaAcopio.objects.all().order_by('-id')
    serializer_class = BodegaAcopioSerializer
    permission_classes = [permissions.AllowAny]

class BodegaAcopioDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    CRUD Bodega de Acopio individual: Consulta, actualización y eliminación.
    """
    queryset = BodegaAcopio.objects.all()
    serializer_class = BodegaAcopioSerializer
    permission_classes = [permissions.AllowAny]

class CatalogoSuministrosListCreateAPIView(generics.ListCreateAPIView):
    """
    CRUD Kits y Catálogo Oficial de Provisiones: Permite listar y crear nuevos kits.
    """
    queryset = SuministroCatalogo.objects.all().order_by('id')
    serializer_class = SuministroCatalogoSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            from django.db import connection, IntegrityError
            if isinstance(e, IntegrityError):
                try:
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "SELECT setval(pg_get_serial_sequence('suministros_catalogo', 'id'), COALESCE(MAX(id), 1) + 1, false) FROM suministros_catalogo;"
                        )
                    self.perform_create(serializer)
                    headers = self.get_success_headers(serializer.data)
                    return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
                except Exception as retry_err:
                    return Response(
                        {"detail": f"Error de base de datos al registrar suministro: {str(retry_err)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            return Response(
                {"detail": f"Error guardando suministro: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class CatalogoSuministroDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    CRUD Kit individual: Consulta, modificación y eliminación de suministros.
    """
    queryset = SuministroCatalogo.objects.all()
    serializer_class = SuministroCatalogoSerializer
    permission_classes = [permissions.AllowAny]

class InventarioBodegasStockAPIView(generics.ListCreateAPIView):
    """
    Control de inventarios y alertas de desabastecimiento.
    """
    queryset = InventarioBodega.objects.select_related('bodega', 'suministro').all()
    serializer_class = InventarioBodegaSerializer
    permission_classes = [permissions.AllowAny]

class SolicitudesCensoListCreateAPIView(generics.ListCreateAPIView):
    """
    Gestión de Solicitudes de Censo de Familias (Ventana de 48h).
    Permite a los ciudadanos solicitar visita de censadores a su sector/barrio.
    Permite a Operadores, Digitalizadores y Administradores consultar y gestionar solicitudes.
    """
    serializer_class = SolicitudCensoSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = self.request.user
        qs = SolicitudCenso.objects.all().order_by('-fecha_solicitud')
        
        # Filtros opcionales
        estado = self.request.query_params.get('estado')
        if estado and estado.upper() != 'TODOS':
            qs = qs.filter(estado=estado.upper())
        
        cedula = self.request.query_params.get('cedula')
        if cedula:
            qs = qs.filter(jefe_familia_cedula=cedula.strip())
            
        sector = self.request.query_params.get('sector')
        if sector:
            qs = qs.filter(barrio_sector__icontains=sector.strip())

        # Si el usuario no es personal autorizado (Operador, Digitalizador, Admin),
        # solo puede ver sus propias solicitudes por cédula o id de usuario
        if not user.is_authenticated or not (
            user.is_superuser or 
            getattr(user, 'rol', None) in ['ADMINISTRADOR', 'OPERADOR', 'OPERADOR_COE', 'DIGITALIZADOR']
        ):
            if user.is_authenticated:
                qs = qs.filter(models.Q(usuario=user) | models.Q(jefe_familia_cedula=getattr(user, 'cedula', '')))
            elif cedula:
                qs = qs.filter(jefe_familia_cedula=cedula.strip())
            else:
                return SolicitudCenso.objects.none()

        return qs

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(usuario=user)

class SolicitudCensoDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Actualización de estado de la solicitud (EN_CAMINO, ATENDIDO, DESCARTADO)
    y asignación de censador/digitalizador.
    """
    queryset = SolicitudCenso.objects.all()
    serializer_class = SolicitudCensoSerializer
    permission_classes = [permissions.AllowAny]

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        nuevo_estado = serializer.validated_data.get('estado')
        if nuevo_estado == 'ATENDIDO':
            serializer.save(atendido_por=user, fecha_atencion=timezone.now())
        elif nuevo_estado == 'EN_CAMINO':
            serializer.save(atendido_por=user)
        else:
            serializer.save()


