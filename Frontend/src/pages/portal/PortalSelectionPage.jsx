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
  ChevronRight,
  Activity
} from 'lucide-react';

export const PortalSelectionPage = () => {
  const navigate = useNavigate();

  const handleSelectVisita = () => {
    // Almacenar selección de modo si es necesario y navegar a la Sala de Crisis
    sessionStorage.setItem('portal_mode', 'visita');
    navigate('/sala-crisis');
  };

  const handleSelectCOE = () => {
    // Almacenar selección de modo y dirigir al login oficial de Keycloak / COE
    sessionStorage.setItem('portal_mode', 'coe');
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-slate-950 text-white overflow-x-hidden font-sans selection:bg-sky-500 selection:text-white">
      
      {/* FONDO AMBIENTAL CON DEGRADADOS Y EFECTO RESPLANDOR (GLOW) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-emerald-600/15 rounded-full blur-[150px]" />
        
        {/* Cuadrícula técnica sutil de fondo */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />
      </div>

      {/* HEADER SUPERIOR */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 border border-white/20">
            <Shield className="w-6 h-6 text-sky-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase">
                Esmeraldas Resiliente
              </h1>
              <span className="text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full">
                6B • COE
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">
              Sistema Integral de Gestión de Riesgos, Clima y Asistencia
            </p>
          </div>
        </div>

        {/* Indicador de monitoreo activo en tiempo real */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-xs text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-[11px] text-emerald-400">SALA DE CRISIS ACTIVA</span>
        </div>
      </header>

      {/* CONTENIDO CENTRAL: HERO & 2 CUADRITOS TIPO BLUR */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center items-center text-center">
        
        {/* TÍTULO Y DESCRIPCIÓN PRINCIPAL */}
        <div className="max-w-2xl mb-8 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Portal de Acceso Unificado • Hackathon 2026</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Selecciona tu Perfil de Ingreso
          </h2>
          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
            Elige el modo de navegación para acceder a la Sala de Mando, visor meteorológico de Esmeraldas y modelos analíticos predictivos.
          </p>
        </div>

        {/* ============================================================== */}
        {/* LOS 2 CUADRITOS TIPO BLUR (GLASSMORPHISM) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl">
          
          {/* ------------------------------------------------------------ */}
          {/* CUADRITO 1: VISITA (CIUDADANO / CONSULTA PÚBLICA) */}
          {/* ------------------------------------------------------------ */}
          <div 
            onClick={handleSelectVisita}
            className="group relative flex flex-col items-center justify-between text-center p-6 sm:p-8 rounded-3xl bg-slate-900/50 hover:bg-slate-900/75 backdrop-blur-2xl border border-white/10 hover:border-sky-400/50 shadow-2xl hover:shadow-sky-500/20 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer"
          >
            {/* Resplandor decorativo interno */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-3xl" />

            <div className="w-full flex flex-col items-center">
              {/* Badge superior */}
              <div className="mb-5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-300 bg-sky-500/15 border border-sky-500/30 px-3 py-1 rounded-full">
                <Eye className="w-3 h-3 text-sky-400" />
                <span>Acceso Público y Libre</span>
              </div>

              {/* Avatar: Persona sin gorra (Visitante) */}
              <div className="relative mb-6">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-gradient-to-b from-sky-500/20 to-slate-900 p-2 border-2 border-sky-400/40 shadow-xl group-hover:border-sky-300 group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
                  <img 
                    src="/avatars/avatar_visita.png" 
                    alt="Perfil Visitante"
                    className="w-full h-full object-cover rounded-full bg-white/5"
                  />
                </div>
                <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-lg border-2 border-slate-900">
                  <Eye className="w-4 h-4" />
                </div>
              </div>

              {/* Título y descripción */}
              <h3 className="text-lg sm:text-xl font-black text-white mb-2 group-hover:text-sky-300 transition-colors">
                Modo Visitante
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6 px-2">
                Consulta en vivo la Sala de Crisis, el radar del clima, el visor de albergues y el Asistente de IA Predictiva <strong>sin necesidad de iniciar sesión</strong>.
              </p>

              {/* Píldoras de características */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-6 text-[11px] text-slate-400">
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 flex items-center gap-1">
                  <Map className="w-3 h-3 text-sky-400" /> Mapa Satelital
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-sky-400" /> Clima en Vivo
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 flex items-center gap-1">
                  <BrainCircuit className="w-3 h-3 text-sky-400" /> IA COE
                </span>
              </div>
            </div>

            {/* BOTÓN: VISITA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectVisita();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-sm tracking-widest uppercase shadow-lg shadow-sky-600/30 group-hover:shadow-sky-500/50 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>VISITA</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* CUADRITO 2: COE / GESTION DE RIESGO (PERSONAL INSTITUCIONAL) */}
          {/* ------------------------------------------------------------ */}
          <div 
            onClick={handleSelectCOE}
            className="group relative flex flex-col items-center justify-between text-center p-6 sm:p-8 rounded-3xl bg-slate-900/50 hover:bg-slate-900/75 backdrop-blur-2xl border border-white/10 hover:border-emerald-400/50 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer"
          >
            {/* Resplandor decorativo interno */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-3xl" />

            <div className="w-full flex flex-col items-center">
              {/* Badge superior */}
              <div className="mb-5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Acceso Restringido COE</span>
              </div>

              {/* Avatar: Trabajador con gorra y credencial (Operativo / COE) */}
              <div className="relative mb-6">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-gradient-to-b from-emerald-500/20 to-slate-900 p-2 border-2 border-emerald-400/40 shadow-xl group-hover:border-emerald-300 group-hover:scale-105 transition-all duration-300 flex items-center justify-center">
                  <img 
                    src="/avatars/avatar_coe.png" 
                    alt="Perfil Operador COE"
                    className="w-full h-full object-cover rounded-full bg-white/5"
                  />
                </div>
                <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-slate-900">
                  <Shield className="w-4 h-4" />
                </div>
              </div>

              {/* Título y descripción */}
              <h3 className="text-lg sm:text-xl font-black text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Personal Oficial COE
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6 px-2">
                Acceso para <strong>Administradores, Gestores, Operadores y Digitalizadores</strong> para despacho de emergencias, control de suministros y censo de campo con <strong>Keycloak IAM</strong>.
              </p>

              {/* Píldoras de características */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-6 text-[11px] text-slate-400">
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400" /> Despacho 911
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-400" /> Censo de Albergues
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> Keycloak SSO
                </span>
              </div>
            </div>

            {/* BOTÓN: COE / GESTION DE RIESGO */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectCOE();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 text-white font-black text-sm tracking-widest uppercase shadow-lg shadow-emerald-600/30 group-hover:shadow-emerald-500/50 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
            >
              <span>COE / GESTION DE RIESGO</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </main>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="relative z-10 w-full border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-[11px] text-slate-400">
          <div>
            <span>© 2026 Alcaldía del Cantón Esmeraldas • Comité de Operaciones de Emergencia (COE Cantonal)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Universidad Técnica Luis Vargas Torres (UTLVTE)</span>
            <span>•</span>
            <span className="text-sky-400 font-medium">Hackathon Esmeraldas Resiliente 2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PortalSelectionPage;
