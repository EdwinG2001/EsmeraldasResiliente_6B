import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Marker, 
  Popup, 
  Circle,
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Cloud, 
  Zap, 
  Play, 
  Pause, 
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Compass,
  MapPin,
  Sun,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Building2,
  Flame,
  HeartPulse,
  X,
  ChevronUp,
  ChevronDown,
  User,
  AlertOctagon,
  Eye,
  Radio,
  ExternalLink,
  Phone,
  UserCheck
} from 'lucide-react';
import { gisApi } from '../../api/gisApi';
import { weatherApi } from '../../api/weatherApi';
import { evacuationApi } from '../../api/evacuationApi';
import { reportsApi } from '../../api/reportsApi';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

// API Key oficial de CARTO para eliminar marcas de agua en teselas Voyager
const CARTO_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfZTViYzllYjYiLCJqdGkiOiIyNjk1OGQwYWE0ZDYwZTUyYmI5Nzk0MTFmOThlYjJjZiJ9.EGdBLX9QpAvUHvpBcjrHiFLLnOJ7k-DqSevIFT5bH_k';

// Fix de íconos predeterminados de Leaflet en Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coordenadas centrales de Esmeraldas
const ESMERALDAS_CENTER = [0.9682, -79.6517];

// Catálogo de Cantones de la Provincia de Esmeraldas
const CANTONES = [
  { id: 'esmeraldas', nombre: 'Esmeraldas (Capital)', shortName: 'Esmeraldas', lat: 0.9681, lon: -79.6582 },
  { id: 'quininde', nombre: 'Quinindé (Rosa Zárate)', shortName: 'Quinindé', lat: 0.3283, lon: -79.4678 },
  { id: 'atacames', nombre: 'Atacames', shortName: 'Atacames', lat: 0.8667, lon: -79.8444 },
  { id: 'san_lorenzo', nombre: 'San Lorenzo', shortName: 'San Lorenzo', lat: 1.2869, lon: -78.8358 },
  { id: 'muisne', nombre: 'Muisne', shortName: 'Muisne', lat: 0.6106, lon: -80.0197 },
  { id: 'rioverde', nombre: 'Rioverde', shortName: 'Rioverde', lat: 1.0744, lon: -79.4000 },
  { id: 'eloy_alfaro', nombre: 'Eloy Alfaro (Borbón)', shortName: 'Eloy Alfaro', lat: 1.2464, lon: -78.9839 },
];

// Ícono personalizado exclusivo para albergues temporales y zonas de refugio (Casa/Refugio con techo seguro y cupo)
const createShelterMarker = (pct = 0, nombre = '', isAdmin = false) => {
  const bgColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
  const ringColor = pct >= 90 ? '#991b1b' : pct >= 70 ? '#b45309' : '#047857';
  const badgeText = pct >= 90 ? 'LLENO' : `${pct}%`;

  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: ${isAdmin ? 'grab' : 'pointer'}; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));">
        <!-- Badge de Refugio / Albergue -->
        <div style="
          width: 36px; 
          height: 36px; 
          background: ${bgColor}; 
          border: ${isAdmin ? '2.5px dashed #38bdf8' : '2.5px solid #ffffff'}; 
          border-radius: 10px; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
          box-shadow: 0 0 10px ${bgColor}88, inset 0 2px 4px rgba(255,255,255,0.3);
        ">
          <!-- Pictograma de Refugio / Casa Segura -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 10.5 12 3l9 7.5"/>
            <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>
            <path d="M10 21v-6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6"/>
          </svg>
        </div>
        <!-- Puntero inferior -->
        <div style="
          width: 0; 
          height: 0; 
          border-left: 6px solid transparent; 
          border-right: 6px solid transparent; 
          border-top: 7px solid ${bgColor}; 
          margin-top: -1px;
        "></div>
        <!-- Mini pill de estado de ocupación -->
        <div style="
          margin-top: 1px;
          background: rgba(15, 23, 42, 0.95);
          color: #ffffff;
          padding: 1px 6px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.3px;
          border: 1px solid ${ringColor};
          white-space: nowrap;
        ">
          ALBERGUE ${badgeText}
        </div>
      </div>
    `,
    className: 'custom-shelter-marker',
    iconSize: [42, 56],
    iconAnchor: [21, 56],
    popupAnchor: [0, -56],
  });
};

// Ícono personalizado para hospitales y bomberos
const createHospitalMarker = (tipo = 'HOSPITAL', isAdmin = false) => {
  const isBomberos = tipo?.toUpperCase().includes('BOMBERO');
  const bgColor = isBomberos ? '#ea580c' : '#dc2626';
  const label = isBomberos ? 'BOMBEROS' : 'HOSPITAL';

  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: ${isAdmin ? 'grab' : 'pointer'}; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));">
        <div style="
          width: 32px; 
          height: 32px; 
          background: ${bgColor}; 
          border: ${isAdmin ? '2.5px dashed #38bdf8' : '2.5px solid #ffffff'}; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
          box-shadow: 0 0 10px ${bgColor}88;
        ">
          ${isBomberos ? `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          ` : `
            <!-- Cruz Médica Universal -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
            </svg>
          `}
        </div>
        <div style="
          width: 0; 
          height: 0; 
          border-left: 5px solid transparent; 
          border-right: 5px solid transparent; 
          border-top: 6px solid ${bgColor}; 
          margin-top: -1px;
        "></div>
        <div style="
          margin-top: 1px;
          background: rgba(15, 23, 42, 0.95);
          color: #ffffff;
          padding: 1px 5px;
          border-radius: 6px;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 0.3px;
          border: 1px solid ${isAdmin ? '#38bdf8' : bgColor};
          white-space: nowrap;
        ">
          ${label}
        </div>
      </div>
    `,
    className: 'custom-hospital-marker',
    iconSize: [32, 50],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

