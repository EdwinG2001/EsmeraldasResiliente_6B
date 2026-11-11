import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  MapPin, 
  AlertTriangle, 
  Home, 
  HeartHandshake, 
  Layers,
  ShieldAlert,
  PhoneCall,
  Clock,
  RefreshCw,
  CheckCircle2,
  Flame,
  Droplets,
  Mountain,
  Bot,
  Megaphone,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import { EmergencyContactsModal } from '../common/EmergencyContactsModal';

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const [showContactsModal, setShowContactsModal] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Estado del acordeón del submenú de incidentes (abierto por defecto, colapsable/expandible por el usuario)
  const [incidentesMenuOpen, setIncidentesMenuOpen] = useState(true);

  const navItems = [
    {
      to: '/sala-crisis',
      label: 'Sala de Crisis (COE)',
      icon: Activity,
      badge: 'En Vivo',
    },
    {
      to: '/incidentes',
      label: 'Seguimiento Incidentes',
      icon: ShieldAlert,
    },
    {
      to: '/reportes',
      label: 'Reporte Comunitario',
      icon: AlertTriangle,
    },
    {
      to: '/albergues',
      label: 'Albergues y Evacuación',
      icon: Home,
    },
    {
      to: '/humanitaria',
      label: 'Censo y Asistencia',
      icon: HeartHandshake,
    },
  ];

  // Filtros de estado solicitados por el usuario
  const incidentStatusFilters = [
    {
      paramKey: '',
      paramValue: '',
      label: 'Todos los Incidentes',
      icon: ShieldAlert,
      iconColor: 'text-slate-700 dark:text-slate-300',
      activeClass: 'bg-slate-200 text-slate-950 dark:bg-crisis-700 dark:text-white font-bold border border-slate-300 dark:border-crisis-600 shadow-sm',
    },
    {
      paramKey: 'estado',
      paramValue: 'PENDIENTE',
      label: 'Pendientes',
      icon: Clock,
      iconColor: 'text-amber-500',
      activeClass: 'bg-amber-100 text-amber-950 dark:bg-amber-500/20 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-500/40 shadow-sm',
    },
    {
      paramKey: 'estado',
      paramValue: 'EN_PROCESO',
      label: 'En Proceso',
      icon: RefreshCw,
      iconColor: 'text-sky-500',
      activeClass: 'bg-sky-100 text-sky-950 dark:bg-sky-500/20 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-500/40 shadow-sm',
    },
    {
      paramKey: 'estado',
      paramValue: 'ATENDIDO',
      label: 'Atendidos',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      activeClass: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-500/40 shadow-sm',
    },
  ];

  // Categorías de incidentes solicitadas para visualizar debajo del botón
  const incidentCategoryFilters = [
    {
      paramKey: 'gravedad',
      paramValue: 'CRITICO',
      label: 'Nivel Crítico',
      icon: Flame,
      iconColor: 'text-red-500',
      activeClass: 'bg-red-100 text-red-950 dark:bg-red-500/20 dark:text-red-300 font-bold border border-red-300 dark:border-red-500/40 shadow-sm',
    },
    {
      paramKey: 'categoria',
      paramValue: 'INUNDACION',
      label: 'Inundaciones / Ríos',
      icon: Droplets,
      iconColor: 'text-blue-500',
      activeClass: 'bg-blue-100 text-blue-950 dark:bg-blue-500/20 dark:text-blue-300 font-bold border border-blue-300 dark:border-blue-500/40 shadow-sm',
    },
    {
      paramKey: 'categoria',
      paramValue: 'DESLAVE',
      label: 'Deslaves / Taludes',
      icon: Mountain,
      iconColor: 'text-amber-600',
      activeClass: 'bg-amber-100 text-amber-950 dark:bg-amber-500/20 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-500/40 shadow-sm',
    },
    {
      paramKey: 'origen',
      paramValue: 'CIUDADANO',
      label: 'Reportes Ciudadanos',
      icon: Megaphone,
      iconColor: 'text-sky-600',
      activeClass: 'bg-sky-100 text-sky-950 dark:bg-sky-500/20 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-500/40 shadow-sm',
    },
    {
      paramKey: 'origen',
      paramValue: 'SIMULACION',
      label: 'Simulaciones IA COE',
      icon: Bot,
      iconColor: 'text-purple-500',
      activeClass: 'bg-purple-100 text-purple-950 dark:bg-purple-500/20 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-500/40 shadow-sm',
    },
    {
      paramKey: 'agrupados',
      paramValue: 'true',
      label: 'Agrupados por Zona (25m)',
      icon: Layers,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      activeClass: 'bg-indigo-100 text-indigo-950 dark:bg-indigo-500/20 dark:text-indigo-300 font-bold border border-indigo-300 dark:border-indigo-500/40 shadow-sm',
    },
  ];

  const renderNavContent = (isMobile = false) => (
    <div className="p-4 space-y-6 flex-1 overflow-y-auto">
      <div>
        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
          Módulos del Sistema
        </p>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isIncidentesModule = item.to === '/incidentes';
            const isCurrentPage = location.pathname === item.to;

            return (
              <div key={item.to} className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => {
                      if (isIncidentesModule && !incidentesMenuOpen) {
                        setIncidentesMenuOpen(true);
                      }
                      if (isMobile) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex-1 flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition ${
                        isActive
                          ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 font-bold shadow-sm'
                          : 'text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-crisis-700/60 hover:text-slate-950 dark:hover:text-white font-semibold'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
                      <span>{item.label}</span>
                    </div>

                    {item.badge === 'En Vivo' && (
                      <span className="relative flex h-2.5 w-2.5 items-center justify-center mr-1" title="Sistema Activo en Tiempo Real">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-sm shadow-emerald-400"></span>
                      </span>
                    )}
                  </NavLink>

                  {isIncidentesModule && (
                    <button
                      type="button"
                      onClick={() => setIncidentesMenuOpen(!incidentesMenuOpen)}
                      className="p-2 rounded-lg text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-700 transition"
                      title={incidentesMenuOpen ? "Ocultar filtros y categorías" : "Mostrar filtros y categorías"}
                      aria-label="Alternar acordeón"
                    >
                      {incidentesMenuOpen ? (
                        <ChevronDown className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  )}
                </div>

                {/* LISTA EXPANDIBLE DEBAJO DE SEGUIMIENTO INCIDENTES */}
                {isIncidentesModule && incidentesMenuOpen && (
                  <div className="ml-3 pl-3 border-l-2 border-sky-300 dark:border-sky-600/70 my-1.5 space-y-2 py-1">
                    {/* Sub-grupo: Filtros de Estado */}
                    <div>
                      <p className="text-[10px] uppercase font-extrabold text-slate-600 dark:text-slate-400 px-2 py-0.5 tracking-wider">
                        Filtros de Estado
                      </p>
                      <div className="space-y-0.5 mt-1">
                        {incidentStatusFilters.map((sub) => {
                          const isSubActive = isCurrentPage && (
                            sub.paramKey
                              ? searchParams.get(sub.paramKey) === sub.paramValue
                              : (!searchParams.get('estado') && !searchParams.get('gravedad') && !searchParams.get('categoria') && !searchParams.get('origen') && !searchParams.get('agrupados'))
                          );
                          const SubIcon = sub.icon;

                          return (
                            <button
                              key={sub.label}
                              onClick={() => {
                                if (sub.paramKey) {
                                  navigate(`/incidentes?${sub.paramKey}=${sub.paramValue}`);
                                } else {
                                  navigate('/incidentes');
                                }
                                if (isMobile) onClose();
                              }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition ${
                                isSubActive
                                  ? sub.activeClass
                                  : 'text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-crisis-700/60 hover:text-slate-950 dark:hover:text-white font-semibold'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <SubIcon className={`w-3.5 h-3.5 shrink-0 ${sub.iconColor}`} />
                                <span className="truncate">{sub.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sub-grupo: Categorías y Gravedad */}
                    <div className="pt-1.5 border-t border-slate-200 dark:border-crisis-700/70">
                      <p className="text-[10px] uppercase font-extrabold text-slate-600 dark:text-slate-400 px-2 py-0.5 tracking-wider">
                        Categorías
                      </p>
                      <div className="space-y-0.5 mt-1">
                        {incidentCategoryFilters.map((cat) => {
                          const isCatActive = isCurrentPage && (
                            searchParams.get(cat.paramKey) === cat.paramValue
                          );
                          const CatIcon = cat.icon;

                          return (
                            <button
                              key={cat.label}
                              onClick={() => {
                                navigate(`/incidentes?${cat.paramKey}=${cat.paramValue}`);
                                if (isMobile) onClose();
                              }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition ${
                                isCatActive
                                  ? cat.activeClass
                                  : 'text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-crisis-700/60 hover:text-slate-950 dark:hover:text-white font-semibold'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <CatIcon className={`w-3.5 h-3.5 shrink-0 ${cat.iconColor}`} />
                                <span className="truncate">{cat.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Resumen de Datos Activos */}
      <div className="bg-slate-50 dark:bg-crisis-900/60 p-3 rounded-lg border border-slate-200 dark:border-crisis-700 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-300 font-semibold">
          <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Base Espacial Activa</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          Aiven PostGIS (EPSG:4326) conectado. Polígonos de susceptibilidad y ríos Teaone/Esmeraldas cargados.
        </p>
      </div>

      {/* Botón: Cambiar Perfil / Portal de Entrada */}
      <div>
        <NavLink
          to="/portal"
          onClick={() => { if (isMobile) onClose(); }}
          className="w-full mb-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700/80 flex items-center justify-between transition active:scale-95 group"
          title="Regresar a la pantalla de selección de perfil"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-sky-500 group-hover:rotate-12 transition-transform" />
            <span>Cambiar Perfil / Portal</span>
          </div>
          <span className="text-[9px] bg-sky-500/10 text-sky-500 border border-sky-500/20 px-1.5 py-0.2 rounded font-mono font-bold">
            INICIO
          </span>
        </NavLink>
      </div>

      {/* Botón Destacado: Contactos de Emergencia (Directorio Rápido) */}
      <div>
        <button
          onClick={() => {
            setShowContactsModal(true);
            if (isMobile) onClose();
          }}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-red-600/90 to-rose-700/90 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/20 border border-red-500/30 flex items-center justify-between transition active:scale-95 group"
        >
          <div className="flex items-center gap-2.5">
            <PhoneCall className="w-4 h-4 text-white group-hover:animate-bounce" />
            <span>Contactos de Emergencia</span>
          </div>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase">
            COE
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. SIDEBAR DE ESCRITORIO Y TABLETS GRANDES (MD+) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-crisis-800 border-r border-slate-200 dark:border-crisis-700 flex-col justify-between shrink-0 h-full overflow-y-auto">
        {renderNavContent(false)}
        <div className="p-4 border-t border-slate-200 dark:border-crisis-700 text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Municipio de Esmeraldas • COE Cantonal
        </div>
      </aside>

      {/* 2. DRAWER DE NAVEGACIÓN MÓVIL (PANTALLAS PEQUEÑAS < MD) */}
      {isOpen && (
        <div className="fixed inset-0 z-[1200] md:hidden">
          {/* Telón de Fondo Oscuro con Desenfoque */}
          <div 
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Menú Deslizante */}
          <aside className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-crisis-800 border-r border-slate-200 dark:border-crisis-700 z-[1201] flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="p-3.5 border-b border-slate-200 dark:border-crisis-700 flex items-center justify-between bg-slate-50 dark:bg-crisis-900/60">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Navegación COE</span>
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-crisis-700 transition"
                title="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderNavContent(true)}

            <div className="p-3 border-t border-slate-200 dark:border-crisis-700 text-center text-[11px] text-slate-500 font-medium bg-slate-50 dark:bg-crisis-900/60">
              Municipio de Esmeraldas • COE Cantonal
            </div>
          </aside>
        </div>
      )}

      {/* Modal Directorio de Emergencia */}
      <EmergencyContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />
    </>
  );
};
export default Sidebar;

