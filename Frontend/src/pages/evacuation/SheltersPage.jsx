import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Home, 
  MapPin, 
  Users, 
  Phone, 
  Navigation, 
  Compass, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Move,
  Check,
  X,
  Map as MapIcon,
  Layers,
  Info,
  Sliders
} from 'lucide-react';
import { evacuationApi } from '../../api/evacuationApi';
import { useAuth } from '../../context/AuthContext';

// Fix de íconos predeterminados de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Ícono personalizado exclusivo para albergues
const createShelterIcon = (pct = 0, isDraggable = true, isSelected = false) => {
  const bgColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
  const badgeText = pct >= 90 ? 'LLENO' : `${pct}%`;

  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: ${isDraggable ? 'grab' : 'pointer'}; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));">
        <div style="
          width: 38px; 
          height: 38px; 
          background: ${bgColor}; 
          border: ${isSelected ? '3px solid #38bdf8' : isDraggable ? '2.5px dashed #ffffff' : '2.5px solid #ffffff'}; 
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
          box-shadow: 0 0 12px ${bgColor}99;
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.2s;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 10.5 12 3l9 7.5"/>
            <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>
            <path d="M10 21v-6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6"/>
          </svg>
        </div>
        <div style="
          width: 0; 
          height: 0; 
          border-left: 6px solid transparent; 
          border-right: 6px solid transparent; 
          border-top: 7px solid ${bgColor}; 
          margin-top: -1px;
        "></div>
        <div style="
          margin-top: 2px;
          background: rgba(15, 23, 42, 0.95);
          color: #ffffff;
          padding: 1px 6px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 800;
          font-family: monospace;
          border: 1px solid rgba(255,255,255,0.2);
          white-space: nowrap;
        ">
          ${badgeText}
        </div>
      </div>
    `,
    className: 'custom-shelter-marker',
    iconSize: [38, 56],
    iconAnchor: [19, 44],
    popupAnchor: [0, -44],
  });
};

// Ícono para nuevo albergue en creación
const createNewPinIcon = () => L.divIcon({
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; cursor: grab;">
      <div style="
        width: 36px; height: 36px; background: #0284c7; border: 3px solid #ffffff; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 0 14px #0284c7;
        animation: bounce 1s infinite alternate;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
    </div>
  `,
  className: 'new-pin-marker',
  iconSize: [36, 40],
  iconAnchor: [18, 20],
});

// Controlador de cámara del mapa
function MapCameraHandler({ targetFly }) {
  const map = useMap();
  useEffect(() => {
    if (targetFly) {
      map.flyTo([targetFly.lat, targetFly.lon], targetFly.zoom || 15, { duration: 1.2 });
    }
  }, [targetFly, map]);
  return null;
}