// Ícono personalizado para incidentes comunitarios clasificados por nivel de gravedad
const createIncidentMarker = (gravedad = 'MEDIO', tipo = 'INCIDENTE', isSelected = false) => {
  const g = (gravedad || '').toUpperCase();
  let bgColor = '#f59e0b';
  let ringColor = '#d97706';
  let pulseHtml = '';

  if (g === 'CRITICO') {
    bgColor = '#dc2626';
    ringColor = '#ef4444';
    pulseHtml = `
      <div style="
        position: absolute;
        top: -6px;
        left: -6px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(220, 38, 38, 0.45);
        animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
        pointer-events: none;
      "></div>
    `;
  } else if (g === 'ALTO') {
    bgColor = '#ea580c';
    ringColor = '#f97316';
  } else if (g === 'BAJO') {
    bgColor = '#10b981';
    ringColor = '#34d399';
  }

  const border = isSelected ? '3px solid #38bdf8' : '2.5px solid #ffffff';
  const label = g;

  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.65));">
        ${pulseHtml}
        <div style="
          position: relative;
          z-index: 2;
          width: 36px; 
          height: 36px; 
          background: ${bgColor}; 
          border: ${border}; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
          box-shadow: 0 0 14px ${bgColor}aa;
          ${isSelected ? 'transform: scale(1.15); transition: transform 0.2s;' : ''}
        ">
          <!-- Pictograma de Alerta / Incidente -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div style="
          position: relative;
          z-index: 2;
          width: 0; 
          height: 0; 
          border-left: 6px solid transparent; 
          border-right: 6px solid transparent; 
          border-top: 7px solid ${bgColor}; 
          margin-top: -1px;
        "></div>
        <div style="
          position: relative;
          z-index: 2;
          margin-top: 1px;
          background: rgba(15, 23, 42, 0.95);
          color: #ffffff;
          padding: 1px 6px;
          border-radius: 6px;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 0.3px;
          border: 1px solid ${isSelected ? '#38bdf8' : ringColor};
          white-space: nowrap;
        ">
          ${label}
        </div>
      </div>
    `,
    className: 'custom-incident-marker',
    iconSize: [44, 58],
    iconAnchor: [22, 50],
    popupAnchor: [0, -50],
  });
};

// Etiqueta territorial para cantones (Mapa/Ubicación administrativa con temperatura en vivo)
const createCantonPin = (nombre, isSelected, temp = null) => L.divIcon({
  html: `
    <div style="
      background: ${isSelected ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(15, 23, 42, 0.94)'};
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 11px;
      border: 1.5px solid ${isSelected ? '#38bdf8' : '#475569'};
      box-shadow: 0 4px 14px rgba(0,0,0,0.6);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      cursor: pointer;
      backdrop-filter: blur(6px);
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#bae6fd' : '#38bdf8'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" y2="18"/>
        <line x1="15" y1="6" y2="21"/>
      </svg>
      <span>${nombre}</span>
      ${isSelected && temp !== null ? `
        <span style="
          background: rgba(245, 158, 11, 0.25);
          color: #fde047;
          border: 1px solid rgba(245, 158, 11, 0.5);
          padding: 0 4px;
          border-radius: 6px;
          font-size: 10px;
          font-family: monospace;
          margin-left: 2px;
        ">
          ${temp}°C
        </span>
      ` : ''}
    </div>
  `,
  className: 'custom-canton-pin',
  iconSize: [temp !== null ? 130 : 95, 26],
  iconAnchor: [temp !== null ? 65 : 47, 13],
  popupAnchor: [0, -15],
});

const isValidGeoJson = (data) => {
  return data && (data.type === 'FeatureCollection' || data.type === 'Feature');
};

// Componente para detectar movimiento del mapa y volar a cantones
function MapController({ onCenterChange, targetFly }) {
  const map = useMap();

  useEffect(() => {
    if (targetFly) {
      map.flyTo([targetFly.lat, targetFly.lon], targetFly.zoom || 13, {
        duration: 1.2,
      });
    }
  }, [targetFly, map]);

  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    },
  });

  return null;
}

// Ícono dinámico según la condición meteorológica
const WeatherIcon = ({ condition = '', className = 'w-5 h-5' }) => {
  const c = condition.toLowerCase();
  if (c.includes('tormenta') || c.includes('rayo') || c.includes('eléctric')) return <Zap className={`${className} text-amber-400`} />;
  if (c.includes('lluv') || c.includes('chubasco') || c.includes('llovizna')) return <Droplets className={`${className} text-sky-400`} />;
  if (c.includes('nub') || c.includes('cubierto')) return <Cloud className={`${className} text-slate-300`} />;
  if (c.includes('viento')) return <Wind className={`${className} text-emerald-400`} />;
  return <Sun className={`${className} text-amber-400`} />;
};

export const CrisisRoomPage = () => {
  const { 
    user, 
    isAdmin: authIsAdmin, 
    isGestor: authIsGestor, 
    isOperador: authIsOperador,
    canManageShelters: authCanManageShelters,
    canEmitAlerts: authCanEmitAlerts
  } = useAuth();

  const userRol = (user?.rol || user?.properties?.rol || '').toUpperCase();
  const userUsername = (user?.username || user?.properties?.username || '').toLowerCase();

  const matchR = (...targets) => targets.some((t) => userRol === t || userRol.includes(t));

  // Permisos de edición y reubicación en mapa habilitados para Administrador y Operador del COE
  const canManageMapPoints = Boolean(
    user && (
      authIsAdmin || 
      authIsOperador || 
      authCanManageShelters ||
      matchR('ADMIN', 'COE', 'SUPERUSER', 'OPERADOR') || 
      userUsername === 'admin' || 
      user?.is_superuser
    )
  );
  const isAdmin = canManageMapPoints;
  const isGestor = Boolean(authIsAdmin || authIsGestor || matchR('ADMIN', 'COE', 'GESTOR', 'DIRECTOR'));
  const [saveStatus, setSaveStatus] = useState(null);

  const [zonasRiesgo, setZonasRiesgo] = useState(null);
  const [redHidrica, setRedHidrica] = useState(null);
  const [infraestructuras, setInfraestructuras] = useState(null);
  const [albergues, setAlbergues] = useState(null);
  
  // Cantón activo seleccionado o detectado
  const [activeCanton, setActiveCanton] = useState(CANTONES[0]);
  const [targetFly, setTargetFly] = useState(null);
  const [mapCenterCoords, setMapCenterCoords] = useState(ESMERALDAS_CENTER);

  // Clima en vivo del cantón activo
  const [clima, setClima] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [lastAutoDetected, setLastAutoDetected] = useState(null);

  // Modo meteorológico activo (Estilo MSN El Tiempo)
  // 'temp': Temperatura | 'rain': Precipitaciones | 'wind': Viento | 'clouds': Nubosidad | 'storm': Tormentas
  const [weatherMode, setWeatherMode] = useState('temp');
  const [consoleExpanded, setConsoleExpanded] = useState(true);

  // Mapa base: 'calles' (Esri AWS sin marca de agua) | 'sat' (Esri Satélite HD) | 'osm' (Francia) | 'carto' (Voyager)
  const [baseMap, setBaseMap] = useState('calles');

  // Navegación y parámetros URL para foco automático desde Centro de Incidentes
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Estado de incidentes comunitarios en vivo (Aiven PostgreSQL)
  const [incidentesData, setIncidentesData] = useState(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const incidentMarkerRefs = useRef({});
  const openedFocusIncidentRef = useRef(null);

  // Capas territoriales conmutables
  const [layers, setLayers] = useState({
    zonasRiesgo: true,
    albergues: true,
    hospitales: true,
    bomberos: true,
    redHidrica: true,
    incidentes: true,
  });

  // Normalización defensiva de listas de infraestructuras y albergues
  const infraFeatures = useMemo(() => {
    if (!infraestructuras) return [];
    if (Array.isArray(infraestructuras)) return infraestructuras;
    if (Array.isArray(infraestructuras.features)) return infraestructuras.features;
    if (Array.isArray(infraestructuras.results)) return infraestructuras.results;
    if (infraestructuras.results?.features) return infraestructuras.results.features;
    return [];
  }, [infraestructuras]);

  const shelterFeatures = useMemo(() => {
    if (!albergues) return [];
    if (Array.isArray(albergues)) return albergues;
    if (Array.isArray(albergues.features)) return albergues.features;
    if (Array.isArray(albergues.results)) return albergues.results;
    if (albergues.results?.features) return albergues.results.features;
    return [];
  }, [albergues]);

  // Filtro de incidentes activos: Solo se muestran los que NO están ATENDIDO ni DESCARTADO
  const activeIncidentFeatures = useMemo(() => {
    if (!incidentesData) return [];
    let list = [];
    if (Array.isArray(incidentesData)) list = incidentesData;
    else if (Array.isArray(incidentesData.features)) list = incidentesData.features;
    else if (Array.isArray(incidentesData.results)) list = incidentesData.results;
    else if (incidentesData.results?.features) list = incidentesData.results.features;

    return list.filter((feat) => {
      const p = feat.properties || feat;
      const estado = (p.estado || '').toUpperCase();
      return estado !== 'ATENDIDO' && estado !== 'DESCARTADO';
    });
  }, [incidentesData]);

  // Manejo de foco desde "Ver en Mapa" en Centro de Incidentes (?focusIncident=ID&lat=...&lon=...)
  useEffect(() => {
    const focusIncidentId = searchParams.get('focusIncident');
    const focusLat = searchParams.get('lat');
    const focusLon = searchParams.get('lon');

    if (focusLat && focusLon) {
      const lat = parseFloat(focusLat);
      const lon = parseFloat(focusLon);
      if (!isNaN(lat) && !isNaN(lon)) {
        setTargetFly({ lat, lon, zoom: 17, ts: Date.now() });
        setSelectedIncidentId(String(focusIncidentId));
      }
    }
  }, [searchParams]);

  // Apertura controlada por una sola vez del popup del incidente enfocado (evita que se quede bloqueado al cerrar)
  useEffect(() => {
    // Interceptar clics en el botón de cerrar 'x' de Leaflet para evitar hash '#close' y briqueo de navegación
    const handlePopupCloseClick = (e) => {
      const closeBtn = e.target.closest('.leaflet-popup-close-button');
      if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIncidentId(null);
        if (location.pathname === '/' && searchParams.get('focusIncident')) {
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('focusIncident');
          newParams.delete('lat');
          newParams.delete('lon');
          setSearchParams(newParams, { replace: true });
        }
      }
    };
    document.addEventListener('click', handlePopupCloseClick, true);

    const focusIncidentId = searchParams.get('focusIncident');
    if (!focusIncidentId) return () => document.removeEventListener('click', handlePopupCloseClick, true);

    if (openedFocusIncidentRef.current !== focusIncidentId) {
      const marker = incidentMarkerRefs.current[focusIncidentId];
      if (marker) {
        openedFocusIncidentRef.current = focusIncidentId;
        const timer = setTimeout(() => {
          try {
            marker.openPopup();
          } catch (e) {}
        }, 600);
        return () => {
          clearTimeout(timer);
          document.removeEventListener('click', handlePopupCloseClick, true);
        };
      }
    }

    return () => document.removeEventListener('click', handlePopupCloseClick, true);
  }, [searchParams, activeIncidentFeatures]);

  // Línea de tiempo interactiva (MSN El Tiempo Timeline)
  const [timelineIndex, setTimelineIndex] = useState(11);
  const [isPlaying, setIsPlaying] = useState(false);

  // Modal y Formulario para creación de Hospitales y Cuerpo de Bomberos (Exclusivo Administrador)
  const [showCreateInfraModal, setShowCreateInfraModal] = useState(false);
  const [infraForm, setInfraForm] = useState({
    nombre: '',
    tipo: 'HOSPITAL',
    direccion: '',
    telefono_contacto: '',
    contacto_responsable: '',
    capacidad_atencion: 100,
    lat: 0.968,
    lon: -79.654,
  });

  const handleCreateInfraestructura = async (e) => {
    e.preventDefault();
    if (!infraForm.nombre?.trim()) {
      alert('Por favor ingrese el nombre oficial de la infraestructura.');
      return;
    }
    const latNum = Number(infraForm.lat);
    const lonNum = Number(infraForm.lon);
    if (isNaN(latNum) || isNaN(lonNum)) {
      alert('Coordenadas GPS no válidas.');
      return;
    }

    const payload = {
      nombre: infraForm.nombre.trim(),
      tipo: infraForm.tipo || 'HOSPITAL',
      direccion: infraForm.direccion?.trim() || 'Cantón Esmeraldas',
      telefono_contacto: infraForm.telefono_contacto?.trim() || '',
      contacto_responsable: infraForm.contacto_responsable?.trim() || '',
      capacidad_atencion: Number(infraForm.capacidad_atencion) || 100,
      lat: Number(latNum.toFixed(5)),
      lon: Number(lonNum.toFixed(5)),
    };

    try {
      const resCreated = await gisApi.createInfraestructura(payload);
      setShowCreateInfraModal(false);

      const createdFeature = resCreated?.infraestructura || {
        type: 'Feature',
        id: resCreated?.id || Date.now(),
        geometry: {
          type: 'Point',
          coordinates: [payload.lon, payload.lat],
        },
        properties: {
          id: resCreated?.id || Date.now(),
          nombre: payload.nombre,
          tipo: payload.tipo,
          direccion: payload.direccion,
          telefono_contacto: payload.telefono_contacto,
          contacto_responsable: payload.contacto_responsable,
          capacidad_atencion: payload.capacidad_atencion,
          activo: true,
        },
      };

      // Inserción visual reactiva inmediata en el visor
      setInfraestructuras((prev) => {
        if (!prev) return { type: 'FeatureCollection', features: [createdFeature] };
        if (Array.isArray(prev)) return [...prev, createdFeature];
        const prevFeatures = prev.features || [];
        return {
          ...prev,
          features: [...prevFeatures, createdFeature],
        };
      });

      // Mover cámara a la nueva infraestructura
      setTargetFly({ lat: payload.lat, lon: payload.lon, zoom: 15, ts: Date.now() });

      // Sincronizar desde la base de datos PostgreSQL en Aiven
      const fresh = await gisApi.getInfraestructuras();
      if (fresh) setInfraestructuras(fresh);

      setSaveStatus({
        type: 'success',
        text: `✅ ${payload.tipo}: "${payload.nombre}" registrado exitosamente en la base de datos Aiven.`,
      });
      setTimeout(() => setSaveStatus(null), 6000);
    } catch (err) {
      console.error('Error guardando infraestructura:', err);
      alert('Error guardando infraestructura en Aiven: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteInfraestructura = async (id, nombre) => {
    if (window.confirm(`¿Confirmas que deseas eliminar permanentemente "${nombre}" de la base de datos?`)) {
      try {
        await gisApi.deleteInfraestructura(id);
        const res = await gisApi.getInfraestructuras();
        setInfraestructuras(res);
        setSaveStatus({
          type: 'success',
          text: `🗑️ "${nombre}" eliminado del sistema.`,
        });
        setTimeout(() => setSaveStatus(null), 6000);
      } catch (err) {
        alert('Error eliminando infraestructura: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  // Manejador de arrastre de infraestructuras (Hospitales / Bomberos) para reubicación en tierra firme (Exclusivo Administrador)
  const handleInfraDragEnd = (infraId, infraNombre) => async (e) => {
    const marker = e.target;
    const newPos = marker.getLatLng();
    const newLat = Number(newPos.lat.toFixed(5));
    const newLon = Number(newPos.lng.toFixed(5));

    setInfraestructuras((prev) => {
      if (!prev) return prev;
      if (Array.isArray(prev)) {
        return prev.map((f) => {
          const fid = f.id || f.properties?.id;
          if (fid === infraId) {
            return {
              ...f,
              geometry: {
                ...f.geometry,
                coordinates: [newLon, newLat],
              },
            };
          }
          return f;
        });
      }
      if (prev.features) {
        return {
          ...prev,
          features: prev.features.map((f) => {
            const fid = f.id || f.properties?.id;
            if (fid === infraId) {
              return {
                ...f,
                geometry: {
                  ...f.geometry,
                  coordinates: [newLon, newLat],
                },
              };
            }
            return f;
          }),
        };
      }
      return prev;
    });

    try {
      await gisApi.updateInfraestructura(infraId, { lat: newLat, lon: newLon });
      setSaveStatus({
        type: 'success',
        text: `✅ ${infraNombre} reubicado exitosamente a [${newLat}, ${newLon}] en PostGIS.`,
      });
      setTimeout(() => setSaveStatus(null), 6000);
    } catch (err) {
      console.error('Error al guardar infraestructura:', err);
      setSaveStatus({
        type: 'error',
        text: `⚠️ No se pudo guardar la ubicación en la base de datos.`,
      });
      setTimeout(() => setSaveStatus(null), 6000);
    }
  };

  // Manejador de arrastre de albergues para reubicación interactiva en tierra firme (Modo Admin)
  const handleShelterDragEnd = (albergueId, albergueNombre) => async (e) => {
    const marker = e.target;
    const newPos = marker.getLatLng();
    const newLat = Number(newPos.lat.toFixed(5));
    const newLon = Number(newPos.lng.toFixed(5));

    // Actualización visual inmediata en estado local GeoJSON
    setAlbergues((prev) => {
      if (!prev) return prev;
      if (Array.isArray(prev)) {
        return prev.map((f) => {
          const fid = f.id || f.properties?.id;
          if (fid === albergueId) {
            return {
              ...f,
              geometry: {
                ...f.geometry,
                coordinates: [newLon, newLat],
              },
            };
          }
          return f;
        });
      }
      if (prev.features) {
        return {
          ...prev,
          features: prev.features.map((f) => {
            const fid = f.id || f.properties?.id;
            if (fid === albergueId) {
              return {
                ...f,
                geometry: {
                  ...f.geometry,
                  coordinates: [newLon, newLat],
                },
              };
            }
            return f;
          }),
        };
      }
      return prev;
    });

    try {
      await evacuationApi.updateAlbergue(albergueId, { lat: newLat, lon: newLon });
      setSaveStatus({
        type: 'success',
        text: `✅ Albergue "${albergueNombre}" reubicado exitosamente a [${newLat}, ${newLon}] en la base de datos PostGIS.`,
      });
      setTimeout(() => setSaveStatus(null), 6000);
    } catch (err) {
      console.error('Error al guardar albergue:', err);
      setSaveStatus({
        type: 'error',
        text: `⚠️ No se pudo guardar la ubicación en la base de datos.`,
      });
      setTimeout(() => setSaveStatus(null), 6000);
    }
  };

  // Carga de clima según cantón
  const fetchWeatherForCanton = useCallback(async (cantonObj) => {
    setLoadingWeather(true);
    try {
      const data = await weatherApi.getClimaActual(cantonObj.id);
      setClima(data);
      if (data?.prevision_horaria?.length > 0) {
        const nowHour = new Date().getHours();
        const foundIdx = data.prevision_horaria.findIndex(
          (p) => parseInt(p.hora) === nowHour
        );
        if (foundIdx !== -1) setTimelineIndex(foundIdx);
      }
    } catch (err) {
      console.error('Error cargando clima de', cantonObj.nombre, err);
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  // Carga inicial de capas territoriales, incidentes y clima
  const loadInitialData = async () => {
    try {
      const [zr, rh, inf, alb, rep] = await Promise.allSettled([
        gisApi.getZonasRiesgo(),
        gisApi.getRedHidricaVial(),
        gisApi.getInfraestructuras(),
        evacuationApi.getAlbergues(),
        reportsApi.getReportes(),
      ]);

      if (zr.status === 'fulfilled') setZonasRiesgo(zr.value);
      if (rh.status === 'fulfilled') setRedHidrica(rh.value);
      if (inf.status === 'fulfilled') setInfraestructuras(inf.value);
      if (alb.status === 'fulfilled') setAlbergues(alb.value);
      if (rep.status === 'fulfilled') setIncidentesData(rep.value);

      // Cargar clima de Esmeraldas inicial
      await fetchWeatherForCanton(CANTONES[0]);
    } catch (err) {
      console.error('Error cargando datos del COE:', err);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Sondeo periódico cada 15 segundos para capturar nuevos incidentes reportados en vivo
    const timer = setInterval(async () => {
      try {
        const freshRep = await reportsApi.getReportes();
        if (freshRep) setIncidentesData(freshRep);
      } catch (e) {
        // Ignorar errores transitorios de red en sondeo
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [fetchWeatherForCanton]);

  // Detector automático de cantón al mover o hacer zoom en el mapa
  const handleMapCenterChanged = useCallback((lat, lon) => {
    setMapCenterCoords([lat, lon]);
    let closest = CANTONES[0];
    let minDistance = Infinity;

    for (const c of CANTONES) {
      const dist = Math.hypot(lat - c.lat, lon - c.lon);
      if (dist < minDistance) {
        minDistance = dist;
        closest = c;
      }
    }

    // Si el usuario movió el visor cerca del nuevo cantón y es diferente al actual
    if (closest.id !== activeCanton.id) {
      setActiveCanton(closest);
      setLastAutoDetected(closest.shortName);
      fetchWeatherForCanton(closest);
    }
  }, [activeCanton, fetchWeatherForCanton]);

  // Selección manual de cantón (desde los chips inferiores o clic en pin)
  const handleSelectCanton = (cantonObj) => {
    setActiveCanton(cantonObj);
    setTargetFly({ lat: cantonObj.lat, lon: cantonObj.lon, zoom: 13, ts: Date.now() });
    fetchWeatherForCanton(cantonObj);
  };

  // Previsión horaria garantizada y reactiva (24 horas dinámicas con variación continua)
  const hourlyList = useMemo(() => {
    if (clima?.prevision_horaria && clima.prevision_horaria.length > 0) {
      return clima.prevision_horaria;
    }
    const baseT = clima?.temperatura_c || 28.5;
    return Array.from({ length: 24 }, (_, i) => {
      const hh = String(i).padStart(2, '0') + ':00';
      const factor = Math.sin(((i - 8) / 24) * 2 * Math.PI);
      const temp = Number((baseT + factor * 3.6).toFixed(1));
      const lluvia = i >= 13 && i <= 17 ? Number((Math.sin((i - 13) / 4 * Math.PI) * 16.5).toFixed(1)) : 0.0;
      const viento = Number((10.5 + Math.abs(factor) * 7.5).toFixed(1));
      return {
        hora: hh,
        temp,
        lluvia,
        viento,
        codigo: lluvia > 5 ? 63 : lluvia > 0 ? 51 : 2,
        condicion: lluvia > 5 ? 'Lluvia moderada' : lluvia > 0 ? 'Llovizna dispersa' : 'Parcialmente nublado',
      };
    });
  }, [clima]);

  // Animación del reproductor de línea de tiempo horaria
  useEffect(() => {
    let timer;
    if (isPlaying && hourlyList.length > 0) {
      timer = setInterval(() => {
        setTimelineIndex((prev) => (prev + 1) % hourlyList.length);
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, hourlyList]);

  // Punto horario activo sincronizado dinámicamente con el slider
  const currentHourlyPoint = hourlyList[timelineIndex] || hourlyList[0] || {
    hora: '11:00',
    temp: 28.5,
    lluvia: 0.0,
    viento: 12.0,
    condicion: 'Parcialmente Nublado'
  };

  const getRiskStyle = (feature) => {
    const nivel = feature.properties?.nivel_riesgo || 'MEDIO';
    if (nivel === 'ALTO') return { color: '#ef4444', weight: 2.5, fillColor: '#ef4444', fillOpacity: 0.45 };
    if (nivel === 'MEDIO') return { color: '#f59e0b', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.4 };
    return { color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.35 };
  };

  return (
    <ErrorBoundary>
      <div className="relative w-full h-full flex flex-col bg-slate-900 overflow-hidden">
        
        {/* ========================================================================= */}
        {/* BARRA SUPERIOR: SELECTOR DE CAPAS METEOROLÓGICAS & MAPA BASE */}
        {/* ========================================================================= */}
        <div className="bg-white/95 dark:bg-crisis-800/95 backdrop-blur-md border-b border-slate-200 dark:border-crisis-700 px-3 md:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 z-10 shadow-sm">
          
          {/* Título & Badge de Monitoreo */}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-500/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              SALA DE CRISIS COE • RADAR EN VIVO
            </span>
            {activeIncidentFeatures.length > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40 shadow-sm animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-500"></span>
                <span>{activeIncidentFeatures.length} {activeIncidentFeatures.length === 1 ? 'Incidente Activo' : 'Incidentes Activos'}</span>
              </span>
            )}
            <span className="text-[11px] text-slate-600 dark:text-slate-300 hidden lg:inline font-medium">
              Provincia de Esmeraldas • Open-Meteo & OpenWeatherMap
            </span>
          </div>

          {/* BARRA DE MODOS METEOROLÓGICOS (ESTILO MSN EL TIEMPO) */}
          <div className="flex items-center bg-slate-100 dark:bg-crisis-900/90 p-1 rounded-xl border border-slate-300 dark:border-crisis-700/80 shadow-inner gap-1 overflow-x-auto max-w-full">
            <button
              onClick={() => setWeatherMode('temp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'temp'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md ring-1 ring-amber-300'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
              }`}
              title="Capa de Temperatura"
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temperatura</span>
            </button>

            <button
              onClick={() => setWeatherMode('rain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'rain'
                  ? 'bg-sky-600 text-white shadow-md ring-1 ring-sky-300'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
              }`}
              title="Capa de Precipitaciones y Lluvias"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Precipitaciones</span>
            </button>

            <button
              onClick={() => setWeatherMode('wind')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'wind'
                  ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-300'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
              }`}
              title="Velocidad y Dirección del Viento"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Viento</span>
            </button>

            <button
              onClick={() => setWeatherMode('clouds')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                weatherMode === 'clouds'
                  ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-300'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
              }`}
              title="Nubosidad Satelital"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Nubosidad</span>
            </button>

            <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-300 dark:border-crisis-700/80">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden xl:inline">
                Leyenda:
              </span>

              {/* Checkbox Albergues */}
              <label 
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition select-none ${
                  layers.albergues ? 'bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30' : 'opacity-60 hover:opacity-100'
                }`}
                title="Mostrar u ocultar albergues temporales en el mapa"
              >
                <input
                  type="checkbox"
                  checked={layers.albergues}
                  onChange={(e) => setLayers((prev) => ({ ...prev, albergues: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-crisis-600 cursor-pointer"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-sm"></span>
                <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 whitespace-nowrap">Albergues</span>
              </label>

              {/* Checkbox Hospitales */}
              <label 
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition select-none ${
                  layers.hospitales ? 'bg-red-50 dark:bg-red-500/15 border border-red-300 dark:border-red-500/30' : 'opacity-60 hover:opacity-100'
                }`}
                title="Mostrar u ocultar hospitales y centros médicos en el mapa"
              >
                <input
                  type="checkbox"
                  checked={layers.hospitales}
                  onChange={(e) => setLayers((prev) => ({ ...prev, hospitales: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded text-red-600 focus:ring-red-500 border-slate-300 dark:border-crisis-600 cursor-pointer"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 shadow-sm"></span>
                <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 whitespace-nowrap">Hospitales</span>
              </label>

              {/* Checkbox Cuerpos de Bomberos */}
              <label 
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition select-none ${
                  layers.bomberos ? 'bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30' : 'opacity-60 hover:opacity-100'
                }`}
                title="Mostrar u ocultar estaciones de bomberos en el mapa"
              >
                <input
                  type="checkbox"
                  checked={layers.bomberos}
                  onChange={(e) => setLayers((prev) => ({ ...prev, bomberos: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-crisis-600 cursor-pointer"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0 shadow-sm"></span>
                <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 whitespace-nowrap">Bomberos</span>
              </label>
            </div>
          </div>

          {/* Selector de Mapa Base Ultra-Rápido */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-crisis-900/90 p-0.5 rounded-xl border border-slate-300 dark:border-crisis-700/80 text-xs">
              <button
                onClick={() => setBaseMap('calles')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                  baseMap === 'calles' ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-300' : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
                title="Esri World Street Map: Libre de marcas de agua, alta definición y carga rápida"
              >
                Calles Esri (Recomendado)
              </button>
              <button
                onClick={() => setBaseMap('sat')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                  baseMap === 'sat' ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-300' : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
                title="Imágenes Satelitales de Alta Resolución (Esri World Imagery)"
              >
                Satelital
              </button>
              <button
                onClick={() => setBaseMap('osm')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                  baseMap === 'osm' ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-300' : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
                title="OpenStreetMap Mirror Comunitario"
              >
                OSM
              </button>
            </div>

            <button
              onClick={async () => {
                fetchWeatherForCanton(activeCanton);
                try {
                  const rep = await reportsApi.getReportes();
                  if (rep) setIncidentesData(rep);
                } catch (e) {}
              }}
              disabled={loadingWeather}
              className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-crisis-700 dark:hover:bg-crisis-600 rounded-lg border border-slate-300 dark:border-crisis-600 transition"
              title="Refrescar telemetría e incidentes en vivo"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingWeather ? 'animate-spin text-sky-500 dark:text-sky-400' : ''}`} />
            </button>

            {/* Acciones de Creación (Exclusivo Administrador) */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-crisis-700">
                <button
                  onClick={() => {
                    const centerLat = mapCenterCoords ? mapCenterCoords[0] : (activeCanton?.lat || ESMERALDAS_CENTER[0]);
                    const centerLon = mapCenterCoords ? mapCenterCoords[1] : (activeCanton?.lon || ESMERALDAS_CENTER[1]);
                    setInfraForm({
                      nombre: '',
                      tipo: 'HOSPITAL',
                      direccion: 'Av. Libertad y Calle 10, Esmeraldas',
                      telefono_contacto: '062723000',
                      contacto_responsable: 'Dr. Roberto Estupiñán',
                      capacidad_atencion: 120,
                      lat: Number(centerLat.toFixed(5)),
                      lon: Number(centerLon.toFixed(5)),
                    });
                    setShowCreateInfraModal(true);
                  }}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] rounded-lg shadow flex items-center gap-1 transition active:scale-95"
                  title="Registrar nuevo hospital en la base de datos"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Hospital</span>
                </button>

                <button
                  onClick={() => {
                    const centerLat = mapCenterCoords ? mapCenterCoords[0] : (activeCanton?.lat || ESMERALDAS_CENTER[0]);
                    const centerLon = mapCenterCoords ? mapCenterCoords[1] : (activeCanton?.lon || ESMERALDAS_CENTER[1]);
                    setInfraForm({
                      nombre: '',
                      tipo: 'BOMBEROS',
                      direccion: 'Calle Sucre y Rocafuerte, Esmeraldas',
                      telefono_contacto: '062720102',
                      contacto_responsable: 'Cmdte. Miguel Perea',
                      capacidad_atencion: 45,
                      lat: Number(centerLat.toFixed(5)),
                      lon: Number(centerLon.toFixed(5)),
                    });
                    setShowCreateInfraModal(true);
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg shadow flex items-center gap-1 transition active:scale-95"
                  title="Registrar nueva estación de bomberos en la base de datos"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Bomberos</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAPA PRINCIPAL LEAFLET CON RENDIMIENTO DE TESELAS OPTIMIZADO */}
        {/* ========================================================================= */}
        <div className="flex-1 relative">
          <MapContainer
            center={ESMERALDAS_CENTER}
            zoom={12}
            minZoom={5}
            maxZoom={19}
            scrollWheelZoom={true}
            zoomAnimation={true}
            fadeAnimation={true}
            className="w-full h-full"
          >
            {/* Controlador de movimiento de mapa para autodetección de cantón */}
            <MapController 
              onCenterChange={handleMapCenterChanged} 
              targetFly={targetFly}
            />

            {/* 1. MAPA BASE CON BUFFER ALTO Y SIN BLOQUEOS DE ZOOM */}
            {baseMap === 'carto' && (
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap'
                url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`}
                subdomains={['a', 'b', 'c', 'd']}
                maxZoom={19}
                keepBuffer={12}
                updateWhenZooming={false}
                updateInterval={100}
              />
            )}

            {baseMap === 'calles' && (
              <TileLayer
                attribution='&copy; Esri, TomTom'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                keepBuffer={12}
                updateWhenZooming={false}
                updateInterval={100}
              />
            )}

            {baseMap === 'osm' && (
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
                subdomains={['a', 'b', 'c']}
                maxZoom={19}
                keepBuffer={12}
                updateWhenZooming={false}
                updateInterval={100}
              />
            )}

            {baseMap === 'sat' && (
              <TileLayer
                attribution='&copy; Esri, Maxar'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                keepBuffer={12}
                updateWhenZooming={false}
                updateInterval={100}
              />
            )}

            {/* 2. PINES DISCRETOS DE TODOS LOS CANTONES */}
            {CANTONES.map((c) => {
              const isSelected = activeCanton.id === c.id;
              return (
                <Marker
                  key={`canton-pin-${c.id}`}
                  position={[c.lat, c.lon]}
                  icon={createCantonPin(c.shortName, isSelected, isSelected ? Number(currentHourlyPoint.temp).toFixed(1) : null)}
                  eventHandlers={{
                    click: () => handleSelectCanton(c),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1 min-w-[150px]">
                      <p className="font-bold text-sky-400 text-sm">{c.nombre}</p>
                      <p className="text-slate-300">
                        Coordenadas: {c.lat.toFixed(4)}, {c.lon.toFixed(4)}
                      </p>
                      <button
                        onClick={() => handleSelectCanton(c)}
                        className="mt-1 w-full bg-sky-600 hover:bg-sky-500 text-white py-1 rounded font-bold text-[11px]"
                      >
                        Centrar y Ver Pronóstico
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 3. CAPAS GIS DE RIESGO DE AIVEN POSTGIS */}
            {layers.zonasRiesgo && isValidGeoJson(zonasRiesgo) && (
              <GeoJSON
                key={`zr-${zonasRiesgo.features?.length || 0}`}
                data={zonasRiesgo}
                style={getRiskStyle}
                onEachFeature={(feature, layer) => {
                  const p = feature.properties || {};
                  layer.bindPopup(`
                    <div class="text-xs">
                      <p class="font-bold text-red-400 text-sm">${p.nombre || 'Zona de Riesgo'}</p>
                      <p class="mt-1"><strong>Nivel:</strong> ${p.nivel_riesgo || 'ALTO'}</p>
                      <p><strong>Evento:</strong> ${p.tipo_evento || 'INUNDACION'}</p>
                      <p class="mt-1 text-slate-300">${p.descripcion || ''}</p>
                    </div>
                  `);
                }}
              />
            )}

            {/* 4. RED HÍDRICA (RÍO TEAONE Y ESMERALDAS) */}
            {layers.redHidrica && isValidGeoJson(redHidrica) && (
              <GeoJSON
                key={`rh-${redHidrica.features?.length || 0}`}
                data={redHidrica}
                style={{ color: '#0284c7', weight: 3.5, opacity: 0.85 }}
              />
            )}

            {/* 5. ALBERGUES TEMPORALES Y ZONAS DE EVACUACIÓN / REFUGIO (ARRASTRABLES EN MODO ADMIN) */}
            {layers.albergues && shelterFeatures.map((feature, i) => {
              const rawCoords = feature.geometry?.coordinates;
              if (!rawCoords) return null;
              const coords = Array.isArray(rawCoords)
                ? rawCoords
                : typeof rawCoords === 'string'
                  ? rawCoords.trim().split(/\s+/).map(Number)
                  : null;
              if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null;

              const p = feature.properties || {};
              const albId = feature.id || p.id || (i + 1);
              const pct = Math.round((p.ocupacion_actual / (p.capacidad_maxima || 1)) * 100);
              return (
                <Marker 
                  key={`alb-${albId}`} 
                  position={[coords[1], coords[0]]} 
                  icon={createShelterMarker(pct, p.nombre, isAdmin)}
                  draggable={isAdmin}
                  eventHandlers={{
                    dragend: handleShelterDragEnd(albId, p.nombre),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-2 min-w-[220px] p-1 text-slate-800 dark:text-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                          <span>Albergue y Refugio Seguro</span>
                        </div>
                        {isAdmin && (
                          <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 px-1.5 py-0.5 rounded font-extrabold">
                            ADMIN (Arrastrable)
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white text-sm">{p.nombre}</p>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">{p.direccion || 'Cantón Esmeraldas'}</p>
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px] mt-0.5">
                          GPS: {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
                        </p>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60">
                        <div className="flex justify-between text-[11px] mb-1 text-slate-700 dark:text-slate-200">
                          <span>Ocupación: <strong>{p.ocupacion_actual}</strong> / {p.capacidad_maxima}</span>
                          <span className={`font-bold ${pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700/80 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} 
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1.5">
                          Cupos disponibles: <strong className="text-emerald-600 dark:text-emerald-400">{Math.max(0, p.capacidad_maxima - p.ocupacion_actual)} personas</strong>
                        </p>
                      </div>

                      {/* Contacto y Encargado del Albergue */}
                      {(p.telefono_contacto || p.contacto_responsable) && (
                        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60 space-y-1 text-[10px]">
                          {p.contacto_responsable && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Encargado:</span>
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{p.contacto_responsable}</span>
                            </div>
                          )}
                          {p.telefono_contacto && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                                <span>Teléfono:</span>
                              </span>
                              <a href={`tel:${p.telefono_contacto}`} className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
                                {p.telefono_contacto}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {isAdmin && (
                        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60 text-[10px] text-sky-700 dark:text-sky-300 flex items-center gap-1 font-semibold">
                          <span>✋ Arrastra este albergue en el mapa para corregir su posición en tierra firme.</span>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 6. INFRAESTRUCTURAS ESENCIALES (HOSPITALES, BOMBEROS) CON FILTRO DE LEYENDA */}
            {infraFeatures.map((feature, i) => {
              const rawCoords = feature.geometry?.coordinates;
              if (!rawCoords) return null;
              const coords = Array.isArray(rawCoords)
                ? rawCoords
                : typeof rawCoords === 'string'
                  ? rawCoords.trim().split(/\s+/).map(Number)
                  : null;
              if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null;

              const p = feature.properties || {};
              const infraId = feature.id || p.id || (i + 1);
              const isBombero = (p.tipo || '').toUpperCase().includes('BOMBERO');

              // Ocultar según checkboxes de leyenda
              if (isBombero && !layers.bomberos) return null;
              if (!isBombero && !layers.hospitales) return null;

              return (
                <Marker 
                  key={`inf-${infraId}`} 
                  position={[coords[1], coords[0]]} 
                  icon={createHospitalMarker(p.tipo, isAdmin)}
                  draggable={isAdmin}
                  eventHandlers={{
                    dragend: handleInfraDragEnd(infraId, p.nombre),
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-2 min-w-[240px] max-w-[280px] p-1 text-slate-800 dark:text-slate-200">
                      {/* Cabecera Tipo y Badge Admin */}
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-1.5">
                        <span className={`font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 ${
                          isBombero
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isBombero ? '🚒 CUERPO DE BOMBEROS' : '🏥 HOSPITAL / CENTRO MÉDICO'}
                        </span>
                        {isAdmin && (
                          <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 px-1.5 py-0.5 rounded font-black">
                            ADMIN (Arrastrable)
                          </span>
                        )}
                      </div>

                      {/* Nombre y Dirección */}
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">{p.nombre}</h4>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{p.direccion || 'Cantón Esmeraldas'}</span>
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px] mt-0.5 pl-4">
                          GPS: {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
                        </p>
                      </div>

                      {/* Tarjeta de Datos de Contacto y Encargado */}
                      <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-[11px]">
                        {/* Teléfono de Contacto */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>Contacto:</span>
                          </span>
                          {p.telefono_contacto ? (
                            <a
                              href={`tel:${p.telefono_contacto}`}
                              className="font-bold text-sky-700 dark:text-sky-300 hover:underline flex items-center gap-1"
                              title="Llamar directamente"
                            >
                              <span>{p.telefono_contacto}</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 font-medium">062725890 (COE)</span>
                          )}
                        </div>

                        {/* Encargado / Responsable a Cargo */}
                        <div className="flex items-start justify-between gap-1 pt-1.5 border-t border-slate-200 dark:border-slate-700/60">
                          <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1 shrink-0">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Encargado:</span>
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-right">
                            {p.contacto_responsable || (isBombero ? 'Jefatura de Guardia' : 'Dirección Médica de Turno')}
                          </span>
                        </div>

                        {/* Capacidad de Atención (Camas / Efectivos) */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700/60">
                          <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                            <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                            <span>{isBombero ? 'Capacidad:' : 'Camas / Atención:'}</span>
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {p.capacidad_atencion ? `${p.capacidad_atencion} ${isBombero ? 'efectivos' : 'camas'}` : (isBombero ? '45 efectivos' : '120 camas')}
                          </span>
                        </div>

                        {/* Estado Operativo */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700/60">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Disponibilidad:</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Operativo 24/7
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                          <div className="text-[10px] text-sky-700 dark:text-sky-300 flex items-center gap-1 font-semibold">
                            <span>✋ Arrastra este icono en el mapa para corregir su posición en tierra firme.</span>
                          </div>
                          <button
                            onClick={() => handleDeleteInfraestructura(infraId, p.nombre)}
                            className="w-full py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 transition shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Eliminar de Base de Datos</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 7. INCIDENTES Y EMERGENCIAS COMUNITARIAS EN VIVO (MARCADORES POR GRAVEDAD) */}
            {layers.incidentes && activeIncidentFeatures.map((feature, i) => {
              const p = feature.properties || feature;
              let lat = null;
              let lon = null;
              if (feature.geometry?.coordinates) {
                lon = feature.geometry.coordinates[0];
                lat = feature.geometry.coordinates[1];
              } else if (p.latitud != null && p.longitud != null) {
                lat = Number(p.latitud);
                lon = Number(p.longitud);
              } else if (p.lat != null && (p.lon != null || p.lng != null)) {
                lat = Number(p.lat);
                lon = Number(p.lon != null ? p.lon : p.lng);
              }

              if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return null;

              const incId = String(feature.id || p.id || `inc-${i}`);
              const isSelected = String(selectedIncidentId) === incId;
              const gravedad = (p.nivel_gravedad || 'MEDIO').toUpperCase();
              const estado = (p.estado || 'PENDIENTE').toUpperCase();
              const informante = p.usuario_nombre || feature.usuario_nombre || 'Ciudadano / Móvil';

              return (
                <React.Fragment key={`incident-group-${incId}`}>
                  {/* Buffer Geoespacial PostGIS (25m de radio por defecto) */}
                  <Circle
                    center={[lat, lon]}
                    radius={Number(p.radio_analisis_metros || 25)}
                    pathOptions={{
                      color: gravedad === 'CRITICO' ? '#dc2626' : gravedad === 'ALTO' ? '#ea580c' : '#0284c7',
                      fillColor: gravedad === 'CRITICO' ? '#ef4444' : gravedad === 'ALTO' ? '#f97316' : '#38bdf8',
                      fillOpacity: isSelected ? 0.35 : 0.16,
                      weight: isSelected ? 2.5 : 1.5,
                      dashArray: isSelected ? '4, 4' : undefined,
                    }}
                  />
                  <Marker
                    key={`incident-marker-${incId}`}
                    position={[lat, lon]}
                    icon={createIncidentMarker(gravedad, p.tipo_evento, isSelected)}
                  ref={(markerInstance) => {
                    if (markerInstance) {
                      incidentMarkerRefs.current[incId] = markerInstance;
                    } else {
                      delete incidentMarkerRefs.current[incId];
                    }
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedIncidentId(incId);
                    },
                    popupopen: () => {
                      setSelectedIncidentId(incId);
                    },
                    popupclose: () => {
                      setSelectedIncidentId(null);
                    },
                  }}
                >
                  <Popup 
                    minWidth={270} 
                    maxWidth={340}
                    autoClose={true}
                    closeOnClick={true}
                  >
                    <div className="text-xs space-y-2 p-1 text-slate-800 dark:text-slate-200">
                      {/* Cabecera: Tipo de evento y Nivel de Gravedad */}
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-1.5 pr-6">
                        <span className="font-extrabold text-sm uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-1.5">
                          <AlertTriangle className={`w-4 h-4 shrink-0 ${
                            gravedad === 'CRITICO' ? 'text-red-600 dark:text-red-500 animate-pulse' :
                            gravedad === 'ALTO' ? 'text-orange-500' :
                            gravedad === 'MEDIO' ? 'text-amber-500' : 'text-emerald-500'
                          }`} />
                          <span>{p.tipo_evento?.replace(/_/g, ' ') || 'INCIDENTE'}</span>
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                          gravedad === 'CRITICO'
                            ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40 shadow-sm'
                            : gravedad === 'ALTO'
                            ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40'
                            : gravedad === 'MEDIO'
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                        }`}>
                          {gravedad}
                        </span>
                      </div>

                      {/* Informante y Estado */}
                      <div className="bg-slate-100 dark:bg-slate-800/80 p-2 rounded-lg space-y-1 border border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                          <User className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                          <span>Informante: <strong className="text-slate-900 dark:text-white">{informante}</strong></span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>Estado: <strong className="text-sky-600 dark:text-sky-400 font-bold">{estado}</strong></span>
                          {p.sincronizado_offline && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <span>📡</span> Sincronizado Offline
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Descripción */}
                      {p.descripcion && (
                        <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed italic bg-amber-50/70 dark:bg-amber-950/25 p-2 rounded-lg border border-amber-200/70 dark:border-amber-800/40">
                          "{p.descripcion}"
                        </p>
                      )}

                      {/* Métricas de Afectación */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-100 dark:bg-slate-800/90 p-2 rounded-lg text-center border border-slate-200 dark:border-slate-700/60">
                          <span className="block text-slate-500 dark:text-slate-400 text-[10px]">Atrapadas</span>
                          <strong className="text-red-600 dark:text-red-400 text-sm font-black">{p.personas_atrapadas || 0}</strong>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800/90 p-2 rounded-lg text-center border border-slate-200 dark:border-slate-700/60">
                          <span className="block text-slate-500 dark:text-slate-400 text-[10px]">Familias Afectadas</span>
                          <strong className="text-slate-900 dark:text-slate-100 text-sm font-black">{p.familias_afectadas || 0}</strong>
                        </div>
                      </div>

                      {/* Cruce Geoespacial PostGIS de Afectación Inmediata con Familias Censadas */}
                      {(Number(p.personas_afectadas_estimadas) > 0 || Number(p.familias_en_perimetro) > 0) && (
                        <div className="bg-purple-50 dark:bg-purple-950/40 p-2 rounded-lg border border-purple-200 dark:border-purple-800/60 text-[11px] space-y-1">
                          <div className="flex justify-between items-center text-purple-950 dark:text-purple-300 font-extrabold">
                            <span>Perímetro PostGIS ({Math.round(p.radio_analisis_metros || 25)}m):</span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-900/60 text-purple-950 dark:text-purple-200 font-black">
                              {p.personas_afectadas_estimadas} pers. ({p.familias_en_perimetro} fam.)
                            </span>
                          </div>
                          {(Number(p.ninos_en_riesgo) > 0 || Number(p.adultos_mayores_riesgo) > 0 || Number(p.discapacitados_riesgo) > 0) && (
                            <p className="text-[10px] text-purple-900 dark:text-purple-300 font-bold">
                              • {p.ninos_en_riesgo || 0} niños &lt;5 | {p.adultos_mayores_riesgo || 0} ancianos | {p.discapacitados_riesgo || 0} disc.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Coordenadas GPS y Hora */}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono space-y-0.5 border-t border-slate-200 dark:border-slate-700/60 pt-1.5 flex items-center justify-between">
                        <span>GPS: {lat.toFixed(5)}, {lon.toFixed(5)}</span>
                        {p.fecha_incidente && (
                          <span>{new Date(p.fecha_incidente).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const marker = incidentMarkerRefs.current[incId];
                            if (marker) marker.closePopup();
                            setSelectedIncidentId(null);
                            if (location.pathname === '/' && searchParams.get('focusIncident')) {
                              const newParams = new URLSearchParams(searchParams);
                              newParams.delete('focusIncident');
                              newParams.delete('lat');
                              newParams.delete('lon');
                              setSearchParams(newParams, { replace: true });
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cerrar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const marker = incidentMarkerRefs.current[incId];
                            if (marker) marker.closePopup();
                            setSelectedIncidentId(null);
                            navigate('/incidentes');
                          }}
                          className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Gestionar Incidente</span>
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
              );
            })}
          </MapContainer>

          {/* TOAST DE REUBICACIÓN EN BASE DE DATOS */}
          {saveStatus && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[1200] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md border animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2 ${
              saveStatus.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200 ring-2 ring-emerald-500/30'
                : 'bg-red-950/95 border-red-500/60 text-red-200'
            }`}>
              <span>{saveStatus.text}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONSOLA INFERIOR UNIFICADA: TELEMETRÍA DINÁMICA & TIMELINE MSN EL TIEMPO */}
          {/* ========================================================================= */}
          <div className="absolute bottom-2 left-2 right-2 lg:right-52 z-[1000] flex flex-col gap-1.5 pointer-events-none">
            
            <div className="pointer-events-auto bg-white/95 dark:bg-crisis-800/95 backdrop-blur-md border border-slate-200 dark:border-crisis-700/80 rounded-2xl p-2.5 shadow-2xl space-y-2">
              
              {/* FILA 1: CANTÓN ACTIVO, CHIPS SELECTORES Y BADGES DE TELEMETRÍA */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                
                {/* Cantón Activo */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/25 flex items-center justify-center shrink-0 shadow-inner">
                    <WeatherIcon condition={clima?.condicion} className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs tracking-wide">
                        {clima?.lugar || activeCanton.nombre}
                      </h3>
                      <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                        En Vivo
                      </span>
                      {isAdmin && (
                        <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 px-1.5 py-0.2 rounded font-extrabold hidden sm:inline">
                          ADMIN (Arrastra Albergues)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="capitalize">{currentHourlyPoint.condicion || clima?.condicion || 'Monitoreo activo'}</span>
                      <span>•</span>
                      <span>Sensación: <strong className="text-slate-900 dark:text-white">{(Number(currentHourlyPoint.temp) + 2.5).toFixed(1)}°C</strong></span>
                    </p>
                  </div>
                </div>

                {/* Chips de Selección Rápida de Cantones */}
                <div className="flex items-center gap-1 overflow-x-auto py-0.5 px-1 bg-slate-100 dark:bg-crisis-900/80 rounded-lg border border-slate-200 dark:border-crisis-700/70">
                  {CANTONES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCanton(c)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition whitespace-nowrap ${
                        activeCanton.id === c.id
                          ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-300'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-700/70'
                      }`}
                    >
                      {c.shortName}
                    </button>
                  ))}
                </div>

                {/* Métricas en Tiempo Real (Resaltando el modo meteorológico seleccionado) */}
                <div className="flex items-center gap-1.5 text-xs overflow-x-auto max-w-full pb-0.5">
                  {/* Temp */}
                  <div className={`px-2 py-1 rounded-lg border transition ${
                    weatherMode === 'temp'
                      ? 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/20 dark:border-amber-500/60 dark:text-amber-300 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-crisis-900/80 dark:border-crisis-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Temp</span>
                      <strong className="text-xs font-mono">{Number(currentHourlyPoint.temp).toFixed(1)}°C</strong>
                    </div>
                  </div>

                  {/* Lluvia */}
                  <div className={`px-2 py-1 rounded-lg border transition ${
                    weatherMode === 'rain'
                      ? 'bg-sky-100 text-sky-900 border-sky-400 dark:bg-sky-500/20 dark:border-sky-500/60 dark:text-sky-300 shadow-md ring-1 ring-sky-400/40'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-crisis-900/80 dark:border-crisis-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Lluvia</span>
                      <strong className="text-xs font-mono">{Number(currentHourlyPoint.lluvia).toFixed(1)} mm</strong>
                    </div>
                  </div>

                  {/* Viento */}
                  <div className={`px-2 py-1 rounded-lg border transition ${
                    weatherMode === 'wind'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-500/20 dark:border-emerald-500/60 dark:text-emerald-300 shadow-md ring-1 ring-emerald-400/40'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-crisis-900/80 dark:border-crisis-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Viento</span>
                      <strong className="text-xs font-mono">{currentHourlyPoint.viento || clima?.velocidad_viento_kmh || 12} km/h</strong>
                    </div>
                  </div>

                  {/* Nubes */}
                  <div className={`px-2 py-1 rounded-lg border transition ${
                    weatherMode === 'clouds'
                      ? 'bg-indigo-100 text-indigo-900 border-indigo-400 dark:bg-indigo-500/20 dark:border-indigo-500/60 dark:text-indigo-300 shadow-md ring-1 ring-indigo-400/40'
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-crisis-900/80 dark:border-crisis-700 dark:text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1">
                      <Cloud className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Nubes</span>
                      <strong className="text-xs">{clima?.nubosidad_porcentaje || 55}%</strong>
                    </div>
                  </div>

                  {/* Riesgo */}
                  <div className={`px-2 py-1 rounded-lg border flex items-center gap-1 ${
                    currentHourlyPoint.lluvia > 15
                      ? 'bg-red-100 text-red-900 border-red-300 dark:bg-red-500/20 dark:border-red-500/40 dark:text-red-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300'
                  }`}>
                    {currentHourlyPoint.lluvia > 15 ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    )}
                    <span className="font-bold text-[11px]">
                      {currentHourlyPoint.lluvia > 15 ? 'Alerta Crecida' : 'Nivel Estable'}
                    </span>
                    {/* Botón Minimizar/Expandir Consola */}
                    <button
                      onClick={() => setConsoleExpanded(!consoleExpanded)}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-crisis-700 rounded-lg transition"
                      title={consoleExpanded ? 'Minimizar consola meteorológica' : 'Expandir previsión horaria y timeline'}
                    >
                      {consoleExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

              </div>

              {/* FILA 2: BARRA DE TIEMPO HORARIA INTERACTIVA (SLIDER MSN EL TIEMPO) */}
              {consoleExpanded && (
                <div className="pt-1.5 border-t border-slate-200 dark:border-crisis-700/70 flex flex-col gap-1 animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 gap-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] transition shadow"
                      >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                      </button>
                      <span className="text-slate-900 dark:text-white text-xs font-bold">
                        Previsión Horaria (24h)
                      </span>
                    </div>

                    <div className="text-sky-700 dark:text-sky-400 font-mono text-xs">
                      Hora: <strong className="text-slate-900 dark:text-white">{currentHourlyPoint.hora}</strong> • {Number(currentHourlyPoint.temp).toFixed(1)}°C • {Number(currentHourlyPoint.lluvia).toFixed(1)} mm lluvia
                    </div>
                  </div>

                  {/* Slider interactivo continuo */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="range"
                      min="0"
                      max={Math.max(1, hourlyList.length - 1)}
                      value={timelineIndex}
                      onChange={(e) => setTimelineIndex(parseInt(e.target.value))}
                      className="w-full h-2 bg-crisis-950 rounded-lg appearance-none cursor-pointer accent-sky-400 border border-slate-700"
                    />
                  </div>

                  {/* Marcas horarias fijas (cada 3 horas) */}
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
                    {hourlyList
                      .filter((_, idx) => idx % 3 === 0)
                      .map((h, i) => (
                        <span
                          key={i}
                          onClick={() => {
                            const originalIdx = hourlyList.findIndex((p) => p.hora === h.hora);
                            if (originalIdx !== -1) setTimelineIndex(originalIdx);
                          }}
                          className={`cursor-pointer hover:text-white transition font-medium ${
                            currentHourlyPoint.hora === h.hora ? 'text-sky-400 font-bold underline' : ''
                          }`}
                        >
                          {h.hora}
                        </span>
                      ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* MODAL CREAR HOSPITAL / BOMBEROS (EXCLUSIVO ADMINISTRADOR) */}
      {showCreateInfraModal && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {infraForm.tipo === 'HOSPITAL' ? (
                  <HeartPulse className="w-5 h-5 text-red-500" />
                ) : (
                  <Flame className="w-5 h-5 text-amber-500" />
                )}
                <span>Registrar {infraForm.tipo === 'HOSPITAL' ? 'Nuevo Hospital' : 'Nueva Estación de Bomberos'}</span>
              </h3>
              <button
                onClick={() => setShowCreateInfraModal(false)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInfraestructura} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Tipo Asignado</label>
                  <div className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-lg border font-bold text-xs ${
                    infraForm.tipo === 'HOSPITAL'
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                  }`}>
                    {infraForm.tipo === 'HOSPITAL' ? (
                      <>
                        <HeartPulse className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                        <span>Hospital / Centro Médico</span>
                      </>
                    ) : (
                      <>
                        <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Cuerpo de Bomberos</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">
                    {infraForm.tipo === 'HOSPITAL' ? 'Capacidad de Atención (Camas)' : 'Capacidad Operativa (Efectivos)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={infraForm.capacidad_atencion}
                    onChange={(e) => setInfraForm({ ...infraForm, capacidad_atencion: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Nombre Oficial *</label>
                <input
                  type="text"
                  required
                  placeholder={infraForm.tipo === 'HOSPITAL' ? 'ej: Hospital General Delfina Torres' : 'ej: Estación de Bomberos San Rafael'}
                  value={infraForm.nombre}
                  onChange={(e) => setInfraForm({ ...infraForm, nombre: e.target.value })}
                  className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Teléfono de Contacto</label>
                  <input
                    type="text"
                    placeholder="ej: 062723000"
                    value={infraForm.telefono_contacto}
                    onChange={(e) => setInfraForm({ ...infraForm, telefono_contacto: e.target.value })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Responsable a Cargo</label>
                  <input
                    type="text"
                    placeholder={infraForm.tipo === 'HOSPITAL' ? 'ej: Dr. Roberto Estupiñán' : 'ej: Cmdte. Miguel Perea'}
                    value={infraForm.contacto_responsable}
                    onChange={(e) => setInfraForm({ ...infraForm, contacto_responsable: e.target.value })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Dirección / Sector</label>
                <input
                  type="text"
                  placeholder="ej: Av. Libertad y Calle 10, Sector Centro"
                  value={infraForm.direccion}
                  onChange={(e) => setInfraForm({ ...infraForm, direccion: e.target.value })}
                  className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Latitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={infraForm.lat}
                    onChange={(e) => setInfraForm({ ...infraForm, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Longitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={infraForm.lon}
                    onChange={(e) => setInfraForm({ ...infraForm, lon: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateInfraModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-white font-bold rounded-lg shadow transition active:scale-95 flex items-center gap-1.5 ${
                    infraForm.tipo === 'HOSPITAL' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{infraForm.tipo === 'HOSPITAL' ? 'Guardar Hospital' : 'Guardar Bomberos'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </ErrorBoundary>
  );
};
export default CrisisRoomPage;
