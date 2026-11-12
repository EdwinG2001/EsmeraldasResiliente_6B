import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Eye, 
  Lock, 
  ArrowRight, 
  Radio, 
  CloudRain, 
  Map, 
  BrainCircuit, 
  Users, 
  Sparkles,
  MapPin,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// ============================================================================
// AVATARES VECTORIALES SVG DE ALTA FIDELIDAD (100% AUTOCONTENIDOS)
// ============================================================================

// 1. Avatar Visitante / Ciudadano (Sin gorra - silueta estilizada amigable)
const VisitorAvatar = () => (
  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
    <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-600/30 via-blue-500/20 to-indigo-600/30 p-1 border-2 border-sky-400/50 shadow-lg shadow-sky-500/20 flex items-center justify-center group-hover:scale-105 group-hover:border-sky-300 transition-all duration-300 backdrop-blur-md">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full rounded-full overflow-hidden"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="visHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="visBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="visBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Fondo del avatar */}
        <circle cx="50" cy="50" r="48" fill="url(#visBgGrad)" />
        {/* Cabeza sin gorra (silueta limpia humana) */}
        <circle cx="50" cy="34" r="16" fill="url(#visHeadGrad)" />
        {/* Espacio del cuello */}
        <rect x="46" y="48" width="8" height="6" rx="3" fill="#38bdf8" opacity="0.8" />
        {/* Torso / Hombros suaves */}
        <path
          d="M22 84 C22 65 34 56 50 56 C66 56 78 65 78 84 C78 87 75 89 71 89 H29 C25 89 22 87 22 84 Z"
          fill="url(#visBodyGrad)"
        />
      </svg>
    </div>
    {/* Badge flotante inferior */}
    <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shadow-md border-2 border-slate-900 group-hover:scale-110 transition-transform">
      <Eye className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
    </div>
  </div>
);

// 2. Avatar Personal COE / Rescate (Con gorra táctica y uniforme oficial)
const CoeOfficialAvatar = () => (
  <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
    <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-600/30 via-teal-500/20 to-emerald-700/30 p-1 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20 flex items-center justify-center group-hover:scale-105 group-hover:border-emerald-300 transition-all duration-300 backdrop-blur-md">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full rounded-full overflow-hidden"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="coeHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="coeCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="coeBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="coeBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064e3b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Fondo del avatar */}
        <circle cx="50" cy="50" r="48" fill="url(#coeBgGrad)" />
        {/* Rostro debajo de la visera */}
        <circle cx="50" cy="38" r="14" fill="url(#coeHeadGrad)" opacity="0.95" />
        
        {/* GORRA INSTITUCIONAL COE (Copa curvada y visera prominente) */}
        <path
          d="M34 32 C34 21 41 17 50 17 C59 17 66 21 66 32 Z"
          fill="url(#coeCapGrad)"
        />
        {/* Visera frontal de la gorra */}
        <path
          d="M45 31 C56 30 68 30 76 33 C78 34 77 36 73 36.5 C64 37 52 37 45 34 Z"
          fill="#022c22"
        />
        {/* Insignia dorada en el centro de la gorra */}
        <circle cx="50" cy="25" r="2.2" fill="#f59e0b" />

        {/* Torso con uniforme táctico y chaleco COE */}
        <path
          d="M22 84 C22 65 34 56 50 56 C66 56 78 65 78 84 C78 87 75 89 71 89 H29 C25 89 22 87 22 84 Z"
          fill="url(#coeBodyGrad)"
        />
        {/* Cintas reflectivas del chaleco de emergencias */}
        <path
          d="M43 56 L50 67 L57 56"
          stroke="#34d399"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Credencial oficial COE */}
        <rect x="47" y="68" width="6" height="8" rx="1.5" fill="#f59e0b" />
      </svg>
    </div>
    {/* Badge flotante inferior */}
    <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md border-2 border-slate-900 group-hover:scale-110 transition-transform">
      <Shield className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
    </div>
  </div>
);

