import { useState, useEffect, useCallback } from 'react'
import {
  Activity, CheckCircle, AlertCircle, Loader, StopCircle,
  Globe, Layers, RefreshCw, WifiOff, Eye, ExternalLink, ListOrdered, X, Cloud
} from 'lucide-react'
import {
  getBrowserbaseRuns, getBrowserbaseRunLive, getBrowserbaseRunMessages,
  stopBrowserbaseRun,
} from '../api'

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-95ed.up.railway.app'

function authHeaders() {
  const token = localStorage.getItem('admin_token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

async function fetchSafe(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── Mapeo de estados Browserbase → estilo visual ──
const STATUS_MAP = {
  PENDING:   { label: 'En cola',   estado: 'esperando' },
  RUNNING:   { label: 'En curso',  estado: 'en_curso' },
  COMPLETED: { label: 'Completado', estado: 'exitosa' },
  FAILED:    { label: 'Falló',     estado: 'fallida' },
  STOPPED:   { label: 'Detenido',  estado: 'error' },
  TIMED_OUT: { label: 'Timeout',   estado: 'fallida' },
}

const ESTADO_COLORS = {
  exitosa:  { bg: 'rgba(16,185,129,0.06)',  border: '#1D9E75', badge: { bg: 'rgba(16,185,129,0.12)',  color: '#059669'  } },
  en_curso: { bg: 'rgba(245,158,11,0.06)',  border: '#EF9F27', badge: { bg: 'rgba(245,158,11,0.12)',  color: '#B45309'  } },
  fallida:  { bg: 'rgba(226,75,74,0.06)',   border: '#E24B4A', badge: { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626'  } },
  esperando:{ bg: 'rgba(15,23,42,0.02)', border: '#374151', badge: { bg: 'rgba(15,23,42,0.06)', color: 'var(--text-muted)' } },
  error:    { bg: 'rgba(226,75,74,0.06)',   border: '#E24B4A', badge: { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626'  } },
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#EF9F27', borderRadius: '50%', animation: 'spin .8s linear infinite', marginRight: 4 }} />
  )
}

function fmtFecha(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function duracion(run) {
  const ini = run.startedAt ? new Date(run.startedAt) : null
  const fin = run.endedAt ? new Date(run.endedAt) : null
  if (!ini) return null
  const ms = (fin ? fin : new Date()) - ini
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

// ── Card de un run de Browserbase ──
function RunCard({ run, onVerVivo, onVerPasos, onDetener, deteniendo }) {
  const meta = STATUS_MAP[run.status] || STATUS_MAP.PENDING
  const col = ESTADO_COLORS[meta.estado]
  const activo = run.status === 'RUNNING' || run.status === 'PENDING'
  const dur = duracion(run)
  const ses = run.sesion  // datos de radicación (empresa/eps/documento) si el run vino de la cola

  return (
    <div style={{
      borderRadius: 12, padding: '12px 14px', marginBottom: 8,
      background: col.bg, borderLeft: `3px solid ${col.border}`,
      border: `1px solid ${col.border}20`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {ses && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{ses.eps?.replace(/_/g, ' ').toUpperCase()}</span>
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 999, background: 'rgba(79,70,229,0.10)', color: '#4F46E5' }}>{ses.empresa}</span>
              {ses.documento && <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>CC {ses.documento}</span>}
              {ses.cached && <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 999, background: 'rgba(16,185,129,0.10)', color: '#059669' }}>🔑 sesión guardada</span>}
            </div>
          )}
          <div style={{ fontSize: ses ? 11 : 13, fontWeight: ses ? 400 : 600, color: ses ? 'var(--text-muted)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {run.task}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span>{fmtFecha(run.createdAt)}</span>
            {dur && <span>· {dur}</span>}
            <span style={{ opacity: 0.6 }}>· {run.runId?.slice(0, 8)}</span>
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, flexShrink: 0,
          background: col.badge.bg, color: col.badge.color,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          {run.status === 'RUNNING' && <Spinner />}
          {run.status === 'COMPLETED' && '✓ '}
          {(run.status === 'FAILED' || run.status === 'TIMED_OUT') && '✗ '}
          {meta.label}
        </span>
      </div>

      {/* Resultado si completó */}
      {run.status === 'COMPLETED' && run.result && (
        <div style={{ fontSize: 11, color: '#059669', marginBottom: 6 }}>
          <CheckCircle size={11} style={{ display: 'inline', marginRight: 4 }} />
          {run.result.summary || JSON.stringify(run.result).slice(0, 140)}
        </div>
      )}

      {/* Causa exacta si falló */}
      {(run.status === 'FAILED' || run.status === 'TIMED_OUT' || run.status === 'STOPPED') && run.cause && (
        <div style={{ fontSize: 11, color: '#DC2626', marginBottom: 6 }}>
          <AlertCircle size={11} style={{ display: 'inline', marginRight: 4 }} />
          <b>{run.cause.code}</b>{run.cause.message ? ` — ${run.cause.message}` : ''}
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        {activo && (
          <>
            <button onClick={() => onVerVivo(run)} style={btnStyle('#4F46E5', 'rgba(79,70,229,0.10)', 'rgba(79,70,229,0.2)')}>
              <Eye size={11} /> Ver en vivo
            </button>
            <button onClick={() => onDetener(run)} disabled={deteniendo === run.runId} style={btnStyle('#DC2626', 'rgba(239,68,68,0.08)', 'rgba(239,68,68,0.2)')}>
              <StopCircle size={11} /> {deteniendo === run.runId ? 'Deteniendo…' : 'Detener'}
            </button>
          </>
        )}
        <button onClick={() => onVerPasos(run)} style={btnStyle('var(--text-secondary)', 'rgba(15,23,42,0.04)', 'var(--border-primary)')}>
          <ListOrdered size={11} /> Paso a paso
        </button>
        {run.sessionId && (
          <a href={`https://browserbase.com/sessions/${run.sessionId}`} target="_blank" rel="noreferrer"
            style={{ ...btnStyle('var(--text-muted)', 'transparent', 'var(--border-primary)'), textDecoration: 'none' }}>
            <ExternalLink size={11} /> Browserbase
          </a>
        )}
      </div>
    </div>
  )
}

function btnStyle(color, bg, border) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
    borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: 'pointer',
    color, background: bg, border: `1px solid ${border}`,
  }
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

// ── Modal genérico ──
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: 'var(--bg-card-solid, #ffffff)', border: '1px solid var(--border-primary)', borderRadius: 18, width: wide ? 'min(1100px, 96vw)' : 'min(640px, 96vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border-primary)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>{title}</h4>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}

// ── Extrae texto legible de un mensaje (formato AI SDK UIMessage) ──
function extraerTexto(item) {
  const msg = item.message || item
  const content = msg.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map(p => {
      if (typeof p === 'string') return p
      if (p.type === 'text') return p.text
      if (p.type === 'tool-call' || p.type === 'tool_call') return `🔧 ${p.toolName || p.name || 'acción'}`
      if (p.type === 'reasoning') return null
      return null
    }).filter(Boolean).join(' ')
  }
  return null
}

export default function RadicacionMonitoreo() {
  const [runs, setRuns] = useState([])
  const [cola, setCola] = useState([])
  const [sesiones, setSesiones] = useState([])
  const [sinConexion, setSinConexion] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [ultimaAct, setUltimaAct] = useState(null)
  const [deteniendo, setDeteniendo] = useState(null)

  // Filtros por empresa y EPS
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas')
  const [filtroEps, setFiltroEps] = useState('todas')

  // Modales
  const [liveRun, setLiveRun] = useState(null)      // { run, url, cargando }
  const [pasosRun, setPasosRun] = useState(null)    // { run, mensajes, cargando }

  const cargar = useCallback(async () => {
    try {
      const [runsData, colaData, sesData] = await Promise.all([
        getBrowserbaseRuns({ limit: 50 }).catch(() => null),
        fetchSafe('/admin/radicacion/cola'),
        fetchSafe('/admin/radicacion/sesiones?limit=100'),
      ])
      setSinConexion(!runsData)
      if (runsData) setRuns(runsData.data || runsData.runs || [])
      if (colaData) setCola(colaData.items || [])
      if (sesData) setSesiones(sesData.sesiones || [])
    } catch {
      setSinConexion(true)
    }
    setCargando(false)
    setUltimaAct(new Date())
  }, [])

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 5000)
    return () => clearInterval(interval)
  }, [cargar])

  const abrirLive = async (run) => {
    setLiveRun({ run, url: null, cargando: true })
    try {
      const data = await getBrowserbaseRunLive(run.runId)
      setLiveRun({ run, url: data.liveViewUrl, cargando: false })
    } catch (e) {
      setLiveRun({ run, url: null, cargando: false, error: e.message })
    }
  }

  const abrirPasos = async (run) => {
    setPasosRun({ run, mensajes: [], cargando: true })
    try {
      const data = await getBrowserbaseRunMessages(run.runId)
      setPasosRun({ run, mensajes: data.data || [], cargando: false })
    } catch (e) {
      setPasosRun({ run, mensajes: [], cargando: false, error: e.message })
    }
  }

  const detener = async (run) => {
    if (!window.confirm('¿Detener este bot?')) return
    setDeteniendo(run.runId)
    try {
      await stopBrowserbaseRun(run.runId)
      await cargar()
    } catch (e) {
      alert('No se pudo detener: ' + e.message)
    }
    setDeteniendo(null)
  }

  // Cruce runs ↔ sesiones de radicación (sesion_id === runId → empresa/eps/documento)
  const sesionPorRun = {}
  sesiones.forEach(s => { if (s.sesion_id) sesionPorRun[s.sesion_id] = s })
  const runsEnriquecidos = runs.map(r => ({ ...r, sesion: sesionPorRun[r.runId] || null }))

  // Opciones de filtros (a partir de las sesiones de radicación)
  const empresas = [...new Set(sesiones.map(s => s.empresa).filter(Boolean))].sort()
  const epsList = [...new Set(sesiones.map(s => s.eps).filter(Boolean))].sort()

  // Aplicar filtros: un run sin sesión (ej. pruebas) solo se muestra con filtros en "todas"
  const runsFiltrados = runsEnriquecidos.filter(r => {
    if (filtroEmpresa !== 'todas' && r.sesion?.empresa !== filtroEmpresa) return false
    if (filtroEps !== 'todas' && r.sesion?.eps !== filtroEps) return false
    return true
  })

  const activos = runsFiltrados.filter(r => r.status === 'RUNNING' || r.status === 'PENDING')
  const historial = runsFiltrados.filter(r => r.status !== 'RUNNING' && r.status !== 'PENDING')
  const stats = {
    total: runsFiltrados.length,
    exitosas: runsFiltrados.filter(r => r.status === 'COMPLETED').length,
    en_curso: activos.length,
    fallidas: runsFiltrados.filter(r => r.status === 'FAILED' || r.status === 'TIMED_OUT').length,
  }
  const hayFallas = stats.fallidas > 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 64px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.25)', color: '#4F46E5' }}>
            <Cloud size={24} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Estado de Radicación
          </h2>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(124,58,237,0.12)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.25)' }}>
            ☁️ Browserbase
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {ultimaAct && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Actualizado {ultimaAct.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <a href="https://browserbase.com/overview" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#7C3AED', background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.2)', textDecoration: 'none' }}>
            <ExternalLink size={13} /> Dashboard Browserbase
          </a>
          <button onClick={cargar} disabled={cargando} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#4F46E5', background: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.2)', cursor: 'pointer' }}>
            <RefreshCw size={13} style={{ animation: cargando ? 'spin .8s linear infinite' : 'none' }} /> Actualizar
          </button>
        </div>
      </div>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginBottom: 24 }}>
        Bots corriendo en la nube de Browserbase · Vista en vivo · Paso a paso · Causa exacta de fallos
      </p>

      {/* Alerta si hay fallas */}
      {hayFallas && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#B45309', fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
          <AlertCircle size={15} />
          Hay bots fallidos — revisa la causa exacta en cada tarjeta o el paso a paso para ver dónde se detuvo.
        </div>
      )}

      {/* Sin conexión */}
      {sinConexion && !cargando && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, background: 'rgba(15,23,42,0.03)', border: '1px solid var(--border-primary)', color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
          <WifiOff size={14} /> No se pudo conectar con Browserbase. Verifica que <code style={{ fontSize: 11, background: 'rgba(15,23,42,0.06)', padding: '1px 5px', borderRadius: 4 }}>BROWSERBASE_API_KEY</code> esté configurada en el backend (Railway).
        </div>
      )}

      {/* Filtros por empresa y EPS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Filtrar:</span>
        <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-input)', border: '1px solid var(--border-input)', outline: 'none', cursor: 'pointer' }}>
          <option value="todas">Todas las empresas</option>
          {empresas.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filtroEps} onChange={e => setFiltroEps(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-input)', border: '1px solid var(--border-input)', outline: 'none', cursor: 'pointer' }}>
          <option value="todas">Todas las EPS/ARL</option>
          {epsList.map(e => <option key={e} value={e}>{e.replace(/_/g, ' ').toUpperCase()}</option>)}
        </select>
        {(filtroEmpresa !== 'todas' || filtroEps !== 'todas') && (
          <button onClick={() => { setFiltroEmpresa('todas'); setFiltroEps('todas') }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 9, fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', background: 'rgba(15,23,42,0.04)', border: '1px solid var(--border-primary)', cursor: 'pointer' }}>
            <X size={11} /> Limpiar
          </button>
        )}
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <MetricCard label="Runs recientes" value={stats.total} />
        <MetricCard label="Completados" value={stats.exitosas} color="#059669" />
        <MetricCard label="En curso" value={stats.en_curso} color="#B45309" />
        <MetricCard label="Fallidos" value={stats.fallidas} color="#DC2626" />
      </div>

      {/* Grid principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Columna izquierda — Bots activos */}
        <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)', borderRadius: 18, padding: '16px 18px' }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <Activity size={13} /> Bots activos
            {activos.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#B45309' }}>
                {activos.length} en curso
              </span>
            )}
          </h4>

          {cargando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Loader size={28} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            </div>
          ) : activos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
              <Globe size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
              <p>No hay bots corriendo en este momento.</p>
              <p style={{ fontSize: 11, marginTop: 6 }}>Cuando el backend lance una radicación aparecerá aquí con vista en vivo.</p>
            </div>
          ) : (
            activos.map(r => (
              <RunCard key={r.runId} run={r} onVerVivo={abrirLive} onVerPasos={abrirPasos} onDetener={detener} deteniendo={deteniendo} />
            ))
          )}

          {/* Historial */}
          {historial.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '14px 0 8px', fontWeight: 700 }}>Historial reciente</div>
              {historial.slice(0, 15).map(r => (
                <RunCard key={r.runId} run={r} onVerVivo={abrirLive} onVerPasos={abrirPasos} onDetener={detener} deteniendo={deteniendo} />
              ))}
            </>
          )}
        </div>

        {/* Columna derecha — Cola + Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Cola pendiente (backend) */}
          <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)', borderRadius: 18, padding: '16px 18px', flex: '0 0 auto' }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <Layers size={13} /> Cola pendiente
              {cola.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(79,70,229,0.15)', color: '#4F46E5' }}>
                  {cola.length}
                </span>
              )}
            </h4>
            {cola.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0' }}>Cola vacía — sin pendientes.</p>
            ) : (
              cola.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < cola.length - 1 ? '1px solid rgba(15,23,42,0.04)' : 'none', fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.eps}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}> · {item.documento}</span>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(15,23,42,0.05)', color: 'var(--text-muted)' }}>
                    En espera
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Panel informativo Browserbase */}
          <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)', borderRadius: 18, padding: '16px 18px', flex: 1 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <Cloud size={13} /> Navegador en la nube
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: <Eye size={13} style={{ color: '#4F46E5' }} />, txt: 'Ver en vivo: mira el navegador del bot en tiempo real (y toma control si se atasca).' },
                { icon: <ListOrdered size={13} style={{ color: '#7C3AED' }} />, txt: 'Paso a paso: transcript de cada acción del bot — si falla, ves exactamente dónde.' },
                { icon: <ExternalLink size={13} style={{ color: '#059669' }} />, txt: 'Browserbase: grabación completa (replay) de cada sesión terminada.' },
                { icon: <AlertCircle size={13} style={{ color: '#B45309' }} />, txt: 'CAPTCHAs y proxies se resuelven automáticamente en la nube.' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <span style={{ marginTop: 2, flexShrink: 0 }}>{f.icon}</span>
                  {f.txt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Vista en vivo ── */}
      {liveRun && (
        <Modal wide title={<><Eye size={15} style={{ color: '#4F46E5' }} /> Vista en vivo — {liveRun.run.task?.slice(0, 60)}…</>} onClose={() => setLiveRun(null)}>
          {liveRun.cargando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Loader size={30} className="animate-spin" style={{ color: '#4F46E5' }} />
            </div>
          ) : liveRun.url ? (
            <iframe
              src={liveRun.url}
              title="Browserbase Live View"
              style={{ width: '100%', height: '70vh', border: 'none', background: '#000' }}
              sandbox="allow-same-origin allow-scripts allow-forms allow-pointer-lock"
              allow="clipboard-read; clipboard-write"
            />
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <WifiOff size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
              <p>{liveRun.error || 'El bot aún no tiene navegador asignado (puede estar en cola o resolver la tarea sin navegador).'}</p>
            </div>
          )}
        </Modal>
      )}

      {/* ── Modal: Paso a paso ── */}
      {pasosRun && (
        <Modal title={<><ListOrdered size={15} style={{ color: '#7C3AED' }} /> Paso a paso del bot</>} onClose={() => setPasosRun(null)}>
          <div style={{ padding: '14px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{pasosRun.run.task}</p>
            {pasosRun.cargando ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader size={26} className="animate-spin" style={{ color: '#7C3AED' }} />
              </div>
            ) : pasosRun.error ? (
              <p style={{ fontSize: 12, color: '#DC2626' }}>{pasosRun.error}</p>
            ) : pasosRun.mensajes.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin mensajes todavía.</p>
            ) : (
              pasosRun.mensajes.map((m, i) => {
                const texto = extraerTexto(m)
                if (!texto) return null
                const esBot = (m.message?.role || m.role) === 'assistant'
                return (
                  <div key={m.id || i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, fontSize: 12 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: esBot ? '#7C3AED' : '#4F46E5', marginTop: 5, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5, wordBreak: 'break-word' }}>{texto}</span>
                  </div>
                )
              })
            )}
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