// Selector de clics en el mapa para colocar puntos
function MapClickHandler({ onClickMap }) {
  useMapEvents({
    click: (e) => {
      if (onClickMap) {
        onClickMap(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export const SheltersPage = () => {
  const { user, isAdmin: authIsAdmin, isOperador: authIsOperador, canManageShelters: authCanManage } = useAuth();
  
  const userRol = (user?.rol || user?.properties?.rol || '').toUpperCase();
  const userUsername = (user?.username || user?.properties?.username || '').toLowerCase();

  const matchR = (...targets) => targets.some((t) => userRol === t || userRol.includes(t));

  // Permisos de edición y reubicación habilitados para Administrador y Operador del COE
  const canManageShelters = Boolean(
    user && (
      authIsAdmin || 
      authIsOperador || 
      authCanManage ||
      matchR('ADMIN', 'COE', 'SUPERUSER', 'OPERADOR') || 
      userUsername === 'admin' || 
      user?.is_superuser
    )
  );
  const isAdmin = canManageShelters;

  const [albergues, setAlbergues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearestShelter, setNearestShelter] = useState(null);
  const [locating, setLocating] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Estados visuales y de control
  const [showMap, setShowMap] = useState(true);
  const [dragModeActive, setDragModeActive] = useState(true);
  const [targetFly, setTargetFly] = useState(null);
  const [selectedShelterId, setSelectedShelterId] = useState(null);

  // Modales de Gestión
  const [modalType, setModalType] = useState(null); // 'create' | 'edit' | 'relocate' | null
  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    direccion: '',
    capacidad_maxima: 200,
    ocupacion_actual: 0,
    contacto_responsable: '',
    telefono_contacto: '',
    lat: 0.9682,
    lon: -79.6517,
    servicios_disponibles: {
      agua_potable: true,
      electricidad: true,
      alimentacion: true,
      atencion_medica: false,
      wifi_conectividad: false,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carga inicial de albergues
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await evacuationApi.getAlbergues();
      setAlbergues(res.features || []);
    } catch (err) {
      console.error('Error cargando albergues:', err);
      showToast('error', 'No se pudieron cargar los albergues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (type, text) => {
    setSaveStatus({ type, text });
    setTimeout(() => setSaveStatus(null), 6000);
  };

  // Geolocalización del albergue más cercano
  const findNearest = () => {
    if (!navigator.geolocation) {
      showToast('error', 'Geolocalización no soportada en este navegador.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await evacuationApi.getAlbergueCercano(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setNearestShelter(res);
          if (res.lat && res.lng) {
            setTargetFly({ lat: res.lat, lon: res.lng, zoom: 16 });
          }
          showToast('success', `Albergue más cercano encontrado: ${res.nombre}`);
        } catch (err) {
          showToast('error', 'No se pudo calcular el albergue cercano.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        showToast('error', 'Se requiere acceso GPS para encontrar el más cercano.');
        setLocating(false);
      }
    );
  };

  // Arrastre interactivo en el mapa principal
  const handleMarkerDragEnd = (albId, nombre) => async (e) => {
    const newPos = e.target.getLatLng();
    const newLat = Number(newPos.lat.toFixed(5));
    const newLon = Number(newPos.lng.toFixed(5));

    // Actualización visual inmediata
    setAlbergues((prev) =>
      prev.map((f) => {
        const fid = f.id || f.properties?.id;
        if (fid === albId) {
          return {
            ...f,
            geometry: {
              ...f.geometry,
              coordinates: [newLon, newLat],
            },
          };
        }
        return f;
      })
    );

    try {
      await evacuationApi.updateAlbergue(albId, { lat: newLat, lon: newLon });
      showToast(
        'success',
        `✅ Albergue "${nombre}" reubicado exitosamente a [${newLat}, ${newLon}] en PostGIS.`
      );
    } catch (err) {
      console.error('Error reubicando albergue:', err);
      showToast('error', `⚠️ Error al guardar nueva ubicación en la base de datos.`);
      loadData(); // Revertir
    }
  };

  // Centrar en el mapa y enfocar
  const focusOnMap = (feature) => {
    setShowMap(true);
    const coords = feature.geometry?.coordinates || [-79.6517, 0.9682];
    setSelectedShelterId(feature.id || feature.properties?.id);
    setTargetFly({ lat: coords[1], lon: coords[0], zoom: 16 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('info', `✋ Arrastra el marcador de "${feature.properties?.nombre}" para moverlo en tierra firme.`);
  };

  // Abrir Modal de Creación
  const openCreateModal = () => {
    setFormData({
      id: null,
      nombre: '',
      direccion: '',
      capacidad_maxima: 250,
      ocupacion_actual: 0,
      contacto_responsable: user?.first_name ? `${user.first_name} (COE)` : 'COE Cantonal Esmeraldas',
      telefono_contacto: user?.telefono || '0991234567',
      lat: 0.9682,
      lon: -79.6517,
      servicios_disponibles: {
        agua_potable: true,
        electricidad: true,
        alimentacion: true,
        atencion_medica: true,
        wifi_conectividad: false,
      },
    });
    setModalType('create');
  };

  // Abrir Modal de Edición
  const openEditModal = (feature) => {
    const p = feature.properties || {};
    const coords = feature.geometry?.coordinates || [-79.6517, 0.9682];
    setFormData({
      id: feature.id || p.id,
      nombre: p.nombre || '',
      direccion: p.direccion || '',
      capacidad_maxima: p.capacidad_maxima || 200,
      ocupacion_actual: p.ocupacion_actual || 0,
      contacto_responsable: p.contacto_responsable || '',
      telefono_contacto: p.telefono_contacto || '',
      lat: Number(coords[1].toFixed(5)),
      lon: Number(coords[0].toFixed(5)),
      servicios_disponibles: p.servicios_disponibles || {
        agua_potable: true,
        electricidad: true,
        alimentacion: true,
        atencion_medica: false,
        wifi_conectividad: false,
      },
    });
    setModalType('edit');
  };

  // Guardar (Crear o Editar)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert('El nombre del albergue es obligatorio.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (modalType === 'create') {
        await evacuationApi.createAlbergue({
          nombre: formData.nombre,
          direccion: formData.direccion,
          capacidad_maxima: Number(formData.capacidad_maxima),
          ocupacion_actual: Number(formData.ocupacion_actual),
          contacto_responsable: formData.contacto_responsable,
          telefono_contacto: formData.telefono_contacto,
          lat: Number(formData.lat),
          lon: Number(formData.lon),
          servicios_disponibles: formData.servicios_disponibles,
        });
        showToast('success', `✅ Albergue "${formData.nombre}" creado exitosamente.`);
      } else if (modalType === 'edit') {
        await evacuationApi.updateAlbergue(formData.id, {
          nombre: formData.nombre,
          direccion: formData.direccion,
          capacidad_maxima: Number(formData.capacidad_maxima),
          ocupacion_actual: Number(formData.ocupacion_actual),
          contacto_responsable: formData.contacto_responsable,
          telefono_contacto: formData.telefono_contacto,
          lat: Number(formData.lat),
          lon: Number(formData.lon),
          servicios_disponibles: formData.servicios_disponibles,
        });
        showToast('success', `✅ Albergue "${formData.nombre}" actualizado correctamente.`);
      }
      setModalType(null);
      await loadData();
    } catch (err) {
      console.error('Error guardando albergue:', err);
      showToast('error', '⚠️ No se pudo guardar la información del albergue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar Albergue
  const handleDelete = async (feature) => {
    const id = feature.id || feature.properties?.id;
    const nombre = feature.properties?.nombre || 'Albergue';
    if (!window.confirm(`¿Está seguro de eliminar permanentemente el albergue "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await evacuationApi.deleteAlbergue(id);
      showToast('success', `🗑️ Albergue "${nombre}" eliminado del sistema.`);
      loadData();
    } catch (err) {
      console.error('Error eliminando albergue:', err);
      showToast('error', 'Error al eliminar el albergue.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* ========================================================================= */}
      {/* NOTIFICACIÓN TOAST FLOTANTE */}
      {/* ========================================================================= */}
      {saveStatus && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[2000] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md border animate-in fade-in duration-300 flex items-center gap-2 ${
          saveStatus.type === 'success'
            ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200 ring-2 ring-emerald-500/30'
            : saveStatus.type === 'info'
            ? 'bg-sky-950/95 border-sky-500/60 text-sky-200 ring-2 ring-sky-500/30'
            : 'bg-red-950/95 border-red-500/60 text-red-200 ring-2 ring-red-500/30'
        }`}>
          <span>{saveStatus.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CABECERA PRINCIPAL CON BOTÓN DE REGISTRAR Y TOGGLES */}
      {/* ========================================================================= */}
      <div className="bg-crisis-800 border border-crisis-700 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide flex flex-wrap items-center gap-2">
                <span>Red de Albergues y Evacuación</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {albergues.length} Albergues Activos
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gestión integral, reubicación satelital en tierra firme, control de aforo y asistencia.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Botón Crear Albergue (Exclusivo Administrador) */}
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex-1 sm:flex-initial justify-center flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Crear Albergue</span>
            </button>
          )}

          {/* Toggle de Mapa Interactivo */}
          <button
            onClick={() => setShowMap(!showMap)}
            className={`flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl border text-xs font-bold transition ${
              showMap
                ? 'bg-sky-600 text-white border-sky-500 shadow-md ring-1 ring-sky-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border-slate-300 dark:bg-crisis-700 dark:hover:bg-crisis-600 dark:text-slate-300 dark:hover:text-white dark:border-crisis-600'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{showMap ? 'Ocultar Mapa' : 'Ver Mapa'}</span>
          </button>

          {/* Buscar Albergue Más Cercano */}
          <button
            onClick={findNearest}
            disabled={locating}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border border-slate-300 dark:bg-crisis-700 dark:hover:bg-crisis-600 dark:text-slate-200 dark:border-crisis-600 text-xs font-bold transition disabled:opacity-50"
            title="Calcular refugio más próximo según GPS"
          >
            <Compass className={`w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'GPS...' : 'Cercano'}</span>
          </button>

          {/* Refrescar */}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 sm:p-2.5 text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:hover:text-white dark:bg-crisis-700 dark:hover:bg-crisis-600 rounded-xl border border-slate-300 dark:border-crisis-600 transition"
            title="Recargar datos desde la base de datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500 dark:text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAPA INTERACTIVO CON REUBICACIÓN POR ARRASTRE DIRECTO (ESRI MAPA DE CALLES) */}
      {/* ========================================================================= */}
      {showMap && (
        <div className="bg-crisis-800 border border-crisis-700 rounded-2xl overflow-hidden shadow-2xl space-y-2">
          {/* Barra de control del mapa */}
          <div className="px-4 py-2.5 bg-crisis-900 border-b border-crisis-700 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-bold text-sky-400 uppercase tracking-wider text-[11px]">
                <Move className="w-3.5 h-3.5" />
                Mapa Interactivo de Reubicación
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                {isAdmin ? '• Arrastra cualquier icono de casa en el mapa para corregir su posición en tierra firme' : '• Visualización en tiempo real de albergues y centros de auxilio'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin ? (
                <button
                  onClick={() => setDragModeActive(!dragModeActive)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    dragModeActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-400/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Sliders className="w-3 h-3" />
                  <span>{dragModeActive ? 'Arrastre Habilitado (Admin)' : 'Solo Lectura'}</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 bg-crisis-800 px-2.5 py-1 rounded-lg border border-crisis-700">
                  Modo Monitoreo COE
                </span>
              )}
            </div>
          </div>

          {/* Contenedor del Mapa Leaflet */}
          <div className="w-full h-80 sm:h-96 relative">
            <MapContainer
              center={[0.9682, -79.6517]}
              zoom={13}
              minZoom={6}
              maxZoom={19}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <MapCameraHandler targetFly={targetFly} />

              {/* Mapa base Esri World Street Map (Sin marcas de agua, alta definición) */}
              <TileLayer
                attribution='&copy; Esri, TomTom'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                keepBuffer={8}
              />

              {/* Marcadores de Albergues Temporales */}
              {albergues.map((feature) => {
                const p = feature.properties || {};
                const albId = feature.id || p.id;
                const coords = feature.geometry?.coordinates || [-79.6517, 0.9682];
                const pct = Math.round((p.ocupacion_actual / (p.capacidad_maxima || 1)) * 100);
                const isSelected = selectedShelterId === albId;

                return (
                  <Marker
                    key={`map-alb-${albId}`}
                    position={[coords[1], coords[0]]}
                    icon={createShelterIcon(pct, isAdmin && dragModeActive, isSelected)}
                    draggable={isAdmin && dragModeActive}
                    eventHandlers={{
                      dragend: handleMarkerDragEnd(albId, p.nombre),
                      click: () => setSelectedShelterId(albId),
                    }}
                  >
                    <Popup>
                      <div className="text-xs space-y-2 min-w-[210px] p-1">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                          <span className="font-extrabold text-white text-sm">{p.nombre}</span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            {pct}%
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{p.direccion || 'Cantón Esmeraldas'}</p>
                        <p className="text-slate-400 font-mono text-[10px]">
                          GPS: {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
                        </p>
                        <div className="flex justify-between text-[11px] text-slate-200">
                          <span>Ocupación: <strong>{p.ocupacion_actual}</strong> / {p.capacidad_maxima}</span>
                          <span className="text-emerald-400 font-bold">{p.capacidad_maxima - p.ocupacion_actual} libres</span>
                        </div>
                        {isAdmin && (
                          <div className="pt-2 border-t border-slate-700/70 flex items-center justify-between gap-1">
                            <button
                              onClick={() => openEditModal(feature)}
                              className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-2 rounded text-[10px] flex items-center justify-center gap-1"
                            >
                              <Edit className="w-3 h-3" /> Editar
                            </button>
                            <button
                              onClick={() => handleDelete(feature)}
                              className="bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-2 rounded text-[10px] flex items-center justify-center"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ALBERGUE DESTACADO MÁS CERCANO (SI SE CONSULTA GPS) */}
      {/* ========================================================================= */}
      {nearestShelter && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 shadow-xl flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
              Refugio con Cupo Más Próximo
            </span>
            <h3 className="text-lg font-extrabold text-white mt-1.5">
              {nearestShelter.nombre}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">{nearestShelter.direccion}</p>
            <p className="text-xs font-semibold text-emerald-400 mt-1.5">
              Cupos Disponibles: {nearestShelter.capacidad_maxima - nearestShelter.ocupacion_actual} personas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${nearestShelter.lat || 0.9682},${nearestShelter.lng || -79.6517}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shrink-0 shadow"
            >
              <Navigation className="w-3.5 h-3.5" /> Cómo llegar
            </a>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUADRÍCULA DE TARJETAS DE ALBERGUES CON ACCIONES DE CRUD Y REUBICACIÓN */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {albergues.map((feature, idx) => {
          const p = feature.properties || {};
          const coords = feature.geometry?.coordinates || [-79.6517, 0.9682];
          const pct = Math.round((p.ocupacion_actual / (p.capacidad_maxima || 1)) * 100);
          const cuposLibres = Math.max(0, p.capacidad_maxima - p.ocupacion_actual);

          return (
            <div
              key={`card-${p.id || idx}`}
              className="bg-crisis-800 border border-crisis-700 hover:border-crisis-600 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition"
            >
              <div className="space-y-3">
                
                {/* Cabecera de tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm line-clamp-1">
                        {p.nombre}
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="line-clamp-1">{p.direccion || 'Cantón Esmeraldas'}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                      cuposLibres > 0
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-300 border-red-500/30'
                    }`}
                  >
                    {cuposLibres > 0 ? `${cuposLibres} libres` : 'Lleno'}
                  </span>
                </div>

                {/* Coordenadas GPS */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono bg-crisis-900/80 px-2.5 py-1.5 rounded-xl border border-crisis-700/60">
                  <span>GPS: {coords[1].toFixed(5)}, {coords[0].toFixed(5)}</span>
                  {isAdmin && (
                    <button
                      onClick={() => focusOnMap(feature)}
                      className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                    >
                      <Move className="w-3 h-3" /> Mover en mapa
                    </button>
                  )}
                </div>

                {/* Barra de Ocupación */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Ocupación: <strong>{p.ocupacion_actual}</strong> / {p.capacidad_maxima}</span>
                    <span className={`font-bold ${pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-crisis-950 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
                    <div
                      className={`h-full transition-all duration-500 ${
                        pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Contacto Responsable */}
                {(p.contacto_responsable || p.telefono_contacto) && (
                  <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1">
                    <span className="truncate text-slate-400">Resp: {p.contacto_responsable || 'COE'}</span>
                    {p.telefono_contacto && (
                      <a
                        href={`tel:${p.telefono_contacto}`}
                        className="flex items-center gap-1 text-sky-400 hover:underline shrink-0"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{p.telefono_contacto}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Botonera de Acciones (Solo Administrador) y Enlace de Ruta */}
              <div className="pt-3 border-t border-crisis-700/80 flex items-center justify-between gap-1.5 text-xs">
                {isAdmin ? (
                  <div className="flex items-center gap-1">
                    {/* Editar */}
                    <button
                      onClick={() => openEditModal(feature)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/40 font-bold text-[11px] transition"
                      title="Modificar nombre, capacidad, ocupación o ubicación"
                    >
                      <Edit className="w-3 h-3" /> Editar
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => handleDelete(feature)}
                      className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/40 transition"
                      title="Eliminar albergue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Albergue Verificado COE
                  </span>
                )}

                {/* Cómo llegar */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-300 hover:text-white font-medium text-[11px] px-2 py-1.5 rounded-lg hover:bg-crisis-700 transition"
                >
                  <Navigation className="w-3 h-3 text-sky-400" /> Ruta
                </a>
              </div>

            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL PARA CREAR O EDITAR ALBERGUE TEMPORAL */}
      {/* ========================================================================= */}
      {modalType && (
        <div className="fixed inset-0 z-[2500] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-crisis-800 border border-crisis-700 w-full max-w-xl rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between border-b border-crisis-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  {modalType === 'create' ? <Plus className="w-5 h-5" /> : <Edit className="w-4 h-4" />}
                </div>
                <h3 className="font-extrabold text-white text-base">
                  {modalType === 'create' ? 'Registrar Nuevo Albergue Temporal' : 'Modificar Albergue'}
                </h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-crisis-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              
              {/* Nombre */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre del Albergue o Refugio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Coliseo Nubia Villacís Díaz"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-crisis-900 border border-crisis-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Dirección / Sector de Esmeraldas</label>
                <input
                  type="text"
                  placeholder="Ej. Calle Pedro Vicente Maldonado y 10 de Agosto"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full bg-crisis-900 border border-crisis-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Capacidad y Ocupación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Capacidad Máxima (Personas) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacidad_maxima}
                    onChange={(e) => setFormData({ ...formData, capacidad_maxima: e.target.value })}
                    className="w-full bg-crisis-900 border border-crisis-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Ocupación Actual (Personas)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ocupacion_actual}
                    onChange={(e) => setFormData({ ...formData, ocupacion_actual: e.target.value })}
                    className="w-full bg-crisis-900 border border-crisis-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Responsable y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contacto / Responsable COE</label>
                  <input
                    type="text"
                    placeholder="Ej. Ing. Juan Pérez (Gestión de Riesgos)"
                    value={formData.contacto_responsable}
                    onChange={(e) => setFormData({ ...formData, contacto_responsable: e.target.value })}
                    className="w-full bg-crisis-900 border border-crisis-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Teléfono Celular de Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej. 0991234567"
                    value={formData.telefono_contacto}
                    onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value })}
                    className="w-full bg-crisis-900 border border-crisis-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Coordenadas GPS y Reubicación */}
              <div className="p-3 bg-crisis-900/90 rounded-xl border border-crisis-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Coordenadas Geográficas (Tierra Firme)
                  </span>
                  <span className="text-[10px] text-slate-400">EPSG:4326 (WGS 84)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Latitud</label>
                    <input
                      type="number"
                      step="0.00001"
                      required
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-crisis-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Longitud</label>
                    <input
                      type="number"
                      step="0.00001"
                      required
                      value={formData.lon}
                      onChange={(e) => setFormData({ ...formData, lon: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-crisis-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                  <Info className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>También puedes arrastrar el marcador directamente en el mapa superior para fijar la ubicación exacta.</span>
                </p>
              </div>

              {/* Botones de acción del formulario */}
              <div className="pt-3 border-t border-crisis-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-crisis-700 hover:bg-crisis-600 text-slate-300 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : modalType === 'create' ? 'Registrar Albergue' : 'Guardar Cambios'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default SheltersPage;
