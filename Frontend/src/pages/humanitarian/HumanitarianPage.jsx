import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Package, 
  Users, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  Boxes,
  Building2,
  Edit,
  Trash2,
  Phone,
  MapPin,
  ShieldCheck,
  Plus,
  X,
  RefreshCw,
  Search,
  Lock,
  Eye,
  ChevronRight,
  LogIn,
  Home,
  Calendar,
  UserCheck,
  Clock,
  PhoneCall,
  Navigation,
  Truck,
  List,
  LayoutGrid,
  MessageSquare
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { humanitarianApi } from '../../api/humanitarianApi';
import { useAuth } from '../../context/AuthContext';

export const HumanitarianPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    user, 
    isAuthenticated, 
    isAdmin: authIsAdmin, 
    isGestor: authIsGestor, 
    isOperador: authIsOperador,
    isDigitalizador: authIsDigitalizador,
    canRegisterCenso: authCanRegisterCenso,
    canManageSupplies: authCanManageSupplies
  } = useAuth();

  // Matriz de Roles Humanitarios y Censales
  const userRole = (user?.rol || user?.properties?.rol || '').toUpperCase();
  const userName = (user?.username || user?.properties?.username || '').toLowerCase();
  
  const matchR = (...targets) => targets.some((t) => userRole === t || userRole.includes(t));

  const isMasterAdmin = Boolean(
    authIsAdmin || 
    matchR('ADMIN', 'COE', 'SUPERUSER') || 
    userName === 'admin' || 
    user?.is_superuser
  );
  const isGestor = Boolean(isMasterAdmin || authIsGestor || matchR('GESTOR', 'DIRECTOR'));
  const isOperador = Boolean(isGestor || authIsOperador || matchR('OPERADOR'));
  const isDigitalizador = Boolean(isMasterAdmin || isGestor || isOperador || authIsDigitalizador || matchR('DIGITALIZADOR', 'CENSO', 'CENSADOR'));

  // Tanto el Administrador como el Operador, Gestor y Digitalizador pueden registrar y consultar el censo:
  const canRegisterCenso = Boolean(isAuthenticated && (isMasterAdmin || isGestor || isOperador || isDigitalizador || authCanRegisterCenso));
  // Solo Administrador, Gestor, Operador y Digitalizador pueden ver los datos sensibles (cédula y teléfono) sin efecto blur:
  const canViewSensitiveCensoData = Boolean(isAuthenticated && (isMasterAdmin || isGestor || isOperador || isDigitalizador || authCanRegisterCenso));
  // Gestión de suministros (bodegas y kits): Administrador, Gestor y Operador
  const canManageSupplies = Boolean(isAuthenticated && (isMasterAdmin || isGestor || isOperador || authCanManageSupplies));
  const isAdmin = Boolean(isMasterAdmin || isOperador);
  // Rol exclusivo para ver y gestionar solicitudes de censo (Operador, Digitalizador y Administrador)
  const canViewSolicitudes = Boolean(isAuthenticated && (isMasterAdmin || isOperador || isDigitalizador));

  const [tab, setTab] = useState(
    searchParams.get('tab') === 'solicitudes' && canViewSolicitudes ? 'solicitudes' : 'censo'
  ); // 'censo' | 'bodegas' | 'suministros' | 'solicitudes'
  const [familias, setFamilias] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [suministros, setSuministros] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [solicitudFilter, setSolicitudFilter] = useState('TODOS');
  const [solicitudSearch, setSolicitudSearch] = useState('');
  const [solicitudViewMode, setSolicitudViewMode] = useState('tabla'); // 'tabla' | 'tarjetas'
  const [loading, setLoading] = useState(true);

  // Modal / Ventanita flotante para ver detalle completo de ficha censal
  const [selectedFamilia, setSelectedFamilia] = useState(null);

  // Formulario de censo familiar
  const [nuevoCenso, setNuevoCenso] = useState({
    codigo_censo: `CENSO-ESM-${Math.floor(1000 + Math.random() * 9000)}`,
    jefe_familia_nombre: '',
    jefe_familia_cedula: '',
    telefono_contacto: '',
    parroquia: '50 Casas',
    barrio_sector: 'Ribera del Teaone',
    numero_integrantes: 4,
    ninos_menores_5: 1,
    adultos_mayores: 0,
    personas_discapacidad: 0,
    danos_vivienda: 'TOTAL',
    requiere_evacuacion_inmediata: true,
  });
  const [censoGuardado, setCensoGuardado] = useState(false);

  // Modales CRUD Bodega
  const [showBodegaModal, setShowBodegaModal] = useState(false);
  const [editingBodega, setEditingBodega] = useState(null);
  const [bodegaForm, setBodegaForm] = useState({
    nombre: '',
    responsable: '',
    telefono: '',
    direccion: '',
    lat: 0.968,
    lon: -79.654,
    activo: true
  });

  // Modales CRUD Kit / Suministro
  const [showKitModal, setShowKitModal] = useState(false);
  const [editingKit, setEditingKit] = useState(null);
  const [kitForm, setKitForm] = useState({
    codigo_sku: '',
    nombre_suministro: '',
    tipo: 'ALIMENTO',
    unidad_medida: 'Kit Familiar',
    peso_kg: 15.0,
    descripcion: ''
  });

  const [censoSearch, setCensoSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [fRes, bRes, sRes, solRes] = await Promise.allSettled([
        humanitarianApi.getCensoFamilias(),
        humanitarianApi.getBodegas(),
        humanitarianApi.getSuministros(),
        canViewSolicitudes ? humanitarianApi.getSolicitudesCenso() : Promise.resolve([]),
      ]);
      if (fRes.status === 'fulfilled') {
        const val = fRes.value;
        const list = Array.isArray(val) ? val : (Array.isArray(val?.results) ? val.results : (Array.isArray(val?.features) ? val.features : []));
        setFamilias(list);
      }
      if (bRes.status === 'fulfilled') {
        const val = bRes.value;
        const list = Array.isArray(val) ? val : (Array.isArray(val?.results) ? val.results : []);
        setBodegas(list);
      }
      if (sRes.status === 'fulfilled') {
        const val = sRes.value;
        const list = Array.isArray(val) ? val : (Array.isArray(val?.results) ? val.results : []);
        setSuministros(list);
      }
      if (solRes.status === 'fulfilled') {
        const val = solRes.value;
        const list = Array.isArray(val) ? val : (Array.isArray(val?.results) ? val.results : []);
        setSolicitudes(list);
      }
    } catch (err) {
      console.error('Error cargando asistencia humanitaria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Manejadores para Solicitudes de Censo (48h)
  const handleIniciarCensoDesdeSolicitud = (sol) => {
    setNuevoCenso({
      codigo_censo: `CENSO-ESM-${Math.floor(1000 + Math.random() * 9000)}`,
      jefe_familia_nombre: sol.jefe_familia_nombre || '',
      jefe_familia_cedula: sol.jefe_familia_cedula || '',
      telefono_contacto: sol.telefono_contacto || '',
      parroquia: 'Esmeraldas',
      barrio_sector: sol.barrio_sector || '',
      direccion_referencia: sol.direccion_referencia || '',
      numero_integrantes: 4,
      ninos_menores_5: 0,
      adultos_mayores: 0,
      personas_discapacidad: 0,
      danos_vivienda: 'PARCIAL',
      requiere_evacuacion_inmediata: false,
      lat: sol.latitud || sol.lat,
      lon: sol.longitud || sol.lon
    });
    // Notificar que la brigada está en camino
    humanitarianApi.actualizarSolicitudCenso(sol.id, { estado: 'EN_CAMINO' })
      .then(() => loadData())
      .catch(() => {});
    setTab('censo');
  };

  const handleMarcarSolicitudAtendida = async (id) => {
    try {
      await humanitarianApi.actualizarSolicitudCenso(id, { estado: 'ATENDIDO' });
      await loadData();
    } catch (err) {
      alert('Error actualizando solicitud: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDescartarSolicitud = async (id) => {
    if (window.confirm('¿Confirmas que deseas descartar esta solicitud de censo?')) {
      try {
        await humanitarianApi.actualizarSolicitudCenso(id, { estado: 'DESCARTADO' });
        await loadData();
      } catch (err) {
        alert('Error descartando solicitud: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  // Submit Censo
  const handleSubmitCenso = async (e) => {
    e.preventDefault();
    if (!canRegisterCenso) {
      alert('Acción restringida: Solo el personal acreditado (Digitalizador, Gestor o Administrador del COE) puede registrar fichas censales.');
      return;
    }
    try {
      await humanitarianApi.crearCensoFamilia(nuevoCenso);
      setCensoGuardado(true);
      await loadData();
      setTimeout(() => setCensoGuardado(false), 4000);
      setNuevoCenso({
        codigo_censo: `CENSO-ESM-${Math.floor(1000 + Math.random() * 9000)}`,
        jefe_familia_nombre: '',
        jefe_familia_cedula: '',
        telefono_contacto: '',
        parroquia: '50 Casas',
        barrio_sector: 'Ribera del Teaone',
        numero_integrantes: 4,
        ninos_menores_5: 1,
        adultos_mayores: 0,
        personas_discapacidad: 0,
        danos_vivienda: 'TOTAL',
        requiere_evacuacion_inmediata: true,
      });
    } catch (err) {
      alert('Error guardando la ficha censal: ' + (err.response?.data?.detail || err.message));
    }
  };

  // CRUD BODEGAS
  const handleOpenCreateBodega = () => {
    setEditingBodega(null);
    setBodegaForm({
      nombre: '',
      responsable: '',
      telefono: '',
      direccion: '',
      lat: 0.968,
      lon: -79.654,
      activo: true
    });
    setShowBodegaModal(true);
  };

  const handleOpenEditBodega = (b) => {
    setEditingBodega(b);
    setBodegaForm({
      nombre: b.nombre,
      responsable: b.responsable || '',
      telefono: b.telefono || '',
      direccion: b.direccion || '',
      lat: b.latitud || 0.968,
      lon: b.longitud || -79.654,
      activo: b.activo !== false
    });
    setShowBodegaModal(true);
  };

  const handleSaveBodega = async (e) => {
    e.preventDefault();
    try {
      if (editingBodega) {
        await humanitarianApi.actualizarBodega(editingBodega.id, bodegaForm);
      } else {
        await humanitarianApi.crearBodega(bodegaForm);
      }
      setShowBodegaModal(false);
      await loadData();
    } catch (err) {
      alert('Error guardando bodega: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteBodega = async (id) => {
    if (window.confirm('¿Confirmas que deseas eliminar permanentemente esta bodega de acopio?')) {
      try {
        await humanitarianApi.eliminarBodega(id);
        await loadData();
      } catch (err) {
        alert('Error eliminando bodega: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  // CRUD KITS / SUMINISTROS
  const handleOpenCreateKit = () => {
    setEditingKit(null);
    setKitForm({
      codigo_sku: `SUM-${Math.floor(100 + Math.random() * 900)}`,
      nombre_suministro: '',
      tipo: 'COLCHON_COBIJA',
      unidad_medida: 'UNIDAD',
      peso_kg: 5.0,
      descripcion: ''
    });
    setShowKitModal(true);
  };

  const handleOpenEditKit = (kit) => {
    setEditingKit(kit);
    setKitForm({
      codigo_sku: kit.codigo_sku,
      nombre_suministro: kit.nombre_suministro,
      tipo: kit.tipo || 'COLCHON_COBIJA',
      unidad_medida: kit.unidad_medida || 'UNIDAD',
      peso_kg: kit.peso_kg || 0,
      descripcion: kit.descripcion || ''
    });
    setShowKitModal(true);
  };

  const handleSaveKit = async (e) => {
    e.preventDefault();
    try {
      if (editingKit) {
        await humanitarianApi.actualizarSuministro(editingKit.id, kitForm);
      } else {
        await humanitarianApi.crearSuministro(kitForm);
      }
      setShowKitModal(false);
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.detail || 
                  (typeof err.response?.data === 'object' ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(', ') : null) || 
                  err.message;
      alert('Error guardando suministro/kit: ' + msg);
    }
  };

  const handleDeleteKit = async (id) => {
    if (window.confirm('¿Confirmas que deseas eliminar este kit del catálogo oficial?')) {
      try {
        await humanitarianApi.eliminarSuministro(id);
        await loadData();
      } catch (err) {
        alert('Error eliminando suministro: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const formatTipoSuministro = (t) => {
    switch (t) {
      case 'COLCHON_COBIJA':
      case 'REFUGIO':
        return 'Colchón / Cobija';
      case 'KIT_ASEO':
      case 'HIGIENE':
        return 'Kit Aseo';
      case 'ALIMENTO':
        return 'Alimento';
      case 'AGUA':
        return 'Agua';
      case 'MEDICINA':
        return 'Medicina';
      case 'HERRAMIENTAS':
      case 'HERRAMIENTA':
        return 'Herramientas';
      default:
        return t ? t.replace(/_/g, ' ') : 'General';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Cabecera y Selector de Pestañas */}
      <div className="bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 p-4 sm:p-5 rounded-2xl shadow-sm dark:shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
              Módulos 4 & 5 • Asistencia Humanitaria
            </span>
            {isAdmin && (
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Modo CRUD Administrador Activo
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 mt-1.5">
            <HeartHandshake className="w-6 h-6 sm:w-7 sm:h-7 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>Asistencia Humanitaria, Bodegas y Kits</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Gestión de padrón de familias damnificadas, bodegas de acopio y catálogo de provisiones del COE.
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div className={`grid grid-cols-1 ${canViewSolicitudes ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} w-full lg:w-auto bg-slate-100 dark:bg-crisis-900 p-1 rounded-xl border border-slate-300 dark:border-crisis-700 text-xs gap-1`}>
          <button
            onClick={() => setTab('censo')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'censo'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" /> <span className="truncate">Ficha Censal ({familias.length})</span>
          </button>
          <button
            onClick={() => setTab('bodegas')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'bodegas'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" /> <span className="truncate">Bodegas ({bodegas.length})</span>
          </button>
          <button
            onClick={() => setTab('suministros')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'suministros'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
            }`}
          >
            <Boxes className="w-4 h-4 shrink-0" /> <span className="truncate">Kits COE ({suministros.length})</span>
          </button>
          {canViewSolicitudes && (
            <button
              onClick={() => setTab('solicitudes')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                tab === 'solicitudes'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-800'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span className="truncate">Solicitudes 48h ({solicitudes.length})</span>
              {solicitudes.filter((s) => s.estado === 'PENDIENTE').length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-black rounded-full bg-red-500 text-white animate-pulse">
                  {solicitudes.filter((s) => s.estado === 'PENDIENTE').length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Banner Informativo de Modo Consulta para Ciudadanos */}
      {!canRegisterCenso && (
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 p-3 sm:p-3.5 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Modo Consulta (Público / Ciudadano):</p>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                Los formularios de registro de fichas censales y suministros se encuentran en modo de solo lectura. Para registrar o modificar información humanitaria, inicia sesión como Digitalizador Territorial, Gestor o Administrador del COE.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs shrink-0 transition shadow-sm"
          >
            Acceder al Sistema
          </button>
        </div>
      )}

      {censoGuardado && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Ficha de censo registrada correctamente en el padrón humanitario.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 1: FICHA CENSAL FAMILIAR */}
      {/* ========================================================================= */}
      {tab === 'censo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleSubmitCenso}
            className="lg:col-span-2 bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm dark:shadow-xl transition-colors"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-crisis-700 pb-2.5">
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                {!canRegisterCenso && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                <span>Nueva Ficha Familiar Damnificada</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                {nuevoCenso.codigo_censo}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  Nombre Jefe de Hogar
                </label>
                <input
                  type="text"
                  required
                  disabled={!canRegisterCenso}
                  placeholder={canRegisterCenso ? "ej: María Elena Bone" : "Modo consulta (Digitalizador / Admin)"}
                  value={nuevoCenso.jefe_familia_nombre}
                  onChange={(e) => setNuevoCenso({ ...nuevoCenso, jefe_familia_nombre: e.target.value })}
                  className={`w-full mt-1 bg-slate-50 dark:bg-crisis-900 border border-slate-300 dark:border-crisis-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition ${
                    !canRegisterCenso ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-crisis-950' : ''
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  Cédula de Identidad (10 dígitos)
                </label>
                <input
                  type="text"
                  required
                  disabled={!canRegisterCenso}
                  maxLength="10"
                  placeholder={canRegisterCenso ? "ej: 0801234567" : "Modo consulta (Digitalizador / Admin)"}
                  value={nuevoCenso.jefe_familia_cedula}
                  onChange={(e) => setNuevoCenso({ ...nuevoCenso, jefe_familia_cedula: e.target.value })}
                  className={`w-full mt-1 bg-slate-50 dark:bg-crisis-900 border border-slate-300 dark:border-crisis-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition ${
                    !canRegisterCenso ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-crisis-950' : ''
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  Teléfono Celular
                </label>
                <input
                  type="text"
                  disabled={!canRegisterCenso}
                  placeholder={canRegisterCenso ? "ej: 0991234567" : "Modo consulta"}
                  value={nuevoCenso.telefono_contacto}
                  onChange={(e) => setNuevoCenso({ ...nuevoCenso, telefono_contacto: e.target.value })}
                  className={`w-full mt-1 bg-slate-50 dark:bg-crisis-900 border border-slate-300 dark:border-crisis-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition ${
                    !canRegisterCenso ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-crisis-950' : ''
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  Barrio o Sector
                </label>
                <input
                  type="text"
                  disabled={!canRegisterCenso}
                  value={nuevoCenso.barrio_sector}
                  onChange={(e) => setNuevoCenso({ ...nuevoCenso, barrio_sector: e.target.value })}
                  className={`w-full mt-1 bg-slate-50 dark:bg-crisis-900 border border-slate-300 dark:border-crisis-600 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition ${
                    !canRegisterCenso ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-crisis-950' : ''
                  }`}
                />
              </div>
            </div>

            {/* Composición Familiar */}
            <div className="bg-slate-50 dark:bg-crisis-900/60 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-crisis-700 space-y-2.5 transition-colors">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Indicadores de Vulnerabilidad en el Hogar
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Total Miembros</label>
                  <input
                    type="number"
                    min="1"
                    disabled={!canRegisterCenso}
                    value={nuevoCenso.numero_integrantes}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, numero_integrantes: Number(e.target.value) })}
                    className={`w-full mt-1 bg-white dark:bg-crisis-800 border border-slate-300 dark:border-crisis-600 rounded px-2 py-1.5 text-xs text-center font-bold text-slate-900 dark:text-white shadow-xs focus:outline-none focus:border-sky-500 ${
                      !canRegisterCenso ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Niños (&lt;5 años)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={!canRegisterCenso}
                    value={nuevoCenso.ninos_menores_5}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, ninos_menores_5: Number(e.target.value) })}
                    className={`w-full mt-1 bg-white dark:bg-crisis-800 border border-slate-300 dark:border-crisis-600 rounded px-2 py-1.5 text-xs text-center font-bold text-slate-900 dark:text-white shadow-xs focus:outline-none focus:border-sky-500 ${
                      !canRegisterCenso ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Adultos Mayores</label>
                  <input
                    type="number"
                    min="0"
                    disabled={!canRegisterCenso}
                    value={nuevoCenso.adultos_mayores}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, adultos_mayores: Number(e.target.value) })}
                    className={`w-full mt-1 bg-white dark:bg-crisis-800 border border-slate-300 dark:border-crisis-600 rounded px-2 py-1.5 text-xs text-center font-bold text-slate-900 dark:text-white shadow-xs focus:outline-none focus:border-sky-500 ${
                      !canRegisterCenso ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Discapacidad</label>
                  <input
                    type="number"
                    min="0"
                    disabled={!canRegisterCenso}
                    value={nuevoCenso.personas_discapacidad}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, personas_discapacidad: Number(e.target.value) })}
                    className={`w-full mt-1 bg-white dark:bg-crisis-800 border border-slate-300 dark:border-crisis-600 rounded px-2 py-1.5 text-xs text-center font-bold text-slate-900 dark:text-white shadow-xs focus:outline-none focus:border-sky-500 ${
                      !canRegisterCenso ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canRegisterCenso}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                canRegisterCenso
                  ? 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-200 dark:bg-crisis-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-crisis-600 opacity-60'
              }`}
            >
              {canRegisterCenso ? <PlusCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{canRegisterCenso ? 'Registrar Familia Damnificada' : 'Registro Deshabilitado (Digitalizador / Admin)'}</span>
            </button>
          </form>

          {/* Resumen Lateral de Familias Censadas */}
          <div className="bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-crisis-700 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Padrón de Censados ({familias.length})</span>
              </h3>
              <button
                type="button"
                onClick={loadData}
                className="p-1 rounded text-slate-500 hover:text-sky-600 dark:hover:text-white transition"
                title="Actualizar padrón"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Buscador de Familias en Padrón */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={censoSearch}
                onChange={(e) => setCensoSearch(e.target.value)}
                placeholder="Buscar por nombre, cédula o sector..."
                className="w-full bg-slate-50 dark:bg-crisis-900 border border-slate-300 dark:border-crisis-600 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {familias.filter((item) => {
                if (!censoSearch.trim()) return true;
                const f = item.properties ? { ...item.properties, id: item.id } : item;
                const query = censoSearch.toLowerCase();
                return (
                  (f.jefe_familia_nombre || '').toLowerCase().includes(query) ||
                  (f.jefe_familia_cedula || '').includes(query) ||
                  (f.codigo_censo || '').toLowerCase().includes(query) ||
                  (f.barrio_sector || '').toLowerCase().includes(query)
                );
              }).length > 0 ? (
                familias
                  .filter((item) => {
                    if (!censoSearch.trim()) return true;
                    const f = item.properties ? { ...item.properties, id: item.id } : item;
                    const query = censoSearch.toLowerCase();
                    return (
                      (f.jefe_familia_nombre || '').toLowerCase().includes(query) ||
                      (f.jefe_familia_cedula || '').includes(query) ||
                      (f.codigo_censo || '').toLowerCase().includes(query) ||
                      (f.barrio_sector || '').toLowerCase().includes(query)
                    );
                  })
                  .map((item, i) => {
                    const f = item.properties ? { ...item.properties, id: item.id } : item;
                    return (
                      <div
                        key={f.id || i}
                        onClick={() => setSelectedFamilia(f)}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-crisis-900 border border-slate-200 dark:border-crisis-700 text-xs space-y-1.5 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-md transition shadow-xs cursor-pointer group"
                        title="Haz clic para ver la ficha censal completa en la ventana flotante"
                      >
                        <div className="flex justify-between items-start font-semibold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                            <span className="truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition font-bold">
                              {f.jefe_familia_nombre || 'Familia'}
                            </span>
                            <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                          </div>
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 font-semibold shrink-0">
                            {f.codigo_censo}
                          </span>
                        </div>

                        {/* Cédula y Teléfono con efecto blur por privacidad para usuarios no autorizados */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-slate-600 dark:text-slate-400">CI:</span>
                            {canViewSensitiveCensoData ? (
                              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                                {f.jefe_familia_cedula || 'S/N'}
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 font-mono bg-slate-200 dark:bg-crisis-800 border border-slate-300 dark:border-crisis-700 px-1.5 py-0.2 rounded text-[10.5px] text-slate-700 dark:text-slate-300 blur-[4px] select-none"
                                title="Dato privado protegido (Requiere rol: Admin, Gestor, Operador o Digitalizador)"
                              >
                                <Lock className="w-2.5 h-2.5 text-amber-500 inline shrink-0" />
                                {f.jefe_familia_cedula || '0801234567'}
                              </span>
                            )}
                          </span>

                          {f.telefono_contacto && (
                            <span className="flex items-center gap-1">
                              <span className="font-semibold text-slate-600 dark:text-slate-400">Tel:</span>
                              {canViewSensitiveCensoData ? (
                                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                                  {f.telefono_contacto}
                                </span>
                              ) : (
                                <span 
                                  className="inline-flex items-center gap-1 font-mono bg-slate-200 dark:bg-crisis-800 border border-slate-300 dark:border-crisis-700 px-1.5 py-0.2 rounded text-[10.5px] text-slate-700 dark:text-slate-300 blur-[4px] select-none"
                                  title="Teléfono protegido por privacidad (Requiere rol autorizado)"
                                >
                                  <Lock className="w-2.5 h-2.5 text-amber-500 inline shrink-0" />
                                  {f.telefono_contacto || '0991234567'}
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                          📍 {f.barrio_sector || f.parroquia || 'Esmeraldas'} • {f.numero_integrantes} integrantes
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200 dark:border-crisis-800 text-[10px]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(f.ninos_menores_5 > 0 || f.adultos_mayores > 0 || f.personas_discapacidad > 0) ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 font-semibold">
                                {f.ninos_menores_5 || 0} niños • {f.adultos_mayores || 0} ad. may. • {f.personas_discapacidad || 0} disc.
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400">Sin vulnerabilidad</span>
                            )}
                            {f.requiere_evacuacion_inmediata && (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/15 dark:text-red-300 font-bold">
                                Evacuar
                              </span>
                            )}
                          </div>

                          <span className="text-sky-600 dark:text-sky-400 font-bold group-hover:underline flex items-center gap-0.5 shrink-0">
                            <span>Ver Ficha</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  {censoSearch ? 'No se encontraron familias que coincidan con la búsqueda.' : 'No hay familias censadas registradas aún.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: BODEGAS DE ACOPIO (CON CRUD ADMINISTRADOR) */}
      {/* ========================================================================= */}
      {tab === 'bodegas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 p-4 rounded-xl shadow-sm dark:shadow transition-colors">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                Red de Bodegas y Centros de Acopio COE
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Almacenes logísticos autorizados para la recepción y despacho de ayuda humanitaria.
              </p>
            </div>

            {canManageSupplies && (
              <button
                onClick={handleOpenCreateBodega}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Bodega</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bodegas.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-crisis-800 rounded-2xl border border-slate-200 dark:border-crisis-700 text-slate-500 dark:text-slate-400 text-xs">
                No hay bodegas registradas actualmente.
              </div>
            ) : (
              bodegas.map((bodega) => (
                <div
                  key={bodega.id}
                  className="bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 hover:border-sky-400 dark:hover:border-slate-500 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md space-y-3 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        bodega.activo !== false
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
                          : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30'
                      }`}>
                        {bodega.activo !== false ? '● Operativa' : '○ Inactiva'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                        ID: #{bodega.id}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {bodega.nombre}
                    </h4>

                    <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                      <p className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Responsable:</span> <span className="text-slate-800 dark:text-slate-200">{bodega.responsable || 'No asignado'}</span>
                      </p>
                      {bodega.telefono && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-semibold text-slate-600 dark:text-slate-400">Teléfono:</span> <span className="text-slate-800 dark:text-slate-200">{bodega.telefono}</span>
                        </p>
                      )}
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Dirección:</span> <span className="text-slate-800 dark:text-slate-200">{bodega.direccion || 'Esmeraldas'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Acciones CRUD si es Gestor o Admin */}
                  {canManageSupplies && (
                    <div className="pt-3 border-t border-slate-200 dark:border-crisis-700/80 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditBodega(bodega)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-sky-50 dark:bg-crisis-700 dark:hover:bg-crisis-600 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center gap-1 transition shadow-xs"
                      >
                        <Edit className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBodega(bodega.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-red-700 hover:text-white dark:text-red-400 dark:hover:text-white bg-red-50 hover:bg-red-600 dark:bg-crisis-700 dark:hover:bg-red-600 rounded-lg border border-red-200 dark:border-red-500/30 flex items-center gap-1 transition shadow-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: CATÁLOGO DE KITS Y PROVISIONES (CON CRUD ADMINISTRADOR) */}
      {/* ========================================================================= */}
      {tab === 'suministros' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 p-4 rounded-xl shadow-sm dark:shadow transition-colors">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Catálogo Oficial de Kits y Provisiones Humanitarias
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Kits estandarizados por el COE Cantonal según directrices del Servicio Nacional de Gestión de Riesgos.
              </p>
            </div>

            {canManageSupplies && (
              <button
                onClick={handleOpenCreateKit}
                className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo Kit / Suministro</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {suministros.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 hover:border-sky-400 dark:hover:border-slate-500 rounded-xl p-4 shadow-sm hover:shadow-md space-y-3 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 dark:bg-crisis-700 dark:text-sky-400 dark:border-slate-600">
                      {item.codigo_sku}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-crisis-700/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                      {formatTipoSuministro(item.tipo)}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{item.nombre_suministro}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.descripcion}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-crisis-700">
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                    <span>Unidad: <strong className="font-semibold">{item.unidad_medida}</strong></span>
                    <span className="font-bold text-sky-700 dark:text-sky-300">{item.peso_kg} kg</span>
                  </div>

                  {canManageSupplies && (
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200 dark:border-crisis-700/60">
                      <button
                        onClick={() => handleOpenEditKit(item)}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-sky-50 dark:bg-crisis-700 dark:hover:bg-crisis-600 rounded border border-slate-300 dark:border-slate-600 flex items-center gap-1 transition shadow-xs"
                      >
                        <Edit className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteKit(item.id)}
                        className="px-2 py-1 text-[11px] font-semibold text-red-700 hover:text-white dark:text-red-400 dark:hover:text-white bg-red-50 hover:bg-red-600 dark:bg-crisis-700 dark:hover:bg-red-600 rounded border border-red-200 dark:border-red-500/30 flex items-center gap-1 transition shadow-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 4: SOLICITUDES DE CENSO DE CIUDADANOS (VENTANA 48H) */}
      {/* ========================================================================= */}
      {tab === 'solicitudes' && canViewSolicitudes && (
        <div className="space-y-4">
          {/* Header y Filtros */}
          <div className="bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 p-4 sm:p-5 rounded-xl shadow-sm transition-colors space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Hoja de Ruta de Visitas Censales (Ventana 48 Horas)</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Solicitudes enviadas por ciudadanos no censados desde la aplicación móvil para recibir una brigada en su vivienda.
                </p>
              </div>

              <button
                onClick={loadData}
                disabled={loading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-crisis-700 dark:hover:bg-crisis-600 text-slate-800 dark:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
                <span>Actualizar Solicitudes</span>
              </button>
            </div>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Solicitudes</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{solicitudes.length}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Pendientes (&lt;48h)
                </span>
                <p className="text-lg font-black text-amber-900 dark:text-amber-300 mt-0.5">
                  {solicitudes.filter((s) => s.estado === 'PENDIENTE').length}
                </p>
              </div>
              <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800/40">
                <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Brigada en Camino
                </span>
                <p className="text-lg font-black text-sky-900 dark:text-sky-300 mt-0.5">
                  {solicitudes.filter((s) => s.estado === 'EN_CAMINO').length}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Atendidas / Censadas
                </span>
                <p className="text-lg font-black text-emerald-900 dark:text-emerald-300 mt-0.5">
                  {solicitudes.filter((s) => s.estado === 'ATENDIDO').length}
                </p>
              </div>
            </div>

            {/* Barra de Filtros, Búsqueda y Selector de Vista */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                {['TODOS', 'PENDIENTE', 'EN_CAMINO', 'ATENDIDO'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSolicitudFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      solicitudFilter === st
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-slate-100 dark:bg-crisis-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-crisis-700'
                    }`}
                  >
                    {st === 'TODOS' ? 'Todas' : st === 'PENDIENTE' ? 'Pendientes' : st === 'EN_CAMINO' ? 'En Camino' : 'Atendidas'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar solicitante, cédula o sector..."
                    value={solicitudSearch}
                    onChange={(e) => setSolicitudSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Alternador de Vista Tabla / Tarjetas */}
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-crisis-900 p-0.5 rounded-lg border border-slate-300 dark:border-crisis-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSolicitudViewMode('tabla')}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                      solicitudViewMode === 'tabla'
                        ? 'bg-white dark:bg-crisis-700 text-sky-700 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Vista Tabla"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tabla</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSolicitudViewMode('tarjetas')}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                      solicitudViewMode === 'tarjetas'
                        ? 'bg-white dark:bg-crisis-700 text-sky-700 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Vista Tarjetas"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tarjetas</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Listado de Solicitudes: VISTA TABLA (Por defecto) */}
          {solicitudViewMode === 'tabla' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-crisis-700 bg-white dark:bg-crisis-800 shadow-sm transition-colors">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-crisis-900 border-b border-slate-200 dark:border-crisis-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5 whitespace-nowrap">Estado / SLA (48h)</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Cédula</th>
                    <th className="py-3 px-3.5">Jefe de Hogar</th>
                    <th className="py-3 px-3.5">Sector / Barrio</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Contacto</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Geolocalización</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">Acciones Brigada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-crisis-700/60">
                  {solicitudes
                    .filter((s) => {
                      if (solicitudFilter !== 'TODOS' && s.estado !== solicitudFilter) return false;
                      if (solicitudSearch.trim()) {
                        const q = solicitudSearch.toLowerCase();
                        const nom = (s.jefe_familia_nombre || '').toLowerCase();
                        const ced = (s.jefe_familia_cedula || '').toLowerCase();
                        const bar = (s.barrio_sector || '').toLowerCase();
                        return nom.includes(q) || ced.includes(q) || bar.includes(q);
                      }
                      return true;
                    })
                    .map((sol) => {
                      const horasTranscurridas = Math.floor((new Date() - new Date(sol.fecha_solicitud)) / (1000 * 60 * 60));
                      const horasRestantes = Math.max(0, 48 - horasTranscurridas);
                      const vencido = horasTranscurridas >= 48;

                      return (
                        <tr key={sol.id} className="hover:bg-slate-50/80 dark:hover:bg-crisis-700/40 transition">
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border w-fit ${
                                  sol.estado === 'PENDIENTE'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                                    : sol.estado === 'EN_CAMINO'
                                    ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40'
                                    : sol.estado === 'ATENDIDO'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                                    : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                                }`}
                              >
                                {sol.estado === 'PENDIENTE'
                                  ? 'Pendiente (48h)'
                                  : sol.estado === 'EN_CAMINO'
                                  ? 'En Camino'
                                  : sol.estado === 'ATENDIDO'
                                  ? 'Censado / Atendido'
                                  : 'Descartado'}
                              </span>
                              {sol.estado === 'PENDIENTE' ? (
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${vencido ? 'text-red-500 font-extrabold animate-pulse' : 'text-amber-600 dark:text-amber-400'}`}>
                                  <Clock className="w-3 h-3" />
                                  {vencido ? 'SLA 48h Vencido' : `Restan ${horasRestantes}h de 48h`}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  Hace {horasTranscurridas}h
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs px-2 py-1 bg-slate-100 dark:bg-crisis-900 rounded-md border border-slate-200 dark:border-crisis-700">
                              {sol.jefe_familia_cedula}
                            </span>
                          </td>

                          <td className="py-3 px-3.5">
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{sol.jefe_familia_nombre}</p>
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-semibold">
                              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span>{sol.barrio_sector}</span>
                            </div>
                            {sol.direccion_referencia && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-4">
                                Ref: {sol.direccion_referencia}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {sol.telefono_contacto ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{sol.telefono_contacto}</span>
                                <a
                                  href={`tel:${sol.telefono_contacto}`}
                                  className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[10px] transition"
                                  title="Llamar"
                                >
                                  <PhoneCall className="w-3 h-3 text-sky-500" />
                                </a>
                                <a
                                  href={`https://wa.me/593${sol.telefono_contacto.replace(/\D/g, '').replace(/^0/, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] transition"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Sin teléfono</span>
                            )}
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {(sol.latitud || sol.lat) ? (
                              <a
                                href={`https://www.google.com/maps?q=${sol.latitud || sol.lat},${sol.longitud || sol.lon}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                              >
                                <Navigation className="w-3 h-3" />
                                <span>{Number(sol.latitud || sol.lat).toFixed(3)}, {Number(sol.longitud || sol.lon).toFixed(3)}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Sin GPS</span>
                            )}
                          </td>

                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {sol.estado !== 'ATENDIDO' && (
                                <button
                                  onClick={() => handleIniciarCensoDesdeSolicitud(sol)}
                                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold shadow-xs flex items-center gap-1 transition active:scale-95"
                                  title="Iniciar Ficha Censal cargando datos automáticamente"
                                >
                                  <Users className="w-3 h-3" />
                                  <span>Iniciar Ficha</span>
                                </button>
                              )}
                              {sol.estado !== 'ATENDIDO' && (
                                <button
                                  onClick={() => handleMarcarSolicitudAtendida(sol.id)}
                                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                  title="Marcar Atendido"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Atendido</span>
                                </button>
                              )}
                              {sol.estado !== 'DESCARTADO' && (
                                <button
                                  onClick={() => handleDescartarSolicitud(sol.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                                  title="Descartar solicitud"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* Listado de Solicitudes: VISTA TARJETAS */}
          {solicitudViewMode === 'tarjetas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solicitudes
                .filter((s) => {
                  if (solicitudFilter !== 'TODOS' && s.estado !== solicitudFilter) return false;
                  if (solicitudSearch.trim()) {
                    const q = solicitudSearch.toLowerCase();
                    const nom = (s.jefe_familia_nombre || '').toLowerCase();
                    const ced = (s.jefe_familia_cedula || '').toLowerCase();
                    const bar = (s.barrio_sector || '').toLowerCase();
                    return nom.includes(q) || ced.includes(q) || bar.includes(q);
                  }
                  return true;
                })
                .map((sol) => {
                  const horasTranscurridas = Math.floor((new Date() - new Date(sol.fecha_solicitud)) / (1000 * 60 * 60));
                  const horasRestantes = Math.max(0, 48 - horasTranscurridas);
                  const vencido = horasTranscurridas >= 48;

                  return (
                    <div
                      key={sol.id}
                      className="bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        {/* Cabecera Tarjeta */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {sol.jefe_familia_nombre}
                              </h4>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Cédula: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{sol.jefe_familia_cedula}</span>
                            </p>
                          </div>

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              sol.estado === 'PENDIENTE'
                                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                                : sol.estado === 'EN_CAMINO'
                                ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40'
                                : sol.estado === 'ATENDIDO'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                                : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                            }`}
                          >
                            {sol.estado === 'PENDIENTE'
                              ? 'Pendiente (48h)'
                              : sol.estado === 'EN_CAMINO'
                              ? 'En Camino'
                              : sol.estado === 'ATENDIDO'
                              ? 'Censado / Atendido'
                              : 'Descartado'}
                          </span>
                        </div>

                        {/* Detalles de Ubicación y Contacto */}
                        <div className="mt-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span>Sector: <strong>{sol.barrio_sector}</strong></span>
                          </div>

                          {sol.direccion_referencia && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                              Ref: {sol.direccion_referencia}
                            </p>
                          )}

                          {sol.telefono_contacto && (
                            <div className="flex items-center gap-2 pt-1">
                              <PhoneCall className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              <span>Contacto: <strong className="font-mono">{sol.telefono_contacto}</strong></span>
                              <div className="flex items-center gap-1.5 ml-auto">
                                <a
                                  href={`tel:${sol.telefono_contacto}`}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-[10px] font-bold"
                                >
                                  Llamar
                                </a>
                                <a
                                  href={`https://wa.me/593${sol.telefono_contacto.replace(/\D/g, '').replace(/^0/, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                                >
                                  WhatsApp
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Coordenadas GPS */}
                          {(sol.latitud || sol.lat) && (
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                              <span>GPS: {Number(sol.latitud || sol.lat).toFixed(4)}, {Number(sol.longitud || sol.lon).toFixed(4)}</span>
                              <a
                                href={`https://www.google.com/maps?q=${sol.latitud || sol.lat},${sol.longitud || sol.lon}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <Navigation className="w-3 h-3" /> Ver en Mapa
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Contador de Ventana de 48 Horas */}
                        <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Solicitado hace: <strong>{horasTranscurridas}h</strong>
                          </span>
                          {sol.estado === 'PENDIENTE' ? (
                            <span className={`text-[11px] font-bold flex items-center gap-1 ${
                              vencido ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              {vencido ? 'Plazo de 48h Vencido' : `Restan ${horasRestantes}h de 48h`}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Atendido
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acciones del Operador / Digitalizador */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
                        {sol.estado !== 'ATENDIDO' && (
                          <button
                            onClick={() => handleIniciarCensoDesdeSolicitud(sol)}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition active:scale-95"
                            title="Cargar estos datos en el formulario de censo para registrar la ficha familiar"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Iniciar Ficha Censal</span>
                          </button>
                        )}

                        {sol.estado !== 'ATENDIDO' && (
                          <button
                            onClick={() => handleMarcarSolicitudAtendida(sol.id)}
                            className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold transition"
                          >
                            Marcar Atendido
                          </button>
                        )}

                        {sol.estado !== 'DESCARTADO' && (
                          <button
                            onClick={() => handleDescartarSolicitud(sol.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                            title="Descartar solicitud"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Mensaje de Lista Vacía */}
          {solicitudes.filter((s) => {
            if (solicitudFilter !== 'TODOS' && s.estado !== solicitudFilter) return false;
            if (solicitudSearch.trim()) {
              const q = solicitudSearch.toLowerCase();
              const nom = (s.jefe_familia_nombre || '').toLowerCase();
              const ced = (s.jefe_familia_cedula || '').toLowerCase();
              const bar = (s.barrio_sector || '').toLowerCase();
              return nom.includes(q) || ced.includes(q) || bar.includes(q);
            }
            return true;
          }).length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-crisis-800 border border-slate-200 dark:border-crisis-700 rounded-xl text-slate-500 dark:text-slate-400 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {solicitudes.length === 0
                  ? 'No hay solicitudes de censo registradas actualmente'
                  : 'No se encontraron solicitudes con el filtro o búsqueda seleccionada'}
              </p>
              <p className="text-xs">
                Cuando los ciudadanos soliciten visita desde la aplicación móvil, aparecerán automáticamente en esta tabla con su geolocalización y plazo de atención de 48 horas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {showBodegaModal && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                {editingBodega ? 'Editar Bodega de Acopio' : 'Registrar Nueva Bodega'}
              </h3>
              <button
                onClick={() => setShowBodegaModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBodega} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Nombre de la Bodega</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Bodega Central COE - San Rafael"
                  value={bodegaForm.nombre}
                  onChange={(e) => setBodegaForm({ ...bodegaForm, nombre: e.target.value })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Responsable Encargado</label>
                  <input
                    type="text"
                    placeholder="ej: Ing. Marcos Quintero"
                    value={bodegaForm.responsable}
                    onChange={(e) => setBodegaForm({ ...bodegaForm, responsable: e.target.value })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Teléfono Celular</label>
                  <input
                    type="text"
                    placeholder="ej: 0991234567"
                    value={bodegaForm.telefono}
                    onChange={(e) => setBodegaForm({ ...bodegaForm, telefono: e.target.value })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Dirección / Referencia</label>
                <input
                  type="text"
                  placeholder="ej: Av. Kennedy y Olmedo"
                  value={bodegaForm.direccion}
                  onChange={(e) => setBodegaForm({ ...bodegaForm, direccion: e.target.value })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Latitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={bodegaForm.lat}
                    onChange={(e) => setBodegaForm({ ...bodegaForm, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Longitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={bodegaForm.lon}
                    onChange={(e) => setBodegaForm({ ...bodegaForm, lon: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activoBodega"
                  checked={bodegaForm.activo}
                  onChange={(e) => setBodegaForm({ ...bodegaForm, activo: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="activoBodega" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Bodega operativa para despacho inmediato
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBodegaModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow transition"
                >
                  {editingBodega ? 'Guardar Cambios' : 'Crear Bodega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FORMULARIO KITS Y SUMINISTROS (CREAR / EDITAR) */}
      {/* ========================================================================= */}
      {showKitModal && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                {editingKit ? 'Editar Suministro / Provisión' : 'Registrar Nuevo Suministro / Provisión'}
              </h3>
              <button
                onClick={() => setShowKitModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Código SKU / Identificador</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: UNT-919, KIT-ALIM-3D"
                    value={kitForm.codigo_sku}
                    onChange={(e) => setKitForm({ ...kitForm, codigo_sku: e.target.value })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Tipo de Suministro</label>
                  <select
                    value={kitForm.tipo}
                    onChange={(e) => setKitForm({ ...kitForm, tipo: e.target.value })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="COLCHON_COBIJA">Colchones, Frazadas y Refugio</option>
                    <option value="ALIMENTO">Alimentos y Raciones</option>
                    <option value="AGUA">Agua Potable e Hidratación</option>
                    <option value="MEDICINA">Medicinas y Primeros Auxilios</option>
                    <option value="KIT_ASEO">Kit de Higiene y Aseo Personal</option>
                    <option value="HERRAMIENTAS">Herramientas y Limpieza</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Nombre del Suministro / Insumo</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Colchones de Espuma, Kit de Alimentos, Bidón de Agua"
                  value={kitForm.nombre_suministro}
                  onChange={(e) => setKitForm({ ...kitForm, nombre_suministro: e.target.value })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Unidad de Medida</label>
                  <select
                    value={kitForm.unidad_medida}
                    onChange={(e) => setKitForm({ ...kitForm, unidad_medida: e.target.value })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-sky-500"
                  >
                    <option value="UNIDAD">UNIDAD (Colchón, frazada, linterna, etc.)</option>
                    <option value="KIT">KIT (Kit familiar, kit de aseo, etc.)</option>
                    <option value="PAQUETE">PAQUETE (Paquete de insumos)</option>
                    <option value="CAJA">CAJA</option>
                    <option value="BIDON">BIDÓN / BOTELLÓN</option>
                    <option value="SACO">SACO / BULTO</option>
                    <option value="RACION">RACIÓN</option>
                    <option value="LITRO">LITRO</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Peso Aproximado (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={kitForm.peso_kg}
                    onChange={(e) => setKitForm({ ...kitForm, peso_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Descripción y Detalle del Suministro</label>
                <textarea
                  rows="2"
                  placeholder="Detalle de provisiones o características técnicas..."
                  value={kitForm.descripcion}
                  onChange={(e) => setKitForm({ ...kitForm, descripcion: e.target.value })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowKitModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow transition"
                >
                  {editingKit ? 'Guardar Cambios' : 'Crear Suministro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / VENTANA FLOTANTE: DETALLE DE FICHA CENSAL (CON PRIVACIDAD / BLUR) */}
      {/* ========================================================================= */}
      {selectedFamilia && (
        <div 
          className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedFamilia(null)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-crisis-900 border border-slate-200 dark:border-crisis-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-slate-50 dark:bg-crisis-950 border-b border-slate-200 dark:border-crisis-800 p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {selectedFamilia.jefe_familia_nombre || 'Familia Damnificada'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-1.5 py-0.2 rounded">
                      {selectedFamilia.codigo_censo}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {selectedFamilia.barrio_sector || selectedFamilia.parroquia || 'Cantón Esmeraldas'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFamilia(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-crisis-800 transition shrink-0"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner de Privacidad / Permisos */}
            <div className="px-4 sm:px-5 pt-3">
              {canViewSensitiveCensoData ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Acceso Autorizado ({user?.rol || 'Personal COE'})</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                    Datos en claro
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="flex-1">
                    <p className="font-bold">Datos Personales Protegidos por Privacidad</p>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 mt-0.5">
                      Por Ley de Protección de Datos Personales, la cédula y el número telefónico están protegidos con efecto blur. Solo los usuarios con rol de <strong>Administrador, Gestor, Operador o Digitalizador</strong> pueden visualizarlos en claro.
                    </p>
                    {!isAuthenticated && (
                      <a
                        href="/login"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Iniciar sesión con cuenta COE para desbloquear datos</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contenido Detallado de la Ficha */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
              
              {/* Sección 1: Identificación y Contacto */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-crisis-800/60 border border-slate-200 dark:border-crisis-700 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-500" />
                  <span>Identificación y Contacto del Jefe de Familia</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Cédula */}
                  <div className="bg-white dark:bg-crisis-900 p-2.5 rounded-lg border border-slate-200 dark:border-crisis-700">
                    <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Cédula de Identidad (CI):</span>
                    {canViewSensitiveCensoData ? (
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{selectedFamilia.jefe_familia_cedula || 'S/N'}</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-1 py-0.2 rounded font-sans font-semibold">
                          Oficial
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-slate-700 dark:text-slate-300 blur-[4px] select-none bg-slate-200 dark:bg-crisis-800 border border-slate-300 dark:border-crisis-700 px-2 py-0.5 rounded">
                          {selectedFamilia.jefe_familia_cedula || '0801234567'}
                        </span>
                        <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Protegido
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div className="bg-white dark:bg-crisis-900 p-2.5 rounded-lg border border-slate-200 dark:border-crisis-700">
                    <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Teléfono Celular:</span>
                    {canViewSensitiveCensoData ? (
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{selectedFamilia.telefono_contacto || 'No registrado'}</span>
                        {selectedFamilia.telefono_contacto && (
                          <a
                            href={`tel:${selectedFamilia.telefono_contacto}`}
                            className="p-1 rounded bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 transition"
                            title="Llamar"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-slate-700 dark:text-slate-300 blur-[4px] select-none bg-slate-200 dark:bg-crisis-800 border border-slate-300 dark:border-crisis-700 px-2 py-0.5 rounded">
                          {selectedFamilia.telefono_contacto || '0991234567'}
                        </span>
                        <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Protegido
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección 2: Ubicación Territorial */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-crisis-800/60 border border-slate-200 dark:border-crisis-700 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Ubicación Territorial y Sector</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cantón / Parroquia:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedFamilia.canton || 'Esmeraldas'} • {selectedFamilia.parroquia || '50 Casas'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Barrio / Sector:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedFamilia.barrio_sector || 'Sector sin especificar'}
                    </span>
                  </div>
                </div>
                {selectedFamilia.direccion_referencia && (
                  <div className="pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Referencia: </span>
                    {selectedFamilia.direccion_referencia}
                  </div>
                )}
              </div>

              {/* Sección 3: Vulnerabilidad del Hogar */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-crisis-800/60 border border-slate-200 dark:border-crisis-700 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-500" />
                  <span>Composición del Hogar e Indicadores de Vulnerabilidad</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white dark:bg-crisis-900 p-2 rounded-lg border border-slate-200 dark:border-crisis-700">
                    <div className="text-[10px] text-slate-400">Total Miembros</div>
                    <div className="text-sm font-black text-sky-600 dark:text-sky-400">
                      {selectedFamilia.numero_integrantes || 1}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-crisis-900 p-2 rounded-lg border border-slate-200 dark:border-crisis-700">
                    <div className="text-[10px] text-slate-400">Niños (&lt;5 años)</div>
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                      {selectedFamilia.ninos_menores_5 || 0}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-crisis-900 p-2 rounded-lg border border-slate-200 dark:border-crisis-700">
                    <div className="text-[10px] text-slate-400">Adultos Mayores</div>
                    <div className="text-sm font-black text-purple-600 dark:text-purple-400">
                      {selectedFamilia.adultos_mayores || 0}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-crisis-900 p-2 rounded-lg border border-slate-200 dark:border-crisis-700">
                    <div className="text-[10px] text-slate-400">Discapacidad</div>
                    <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                      {selectedFamilia.personas_discapacidad || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 4: Daños y Estado de Evacuación */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-crisis-800/60 border border-slate-200 dark:border-crisis-700 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Estado de Vivienda y Evacuación</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-[11px] font-bold border ${
                    selectedFamilia.danos_vivienda === 'TOTAL'
                      ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
                      : selectedFamilia.danos_vivienda === 'PARCIAL'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  }`}>
                    Daños en Vivienda: {selectedFamilia.danos_vivienda || 'PARCIAL'}
                  </span>

                  {selectedFamilia.requiere_evacuacion_inmediata ? (
                    <span className="px-2 py-1 rounded-md text-[11px] font-black bg-red-600 text-white animate-pulse">
                      🚨 Requiere Evacuación Inmediata
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-200 dark:bg-crisis-700 text-slate-700 dark:text-slate-300">
                      Evacuación no requerida
                    </span>
                  )}
                </div>

                {selectedFamilia.fecha_censo && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Fecha de registro en padrón: {new Date(selectedFamilia.fecha_censo).toLocaleString()}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-crisis-950 border-t border-slate-200 dark:border-crisis-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Ficha #{selectedFamilia.codigo_censo}
              </span>
              <button
                type="button"
                onClick={() => setSelectedFamilia(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-crisis-800 hover:bg-slate-300 dark:hover:bg-crisis-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default HumanitarianPage;
