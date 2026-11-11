import React from 'react';
import { Shield, Wifi, WifiOff, RefreshCw, User, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();
  const { theme, toggleTheme, isLight } = useTheme();

  return (
    <header className="bg-white dark:bg-crisis-800 border-b border-slate-200 dark:border-crisis-700 px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-sm z-30 shrink-0">
      {/* Brand & Botón Hamburguesa Móvil */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Botón Hamburguesa (Móviles y Tablets < md) */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-crisis-700 border border-slate-200 dark:border-crisis-600 transition active:scale-95 shadow-sm"
          title={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
          aria-label="Alternar navegación móvil"
        >
          {isSidebarOpen ? <X className="w-5 h-5 text-red-500" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="bg-sky-500/10 p-1.5 sm:p-2 rounded-xl border border-sky-500/30 shrink-0">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500 dark:text-sky-400" />
        </div>

        <div>
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5 sm:gap-2">
            <span className="truncate max-w-[150px] xs:max-w-none">ESMERALDAS RESILIENTE</span>
            <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30 whitespace-nowrap">
              6B • COE
            </span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
            Sistema Integral de Gestión de Riesgos, Clima y Asistencia
          </p>
        </div>
      </div>

      {/* Indicadores de Conexión, Offline Sync y Usuario */}
      <div className="flex items-center space-x-1.5 sm:space-x-3">
        {/* Botón para regresar al Portal de Selección */}
        <Link
          to="/portal"
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold text-[11px] border border-slate-300 dark:border-slate-700 transition shadow-sm"
          title="Cambiar de modo / Volver al portal de bienvenida"
        >
          <span className="text-sky-500 font-black">←</span>
          <span>Portal</span>
        </Link>

        {/* Selector de Tema Claro / Oscuro */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-700/70 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-600 font-semibold transition active:scale-95 shadow-sm"
          title={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        >
          {isLight ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-bold text-slate-800 hidden md:inline">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-300" />
              <span className="text-[11px] font-bold text-slate-200 hidden md:inline">Modo Oscuro</span>
            </>
          )}
        </button>

        {/* Conectividad */}
        <div className="flex items-center space-x-1.5 text-xs">
          {isOnline ? (
            <span className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[10px] sm:text-xs">
              <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Online</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-[10px] sm:text-xs animate-pulse">
              <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Offline</span>
            </span>
          )}

          {pendingCount > 0 && (
            <button
              onClick={syncNow}
              disabled={isSyncing || !isOnline}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-bold text-[10px] sm:text-xs hover:bg-indigo-500/30 transition disabled:opacity-50"
              title="Reportes pendientes por sincronizar"
            >
              <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{pendingCount} pendientes</span>
            </button>
          )}
        </div>

        {/* Perfil & Auth */}
        {isAuthenticated ? (
          <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-crisis-700">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px] hidden sm:block">
                {user?.nombre_completo || user?.first_name || user?.username || user?.telefono || 'Usuario'}
              </p>
              {(() => {
                const r = (user?.rol || '').toUpperCase();
                const u = (user?.username || '').toLowerCase();
                const isAdm = r === 'ADMINISTRADOR' || r === 'ADMIN' || r === 'COE' || r.includes('ADMIN') || r.includes('COE') || u === 'admin';
                const isGes = !isAdm && (r === 'GESTOR' || r.includes('GESTOR') || r.includes('DIRECTOR'));
                const isOpe = !isAdm && !isGes && (r === 'OPERADOR' || r.includes('OPERADOR'));
                const isDig = !isAdm && !isGes && !isOpe && (r === 'DIGITALIZADOR' || r.includes('DIGITAL') || r.includes('CENSO'));

                if (isAdm) {
                  return (
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded border bg-red-100 text-red-900 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30">
                      ADMINISTRADOR
                    </span>
                  );
                }
                if (isGes) {
                  return (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30">
                      GESTOR
                    </span>
                  );
                }
                if (isOpe) {
                  return (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                      OPERADOR
                    </span>
                  );
                }
                if (isDig) {
                  return (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                      DIGITALIZADOR
                    </span>
                  );
                }
                return (
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border bg-slate-100 text-slate-800 border-slate-300 dark:bg-crisis-700 dark:text-slate-300 dark:border-crisis-600">
                    {user?.rol || 'INVITADO'}
                  </span>
                );
              })()}
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-crisis-700 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition shadow"
          >
            <User className="w-3.5 h-3.5" />
            <span>Ingresar</span>
          </Link>
        )}
      </div>
    </header>
  );
};
export default Navbar;