// ============================================================================
// PANTALLA PRINCIPAL: PORTAL DE SELECCIÓN (CERO SCROLL EN LAPTOPS Y MONITORES)
// ============================================================================
export const PortalSelectionPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const handleSelectVisita = () => {
    sessionStorage.setItem('portal_mode', 'visita');
    navigate('/sala-crisis');
  };

  const handleSelectCOE = () => {
    sessionStorage.setItem('portal_mode', 'coe');
    navigate('/login');
  };

  return (
    <div className="h-screen max-h-screen w-full flex flex-col justify-between bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white overflow-y-auto md:overflow-hidden font-sans selection:bg-sky-500 selection:text-white select-none transition-colors duration-200">
      
      {/* FONDO AMBIENTAL CON DEGRADADOS Y EFECTO RESPLANDOR (GLOW) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-sky-500/15 dark:bg-sky-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[110px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/15 rounded-full blur-[120px]" />
        
        {/* Cuadrícula técnica sutil */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* HEADER SUPERIOR COMPACTO */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 border border-white/20">
            <Shield className="w-5 h-5 text-sky-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase">
                Esmeraldas Resiliente
              </h1>
              <span className="text-[9px] font-mono font-bold bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 dark:border-sky-500/40 px-1.5 py-0.2 rounded-full">
                6B • COE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Sistema Integral de Gestión de Riesgos, Clima y Asistencia
            </p>
          </div>
        </div>

        {/* Controles de cabecera: Toggle de Tema e Indicador de monitoreo activo */}
        <div className="flex items-center gap-2.5">
          {/* Botón Selector de Tema Claro/Oscuro */}
          <button
            onClick={toggleTheme}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-[11px] font-bold shadow-sm transition active:scale-95"
            title={isLight ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Modo Oscuro</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Modo Claro</span>
              </>
            )}
          </button>

          {/* Indicador de monitoreo activo en tiempo real */}
          <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Sala de Crisis Activa
            </span>
          </div>
        </div>
      </header>

      {/* CONTENIDO CENTRAL: HERO COMPACTO & 2 CUADRITOS GLASS */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-1 sm:py-2 flex-1 flex flex-col justify-center items-center text-center">
        
        {/* TÍTULO Y DESCRIPCIÓN PRINCIPAL (MEDIDAS OPTIMIZADAS) */}
        <div className="max-w-xl mb-3 sm:mb-5 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] sm:text-[11px] font-semibold mb-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Portal de Acceso Unificado • Hackathon 2026</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Selecciona tu Perfil de Ingreso
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300/90 leading-relaxed">
            Elige el modo de navegación para acceder a la Sala de Mando o despacho operativo.
          </p>
        </div>

        {/* ============================================================== */}
        {/* LOS 2 CUADRITOS TIPO GLASS (RESPONSIVE SIN SCROLL EN AMBOS TEMAS) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl">
          
          {/* ------------------------------------------------------------ */}
          {/* CUADRITO 1: VISITA (CIUDADANO / CONSULTA PÚBLICA) */}
          {/* ------------------------------------------------------------ */}
          <div 
            onClick={handleSelectVisita}
            className="group relative flex flex-col justify-between text-center p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900/85 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 hover:border-sky-500/60 dark:hover:border-sky-400/50 shadow-lg dark:shadow-xl hover:shadow-sky-500/15 dark:hover:shadow-sky-500/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            {/* Resplandor decorativo interno */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />

            <div className="w-full flex flex-col items-center">
              {/* Badge superior */}
              <div className="mb-2.5 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/30 px-2.5 py-0.5 rounded-full">
                <Eye className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400" />
                <span>Acceso Público y Libre</span>
              </div>

              {/* Avatar Vectorial: Persona sin gorra (Visitante / Ciudadano) */}
              <div className="mb-2.5">
                <VisitorAvatar />
              </div>

              {/* Título y descripción breve */}
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                Modo Visitante
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-snug mb-3 px-1">
                Consulta en vivo el mapa de eventos, el radar del clima y envía reportes ciudadanos <strong className="text-slate-800 dark:text-slate-100">sin necesidad de iniciar sesión</strong>.
              </p>

              {/* Píldoras de características */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-3 text-[10px] text-slate-600 dark:text-slate-400">
                <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1 font-medium">
                  <Map className="w-3 h-3 text-sky-500" /> Mapa de Eventos
                </span>
                <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1 font-medium">
                  <CloudRain className="w-3 h-3 text-sky-500" /> Radar Clima
                </span>
                <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1 font-medium">
                  <BrainCircuit className="w-3 h-3 text-sky-500" /> IA Predictiva
                </span>
              </div>
            </div>

            {/* BOTÓN: VISITA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectVisita();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-md shadow-sky-600/30 group-hover:shadow-sky-500/50 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>VISITA</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* CUADRITO 2: COE / GESTION DE RIESGO (PERSONAL OFICIAL) */}
          {/* ------------------------------------------------------------ */}
          <div 
            onClick={handleSelectCOE}
            className="group relative flex flex-col justify-between text-center p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900/85 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 hover:border-emerald-500/60 dark:hover:border-emerald-400/50 shadow-lg dark:shadow-xl hover:shadow-emerald-500/15 dark:hover:shadow-emerald-500/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            {/* Resplandor decorativo interno */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />

            <div className="w-full flex flex-col items-center">
              {/* Badge superior */}
              <div className="mb-2.5 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <Lock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                <span>Acceso Restringido COE</span>
              </div>

              {/* Avatar Vectorial: Trabajador con gorra táctica (Personal Oficial COE) */}
              <div className="mb-2.5">
                <CoeOfficialAvatar />
              </div>

              {/* Título y descripción breve */}
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                Personal Oficial COE
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-snug mb-3 px-1">
                Acceso para <strong className="text-slate-800 dark:text-slate-100">Administradores, Gestores y Operadores</strong>: despacho de incidentes, albergues y censo humanitario con <strong className="text-slate-800 dark:text-slate-100">Keycloak IAM</strong>.
              </p>

              {/* Píldoras de características */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-3 text-[10px] text-slate-600 dark:text-slate-400">
                <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1 font-medium">
                  <Radio className="w-3 h-3 text-emerald-500" /> Despacho COE
                </span>
                <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1 font-medium">
                  <Users className="w-3 h-3 text-emerald-500" /> Censo y Ayuda
                </span>
                <span className="bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3 text-emerald-500" /> Keycloak SSO
                </span>
              </div>
            </div>

            {/* BOTÓN: COE / GESTION DE RIESGO */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectCOE();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-md shadow-emerald-600/30 group-hover:shadow-emerald-500/50 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>COE / GESTION DE RIESGO</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </main>

      {/* FOOTER INSTITUCIONAL ULTRA COMPACTO */}
      <footer className="relative z-10 w-full border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-1.5 sm:py-2 px-4 sm:px-6 shrink-0 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
          <div>
            <span>© 2026 Alcaldía del Cantón Esmeraldas • COE Cantonal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-slate-500 dark:text-slate-400">
            <span>Universidad Técnica Luis Vargas Torres (UTLVTE)</span>
            <span>•</span>
            <span className="text-sky-600 dark:text-sky-400 font-medium">Hackathon Esmeraldas Resiliente 2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PortalSelectionPage;
