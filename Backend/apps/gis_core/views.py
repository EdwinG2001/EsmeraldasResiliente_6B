from rest_framework import generics, permissions, status
from rest_framework.response import Response

# Importación segura de Point compatible con entornos Windows y servidores en la nube
try:
    from django.contrib.gis.geos import Point
except Exception:
    Point = None

def _crear_punto_espacial(lon, lat):
    """
    Retorna una instancia válida de geometría Point tolerando
    entornos con limitaciones binarias de GEOS/GDAL.
    """
    try:
        if Point is not None:
            return Point(float(lon), float(lat), srid=4326)
    except Exception:
        pass
    try:
        from django.contrib.gis.geos import GEOSGeometry
        return GEOSGeometry(f'SRID=4326;POINT({float(lon)} {float(lat)})')
    except Exception:
        return f'SRID=4326;POINT({float(lon)} {float(lat)})'

from django.utils import timezone
from django.db.models import Q
from .models import ZonaRiesgo, CapaHidricaVial, InfraestructuraEsencial
from .serializers import (
    ZonaRiesgoGeoSerializer,
    CapaHidricaVialGeoSerializer,
    InfraestructuraEsencialGeoSerializer
)

class ZonasRiesgoGeoJSONAPIView(generics.ListAPIView):
    """
    Retorna GeoJSON con los polígonos de zonas susceptibles a inundaciones o deslaves.
    Soporta filtro por query param: ?nivel_riesgo=ALTO
    Soporta filtro por query param: ?solo_alertadas=true (solo polígonos con alerta activa del COE)
    """
    serializer_class = ZonaRiesgoGeoSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = ZonaRiesgo.objects.filter(activo=True)
        solo_alertadas = self.request.query_params.get('solo_alertadas')
        if solo_alertadas is not None and str(solo_alertadas).lower() == 'true':
            qs = qs.filter(alerta_activa=True)
        nivel = self.request.query_params.get('nivel_riesgo')
        if nivel:
            qs = qs.filter(nivel_riesgo=nivel.upper())
        return qs

class EmitirAlertaSectorialAPIView(APIView):
    """
    Permite al Gestor, Operador o Administrador del COE emitir o desactivar
    alertas sectoriales tempranas que dinamizan el pintado de polígonos de riesgo en el mapa GIS.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Retorna las alertas sectoriales actualmente activas"""
        activas = ZonaRiesgo.objects.filter(activo=True, alerta_activa=True)
        serializer = ZonaRiesgoGeoSerializer(activas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        sector_nombre = data.get('sector', '').strip()
        zona_id = data.get('zona_id')
        nivel = data.get('nivel', 'ROJA').upper()
        tipo = data.get('tipo', 'DESBORDE_INMINENTE')
        mensaje = data.get('mensaje', 'Alerta sectorial emitida.')
        instrucciones = data.get('instrucciones', 'Evacuación preventiva.')
        activar = data.get('activar', True)
        if isinstance(activar, str):
            activar = activar.lower() in ['true', '1', 'yes']

        user = request.user if request.user.is_authenticated else None

        # Buscar zona correspondiente
        zonas = []
        if zona_id:
            zonas = list(ZonaRiesgo.objects.filter(id=zona_id))
        elif sector_nombre:
            partes = [p.strip() for p in sector_nombre.split('/') if len(p.strip()) > 2]
            query = Q(nombre__icontains=sector_nombre)
            for p in partes:
                query |= Q(nombre__icontains=p) | Q(descripcion__icontains=p)
            zonas = list(ZonaRiesgo.objects.filter(query))

        if not zonas and activar:
            # Crear polígono representativo si no existe la zona
            try:
                from django.contrib.gis.geos import Polygon
                poly = Polygon([
                    (-79.6640, 0.9750),
                    (-79.6580, 0.9820),
                    (-79.6490, 0.9780),
                    (-79.6510, 0.9690),
                    (-79.6600, 0.9660),
                    (-79.6640, 0.9750)
                ], srid=4326)
                nueva_zona = ZonaRiesgo.objects.create(
                    nombre=sector_nombre or '50 Casas / Ribera del Río Teaone',
                    tipo_evento=tipo,
                    nivel_riesgo='ALTO',
                    descripcion=mensaje,
                    geometria=poly,
                    activo=True,
                    alerta_activa=True,
                    nivel_alerta=nivel,
                    mensaje_alerta=mensaje,
                    instrucciones_alerta=instrucciones,
                    fecha_alerta=timezone.now(),
                    emitida_por=user
                )
                zonas = [nueva_zona]
            except Exception:
                pass

        # Actualizar zonas encontradas
        for z in zonas:
            z.alerta_activa = activar
            if activar:
                z.nivel_alerta = nivel
                z.mensaje_alerta = mensaje
                z.instrucciones_alerta = instrucciones
                z.fecha_alerta = timezone.now()
                if user:
                    z.emitida_por = user
            z.save()

        return Response({
            'success': True,
            'activada': activar,
            'sector': sector_nombre,
            'zonas_actualizadas': len(zonas),
            'mensaje': f"Alerta sectorial {'emitida y activa en mapa GIS' if activar else 'desactivada'}."
        }, status=status.HTTP_200_OK)

class CapasHidricasVialesGeoJSONAPIView(generics.ListAPIView):
    """
    Retorna GeoJSON con ríos, esteros y carreteras para el visor del mapa.
    Soporta filtro por query param: ?tipo=RIO
    """
    serializer_class = CapaHidricaVialGeoSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = CapaHidricaVial.objects.all()
        tipo = self.request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo=tipo.upper())
        return qs

