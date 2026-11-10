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
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { humanitarianApi } from '../../api/humanitarianApi';
import { useAuth } from '../../context/AuthContext';

export const HumanitarianPage = () => {
  const navigate = useNavigate();
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
  // Gestión de suministros (bodegas y kits): Administrador, Gestor y Operador
  const canManageSupplies = Boolean(isAuthenticated && (isMasterAdmin || isGestor || isOperador || authCanManageSupplies));
  const isAdmin = Boolean(isMasterAdmin || isOperador);

  const [tab, setTab] = useState('censo'); // 'censo' | 'bodegas' | 'suministros'
  const [familias, setFamilias] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [suministros, setSuministros] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const [fRes, bRes, sRes] = await Promise.allSettled([
        humanitarianApi.getCensoFamilias(),
        humanitarianApi.getBodegas(),
        humanitarianApi.getSuministros(),
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
    } catch (err) {
      console.error('Error cargando asistencia humanitaria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      <div className="bg-crisis-800 border border-crisis-700 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Módulos 4 & 5 • Asistencia Humanitaria
            </span>
            {isAdmin && (
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Modo CRUD Administrador Activo
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2.5 mt-1.5">
            <HeartHandshake className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400 shrink-0" />
            <span>Asistencia Humanitaria, Bodegas y Kits</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión de padrón de familias damnificadas, bodegas de acopio y catálogo de provisiones del COE.
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 w-full lg:w-auto bg-slate-100 dark:bg-crisis-900 p-1 rounded-xl border border-slate-300 dark:border-crisis-700 text-xs gap-1">
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
            className="lg:col-span-2 bg-crisis-800 border border-crisis-700 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-crisis-700 pb-2.5">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                {!canRegisterCenso && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                <span>Nueva Ficha Familiar Damnificada</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                {nuevoCenso.codigo_censo}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  Nombre Jefe de Hogar
                </label>
                <input
                  type="text"
                  required
                  disabled={!canRegisterCenso}
                  placeholder={canRegisterCenso ? "ej: María Elena Bone" : "Modo consulta (Digitalizador / Admin)"}
                  value={nuevoCenso.jefe_familia_nombre}
                  onChange={(e) => setNuevoCenso({ ...nuevoCenso, jefe_familia_nombre: e.target.value })}
                  className={`w-full mt-1 bg-crisis-900 border border-crisis-600 rounded-lg px-3 py-2 text-xs text-white ${
                    !canRegisterCenso ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-crisis-950' : ''
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold">
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
                  className={`w-full mt-1 bg-crisis-900 border border-crisis-600 rounded-lg px-3 py-2 text-xs text-white ${
                    !canRegisterCenso ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-crisis-950' : ''
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  Teléfono Celular
                </label>
                <input
                  type="text"
                  disabled={!canRegisterCenso}
                  placeholder={canRegisterCenso ? "ej: 0991234567" : "Modo consulta"}
                  value={nuevoCenso.telefono_contacto}
                  onChange={(e) => setNuevoCenso({ ...nuevoCenso, telefono_contacto: e.target.value })}
                  className={`w-full mt-1 bg-crisis-900 border border-crisis-600 rounded-lg px-3 py-2 text-xs text-white ${
                    !canRegisterCenso ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-crisis-950' : ''
                  }`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold">
                  Barrio o Sector
                </label>
                <input
                  type="text"
                  disabled={!canRegisterCenso}
                  value={nuevoCenso.barrio_sector}
                  onChange={(e) => setNuevoCenso({ ...nuevoCenso, barrio_sector: e.target.value })}
                  className={`w-full mt-1 bg-crisis-900 border border-crisis-600 rounded-lg px-3 py-2 text-xs text-white ${
                    !canRegisterCenso ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-crisis-950' : ''
                  }`}
                />
              </div>
            </div>

            {/* Composición Familiar */}
            <div className="bg-crisis-900/60 p-3 sm:p-4 rounded-xl border border-crisis-700 space-y-2.5">
              <span className="text-xs font-bold text-slate-300">
                Indicadores de Vulnerabilidad en el Hogar
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-400">Total Miembros</label>
                  <input
                    type="number"
                    min="1"
                    disabled={!canRegisterCenso}
                    value={nuevoCenso.numero_integrantes}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, numero_integrantes: Number(e.target.value) })}
                    className={`w-full mt-1 bg-crisis-800 border border-crisis-600 rounded px-2 py-1.5 text-xs text-center text-white ${
                      !canRegisterCenso ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Niños (&lt;5 años)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={!canRegisterCenso}
                    value={nuevoCenso.ninos_menores_5}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, ninos_menores_5: Number(e.target.value) })}
                    className={`w-full mt-1 bg-crisis-800 border border-crisis-600 rounded px-2 py-1.5 text-xs text-center text-white ${
                      !canRegisterCenso ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Adultos Mayores</label>
                  <input
                    type="number"
                    min="0"
                    disabled={!canRegisterCenso}
                    value={nuevoCenso.adultos_mayores}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, adultos_mayores: Number(e.target.value) })}
                    className={`w-full mt-1 bg-crisis-800 border border-crisis-600 rounded px-2 py-1.5 text-xs text-center text-white ${
                      !canRegisterCenso ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Discapacidad</label>
                  <input
                    type="number"
                    min="0"
                    disabled={!canRegisterCenso}
                    value={nuevoCenso.personas_discapacidad}
                    onChange={(e) => setNuevoCenso({ ...nuevoCenso, personas_discapacidad: Number(e.target.value) })}
                    className={`w-full mt-1 bg-crisis-800 border border-crisis-600 rounded px-2 py-1.5 text-xs text-center text-white ${
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
                        className="p-3 rounded-xl bg-slate-50 dark:bg-crisis-900 border border-slate-200 dark:border-crisis-700 text-xs space-y-1.5 hover:border-sky-400 dark:hover:border-slate-500 transition shadow-sm"
                      >
                        <div className="flex justify-between items-start font-semibold text-slate-900 dark:text-slate-100">
                          <span className="truncate max-w-[170px]">{f.jefe_familia_nombre || 'Familia'}</span>
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                            {f.codigo_censo}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>CI: {f.jefe_familia_cedula || 'S/N'}</span>
                          {f.telefono_contacto && <span>Tel: {f.telefono_contacto}</span>}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          📍 {f.barrio_sector || f.parroquia || 'Esmeraldas'} • {f.numero_integrantes} integrantes
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-crisis-800 text-[10px]">
                          {(f.ninos_menores_5 > 0 || f.adultos_mayores > 0 || f.personas_discapacidad > 0) ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30">
                              {f.ninos_menores_5 || 0} niños • {f.adultos_mayores || 0} adultos may. • {f.personas_discapacidad || 0} disc.
                            </span>
                          ) : (
                            <span className="text-slate-400">Sin vulnerabilidad reportada</span>
                          )}
                          {f.requiere_evacuacion_inmediata && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-700 dark:text-red-300 font-bold border border-red-500/30">
                              Evacuar
                            </span>
                          )}
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-crisis-800 border border-crisis-700 p-4 rounded-xl shadow">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Red de Bodegas y Centros de Acopio COE
              </h3>
              <p className="text-xs text-slate-400">
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
              <div className="col-span-full text-center py-12 bg-crisis-800 rounded-2xl border border-crisis-700 text-slate-400 text-xs">
                No hay bodegas registradas actualmente.
              </div>
            ) : (
              bodegas.map((bodega) => (
                <div
                  key={bodega.id}
                  className="bg-crisis-800 border border-crisis-700 hover:border-slate-500 rounded-xl p-4 sm:p-5 shadow-lg space-y-3 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        bodega.activo !== false
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}>
                        {bodega.activo !== false ? '● Operativa' : '○ Inactiva'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: #{bodega.id}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">
                      {bodega.nombre}
                    </h4>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-slate-400">Responsable:</span> {bodega.responsable || 'No asignado'}
                      </p>
                      {bodega.telefono && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-slate-400">Teléfono:</span> {bodega.telefono}
                        </p>
                      )}
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-slate-400">Dirección:</span> {bodega.direccion || 'Esmeraldas'}
                      </p>
                    </div>
                  </div>

                  {/* Acciones CRUD si es Gestor o Admin */}
                  {canManageSupplies && (
                    <div className="pt-3 border-t border-crisis-700/80 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditBodega(bodega)}
                        className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-crisis-700 hover:bg-crisis-600 rounded-lg border border-slate-600 flex items-center gap-1 transition"
                      >
                        <Edit className="w-3 h-3 text-sky-400" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBodega(bodega.id)}
                        className="px-2.5 py-1 text-xs text-red-400 hover:text-white bg-crisis-700 hover:bg-red-600 rounded-lg border border-red-500/30 flex items-center gap-1 transition"
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-crisis-800 border border-crisis-700 p-4 rounded-xl shadow">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-sky-400" />
                Catálogo Oficial de Kits y Provisiones Humanitarias
              </h3>
              <p className="text-xs text-slate-400">
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
                className="bg-crisis-800 border border-crisis-700 hover:border-slate-500 rounded-xl p-4 shadow-lg space-y-3 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-crisis-700 text-sky-400 border border-slate-600">
                      {item.codigo_sku}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-300 bg-crisis-700/80 px-2 py-0.5 rounded border border-slate-600">
                      {formatTipoSuministro(item.tipo)}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{item.nombre_suministro}</h4>
                  <p className="text-xs text-slate-400">{item.descripcion}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-crisis-700">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Unidad: {item.unidad_medida}</span>
                    <span className="font-bold text-sky-300">{item.peso_kg} kg</span>
                  </div>

                  {canManageSupplies && (
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-crisis-700/60">
                      <button
                        onClick={() => handleOpenEditKit(item)}
                        className="px-2 py-1 text-[11px] text-slate-300 hover:text-white bg-crisis-700 hover:bg-crisis-600 rounded border border-slate-600 flex items-center gap-1 transition"
                      >
                        <Edit className="w-3 h-3 text-sky-400" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteKit(item.id)}
                        className="px-2 py-1 text-[11px] text-red-400 hover:text-white bg-crisis-700 hover:bg-red-600 rounded border border-red-500/30 flex items-center gap-1 transition"
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
      {/* MODAL FORMULARIO BODEGA (CREAR / EDITAR) */}
      {/* ========================================================================= */}
      {showBodegaModal && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                {editingBodega ? 'Editar Bodega de Acopio' : 'Registrar Nueva Bodega'}
              </h3>
              <button
                onClick={() => setShowBodegaModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBodega} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold">Nombre de la Bodega</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Bodega Central COE - San Rafael"
                  value={bodegaForm.nombre}
                  onChange={(e) => setBodegaForm({ ...bodegaForm, nombre: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold">Responsable Encargado</label>
                  <input
                    type="text"
                    placeholder="ej: Ing. Marcos Quintero"
                    value={bodegaForm.responsable}
                    onChange={(e) => setBodegaForm({ ...bodegaForm, responsable: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold">Teléfono Celular</label>
                  <input
                    type="text"
                    placeholder="ej: 0991234567"
                    value={bodegaForm.telefono}
                    onChange={(e) => setBodegaForm({ ...bodegaForm, telefono: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold">Dirección / Referencia</label>
                <input
                  type="text"
                  placeholder="ej: Av. Kennedy y Olmedo"
                  value={bodegaForm.direccion}
                  onChange={(e) => setBodegaForm({ ...bodegaForm, direccion: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold">Latitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={bodegaForm.lat}
                    onChange={(e) => setBodegaForm({ ...bodegaForm, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold">Longitud GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={bodegaForm.lon}
                    onChange={(e) => setBodegaForm({ ...bodegaForm, lon: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activoBodega"
                  checked={bodegaForm.activo}
                  onChange={(e) => setBodegaForm({ ...bodegaForm, activo: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <label htmlFor="activoBodega" className="text-slate-300 cursor-pointer">
                  Bodega operativa para despacho inmediato
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBodegaModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow"
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
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-sky-400" />
                {editingKit ? 'Editar Suministro / Provisión' : 'Registrar Nuevo Suministro / Provisión'}
              </h3>
              <button
                onClick={() => setShowKitModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold">Código SKU / Identificador</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: UNT-919, KIT-ALIM-3D"
                    value={kitForm.codigo_sku}
                    onChange={(e) => setKitForm({ ...kitForm, codigo_sku: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold">Tipo de Suministro</label>
                  <select
                    value={kitForm.tipo}
                    onChange={(e) => setKitForm({ ...kitForm, tipo: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
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
                <label className="text-slate-300 font-semibold">Nombre del Suministro / Insumo</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Colchones de Espuma, Kit de Alimentos, Bidón de Agua"
                  value={kitForm.nombre_suministro}
                  onChange={(e) => setKitForm({ ...kitForm, nombre_suministro: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold">Unidad de Medida</label>
                  <select
                    value={kitForm.unidad_medida}
                    onChange={(e) => setKitForm({ ...kitForm, unidad_medida: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold"
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
                  <label className="text-slate-300 font-semibold">Peso Aproximado (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={kitForm.peso_kg}
                    onChange={(e) => setKitForm({ ...kitForm, peso_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold">Descripción y Detalle del Suministro</label>
                <textarea
                  rows="2"
                  placeholder="Detalle de provisiones o características técnicas..."
                  value={kitForm.descripcion}
                  onChange={(e) => setKitForm({ ...kitForm, descripcion: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowKitModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow"
                >
                  {editingKit ? 'Guardar Cambios' : 'Crear Suministro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default HumanitarianPage;
