from django.urls import path
from .views import (
    ZonasRiesgoGeoJSONAPIView,
    EmitirAlertaSectorialAPIView,
    CapasHidricasVialesGeoJSONAPIView,
    InfraestructurasGeoJSONAPIView,
    InfraestructuraDetailUpdateDeleteAPIView
)

urlpatterns = [
    # GeoJSON de Polígonos de Riesgo (Semaforización)
    path('zonas-riesgo/', ZonasRiesgoGeoJSONAPIView.as_view(), name='gis-zonas-riesgo'),
    path('zonas-riesgo/alerta-sectorial/', EmitirAlertaSectorialAPIView.as_view(), name='gis-alerta-sectorial'),
    # GeoJSON de Ríos, Esteros y Vías
    path('red-hidrica-vial/', CapasHidricasVialesGeoJSONAPIView.as_view(), name='gis-red-hidrica-vial'),
    # GeoJSON de Hospitales, Bomberos y Policía
    path('infraestructuras/', InfraestructurasGeoJSONAPIView.as_view(), name='gis-infraestructuras'),
    path('infraestructuras/<int:pk>/', InfraestructuraDetailUpdateDeleteAPIView.as_view(), name='gis-infraestructura-detail'),
]