class InfraestructurasGeoJSONAPIView(generics.ListCreateAPIView):
    """
    Retorna GeoJSON con hospitales, bomberos y centros de ayuda, o permite registrarlos.
    Soporta filtro: ?tipo=HOSPITAL
    """
    serializer_class = InfraestructuraEsencialGeoSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = InfraestructuraEsencial.objects.filter(activo=True).order_by('id')
        tipo = self.request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo=tipo.upper())
        return qs

    def create(self, request, *args, **kwargs):
        data = request.data
        lat = data.get('lat')
        lon = data.get('lon') or data.get('lng')

        nombre = (data.get('nombre') or 'Nueva Infraestructura').strip()
        tipo = (data.get('tipo') or 'HOSPITAL').upper()
        direccion = data.get('direccion', 'Esmeraldas')
        telefono = data.get('telefono_contacto', '')
        contacto = data.get('contacto_responsable', '')
        capacidad = data.get('capacidad_atencion', 100)

        try:
            if lat is not None and lon is not None and str(lat).strip() != '' and str(lon).strip() != '':
                ubicacion = _crear_punto_espacial(lon, lat)
            else:
                ubicacion = _crear_punto_espacial(-79.6582, 0.9681)
        except (ValueError, TypeError):
            ubicacion = _crear_punto_espacial(-79.6582, 0.9681)

        try:
            cap_val = int(capacidad) if (capacidad is not None and str(capacidad).strip() != '') else 100
        except (ValueError, TypeError):
            cap_val = 100

        infra = InfraestructuraEsencial.objects.create(
            nombre=nombre,
            tipo=tipo,
            direccion=direccion,
            telefono_contacto=telefono,
            contacto_responsable=contacto,
            capacidad_atencion=cap_val,
            ubicacion=ubicacion,
            activo=True
        )
        serializer = self.get_serializer(infra)
        return Response({
            'mensaje': f'Infraestructura "{infra.nombre}" registrada exitosamente en Aiven.',
            'infraestructura': serializer.data,
            'id': infra.id
        }, status=status.HTTP_201_CREATED)

class InfraestructuraDetailUpdateDeleteAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Permite consultar, editar y reubicar (drag-and-drop de coordenadas) o eliminar hospitales/bomberos.
    """
    queryset = InfraestructuraEsencial.objects.all()
    serializer_class = InfraestructuraEsencialGeoSerializer
    permission_classes = [permissions.AllowAny]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        data = request.data

        # Actualización de coordenadas por arrastre interactivo en el mapa Leaflet
        lat = data.get('lat')
        lon = data.get('lon') or data.get('lng')
        if lat is not None and lon is not None:
            instance.ubicacion = _crear_punto_espacial(lon, lat)

        if 'nombre' in data:
            instance.nombre = data['nombre']
        if 'tipo' in data:
            instance.tipo = data['tipo'].upper()
        if 'direccion' in data:
            instance.direccion = data['direccion']
        if 'telefono_contacto' in data:
            instance.telefono_contacto = data['telefono_contacto']
        if 'contacto_responsable' in data:
            instance.contacto_responsable = data['contacto_responsable']
        if 'capacidad_atencion' in data and data['capacidad_atencion']:
            instance.capacidad_atencion = int(data['capacidad_atencion'])
        if 'activo' in data:
            instance.activo = bool(data['activo'])

        instance.save()
        serializer = self.get_serializer(instance)
        return Response({
            'mensaje': f'Infraestructura "{instance.nombre}" actualizada exitosamente en base de datos.',
            'infraestructura': serializer.data
        }, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        nombre = instance.nombre
        instance.delete()
        return Response({
            'mensaje': f'Infraestructura "{nombre}" eliminada correctamente.'
        }, status=status.HTTP_200_OK)

