import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck,
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  MapPin, 
  Users, 
  Flame, 
  Search, 
  Filter, 
  Send, 
  Plus, 
  Trash2,
  BellRing,
  FileCheck,
  Droplets,
  Mountain,
  Bot,
  Megaphone,
  X,
  Lock,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const IncidentCommandPage = () => {
  const { user, isAuthenticated, isAdmin, isGestor, isOperador } = useAuth();
  const canOperate = Boolean(isAdmin || isGestor || isOperador);
  const canManage = Boolean(isAdmin || isGestor);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [incidentes, setIncidentes] = useState([]);
  const [kpis, setKpis] = useState({
    total: 0,
    pendientes: 0,
    en_proceso: 0,
    atendidos: 0,
    descartados: 0,
    criticos: 0,
    por_verificar: 0,
    falsos_positivos: 0,
    personas_atrapadas: 0,
    familias_afectadas: 0,
    tasa_resolucion: 0
  });
  const [loading, setLoading] = useState(true);

  // Parámetros leídos reactivamente de la URL (controlados desde la lista del Sidebar o widgets)
  const statusParam = searchParams.get('estado') || 'TODOS';
  const gravityParam = searchParams.get('gravedad') || 'TODAS';
  const categoryParam = searchParams.get('categoria') || 'TODAS';
  const originParam = searchParams.get('origen') || 'TODOS';
  const verifParam = searchParams.get('verificacion') || 'TODAS';
  const agrupadosParam = searchParams.get('agrupados') === 'true';

  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [gravityFilter, setGravityFilter] = useState(gravityParam);
  const [categoryFilter, setCategoryFilter] = useState(categoryParam);
  const [originFilter, setOriginFilter] = useState(originParam);
  const [verifFilter, setVerifFilter] = useState(verifParam);
  const [groupByZone, setGroupByZone] = useState(agrupadosParam);
  const [zoneRadius, setZoneRadius] = useState(25); // metros (25m por defecto, ampliable a 50m, 100m, 250m, 500m)
  const [collapsedClusters, setCollapsedClusters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Sincronizar estado cuando cambie la URL (navegación desde el menú lateral)
  useEffect(() => {
    setStatusFilter(statusParam);
    setGravityFilter(gravityParam);
    setCategoryFilter(categoryParam);
    setOriginFilter(originParam);
    setVerifFilter(verifParam);
    if (agrupadosParam) {
      setGroupByZone(true);
    }
  }, [searchParams]);

  const toggleClusterCollapsed = (clusterId) => {
    setCollapsedClusters((prev) => ({
      ...prev,
      [clusterId]: !prev[clusterId],
    }));
  };

  // Modal Alerta Sectorial
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [sectorAlert, setSectorAlert] = useState({
    sector: '50 Casas / Ribera del Río Teaone',
    nivel: 'ROJA',
    tipo: 'DESBORDE_INMINENTE',
    mensaje: 'Alerta máxima de evacuación inmediata. Se prevé pico de crecida fluvial en las próximas 2 horas.',
    instrucciones: 'Dirigirse a pie hacia el Coliseo Nubia Villacís Díaz o Unidad Educativa Luis Vargas Torres.'
  });
  const [alertSuccess, setAlertSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, kpisRes] = await Promise.allSettled([
        reportsApi.getReportesTabla(),
        reportsApi.getKPIs()
      ]);

      if (listRes.status === 'fulfilled') {
        setIncidentes(listRes.value || []);
      }
      if (kpisRes.status === 'fulfilled') {
        setKpis(kpisRes.value || {});
      }
    } catch (err) {
      console.error('Error cargando incidentes COE:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Actualizar estado de incidente (Workflow Módulo 3: Operador, Gestor, Admin)
  const handleUpdateStatus = async (id, newStatus) => {
    if (!canOperate) {
      alert('Acción restringida: Se requiere rol de Operador o Gestor del COE para despachar o modificar estados de incidentes.');
      return;
    }
    try {
      await reportsApi.actualizarEstadoReporte(id, { estado: newStatus });
      await loadData();
    } catch (err) {
      alert('Error actualizando estado del incidente: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Validar y Publicar en Mapa (Anti-Falso Positivo)
  const handleAprobarYPublicar = async (id) => {
    if (!canOperate) {
      alert('Acción restringida: Se requiere rol de Operador o Gestor del COE para verificar incidentes.');
      return;
    }
    try {
      await reportsApi.actualizarEstadoReporte(id, {
        publicado_en_mapa: true,
        estado_verificacion: 'CONFIRMADO_COE',
        motivo_verificacion: 'Aprobado y publicado en mapa por Operador COE.'
      });
      await loadData();
    } catch (err) {
      alert('Error publicando reporte: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Descartar reporte como Falso Positivo
  const handleDescartarFalsoPositivo = async (id) => {
    if (!canOperate) {
      alert('Acción restringida: Se requiere rol de Operador o Gestor del COE.');
      return;
    }
    if (window.confirm('¿Confirmas que deseas descartar este reporte como FALSO POSITIVO? Será retirado del mapa del COE.')) {
      try {
        await reportsApi.actualizarEstadoReporte(id, {
          estado: 'DESCARTADO',
          publicado_en_mapa: false,
          estado_verificacion: 'FALSO_POSITIVO',
          motivo_verificacion: 'Descartado manualmente por Operador COE tras verificar falta de evidencias o lluvia.'
        });
        await loadData();
      } catch (err) {
        alert('Error descartando reporte: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleDelete = async (id) => {
    if (!canManage) {
      alert('Acción restringida: Se requiere rol de Gestor o Administrador del COE para eliminar incidentes.');
      return;
    }
    if (window.confirm('¿Confirmas que deseas eliminar permanentemente este incidente del sistema?')) {
      try {
        await reportsApi.eliminarReporte(id);
        await loadData();
      } catch (err) {
        alert('Error eliminando reporte: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleEmitSectorAlert = (e) => {
    e.preventDefault();
    setAlertSuccess(true);
    setTimeout(() => {
      setAlertSuccess(false);
      setShowAlertModal(false);
    }, 2500);
  };

  // Filtrado reactivo en cliente gobernado por estado, gravedad, categoría, verificación y búsqueda
  const filteredList = incidentes.filter((inc) => {
    if (verifFilter === 'POR_VERIFICAR') {
      if (inc.publicado_en_mapa && inc.estado_verificacion !== 'POR_VERIFICAR') return false;
    } else if (verifFilter === 'VERIFICADOS') {
      if (!inc.publicado_en_mapa) return false;
    } else if (verifFilter === 'FALSOS_POSITIVOS') {
      if (inc.estado_verificacion !== 'FALSO_POSITIVO' && inc.estado !== 'DESCARTADO') return false;
    }

    if (statusFilter !== 'TODOS' && inc.estado !== statusFilter) return false;
    if (gravityFilter !== 'TODAS' && inc.nivel_gravedad !== gravityFilter) return false;

    if (categoryFilter !== 'TODAS') {
      const ev = (inc.tipo_evento || '').toUpperCase();
      if (!ev.includes(categoryFilter.toUpperCase())) return false;
    }

    if (originFilter === 'CIUDADANO' && inc.es_simulacion) return false;
    if (originFilter === 'SIMULACION' && !inc.es_simulacion) return false;

    if (searchTerm) {
      const matchText = (
        (inc.descripcion || '') + ' ' + 
        (inc.tipo_evento || '') + ' ' + 
        (inc.usuario_nombre || '') + ' ' +
        (inc.estimacion_danos_vivienda || '') + ' ' +
        (inc.motivo_verificacion || '')
      ).toLowerCase();
      if (!matchText.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  // Cálculo de distancia geográfica en metros (Fórmula de Haversine)
  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Agrupamiento geoespacial reactivo por radio (por defecto 25m, configurable)
  const clusteredData = useMemo(() => {
    const visited = new Set();
    const clusters = [];

    for (let i = 0; i < filteredList.length; i++) {
      const root = filteredList[i];
      if (visited.has(root.id)) continue;

      const group = [root];
      visited.add(root.id);

      const latA = Number(root.latitud ?? root.lat);
      const lonA = Number(root.longitud ?? root.lon ?? root.lng);

      if (!isNaN(latA) && !isNaN(lonA)) {
        for (let j = i + 1; j < filteredList.length; j++) {
          const candidate = filteredList[j];
          if (visited.has(candidate.id)) continue;

          const latB = Number(candidate.latitud ?? candidate.lat);
          const lonB = Number(candidate.longitud ?? candidate.lon ?? candidate.lng);
          if (isNaN(latB) || isNaN(lonB)) continue;

          // Pertenencia al clúster si dista <= zoneRadius respecto a cualquier miembro del grupo
          const isNearby = group.some((member) => {
            const mLat = Number(member.latitud ?? member.lat);
            const mLon = Number(member.longitud ?? member.lon ?? member.lng);
            return getDistanceMeters(mLat, mLon, latB, lonB) <= zoneRadius;
          });

          if (isNearby) {
            group.push(candidate);
            visited.add(candidate.id);
          }
        }
      }

      const isMulti = group.length > 1;
      const avgLat =
        group.reduce((acc, c) => acc + (Number(c.latitud ?? c.lat) || 0), 0) / group.length;
      const avgLon =
        group.reduce((acc, c) => acc + (Number(c.longitud ?? c.lon ?? c.lng) || 0), 0) /
        group.length;

      const totalPersonas = group.reduce(
        (acc, c) => acc + (Number(c.personas_atrapadas) || 0),
        0
      );
      const totalFamilias = group.reduce(
        (acc, c) => acc + (Number(c.familias_afectadas) || 0),
        0
      );
      const hasCritico = group.some((c) => c.nivel_gravedad === 'CRITICO');

      clusters.push({
        id: `cluster-${root.id}`,
        isCluster: isMulti,
        count: group.length,
        items: group,
        center: { lat: avgLat, lon: avgLon },
        radius: zoneRadius,
        totalPersonas,
        totalFamilias,
        hasCritico,
        primaryEvento: group[0].tipo_evento?.replace(/_/g, ' ') || 'Emergencia',
        primarySector:
          group[0].estimacion_danos_vivienda ||
          group[0].descripcion?.substring(0, 60) ||
          'Sector Esmeraldas',
      });
    }

    // Si el usuario navegó por URL con ?agrupados=true, filtrar solo zonas con >=2 incidentes concurrentes
    if (agrupadosParam) {
      return clusters.filter((c) => c.isCluster);
    }

    // En modo Agrupación activo, priorizar clústeres de >=2 reportes arriba
    return clusters.sort((a, b) => {
      if (a.isCluster && !b.isCluster) return -1;
      if (!a.isCluster && b.isCluster) return 1;
      return b.count - a.count;
    });
  }, [filteredList, zoneRadius, agrupadosParam]);

  const hasActiveFilter = 
    statusFilter !== 'TODOS' || 
    gravityFilter !== 'TODAS' || 
    categoryFilter !== 'TODAS' || 
    originFilter !== 'TODOS' || 
    verifFilter !== 'TODAS' ||
    agrupadosParam ||
    groupByZone;

  const getActiveFilterLabel = () => {
    if (agrupadosParam) return `📍 Zonas Agrupadas (Radio ≤ ${zoneRadius}m)`;
    if (groupByZone) return `📍 Modo Agrupado Activo (${zoneRadius}m)`;
    if (verifFilter === 'POR_VERIFICAR') return '⚠️ Retenidos por Verificar';
    if (verifFilter === 'VERIFICADOS') return '✓ Solo Verificados';
    if (verifFilter === 'FALSOS_POSITIVOS') return '❌ Falsos Positivos Descartados';
    if (statusFilter === 'PENDIENTE') return '⏳ Estado: Pendientes';
    if (statusFilter === 'EN_PROCESO') return '🔄 Estado: En Proceso';
    if (statusFilter === 'ATENDIDO') return '✅ Estado: Atendidos';
    if (gravityFilter === 'CRITICO') return '🚨 Nivel Crítico';
    if (categoryFilter === 'INUNDACION') return '🌊 Inundaciones / Ríos';
    if (categoryFilter === 'DESLAVE') return '⚠️ Deslaves / Deslizamientos';
    if (originFilter === 'CIUDADANO') return '📢 Reportes Ciudadanos';
    if (originFilter === 'SIMULACION') return '🤖 Simulaciones IA COE';
    return 'Filtro Personalizado';
  };

  const getVerificacionBadge = (inc) => {
    if (inc.estado_verificacion === 'FALSO_POSITIVO' || inc.estado === 'DESCARTADO') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-red-100 text-red-950 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40 shadow-sm">
          ❌ Falso Positivo Descartado
        </span>
      );
    }
    if (!inc.publicado_en_mapa || inc.estado_verificacion === 'POR_VERIFICAR') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 shadow-sm animate-pulse">
          ⚠️ Por Verificar • {inc.score_verosimilitud ?? 30}% Confianza
        </span>
      );
    }
    if (inc.estado_verificacion === 'CONFIRMADO_COE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 shadow-sm">
          🛡️ Confirmado por COE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 shadow-sm">
        ✓ Verificado Auto • {inc.score_verosimilitud ?? 70}% Confianza
      </span>
    );
  };

  const getGravedadBadge = (gravedad) => {
    switch (gravedad) {
      case 'CRITICO':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-red-100 text-red-950 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40 animate-pulse shadow-sm">
            Crítico
          </span>
        );
      case 'ALTO':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 shadow-sm">
            Alto
          </span>
        );
      case 'MEDIO':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-yellow-100 text-yellow-950 border border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40 shadow-sm">
            Medio
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 shadow-sm">
            Bajo
          </span>
        );
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Pendiente
          </span>
        );
      case 'EN_PROCESO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-spin" /> En Proceso
          </span>
        );
      case 'ATENDIDO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Atendido
          </span>
        );
      case 'DESCARTADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> Descartado
          </span>
        );
      default:
        return null;
    }
  };

  const handleVerEnMapa = (inc) => {
    const lat = inc.latitud || (inc.geometry?.coordinates ? inc.geometry.coordinates[1] : (inc.lat || 0.9682));
    const lon = inc.longitud || (inc.geometry?.coordinates ? inc.geometry.coordinates[0] : (inc.lon || inc.lng || -79.6517));
    navigate(`/?focusIncident=${inc.id}&lat=${lat}&lon=${lon}`);
  };

  // Renderizado unificado de tarjeta de incidente (funciona tanto para tarjetas individuales como dentro de clústeres)
  const renderIncidentCard = (inc, clusterIndex = null, clusterTotal = null) => (
    <div
      key={inc.id}
      className="bg-white dark:bg-crisis-800 border-2 border-slate-200 dark:border-crisis-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-2xl p-5 transition shadow-sm space-y-3.5"
    >
      {/* Sub-cabecera si es parte de un clúster de zona concurrente */}
      {clusterTotal > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 px-3 py-1.5 rounded-xl text-xs -mt-1 mb-1">
          <span className="font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Reporte #{clusterIndex + 1} de {clusterTotal} en esta zona (&lt; {zoneRadius}m)</span>
          </span>
          <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 font-bold">
            GPS: {Number(inc.latitud || 0).toFixed(5)}, {Number(inc.longitud || 0).toFixed(5)}
          </span>
        </div>
      )}

      {/* Fila Superior: Badges y Fecha */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {getEstadoBadge(inc.estado)}
          {getGravedadBadge(inc.nivel_gravedad)}
          {getVerificacionBadge(inc)}

          {inc.es_simulacion ? (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-950 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40 shadow-sm">
              🤖 Simulación IA COE
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 shadow-sm">
              📢 Reporte Ciudadano
            </span>
          )}

          <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-crisis-900 px-2 py-0.5 rounded border border-slate-200 dark:border-crisis-700">
            ID: {inc.id.substring(0, 8)}
          </span>
        </div>

        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {new Date(inc.fecha_incidente).toLocaleString()}
        </div>
      </div>

      {/* Contenido Central: Tipo y Descripción de Alto Contraste */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        <div className="lg:col-span-3 space-y-2">
          <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>{inc.tipo_evento.replace(/_/g, ' ')}</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            {inc.descripcion}
          </p>

          {inc.estimacion_danos_vivienda && (
            <div className="text-xs text-slate-800 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <strong>Daños reportados:</strong> {inc.estimacion_danos_vivienda}
            </div>
          )}

          {/* Panel de Auditoría Anti-Falso Positivo & Coherencia Hidrometeorológica */}
          <div className={`p-3 rounded-xl border text-xs space-y-2 mt-2 transition ${
            !inc.publicado_en_mapa || inc.estado_verificacion === 'POR_VERIFICAR'
              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50'
              : inc.estado_verificacion === 'FALSO_POSITIVO'
              ? 'bg-red-50/70 dark:bg-red-950/20 border-red-300 dark:border-red-700/50'
              : 'bg-slate-50 dark:bg-crisis-900/60 border-slate-200 dark:border-crisis-700/60'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 border-b border-slate-200/80 dark:border-crisis-700/60">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                {inc.estado_verificacion === 'FALSO_POSITIVO' ? (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                ) : !inc.publicado_en_mapa ? (
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>Auditoría de Verosimilitud & Coherencia Satelital</span>
              </div>
              
              {inc.publicado_en_mapa ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40">
                  🟢 Visible en Mapa Ciudadano
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 animate-pulse">
                  🔴 Retenido (Oculto del Mapa hasta revisión COE)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              {/* Score Verosimilitud */}
              <div className="bg-white/80 dark:bg-crisis-800/80 p-2 rounded-lg border border-slate-200 dark:border-crisis-700">
                <div className="flex items-center justify-between font-bold text-slate-600 dark:text-slate-400">
                  <span>Verosimilitud IA:</span>
                  <span className={`font-black text-xs ${
                    (inc.score_verosimilitud ?? 70) >= 70
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : (inc.score_verosimilitud ?? 70) >= 40
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {inc.score_verosimilitud ?? 70}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-crisis-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (inc.score_verosimilitud ?? 70) >= 70
                        ? 'bg-emerald-500'
                        : (inc.score_verosimilitud ?? 70) >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, inc.score_verosimilitud ?? 70))}%` }}
                  />
                </div>
              </div>

              {/* Lluvia Histórica Open-Meteo */}
              <div className="bg-white/80 dark:bg-crisis-800/80 p-2 rounded-lg border border-slate-200 dark:border-crisis-700">
                <span className="block font-bold text-slate-600 dark:text-slate-400">Lluvia Satelital (±1h):</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {Number(inc.lluvia_verificada_mm || 0).toFixed(1)} mm/h
                  </span>
                  <span className="text-[10px] text-slate-500">(Open-Meteo)</span>
                </div>
              </div>

              {/* Desfase Temporal / Modo Offline */}
              <div className="bg-white/80 dark:bg-crisis-800/80 p-2 rounded-lg border border-slate-200 dark:border-crisis-700">
                <span className="block font-bold text-slate-600 dark:text-slate-400">Desfase Recepción:</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {Number(inc.desfase_horas || 0) < 0.1 ? 'Tiempo real' : `${Number(inc.desfase_horas || 0).toFixed(1)} h desfase`}
                  </span>
                  {Number(inc.desfase_horas || 0) >= 1.5 && (
                    <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1 rounded">
                      Offline
                    </span>
                  )}
                </div>
              </div>
            </div>

            {inc.motivo_verificacion && (
              <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-crisis-800/90 p-2 rounded-lg border border-slate-200 dark:border-crisis-700 mt-1">
                <span className="font-black text-slate-900 dark:text-white">Diagnóstico Verificador: </span>
                {inc.motivo_verificacion}
              </div>
            )}
          </div>
        </div>

        {/* Métricas del Incidente: Alto Contraste */}
        <div className="bg-slate-100 dark:bg-crisis-900/90 p-3.5 rounded-xl border border-slate-300 dark:border-crisis-700 text-xs space-y-2 shadow-sm">
          <div className="flex justify-between items-center text-slate-800 dark:text-slate-300 font-bold">
            <span>Personas atrapadas:</span>
            <span className="font-black text-sm text-red-700 dark:text-red-400">{inc.personas_atrapadas}</span>
          </div>
          <div className="flex justify-between items-center text-slate-800 dark:text-slate-300 font-bold">
            <span>Familias afectadas:</span>
            <span className="font-black text-sm text-amber-800 dark:text-amber-400">{inc.familias_afectadas}</span>
          </div>

          {/* Cruce Geoespacial PostGIS con Familias Censadas */}
          {(Number(inc.familias_en_perimetro) > 0 || Number(inc.personas_afectadas_estimadas) > 0) && (
            <div className="pt-2 border-t border-purple-300 dark:border-purple-800/70 space-y-1">
              <div className="flex justify-between items-center text-purple-950 dark:text-purple-300 font-black text-[11px]">
                <span>Perímetro PostGIS ({Math.round(inc.radio_analisis_metros || 25)}m):</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-900/60 text-purple-950 dark:text-purple-200">
                  {inc.personas_afectadas_estimadas} personas ({inc.familias_en_perimetro} fam.)
                </span>
              </div>
              {(Number(inc.ninos_en_riesgo) > 0 || Number(inc.adultos_mayores_riesgo) > 0 || Number(inc.discapacitados_riesgo) > 0) && (
                <p className="text-[10px] text-purple-900 dark:text-purple-300 font-bold">
                  • {inc.ninos_en_riesgo || 0} niños &lt;5 | {inc.adultos_mayores_riesgo || 0} ancianos | {inc.discapacitados_riesgo || 0} disc.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center text-slate-700 dark:text-slate-400 text-xs pt-1.5 border-t border-slate-300 dark:border-crisis-700 font-semibold">
            <span>Informante:</span>
            <span className="truncate max-w-[120px] font-bold text-slate-900 dark:text-white">{inc.usuario_nombre}</span>
          </div>
        </div>
      </div>

      {/* Barra de Acciones y Transición de Estados (Workflow COE) */}
      <div className="pt-3 border-t border-slate-200 dark:border-crisis-700/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleVerEnMapa(inc)}
            className="w-full sm:w-auto justify-center px-3 py-1.5 text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 rounded-lg border border-sky-300 dark:border-sky-500/30 flex items-center gap-1.5 transition shadow-sm"
            title="Ver coordenadas en el mapa satelital"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Ver en Mapa</span>
          </button>
        </div>

        {/* Botones de Cambio de Estado con Alto Contraste (Operador / Gestor / Admin) */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Acciones de Validación Anti-Falsos Positivos */}
          {(!inc.publicado_en_mapa || inc.estado_verificacion === 'POR_VERIFICAR') && (
            <button
              onClick={() => handleAprobarYPublicar(inc.id)}
              disabled={!canOperate}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 shadow ${
                canOperate
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 cursor-pointer'
                  : 'bg-slate-200 dark:bg-crisis-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-crisis-600 opacity-60'
              }`}
              title={canOperate ? 'Aprobar reporte retenido y publicarlo en el mapa en vivo' : 'Acción restringida: Requiere cuenta Operador o Gestor del COE'}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Aprobar y Publicar</span>
              {!canOperate && <Lock className="w-3 h-3 ml-0.5 text-slate-400" />}
            </button>
          )}

          {inc.estado_verificacion !== 'FALSO_POSITIVO' && inc.estado !== 'DESCARTADO' && (
            <button
              onClick={() => handleDescartarFalsoPositivo(inc.id)}
              disabled={!canOperate}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1 border ${
                canOperate
                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/60 dark:hover:bg-red-900/50 cursor-pointer shadow-sm'
                  : 'bg-slate-100 dark:bg-crisis-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-crisis-700 cursor-not-allowed opacity-60'
              }`}
              title={canOperate ? 'Marcar como falso positivo (descartar y ocultar del mapa)' : 'Acción restringida: Requiere cuenta Operador o Gestor del COE'}
            >
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span>Falso Positivo</span>
              {!canOperate && <Lock className="w-3 h-3 ml-0.5 text-slate-400" />}
            </button>
          )}

          {inc.estado === 'PENDIENTE' && (
            <button
              onClick={() => handleUpdateStatus(inc.id, 'EN_PROCESO')}
              disabled={!canOperate}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 shadow ${
                canOperate
                  ? 'bg-sky-600 hover:bg-sky-500 text-white active:scale-95 cursor-pointer'
                  : 'bg-slate-200 dark:bg-crisis-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-crisis-600 opacity-60'
              }`}
              title={canOperate ? 'Despachar auxilio al incidente' : 'Acción restringida: Requiere cuenta Operador o Gestor del COE'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Despachar / En Proceso</span>
              {!canOperate && <Lock className="w-3 h-3 ml-0.5 text-slate-400" />}
            </button>
          )}

          {inc.estado === 'EN_PROCESO' && (
            <button
              onClick={() => handleUpdateStatus(inc.id, 'ATENDIDO')}
              disabled={!canOperate}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 shadow ${
                canOperate
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 cursor-pointer'
                  : 'bg-slate-200 dark:bg-crisis-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-crisis-600 opacity-60'
              }`}
              title={canOperate ? 'Marcar caso como atendido' : 'Acción restringida: Requiere cuenta Operador o Gestor del COE'}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Marcar Atendido</span>
              {!canOperate && <Lock className="w-3 h-3 ml-0.5 text-slate-400" />}
            </button>
          )}

          {inc.estado === 'ATENDIDO' && (
            <button
              onClick={() => handleUpdateStatus(inc.id, 'EN_PROCESO')}
              disabled={!canOperate}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow ${
                canOperate
                  ? 'bg-slate-800 hover:bg-slate-700 text-white active:scale-95 cursor-pointer'
                  : 'bg-slate-200 dark:bg-crisis-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-crisis-600 opacity-60'
              }`}
              title={canOperate ? 'Reabrir caso' : 'Acción restringida: Requiere cuenta Operador o Gestor del COE'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reabrir Caso</span>
              {!canOperate && <Lock className="w-3 h-3 ml-0.5 text-slate-400" />}
            </button>
          )}

          {inc.estado !== 'DESCARTADO' && (
            <button
              onClick={() => handleUpdateStatus(inc.id, 'DESCARTADO')}
              disabled={!canOperate}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                canOperate
                  ? 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border-slate-300 dark:bg-crisis-700 dark:text-slate-300 dark:border-crisis-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 cursor-pointer'
                  : 'bg-slate-100 dark:bg-crisis-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-crisis-700 cursor-not-allowed opacity-60'
              }`}
              title={canOperate ? 'Descartar reporte no verificado o duplicado' : 'Acción restringida: Requiere cuenta Operador o Gestor del COE'}
            >
              <span>Descartar</span>
              {!canOperate && <Lock className="w-3 h-3 inline ml-1 text-slate-400" />}
            </button>
          )}

          {/* Eliminar (Exclusivo Gestor / Administrador) */}
          {canManage && (
            <button
              onClick={() => handleDelete(inc.id)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-crisis-700 dark:hover:text-red-400 rounded-lg transition"
              title="Eliminar reporte de la base de datos (Gestor / Admin)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* CABECERA PRINCIPAL: CENTRO DE OPERACIONES Y GESTIÓN */}
      <div className="bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-500/20 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40">
                Comando COE • Sala de Situación
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-extrabold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                En Vivo (WebSockets)
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Centro de Operaciones y Gestión de Alertas
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              Seguimiento unificado de emergencias, clasificación por gravedad y gestión de alertas sectoriales.
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setShowAlertModal(true)}
            disabled={!canManage}
            className={`flex-1 sm:flex-initial justify-center px-4 py-2 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition ${
              canManage
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white active:scale-95 cursor-pointer'
                : 'bg-slate-200 dark:bg-crisis-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-crisis-600 opacity-70'
            }`}
            title={canManage ? 'Emitir alerta sectorial' : 'Solo Gestores y Administradores del COE pueden emitir alertas sectoriales'}
          >
            {canManage ? <BellRing className="w-4 h-4 shrink-0" /> : <Lock className="w-4 h-4 shrink-0" />}
            <span>Emitir Alerta Sectorial</span>
            {!canManage && (
              <span className="text-[10px] ml-1 px-1.5 py-0.2 rounded bg-slate-300 dark:bg-crisis-600 text-slate-600 dark:text-slate-300 font-semibold">
                Solo Gestor
              </span>
            )}
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-crisis-700 dark:hover:bg-crisis-600 text-slate-800 dark:text-white rounded-xl border border-slate-300 dark:border-crisis-600 transition"
            title="Refrescar incidentes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600 dark:text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Banner informativo de modo consulta para Ciudadano / No Operador */}
      {!canOperate && (
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 p-3 sm:p-3.5 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Modo Consulta (Invitado / Ciudadano):</p>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                Puedes visualizar el estado de las emergencias y ubicarlas en el radar en vivo. El despacho de auxilio y cambio de estados operativos requieren autenticación como Operador o Gestor del COE.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs shrink-0 transition shadow-sm"
          >
            Iniciar Sesión COE
          </button>
        </div>
      )}

      {/* CENTRO DE CONTROL SIMPLIFICADO A SOLO WIDGETS INTERACTIVOS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-3.5">
        {/* Total */}
        <div
          onClick={() => setSearchParams({})}
          className={`bg-white dark:bg-crisis-800 border-2 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-1.5 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98] ${
            !hasActiveFilter
              ? 'border-sky-500 ring-2 ring-sky-400/40 bg-sky-50/60 dark:bg-sky-500/10'
              : 'border-slate-200 dark:border-crisis-700 hover:border-slate-400 dark:hover:border-slate-500'
          }`}
          title="Ver todos los incidentes"
        >
          <div className="flex items-center justify-between text-xs text-slate-800 dark:text-slate-300 font-bold uppercase tracking-wider">
            <span>Total</span>
            <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">{kpis.total || 0}</p>
          <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold block">100% registros</span>
        </div>

        {/* Por Verificar (Anti-Falsos Positivos) */}
        <div
          onClick={() => setSearchParams({ verificacion: 'POR_VERIFICAR' })}
          className={`bg-white dark:bg-crisis-800 border-2 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-1.5 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98] ${
            verifFilter === 'POR_VERIFICAR'
              ? 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/60 dark:bg-amber-500/10'
              : 'border-amber-200 dark:border-amber-500/30 hover:border-amber-400'
          }`}
          title="Filtrar incidentes retenidos por falta de lluvia o sincronización offline diferida"
        >
          <div className="flex items-center justify-between text-xs text-amber-900 dark:text-amber-400 font-bold uppercase tracking-wider">
            <span>Por Verificar</span>
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{kpis.por_verificar || 0}</p>
          <span className="text-[11px] text-amber-950 dark:text-amber-300 font-bold block">Filtro Anti-Falso</span>
        </div>

        {/* Pendientes */}
        <div
          onClick={() => setSearchParams({ estado: 'PENDIENTE' })}
          className={`bg-white dark:bg-crisis-800 border-2 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-1.5 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98] ${
            statusFilter === 'PENDIENTE'
              ? 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/60 dark:bg-amber-500/10'
              : 'border-amber-200 dark:border-amber-500/30 hover:border-amber-400'
          }`}
          title="Filtrar incidentes pendientes"
        >
          <div className="flex items-center justify-between text-xs text-amber-900 dark:text-amber-400 font-bold uppercase tracking-wider">
            <span>Pendientes</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{kpis.pendientes || 0}</p>
          <span className="text-[11px] text-amber-950 dark:text-amber-300 font-bold block">Por asignar auxilio</span>
        </div>

        {/* En Proceso */}
        <div
          onClick={() => setSearchParams({ estado: 'EN_PROCESO' })}
          className={`bg-white dark:bg-crisis-800 border-2 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-1.5 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98] ${
            statusFilter === 'EN_PROCESO'
              ? 'border-sky-500 ring-2 ring-sky-400/40 bg-sky-50/60 dark:bg-sky-500/10'
              : 'border-sky-200 dark:border-sky-500/30 hover:border-sky-400'
          }`}
          title="Filtrar incidentes en proceso"
        >
          <div className="flex items-center justify-between text-xs text-sky-900 dark:text-sky-400 font-bold uppercase tracking-wider">
            <span>En Proceso</span>
            <RefreshCw className="w-4 h-4 text-sky-600 dark:text-sky-400 animate-spin" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">{kpis.en_proceso || 0}</p>
          <span className="text-[11px] text-sky-950 dark:text-sky-300 font-bold block">Equipos en sitio</span>
        </div>

        {/* Atendidos */}
        <div
          onClick={() => setSearchParams({ estado: 'ATENDIDO' })}
          className={`bg-white dark:bg-crisis-800 border-2 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-1.5 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98] ${
            statusFilter === 'ATENDIDO'
              ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/60 dark:bg-emerald-500/10'
              : 'border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-400'
          }`}
          title="Filtrar incidentes atendidos"
        >
          <div className="flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-400 font-bold uppercase tracking-wider">
            <span>Atendidos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{kpis.atendidos || 0}</p>
          <span className="text-[11px] text-emerald-950 dark:text-emerald-300 font-bold block">{kpis.tasa_resolucion || 0}% resolución</span>
        </div>

        {/* Críticos */}
        <div
          onClick={() => setSearchParams({ gravedad: 'CRITICO' })}
          className={`bg-white dark:bg-crisis-800 border-2 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-1.5 cursor-pointer transition hover:scale-[1.02] active:scale-[0.98] ${
            gravityFilter === 'CRITICO'
              ? 'border-red-500 ring-2 ring-red-400/40 bg-red-50/60 dark:bg-red-500/10'
              : 'border-red-200 dark:border-red-500/30 hover:border-red-400'
          }`}
          title="Filtrar incidentes de nivel crítico"
        >
          <div className="flex items-center justify-between text-xs text-red-900 dark:text-red-400 font-bold uppercase tracking-wider">
            <span>Nivel Crítico</span>
            <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">{kpis.criticos || 0}</p>
          <span className="text-[11px] text-red-950 dark:text-red-300 font-bold block">Riesgo inminente</span>
        </div>

        {/* Población en Riesgo */}
        <div
          className="bg-white dark:bg-crisis-800 border-2 border-purple-200 dark:border-purple-500/30 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs text-purple-900 dark:text-purple-400 font-bold uppercase tracking-wider">
            <span>Población</span>
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {kpis.personas_atrapadas || 0}
          </p>
          <span className="text-[11px] text-purple-950 dark:text-purple-300 font-bold block truncate">{kpis.familias_afectadas || 0} fam. afectadas</span>
        </div>
      </div>

      {/* BARRA SIMPLIFICADA: INDICADOR DE FILTRO ACTIVO, AGRUPACIÓN POR ZONA Y BÚSQUEDA */}
      <div className="bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 p-3 sm:p-3.5 rounded-xl shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-800 dark:text-slate-300 font-bold flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Filtro activo:</span>
          </span>

          {hasActiveFilter ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-lg text-xs font-black bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40 flex items-center gap-1 shadow-sm">
                {getActiveFilterLabel()}
              </span>
              <button
                onClick={() => {
                  setSearchParams({});
                  setGroupByZone(false);
                  setSearchTerm('');
                }}
                className="px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-red-700 dark:hover:text-red-400 bg-slate-100 dark:bg-crisis-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-slate-300 dark:border-crisis-600 transition flex items-center gap-1 shadow-sm"
                title="Quitar filtros y mostrar todos los incidentes"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ver Todos</span>
              </button>
            </div>
          ) : (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 dark:bg-crisis-700 dark:text-slate-200 border border-slate-200 dark:border-crisis-600">
              Mostrando Todos ({incidentes.length})
            </span>
          )}

          {/* Controles de Agrupación Geoespacial por Zona (Radio 25m ampliable) */}
          <div className="flex items-center gap-1.5 pl-0 sm:pl-2">
            <button
              onClick={() => {
                if (agrupadosParam) {
                  setSearchParams({});
                  setGroupByZone(false);
                } else {
                  setGroupByZone(!groupByZone);
                }
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm border cursor-pointer ${
                groupByZone || agrupadosParam
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-700 shadow ring-2 ring-indigo-400/40'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-crisis-700 dark:text-slate-200 dark:hover:bg-crisis-600 border-slate-300 dark:border-crisis-600'
              }`}
              title="Activar o desactivar agrupación de incidentes por zona de proximidad"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{groupByZone || agrupadosParam ? '📍 Agrupado por Zona' : 'Agrupar por Zona'}</span>
            </button>

            {(groupByZone || agrupadosParam) && (
              <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-lg border border-indigo-300 dark:border-indigo-800 text-xs">
                <span className="font-bold text-indigo-950 dark:text-indigo-300 text-[11px]">Radio:</span>
                <select
                  value={zoneRadius}
                  onChange={(e) => setZoneRadius(Number(e.target.value))}
                  className="bg-white dark:bg-crisis-800 text-slate-900 dark:text-white font-bold text-xs rounded border border-indigo-300 dark:border-indigo-700 px-1.5 py-0.5 focus:outline-none cursor-pointer"
                >
                  <option value={25}>25 m (Mismo perímetro / Vecinos)</option>
                  <option value={50}>50 m (Media cuadra / 50m)</option>
                  <option value={100}>100 m (Manzana completa / 100m)</option>
                  <option value={250}>250 m (Sector barrial / 250m)</option>
                  <option value={500}>500 m (Macro-zona / 500m)</option>
                </select>
              </div>
            )}
          </div>

          <span className="text-xs text-slate-700 dark:text-slate-400 font-bold pl-1 hidden xl:inline">
            • {(groupByZone || agrupadosParam) ? `${clusteredData.length} grupos (${filteredList.length} incidentes)` : `${filteredList.length} mostrados`}
          </span>
        </div>

        {/* Buscador de Incidentes */}
        <div className="relative w-full lg:w-auto lg:min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por sector, evento o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-crisis-900 border border-slate-300 dark:border-crisis-600 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* LISTADO DE SEGUIMIENTO DE INCIDENTES (CON ALTO CONTRASTE Y LEGIBILIDAD) */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 bg-white dark:bg-crisis-800 rounded-2xl border border-slate-200 dark:border-crisis-700 space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-sky-600 dark:text-sky-400 animate-spin" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Cargando incidentes y estadísticas del COE...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-crisis-800 rounded-2xl border border-slate-200 dark:border-crisis-700 space-y-2">
            <FileCheck className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500" />
            <p className="text-base font-extrabold text-slate-900 dark:text-white">No hay incidentes con los filtros seleccionados.</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Intenta seleccionar otra categoría en el menú lateral o hacer clic en "Ver Todos".</p>
          </div>
        ) : (groupByZone || agrupadosParam) ? (
          clusteredData.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-crisis-800 rounded-2xl border border-slate-200 dark:border-crisis-700 space-y-2">
              <FileCheck className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500" />
              <p className="text-base font-extrabold text-slate-900 dark:text-white">No hay incidentes concurrentes agrupados en un radio de {zoneRadius}m.</p>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Puedes ampliar el radio de búsqueda o hacer clic en "Ver Todos".</p>
            </div>
          ) : (
            clusteredData.map((cluster) => {
              if (cluster.isCluster) {
                const isCollapsed = Boolean(collapsedClusters[cluster.id]);
                return (
                  <div
                    key={cluster.id}
                    className="bg-slate-50/90 dark:bg-crisis-900/70 border-2 border-indigo-300 dark:border-indigo-600/50 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 transition"
                  >
                    {/* Separador / Encabezado de Zona Agrupada (Clúster Geoespacial) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-indigo-200 dark:border-indigo-800/60">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-indigo-600 text-white flex items-center gap-1.5 shadow-sm">
                            <Layers className="w-4 h-4 animate-pulse" />
                            <span>Zona Agrupada • {cluster.count} Reportes Concurrentes</span>
                          </span>
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-950 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                            Radio de vecindad ≤ {zoneRadius}m
                          </span>
                          {cluster.hasCritico && (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase bg-red-100 text-red-950 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40 animate-pulse">
                              🚨 Nivel Crítico en la Zona
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white flex items-center gap-2 pt-1">
                          <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>{cluster.primaryEvento}</span>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            (GPS Centro: {cluster.center.lat.toFixed(5)}, {cluster.center.lon.toFixed(5)})
                          </span>
                        </h3>
                      </div>

                      {/* Métricas consolidadas de la zona y botón desplegable */}
                      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                        <div className="text-xs bg-white dark:bg-crisis-800 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 shadow-sm">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Total Zona: <strong className="text-red-600 dark:text-red-400">{cluster.totalPersonas} personas</strong> • <strong className="text-amber-600 dark:text-amber-400">{cluster.totalFamilias} fam.</strong>
                          </span>
                        </div>

                        <button
                          onClick={() => toggleClusterCollapsed(cluster.id)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow active:scale-95 cursor-pointer whitespace-nowrap"
                          title={isCollapsed ? 'Ver los reportes individuales de este clúster' : 'Ocultar los reportes individuales de este clúster'}
                        >
                          <span>{isCollapsed ? `Desplegar ${cluster.count} Incidentes` : `Ocultar ${cluster.count} Incidentes`}</span>
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Listado Desplegable con cada Incidente Individual */}
                    {!isCollapsed && (
                      <div className="space-y-3.5 pt-1 pl-1 sm:pl-3 border-l-4 border-indigo-400 dark:border-indigo-600">
                        <div className="text-xs font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
                          <span>📋 Detalle de cada reporte ciudadano registrado en esta misma zona (&lt; {zoneRadius}m):</span>
                        </div>
                        {cluster.items.map((inc, idx) => renderIncidentCard(inc, idx, cluster.count))}
                      </div>
                    )}
                  </div>
                );
              }
              return renderIncidentCard(cluster.items[0]);
            })
          )
        ) : (
          filteredList.map((inc) => renderIncidentCard(inc))
        )}
      </div>

      {/* MODAL DE EMISIÓN DE ALERTA SECTORIAL (MÓDULO 3) */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-sm uppercase">
                <BellRing className="w-5 h-5 animate-bounce" />
                <span>Emisor de Alerta Temprana Sectorial</span>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {alertSuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-center space-y-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400" />
                <p className="font-bold text-sm">¡Alerta Difundida con Éxito!</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Notificación enviada a la Red de Respuesta y Módulo de Monitoreo.</p>
              </div>
            ) : (
              <form onSubmit={handleEmitSectorAlert} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-800 dark:text-slate-300 font-semibold">Sector o Barrio Afectado</label>
                  <input
                    type="text"
                    required
                    value={sectorAlert.sector}
                    onChange={(e) => setSectorAlert({ ...sectorAlert, sector: e.target.value })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-800 dark:text-slate-300 font-semibold">Nivel de Alerta</label>
                    <select
                      value={sectorAlert.nivel}
                      onChange={(e) => setSectorAlert({ ...sectorAlert, nivel: e.target.value })}
                      className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="ROJA">🔴 ALERTA ROJA (Evacuación)</option>
                      <option value="NARANJA">🟠 ALERTA NARANJA (Preparación)</option>
                      <option value="AMARILLA">🟡 ALERTA AMARILLA (Monitoreo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-800 dark:text-slate-300 font-semibold">Tipo de Amenaza</label>
                    <select
                      value={sectorAlert.tipo}
                      onChange={(e) => setSectorAlert({ ...sectorAlert, tipo: e.target.value })}
                      className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="DESBORDE_INMINENTE">Desborde Fluvial Río Teaone</option>
                      <option value="DESLIZAMIENTO_MASIVO">Deslizamiento de Talud</option>
                      <option value="LLUVIA_TORRENCIAL">Precipitación Crítica &gt;100mm</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-800 dark:text-slate-300 font-semibold">Mensaje Oficial a la Población</label>
                  <textarea
                    rows="2"
                    required
                    value={sectorAlert.mensaje}
                    onChange={(e) => setSectorAlert({ ...sectorAlert, mensaje: e.target.value })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-800 dark:text-slate-300 font-semibold">Instrucciones de Evacuación / Albergue Asignado</label>
                  <textarea
                    rows="2"
                    required
                    value={sectorAlert.instrucciones}
                    onChange={(e) => setSectorAlert({ ...sectorAlert, instrucciones: e.target.value })}
                    className="w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAlertModal(false)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow flex items-center gap-1.5 active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Transmitir Alerta</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
export default IncidentCommandPage;

