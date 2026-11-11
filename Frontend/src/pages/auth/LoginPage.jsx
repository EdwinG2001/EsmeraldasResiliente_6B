import React, { useState, useEffect } from 'react';
import { Shield, Lock, Phone, ArrowRight, AlertCircle, Key, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { login, loginWithKeycloakToken } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-md w-full bg-crisis-800 border border-crisis-700 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Acceso al Sistema COE
          </h2>
          <p className="text-xs text-slate-400">
            Plataforma de Mando y Respuesta a Emergencias de Esmeraldas
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
              Número Celular o Usuario
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="ej: 0991234567 o Antonella123@gmail.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-crisis-900 border border-crisis-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
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
                className="w-full bg-crisis-900 border border-crisis-600 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-500 font-bold text-white text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <span>{loading ? 'Validando...' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Separador OIDC */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-crisis-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-crisis-800 px-3 text-slate-400 font-medium">O autentícate mediante</span>
          </div>
        </div>

        {/* Botón Acceso Centralizado con Keycloak IAM */}
        <button
          type="button"
          onClick={handleKeycloakLogin}
          className="w-full py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-950 border border-sky-500/40 hover:border-sky-400 text-sky-400 hover:text-sky-300 text-xs font-bold transition flex items-center justify-center gap-2.5 shadow-md group"
        >
          <Key className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />
          <span>Ingresar con Keycloak IAM (Single Sign-On)</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
        </button>

        {/* Acceso Rápido por Roles para Evaluación de Hackathon */}
        <div className="pt-2 border-t border-crisis-700/80">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Perfiles de Prueba Rápidos (Hackathon 6B)
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('Esmeraldas2026*');
              }}
              className="p-1.5 rounded-lg bg-crisis-900 hover:bg-crisis-950 border border-red-500/30 text-red-300 text-left transition flex items-center gap-1.5"
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
              className="p-1.5 rounded-lg bg-crisis-900 hover:bg-crisis-950 border border-purple-500/30 text-purple-300 text-left transition flex items-center gap-1.5"
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
              className="p-1.5 rounded-lg bg-crisis-900 hover:bg-crisis-950 border border-amber-500/30 text-amber-300 text-left transition flex items-center gap-1.5"
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
              className="p-1.5 rounded-lg bg-crisis-900 hover:bg-crisis-950 border border-emerald-500/30 text-emerald-300 text-left transition flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">📋 Jomira (Digitalizador)</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-crisis-700">
          <p className="text-[11px] text-slate-500">
            ¿Eres ciudadano y necesitas reportar una emergencia? Puedes usar el módulo de reporte comunitario sin iniciar sesión.
          </p>
        </div>
      </div>
    </div>
  );
};

