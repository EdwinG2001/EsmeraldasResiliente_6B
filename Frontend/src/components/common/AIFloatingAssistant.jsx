import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  History, 
  Trash2, 
  ShieldAlert, 
  RefreshCw, 
  BrainCircuit, 
  ChevronRight, 
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  BarChart3,
  Download,
  AlertTriangle,
  Compass,
  Building2,
  Layers,
  Info,
  User,
  LogIn
} from 'lucide-react';
import { aiApi } from '../../api/aiApi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// ============================================================================
// PARSEO Y FORMATEO DE MARKDOWN ADAPTADO A TEMA CLARO Y OSCURO
// ============================================================================
const renderInlineMarkdown = (str, isLight) => {
  if (!str) return null;
  const parts = [];
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIdx = 0;
  let match;

  while ((match = tokenRegex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(str.substring(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code 
          key={match.index} 
          className={`px-1.5 py-0.5 mx-0.5 rounded font-mono text-[11px] border shadow-xs ${
            isLight 
              ? 'bg-slate-100 text-sky-800 border-slate-300' 
              : 'bg-slate-950/90 text-sky-300 border-slate-700/80'
          }`}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong 
          key={match.index} 
          className={`font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}
        >
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em 
          key={match.index} 
          className={`italic ${isLight ? 'text-slate-600' : 'text-slate-300'}`}
        >
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < str.length) {
    parts.push(str.substring(lastIdx));
  }
  return parts;
};

const FormattedAssistantMessage = ({ text, isLight }) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Bloque de código triple backtick
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`codeblock-${i}`} className="my-2 rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-sky-300 overflow-x-auto shadow-inner">
            {codeLang && (
              <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1 border-b border-slate-800 pb-1">
                {codeLang}
              </div>
            )}
            <pre className="whitespace-pre">{codeBlockLines.join('\n')}</pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = trimmed.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-1.5" />);
      continue;
    }

    // Nota de Rigor Científico (Banner)
    if (trimmed.startsWith('*Nota de Rigor Científico') || trimmed.includes('Rigor Científico:')) {
      elements.push(
        <div 
          key={`disclaimer-${i}`} 
          className={`mt-3 p-2.5 rounded-xl border text-[10.5px] flex items-start gap-2 ${
            isLight
              ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
              : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200/90'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            {renderInlineMarkdown(trimmed, isLight)}
          </div>
        </div>
      );
      continue;
    }

    // Encabezados
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 
          key={`h4-${i}`} 
          className={`text-xs font-black mt-2.5 mb-1 tracking-wide flex items-center gap-1.5 ${
            isLight ? 'text-sky-700' : 'text-sky-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          {renderInlineMarkdown(trimmed.replace('### ', ''), isLight)}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 
          key={`h3-${i}`} 
          className={`text-sm font-black mt-3 mb-1.5 tracking-wide flex items-center gap-1.5 border-b pb-1 ${
            isLight 
              ? 'text-slate-900 border-slate-200' 
              : 'text-white border-slate-700/60'
          }`}
        >
          <BrainCircuit className="w-4 h-4 text-sky-500 shrink-0" />
          {renderInlineMarkdown(trimmed.replace('## ', ''), isLight)}
        </h3>
      );
      continue;
    }

    // Listas ordenadas (1., 2., etc.)
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      elements.push(
        <div key={`ordered-${i}`} className="flex items-start gap-2 my-1 text-[11.5px] pl-1">
          <span className={`w-4 h-4 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border ${
            isLight
              ? 'bg-sky-100 text-sky-800 border-sky-300'
              : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
          }`}>
            {orderedMatch[1]}
          </span>
          <div className={`flex-1 leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
            {renderInlineMarkdown(orderedMatch[2], isLight)}
          </div>
        </div>
      );
      continue;
    }

    // Viñetas no ordenadas (- o * o •)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      const content = trimmed.substring(2);
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 my-1 text-[11.5px] pl-1">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
            isLight ? 'bg-sky-600' : 'bg-sky-400 shadow-sm shadow-sky-400/50'
          }`} />
          <div className={`flex-1 leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
            {renderInlineMarkdown(content, isLight)}
          </div>
        </div>
      );
      continue;
    }

    // Párrafo normal
    elements.push(
      <p key={`p-${i}`} className={`text-[11.5px] leading-relaxed my-0.5 ${
        isLight ? 'text-slate-700' : 'text-slate-200'
      }`}>
        {renderInlineMarkdown(trimmed, isLight)}
      </p>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
};

// ============================================================================
// COMPONENTE DE TARJETAS KPI DE METADATOS Y MODELOS SCIKIT-LEARN / POSTGIS
// ============================================================================
const ContextDataBadges = ({ datos, isLight }) => {
  if (!datos || typeof datos !== 'object') return null;

  // 1. Caso: Métricas de Machine Learning (Scikit-Learn)
  if (datos.tipo === 'ml_metricas') {
    return (
      <div className={`mt-2.5 p-2.5 rounded-xl border space-y-2 ${
        isLight 
          ? 'bg-slate-50 border-slate-200' 
          : 'bg-slate-950/70 border-indigo-500/30'
      }`}>
        <div className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-wider ${
          isLight ? 'text-indigo-800' : 'text-indigo-300'
        }`}>
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            Panel Scikit-Learn • Evaluación Empírica
          </span>
          <span className={`px-1.5 py-0.5 rounded border ${
            isLight 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {datos.algoritmo || 'Random Forest'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
          <div className={`p-1.5 rounded-lg border ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Exactitud Test</div>
            <div className={`text-xs font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              {datos.exactitud_pct}%
            </div>
          </div>
          <div className={`p-1.5 rounded-lg border ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>F1-Score</div>
            <div className={`text-xs font-black ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>
              {datos.f1_score_pct}%
            </div>
          </div>
          <div className={`p-1.5 rounded-lg border ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Muestras</div>
            <div className={`text-xs font-black ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>
              {datos.total_muestras}
            </div>
          </div>
          <div className={`p-1.5 rounded-lg border ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>5-Fold CV</div>
            <div className={`text-xs font-black ${isLight ? 'text-teal-700' : 'text-teal-400'}`}>
              {datos.validacion_cruzada_5f}
            </div>
          </div>
        </div>

        {Array.isArray(datos.top_features) && datos.top_features.length > 0 && (
          <div className={`pt-1 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
            <div className={`text-[9px] font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Top Características Determinantes (Feature Importance):
            </div>
            <div className="space-y-1">
              {datos.top_features.slice(0, 3).map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[10px]">
                  <span className={`w-28 truncate ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    {f.nombre}:
                  </span>
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden border ${
                    isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-sky-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, f.peso * 2.2)}%` }}
                    />
                  </div>
                  <span className={`font-mono font-bold text-[9px] w-9 text-right ${
                    isLight ? 'text-indigo-700' : 'text-sky-300'
                  }`}>
                    {f.peso}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Caso: Simulación Hidrológica
  if (datos.tipo === 'simulacion') {
    return (
      <div className={`mt-2.5 p-2.5 rounded-xl border space-y-2 ${
        isLight ? 'bg-sky-50/70 border-sky-200' : 'bg-slate-950/70 border-sky-500/30'
      }`}>
        <div className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-wider ${
          isLight ? 'text-sky-800' : 'text-sky-300'
        }`}>
          <span className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-sky-500" />
            Parámetros Hidrométricos Proyectados
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
            datos.nivel_rio_teaone_m >= datos.cota_critica_m
              ? 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40 animate-pulse'
              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
          }`}>
            Alerta {datos.alerta_global}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
          <div className={`p-1.5 rounded-lg border ${
            isLight ? 'bg-white border-sky-100 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Precipitación 24h</div>
            <div className={`text-xs font-black ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>
              {datos.lluvia_24h_mm} mm
            </div>
          </div>
          <div className={`p-1.5 rounded-lg border ${
            isLight ? 'bg-white border-sky-100 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Nivel Proyectado</div>
            <div className={`text-xs font-black ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
              {datos.nivel_rio_teaone_m} m
            </div>
          </div>
          <div className={`p-1.5 rounded-lg border ${
            isLight ? 'bg-white border-sky-100 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cota Desborde</div>
            <div className={`text-xs font-black ${isLight ? 'text-red-700' : 'text-red-400'}`}>
              {datos.cota_critica_m} m
            </div>
          </div>
          <div className={`p-1.5 rounded-lg border ${
            isLight ? 'bg-white border-sky-100 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Familias Riesgo</div>
            <div className={`text-xs font-black ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
              {datos.total_familias_en_riesgo}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Caso: Red de Albergues
  if (datos.tipo === 'albergues' && Array.isArray(datos.albergues)) {
    return (
      <div className={`mt-2.5 p-2 rounded-xl border space-y-1.5 ${
        isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-950/70 border-emerald-500/30'
      }`}>
        <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
          isLight ? 'text-emerald-800' : 'text-emerald-300'
        }`}>
          <Building2 className="w-3.5 h-3.5 text-emerald-500" />
          Red de Albergues COE • Capacidad ({datos.capacidad_familias} Familias)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {datos.albergues.map((a, i) => (
            <div 
              key={i} 
              className={`p-1.5 rounded-lg border text-[10px] ${
                isLight ? 'bg-white border-emerald-100 shadow-xs' : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {a.nombre}
              </div>
              <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Capacidad: <span className="text-emerald-600 dark:text-emerald-300 font-bold">{a.capacidad_familias || a.capacidad} fam</span>
              </div>
              <div className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Cota: <span className="text-sky-600 dark:text-sky-300">{a.cota}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. Caso: Motor Espacial PostGIS
  if (datos.tipo === 'postgis') {
    return (
      <div className={`mt-2.5 p-2 rounded-xl border flex items-center justify-between text-[10.5px] ${
        isLight ? 'bg-purple-50/70 border-purple-200' : 'bg-slate-950/70 border-purple-500/30'
      }`}>
        <div className={`flex items-center gap-1.5 font-bold ${
          isLight ? 'text-purple-800' : 'text-purple-300'
        }`}>
          <Layers className="w-3.5 h-3.5 text-purple-500" />
          <span>Buffer: {datos.radio_metros}m</span>
        </div>
        <div className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Función: <code className="text-sky-600 dark:text-sky-300 font-mono text-[9px]">ST_DWithin</code>
        </div>
        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
          isLight 
            ? 'bg-purple-100 text-purple-800 border-purple-300' 
            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        }`}>
          {datos.indice || 'GIST Espacial'}
        </div>
      </div>
    );
  }

  return null;
};

// ============================================================================
// COMPONENTE PRINCIPAL: ASISTENTE FLOTANTE DE IA PREDICTIVA
// ============================================================================
export const AIFloatingAssistant = () => {
  const { user, isAuthenticated } = useAuth();
  const { isLight } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'history'
  const [copiedId, setCopiedId] = useState(null);

  const initialWelcomeMessage = {
    id: 'welcome',
    sender: 'ai',
    text: `👋 ¡Hola! Soy el **Asistente de Inteligencia Artificial del COE Cantonal de Esmeraldas**.

Estoy entrenado con modelos de **Machine Learning (Scikit-Learn)** y conectado a la base geoespacial **PostGIS**. Puedes consultarme en cualquier momento sobre:

- 🌊 **Simulaciones Hidrológicas:** Crecidas proyectadas del Río Teaone ante precipitaciones de 120 mm o más.
- 🤖 **Métricas del Modelo ML:** Exactitud (99.17%), F1-Score (99.19%) y arquitectura Random Forest.
- 📍 **Recurrencia Histórica:** Sectores críticos (50 Casas, Propicia 1 y 2, Isla Piedad).
- 🏕️ **Red de Albergues:** Capacidad del Coliseo Nubia Villacís y protocolo de evacuación.
- 🛰️ **Buffer PostGIS 25m:** Mecánica de cálculo demográfico en tiempo real.

*Nota de Rigor Científico (UTLVTE 2026): Modelos analíticos desarrollados con Python 3.12 y Scikit-learn para soporte a la toma de decisiones.*`,
    categoria: 'GENERAL',
    datos: {
      tipo: 'ml_metricas',
      algoritmo: 'Random Forest Classifier',
      exactitud_pct: 99.17,
      f1_score_pct: 99.19,
      total_muestras: 1200,
      validacion_cruzada_5f: '99.08% ± 0.49%'
    },
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const [messages, setMessages] = useState([initialWelcomeMessage]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  // Historial en BD (solo para usuarios autenticados)
  const [dbHistoryList, setDbHistoryList] = useState([]);
  // Historial temporal de la sesión activa (para usuarios sin autenticar)
  const [sessionHistoryList, setSessionHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, activeTab, loading]);

  // Cargar historial de la base de datos PostgreSQL (solo si está autenticado)
  const loadHistory = async () => {
    if (!isAuthenticated) {
      setDbHistoryList([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const data = await aiApi.getHistorial();
      setDbHistoryList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando historial de IA:', err);
      setDbHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Re-evaluar historial al iniciar sesión o cambiar de pestaña
  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    } else {
      setDbHistoryList([]);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isOpen && activeTab === 'history' && isAuthenticated) {
      loadHistory();
    }
  }, [isOpen, activeTab, isAuthenticated]);

  // Lista de historial efectiva y conteo
  const currentHistory = isAuthenticated ? dbHistoryList : sessionHistoryList;
  const historyCount = currentHistory.length;

  const handleSend = async (questionText = null) => {
    const textToSend = questionText || inputQuestion;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await aiApi.consultar(textToSend);
      if (res && res.respuesta) {
        const aiMsg = {
          id: res.id || `ai-${Date.now()}`,
          sender: 'ai',
          text: res.respuesta,
          categoria: res.categoria,
          datos: res.datos_contexto,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Manejo del historial:
        if (isAuthenticated) {
          // Si está autenticado, el backend ya lo guardó en PostgreSQL; refrescamos la lista
          loadHistory();
        } else {
          // Si NO está autenticado, se muestra en el historial de sesión en pantalla, pero NO se almacena en la BD
          setSessionHistoryList((prev) => [
            {
              id: res.id || `anon-${Date.now()}`,
              pregunta: textToSend,
              respuesta: res.respuesta,
              categoria: res.categoria,
              datos_contexto: res.datos_contexto,
              fecha_creacion: res.fecha_creacion || new Date().toISOString(),
              almacenado: false
            },
            ...prev
          ]);
        }
        return;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (err) {
      console.warn('Consulta falló:', err);

      // Si está autenticado, intentar recuperar la última respuesta de la BD
      if (isAuthenticated) {
        try {
          const historyData = await aiApi.getHistorial();
          if (Array.isArray(historyData) && historyData.length > 0) {
            const latest = historyData[0];
            if (latest && latest.respuesta) {
              const recoveredMsg = {
                id: latest.id || `ai-${Date.now()}`,
                sender: 'ai',
                text: latest.respuesta,
                categoria: latest.categoria,
                datos: latest.datos_contexto,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              setMessages((prev) => [...prev, recoveredMsg]);
              setDbHistoryList(historyData);
              return;
            }
          }
        } catch (histErr) {
          console.error('No se pudo recuperar del historial:', histErr);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: '⚠️ Ocurrió un error al procesar la consulta con los modelos analíticos. Por favor, verifica tu conexión o intenta nuevamente.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (id, text) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('¿Deseas reiniciar la conversación en pantalla?')) {
      setMessages([initialWelcomeMessage]);
    }
  };

  const handleClearHistory = async () => {
    if (isAuthenticated) {
      if (window.confirm('¿Deseas vaciar tu historial personal almacenado en PostgreSQL?')) {
        try {
          await aiApi.borrarHistorial();
          setDbHistoryList([]);
        } catch (err) {
          console.error('Error borrando historial:', err);
        }
      }
    } else {
      if (window.confirm('¿Deseas limpiar las consultas temporales de esta sesión?')) {
        setSessionHistoryList([]);
      }
    }
  };

  const handleExportConversation = () => {
    const transcript = messages.map(m => `[${m.timestamp}] ${m.sender === 'user' ? 'OPERADOR' : 'ASISTENTE IA'}:\n${m.text}\n-------------------`).join('\n\n');
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_ia_coe_esmeraldas_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick prompts organizados y categorizados
  const quickPrompts = [
    {
      label: '🌊 Simulación Teaone (120 mm)',
      prompt: 'Simular crecida del Rio Teaone con 120 mm de lluvia',
      badge: 'Hidrología'
    },
    {
      label: '🤖 Algoritmo ML & F1-Score',
      prompt: '¿Cuáles son las métricas, exactitud y algoritmo del modelo Scikit-Learn?',
      badge: 'Scikit-Learn'
    },
    {
      label: '📍 Sectores con más recurrencia',
      prompt: '¿Cuáles son los sectores con mayor recurrencia histórica de inundaciones?',
      badge: 'GIS'
    },
    {
      label: '🏕️ Albergues y Evacuación',
      prompt: '¿Cuáles son los albergues oficiales habilitados y rutas de evacuación?',
      badge: 'Humanitaria'
    },
    {
      label: '🛰️ Motor PostGIS (Buffer 25m)',
      prompt: '¿Cómo calcula el motor PostGIS el impacto a personas en el buffer de 25m?',
      badge: 'PostgreSQL'
    },
    {
      label: '🚨 Triage ML (Derrumbe)',
      prompt: 'Clasificar prioridad de incidente con 3 personas atrapadas y 90 mm de lluvia',
      badge: 'Priorización'
    },
    {
      label: '📈 Fenómeno El Niño (ENSO)',
      prompt: '¿Cuál es la tendencia histórica del Fenómeno El Niño en Esmeraldas?',
      badge: 'Clima'
    },
    {
      label: '📋 Fases de Alerta COE',
      prompt: '¿Cuáles son las fases de alerta del COE Cantonal ante crecidas del río?',
      badge: 'Protocolo'
    }
  ];

  return (
    <>
      {/* BOTÓN FLOTANTE TRIGGER FIJO EN ESQUINA INFERIOR DERECHA */}
      <div className="fixed bottom-3 right-3 z-[1200] flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold rounded-full shadow-2xl shadow-indigo-500/40 border border-white/20 transition-all duration-300 transform hover:scale-105 active:scale-95"
          title="Abrir Asistente de IA Predictiva COE Cantonal"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>

          <BrainCircuit className="w-4 h-4 text-sky-200 group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-xs tracking-wide font-black uppercase text-white">
            IA PREDICTIVA COE
          </span>
        </button>
      </div>

      {/* VENTANA MODAL / PANEL DE CONSULTAS DE IA */}
      {isOpen && (
        <div
          className={`fixed z-[1200] flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 border ${
            isLight
              ? 'bg-white border-slate-200 shadow-slate-900/20 text-slate-900'
              : 'bg-slate-900/95 backdrop-blur-2xl border-slate-700/80 shadow-black/90 text-slate-100'
          } ${
            isMaximized
              ? 'bottom-4 right-4 left-4 top-16 sm:left-auto sm:top-12 sm:w-[860px] sm:h-[84vh] max-w-5xl'
              : 'bottom-16 right-2 sm:right-4 w-[calc(100vw-1rem)] sm:w-[500px] h-[610px] max-h-[85vh]'
          }`}
        >
          {/* HEADER DEL ASISTENTE */}
          <div className={`p-3 flex items-center justify-between border-b ${
            isLight 
              ? 'bg-slate-50 border-slate-200' 
              : 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-xs sm:text-sm tracking-wide truncate ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    Asistente de IA • COE Esmeraldas
                  </h3>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 border ${
                    isLight
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}>
                    Scikit-Learn 1.9
                  </span>
                </div>
                <p className={`text-[10px] truncate ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Modelos predictivos • Simulación fluvial • Análisis PostGIS
                </p>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN RÁPIDA EN EL HEADER */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleExportConversation}
                className={`p-1.5 rounded-lg transition ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Descargar informe de la sesión"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className={`p-1.5 rounded-lg transition hidden sm:inline-flex ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isMaximized ? 'Restaurar tamaño normal' : 'Maximizar ventana'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-lg transition ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TABS SELECTOR (CHAT VS HISTORIAL) */}
          <div className={`flex items-center justify-between border-b px-3 text-xs font-semibold ${
            isLight
              ? 'bg-slate-100/90 border-slate-200'
              : 'bg-slate-950/90 border-slate-800'
          }`}>
            <div className="flex">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
                  activeTab === 'chat'
                    ? (isLight ? 'border-sky-600 text-sky-700 font-bold' : 'border-sky-500 text-sky-400 font-bold')
                    : (isLight ? 'border-transparent text-slate-600 hover:text-slate-900' : 'border-transparent text-slate-400 hover:text-white')
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Consultas en Vivo</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition ${
                  activeTab === 'history'
                    ? (isLight ? 'border-sky-600 text-sky-700 font-bold' : 'border-sky-500 text-sky-400 font-bold')
                    : (isLight ? 'border-transparent text-slate-600 hover:text-slate-900' : 'border-transparent text-slate-400 hover:text-white')
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>
                  {isAuthenticated ? `Historial en BD (${historyCount})` : `Historial (${historyCount})`}
                </span>
              </button>
            </div>

            {activeTab === 'chat' && (
              <button
                onClick={handleClearChat}
                className={`text-[10px] flex items-center gap-1 py-1 px-1.5 rounded transition ${
                  isLight 
                    ? 'text-slate-500 hover:text-red-600 hover:bg-slate-200' 
                    : 'text-slate-400 hover:text-red-400 hover:bg-slate-800/60'
                }`}
                title="Reiniciar chat en pantalla"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>

          {/* ================================================================ */}
          {/* TAB 1: CONSULTAS EN VIVO (CHAT INTERACTIVO) */}
          {/* ================================================================ */}
          {activeTab === 'chat' && (
            <div className={`flex-1 flex flex-col min-h-0 ${isLight ? 'bg-slate-50/70' : 'bg-slate-900/60'}`}>
              
              {/* CONTENEDOR DE MENSAJES CON SCROLL */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`relative group max-w-[92%] sm:max-w-[85%] rounded-2xl p-3.5 shadow-md ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-br-none shadow-sky-950/20'
                          : isLight
                            ? 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none shadow-xs'
                            : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none shadow-black/40'
                      }`}
                    >
                      {/* Cabecera del mensaje de IA */}
                      {m.sender === 'ai' && (
                        <div className={`flex items-center justify-between gap-2 mb-2 pb-1.5 border-b text-[10px] ${
                          isLight ? 'border-slate-200 text-sky-700' : 'border-slate-700/60 text-sky-300'
                        }`}>
                          <div className="flex items-center gap-1.5 font-mono">
                            <Sparkles className="w-3 h-3 text-sky-500 shrink-0" />
                            <span className="uppercase font-bold tracking-wider">
                              Módulo: {m.categoria || 'GENERAL'}
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopyMessage(m.id, m.text)}
                            className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border transition ${
                              isLight
                                ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border-slate-700/60'
                            }`}
                            title="Copiar texto"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Renderizado de texto formateado (Markdown parseado) */}
                      {m.sender === 'user' ? (
                        <div className="text-[12px] font-medium leading-relaxed whitespace-pre-wrap text-white">
                          {m.text}
                        </div>
                      ) : (
                        <FormattedAssistantMessage text={m.text} isLight={isLight} />
                      )}

                      {/* Badges de métricas estructuradas */}
                      {m.sender === 'ai' && m.datos && (
                        <ContextDataBadges datos={m.datos} isLight={isLight} />
                      )}

                      {/* Timestamp */}
                      <div className={`mt-2 text-[9px] text-right font-mono ${
                        m.sender === 'user' 
                          ? 'text-sky-200/90' 
                          : isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {m.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading spinner durante inferencia */}
                {loading && (
                  <div className={`flex items-center gap-2.5 text-xs p-3 rounded-2xl w-fit shadow-md border animate-pulse ${
                    isLight
                      ? 'bg-white border-slate-200 text-sky-700'
                      : 'bg-slate-800/90 border-slate-700 text-sky-400'
                  }`}>
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
                    <span>Ejecutando inferencia con <strong>Scikit-Learn</strong> y consultando <strong>PostGIS</strong>...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* BARRA DE PREGUNTAS SUGERIDAS (QUICK PROMPTS PILLS) */}
              <div className={`px-3 py-2 border-t ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800/80'
              }`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1 ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  <HelpCircle className="w-3 h-3 text-sky-500" />
                  <span>Preguntas Frecuentes y Evaluaciones del Jurado:</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  {quickPrompts.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(qp.prompt)}
                      disabled={loading}
                      className={`shrink-0 group flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition shadow-xs active:scale-95 disabled:opacity-50 ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
                          : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80'
                      }`}
                      title={qp.prompt}
                    >
                      <span className="font-medium">{qp.label}</span>
                      <span className={`text-[8.5px] px-1 py-0.2 rounded font-mono font-semibold ${
                        isLight
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20'
                      }`}>
                        {qp.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CAJA DE ENTRADA DE TEXTO / PROMPT */}
              <div className={`p-3 border-t flex items-center gap-2 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Pregúntale a la IA (ej: simulación 120mm, métricas scikit-learn, albergues)..."
                  className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-sky-500 transition shadow-inner ${
                    isLight
                      ? 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-300 focus:bg-white focus:border-sky-500'
                      : 'bg-slate-900 text-white placeholder-slate-400 border-slate-700 focus:border-sky-500'
                  }`}
                  disabled={loading}
                />

                <button
                  onClick={() => handleSend()}
                  disabled={loading || !inputQuestion.trim()}
                  className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-md transition transform active:scale-95 shrink-0"
                  title="Enviar consulta a la IA"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: HISTORIAL EN BASE DE DATOS O SESIÓN TEMPORAL */}
          {/* ================================================================ */}
          {activeTab === 'history' && (
            <div className={`flex-1 flex flex-col min-h-0 p-3.5 ${isLight ? 'bg-slate-50/70' : 'bg-slate-900/60'}`}>
              
              {/* STATUS BAR DE HISTORIAL */}
              <div className={`flex items-center justify-between mb-3 pb-2 border-b ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div className="flex items-center gap-1.5 text-xs">
                  {isAuthenticated ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>
                        Historial personal persistido en PostgreSQL (<strong>{user?.nombre_completo || user?.username || 'Usuario'}</strong>)
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                      <Info className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>
                        Modo Sesión Temporal (Sin iniciar sesión • <em>No se almacena en BD</em>)
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isAuthenticated && (
                    <button
                      onClick={loadHistory}
                      disabled={loadingHistory}
                      className={`p-1.5 rounded-lg border transition ${
                        isLight
                          ? 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border-slate-200'
                          : 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
                      }`}
                      title="Actualizar historial"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                    </button>
                  )}

                  {currentHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="p-1.5 text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition"
                      title={isAuthenticated ? 'Borrar tu historial en BD' : 'Limpiar consultas temporales'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* LISTA DE CONSULTAS HISTÓRICAS */}
              <div className="flex-1 overflow-y-auto space-y-2.5 text-xs pr-1">
                {currentHistory.length === 0 ? (
                  <div className={`text-center py-12 text-xs space-y-3 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    <History className={`w-10 h-10 mx-auto ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
                    <div>
                      <p className={`font-bold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        Historial en 0 ({isAuthenticated ? 'Sin consultas previas' : 'Sesión anónima'})
                      </p>
                      <p className="max-w-xs mx-auto text-[11px] leading-relaxed mt-1">
                        {isAuthenticated
                          ? 'No tienes consultas guardadas en tu cuenta todavía. Haz una pregunta en el chat para registrarla en tu historial personal.'
                          : 'No tienes un usuario logueado. Las consultas que hagas en el chat se mostrarán temporalmente en esta sesión pero no se almacenarán en la base de datos.'
                        }
                      </p>
                    </div>

                    {!isAuthenticated && (
                      <div className="pt-2">
                        <a
                          href="/login"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shadow transition active:scale-95"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Iniciar sesión para guardar tu historial</span>
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  currentHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl p-3 space-y-2 border shadow-xs transition ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`font-semibold uppercase tracking-wider font-mono ${
                          isLight ? 'text-sky-700' : 'text-sky-400'
                        }`}>
                          {item.categoria || 'GENERAL'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {item.almacenado === false && (
                            <span className="text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/30 px-1.5 py-0.2 rounded font-semibold">
                              Temporal
                            </span>
                          )}
                          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                            {item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleString() : ''}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {item.pregunta}
                      </p>

                      <div className={`text-[11px] p-2.5 rounded-lg border ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 text-slate-800' 
                          : 'bg-slate-950/70 border-slate-800 text-slate-300'
                      }`}>
                        <FormattedAssistantMessage text={item.respuesta} isLight={isLight} />
                        {item.datos_contexto && (
                          <ContextDataBadges datos={item.datos_contexto} isLight={isLight} />
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setActiveTab('chat');
                          handleSend(item.pregunta);
                        }}
                        className={`text-[10.5px] hover:underline flex items-center gap-1 pt-1 font-semibold ${
                          isLight ? 'text-sky-700 hover:text-sky-900' : 'text-sky-400'
                        }`}
                      >
                        <span>Re-ejecutar simulación</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
};

export default AIFloatingAssistant;
