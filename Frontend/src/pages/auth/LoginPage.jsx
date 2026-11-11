import React, { useState, useEffect } from 'react';
import { Shield, Lock, Phone, ArrowRight, ArrowLeft, AlertCircle, Key, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { login, loginWithKeycloakToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Si ya está autenticado, redirigir automáticamente a la Sala de Crisis
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/sala-crisis', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Detección automática del Token OIDC retornado por Keycloak (OAuth2 Implicit / Token Flow)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      try {
        const params = new URLSearchParams(hash.replace('#', ''));
        const kcToken = params.get('access_token');
        if (kcToken) {
          // Decodificar payload RS256 de Keycloak
          const base64Url = kcToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);

          const realmRoles = payload.realm_access?.roles || [];
          const clientRoles = Object.values(payload.resource_access || {}).flatMap((c) => c?.roles || []);
          const groupRoles = (payload.groups || []).map((g) => g.replace(/^\//, ''));
          const directRoles = Array.isArray(payload.roles) ? payload.roles : (payload.role ? [payload.role] : []);
          const allRoles = [...realmRoles, ...clientRoles, ...groupRoles, ...directRoles].map((r) => String(r).toUpperCase());
          const preferredUsername = (payload.preferred_username || '').toLowerCase();
          
          const matchRole = (...targets) => allRoles.some((r) => targets.some((t) => r === t || r.includes(t)));

          let rol = 'INVITADO';
          if (matchRole('ADMIN', 'COE', 'SUPERUSER') || preferredUsername === 'admin') {
            rol = 'ADMINISTRADOR';
          } else if (matchRole('GESTOR', 'DIRECTOR')) {
            rol = 'GESTOR';
          } else if (matchRole('OPERADOR', 'OPERADOR_COE', 'OPERADOR-COE')) {
            rol = 'OPERADOR';
          } else if (matchRole('DIGITALIZADOR', 'CENSADOR', 'CENSO')) {
            rol = 'DIGITALIZADOR';
          } else if (matchRole('INVITADO')) {
            rol = 'INVITADO';
          } else if (matchRole('CIUDADANO')) {
            rol = 'CIUDADANO';
          }

          const kcUser = {
            id: payload.sub,
            username: payload.preferred_username || payload.email,
            nombre_completo: (rol === 'ADMINISTRADOR' || preferredUsername === 'admin') 
              ? 'Administrador COE' 
              : (payload.name || payload.preferred_username || `Usuario ${rol}`),
            email: payload.email,
            rol: rol,
            is_staff: rol === 'ADMINISTRADOR' || rol === 'GESTOR' || rol === 'OPERADOR',
            is_superuser: rol === 'ADMINISTRADOR',
          };

          loginWithKeycloakToken(kcToken, kcUser);
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/sala-crisis');
        }
      } catch (e) {
        console.error('Error decodificando token Keycloak:', e);
        setError('Error al procesar la sesión de Keycloak.');
      }
    }
  }, [navigate, loginWithKeycloakToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
      navigate('/sala-crisis');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Credenciales no válidas. Ingrese su número celular o usuario registrado.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeycloakLogin = () => {
    const kcBaseUrl = 'https://innocent-arrivals-sec-penetration.trycloudflare.com';
    const realm = 'esmeraldas-resiliente';
    const clientId = 'frontend-web';
    const redirectUri = window.location.origin + '/login';
    const authUrl = `${kcBaseUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&response_type=token&scope=openid%20profile%20email&prompt=login&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-950 text-white font-sans selection:bg-sky-500 selection:text-white relative overflow-x-hidden select-none">
      
      {/* FONDO AMBIENTAL CON DEGRADADOS Y EFECTO RESPLANDOR (GLOW) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-sky-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[110px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px]" />
        
        {/* Cuadrícula técnica sutil */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* HEADER SUPERIOR: LOGO Y BOTÓN VOLVER AL PORTAL */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 border border-white/20">
            <Shield className="w-5 h-5 text-sky-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase">
                Esmeraldas Resiliente
              </h1>
              <span className="text-[9px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded-full">
                6B • COE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Sistema Integral de Gestión de Riesgos, Clima y Asistencia
            </p>
          </div>
        </div>

        {/* Botón Volver al Portal para Cambiar de Perfil */}
        <button
          onClick={() => navigate('/portal')}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-sky-400 text-xs font-bold transition shadow-sm active:scale-95 group"
          title="Regresar a la selección de perfil (Visitante / COE)"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-sky-400 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Portal</span>
        </button>
      </header>

      {/* CONTENIDO CENTRAL: TARJETA DE LOGIN */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 py-4 sm:py-6">
        <div className="max-w-md w-full bg-slate-900/70 border border-slate-800/80 backdrop-blur-2xl rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4">
          <div className="text-center space-y-1.5">
            <div className="inline-flex p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-400 shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
              Acceso al Sistema COE
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Plataforma de Mando y Respuesta a Emergencias de Esmeraldas
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Número Celular o Usuario
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="ej: admin o 0991234567"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 font-bold text-white text-xs sm:text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 disabled:opacity-50 active:scale-95"
            >
              <span>{loading ? 'Validando credenciales...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Separador OIDC */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-slate-900 px-2 text-slate-400 uppercase tracking-widest font-bold">
                O autentícate mediante
              </span>
            </div>
          </div>

          {/* Botón Acceso Centralizado con Keycloak IAM */}
          <button
            type="button"
            onClick={handleKeycloakLogin}
            className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950/90 hover:bg-slate-950 border border-sky-500/40 hover:border-sky-400 text-sky-400 hover:text-sky-300 text-xs font-bold transition flex items-center justify-center gap-2 shadow-md group"
          >
            <Key className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />
            <span>Ingresar con Keycloak IAM (Single Sign-On)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
          </button>

          {/* Acceso Rápido por Roles para Evaluación de Hackathon */}
          <div className="pt-2 border-t border-slate-800">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
              Perfiles de Prueba Rápidos (Hackathon 6B)
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
              <button
                type="button"
                onClick={() => {
                  setUsername('admin');
                  setPassword('Esmeraldas2026*');
                }}
                className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-950 border border-red-500/30 text-red-300 text-left transition flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                <span className="truncate">👑 Admin COE</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('antonella123@gmail.com');
                  setPassword('123antonella');
                }}
                className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-950 border border-purple-500/30 text-purple-300 text-left transition flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                <span className="truncate">🛡️ Antonella (Gestor)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('axelrosero123@gmail.com');
                  setPassword('123Axel');
                }}
                className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-950 border border-amber-500/30 text-amber-300 text-left transition flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <span className="truncate">⚡ Axel (Operador)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsername('jomira123@gmail.com');
                  setPassword('Jomira123');
                }}
                className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-950 border border-emerald-500/30 text-emerald-300 text-left transition flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="truncate">📋 Jomira (Digitalizador)</span>
              </button>
            </div>
          </div>

          {/* Enlace para regresar al portal */}
          <div className="text-center pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/portal')}
              className="text-xs text-slate-400 hover:text-sky-300 transition underline underline-offset-4"
            >
              ¿Deseas cambiar de modo? Volver al Portal de Perfiles
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="relative z-10 w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-1.5 sm:py-2 px-4 sm:px-6 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left text-[10px] sm:text-[11px] text-slate-400">
          <div>
            <span>© 2026 Alcaldía del Cantón Esmeraldas • COE Cantonal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-slate-400">
            <span>Universidad Técnica Luis Vargas Torres (UTLVTE)</span>
            <span>•</span>
            <span className="text-sky-400 font-medium">Hackathon Esmeraldas Resiliente 2026</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LoginPage;
