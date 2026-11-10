import logging
from datetime import timedelta
import requests
from django.utils import timezone
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

logger = logging.getLogger(__name__)

class VerificadorIncidentesService:
    """
    Servicio de Inteligencia Operacional para Prevención de Falsos Positivos
    y Validación de Coherencia Hidrometeorológica con Soporte de Desfase Offline.
    """

    @classmethod
    def evaluar_incidente(cls, tipo_evento, lat, lon, fecha_incidente=None, sincronizado_offline=False, descripcion=''):
        """
        Calcula el Score de Verosimilitud (0 a 100%) y dictamina si el incidente se publica
        de inmediato en el mapa público o si se reserva para validación por el Operador COE.
        """
        ahora = timezone.now()
        if not fecha_incidente:
            fecha_incidente = ahora

        # 1. Calcular desfase temporal entre el evento y la recepción
        delta_segundos = max(0, (ahora - fecha_incidente).total_seconds())
        desfase_horas = round(delta_segundos / 3600.0, 2)

        tipo_norm = str(tipo_evento).strip().upper()
        
        # 2. Obtener precipitación efectiva en el momento y lugar del incidente
        lluvia_detectada_mm = cls._obtener_lluvia_en_momento(lat, lon, fecha_incidente, desfase_horas)

        score = 50 # Base neutral
        motivos = []

        # =========================================================================
        # CRITERIO 1: COHERENCIA HIDROMETEOROLÓGICA (LLUVIA vs TIPO DE INCIDENTE)
        # =========================================================================
        es_evento_lluvia = any(k in tipo_norm for k in ['INUNDACION', 'INUNDACIÓN', 'DESBORDAMIENTO', 'CRECIDA', 'ANIEGO', 'RIO'])
        es_evento_suelo = any(k in tipo_norm for k in ['DESLAVE', 'DESLIZAMIENTO', 'TALUD', 'DERRUMBE'])

        if es_evento_lluvia:
            if lluvia_detectada_mm >= 25.0:
                score += 35
                motivos.append(f"Precipitación torrencial confirmada ({lluvia_detectada_mm} mm/h)")
            elif lluvia_detectada_mm >= 8.0:
                score += 25
                motivos.append(f"Precipitación moderada detectada ({lluvia_detectada_mm} mm/h)")
            elif lluvia_detectada_mm >= 2.0:
                score += 10
                motivos.append(f"Lluvia leve registrada ({lluvia_detectada_mm} mm/h)")
            else:
                score -= 30
                motivos.append(f"Incoherencia hidrológica: Inundación reportada sin lluvia registrada ({lluvia_detectada_mm} mm/h)")

        elif es_evento_suelo:
            if lluvia_detectada_mm >= 15.0:
                score += 30
                motivos.append(f"Suelo saturado por lluvias intensas ({lluvia_detectada_mm} mm/h)")
            elif lluvia_detectada_mm >= 4.0:
                score += 15
                motivos.append(f"Precipitación previa acumulada ({lluvia_detectada_mm} mm/h)")
            else:
                score -= 10
                motivos.append("Sin lluvia reciente en el momento del reporte")
        else:
            score += 15
            motivos.append("Evento no dependiente de lluvia directa")

        # =========================================================================
        # CRITERIO 2: CLUSTERING / CONFIRMACIÓN MULTI-REPORTANTE ESPACIOTEMPORAL
        # =========================================================================
        try:
            from apps.reports.models import ReporteIncidente
            punto = Point(float(lon), float(lat), srid=4326)
            ventana_minutos = 180
            reportes_vecinos = ReporteIncidente.objects.filter(
                ubicacion__distance_lte=(punto, D(m=600)),
                fecha_incidente__gte=fecha_incidente - timedelta(minutes=ventana_minutos),
                fecha_incidente__lte=fecha_incidente + timedelta(minutes=ventana_minutos)
            ).exclude(estado='DESCARTADO').count()

            if reportes_vecinos >= 2:
                score += 25
                motivos.append(f"Confirmación comunitaria: {reportes_vecinos} reportes concurrentes en 600m")
            elif reportes_vecinos == 1:
                score += 10
                motivos.append("Reporte corroborado por otro incidente cercano")
        except Exception as e:
            logger.warning(f"Error calculando clustering de incidentes: {e}")

        # =========================================================================
        # CRITERIO 3: DESFASE TEMPORAL POR REPORTE OFFLINE
        # =========================================================================
        es_desfase_alto = desfase_horas >= 3.0 or (sincronizado_offline and desfase_horas >= 1.5)

        if es_desfase_alto:
            score -= 15
            motivos.append(f"Desfase offline detectado ({desfase_horas}h de retraso en sincronización)")

        # Normalizar score entre 5% y 99%
        score_final = max(5, min(99, score))

        # =========================================================================
        # CRITERIO 4: POLÍTICA DE PUBLICACIÓN Y ESTADO DE VERIFICACIÓN
        # =========================================================================
        if score_final >= 60 and not es_desfase_alto:
            publicado_en_mapa = True
            estado_verificacion = 'VERIFICADO_AUTO'
        elif es_evento_lluvia and lluvia_detectada_mm < 2.5:
            publicado_en_mapa = False
            estado_verificacion = 'POR_VERIFICAR'
            motivos.append("Retenido para revisión: Inundación reportada sin lluvia suficiente (<2.5 mm/h)")
        elif es_desfase_alto:
            publicado_en_mapa = False
            estado_verificacion = 'POR_VERIFICAR'
            motivos.append("Retenido para revisión: Sincronización diferida offline (confirmar vigencia con Operador COE)")
        elif score_final < 50:
            publicado_en_mapa = False
            estado_verificacion = 'POR_VERIFICAR'
            motivos.append("Retenido para revisión: Score de confianza insuficiente")
        else:
            publicado_en_mapa = True
            estado_verificacion = 'VERIFICADO_AUTO'

        return {
            'score_verosimilitud': score_final,
            'publicado_en_mapa': publicado_en_mapa,
            'estado_verificacion': estado_verificacion,
            'lluvia_verificada_mm': round(lluvia_detectada_mm, 2),
            'desfase_horas': desfase_horas,
            'motivo_verificacion': " • ".join(motivos)
        }

    @classmethod
    def _obtener_lluvia_en_momento(cls, lat, lon, fecha_evento, desfase_horas):
        """
        Consulta Open-Meteo. Si el evento fue reciente (<1.5h) consulta el forecast en vivo;
        si ocurrió hace varias horas o días, consulta el histórico horario de las últimas 48h.
        """
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=precipitation,rain&past_days=2&forecast_days=1"
            res = requests.get(url, timeout=4)
            if res.status_code == 200:
                data = res.json()
                tiempos = data.get('hourly', {}).get('time', [])
                precipitaciones = data.get('hourly', {}).get('precipitation', [])
                
                # Buscar la hora formateada 'YYYY-MM-DDTHH:00'
                hora_target = fecha_evento.strftime('%Y-%m-%dT%H:00')
                if hora_target in tiempos:
                    idx = tiempos.index(hora_target)
                    idx_inicio = max(0, idx - 1)
                    idx_fin = min(len(precipitaciones), idx + 2)
                    ventana_lluvia = precipitaciones[idx_inicio:idx_fin]
                    return max(ventana_lluvia) if ventana_lluvia else 0.0
                elif precipitaciones:
                    if desfase_horas <= 2.0:
                        return float(precipitaciones[-1] if precipitaciones else 0.0)
        except Exception as e:
            logger.info(f"Open-Meteo no disponible ({e}), usando fallback.")

        # Fallback usando OpenWeatherService
        try:
            from apps.weather.services import OpenWeatherService
            clima = OpenWeatherService.obtener_clima_actual(lat=lat, lon=lon)
            return float(clima.get('precipitacion_1h_mm') or 0.0)
        except Exception:
            return 0.0
