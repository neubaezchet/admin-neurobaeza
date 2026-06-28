import { useState, useEffect, useCallback } from 'react'
import {
  Monitor, RefreshCw, Activity, Database, Users, Building2,
  FileText, AlertTriangle, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Zap, Server, Heart, Trash2
} from 'lucide-react'
import { getStats, getHealth, getActivity, factoryReset } from '../api'

const ESTADO_COLORS = {
  NUEVO:             'bg-blue-500',
  EN_REVISION:       'bg-cyan-500',
  INCOMPLETA:        'bg-red-500',
  ILEGIBLE:          'bg-orange-500',
  INCOMPLETA_ILEGIBLE:'bg-red-600',
  EPS_TRANSCRIPCION: 'bg-yellow-500',
  DERIVADO_TTHH:     'bg-red-600',
  CAUSA_EXTRA:       'bg-pink-500',
  COMPLETA:          'bg-green-500',
  EN_RADICACION:     'bg-teal-500',
}

const ESTADO_LABELS = {
  NUEVO: 'Nuevo', EN_REVISION: 'En Revisión', INCOMPLETA: 'Incompleta',
  ILEGIBLE: 'Ilegible', INCOMPLETA_ILEGIBLE: 'Incompleta+Ilegible',
  EPS_TRANSCRIPCION: 'EPS Transcripción', DERIVADO_TTHH: 'P. Fraude',
  CAUSA_EXTRA: 'Causa Extra', COMPLETA: 'Completa', EN_RADICACION: 'En Radicación',
}

export default function SystemConsole() {
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Factory reset
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetResult, setResetResult] = useState(null)

  const load = useCallback(async () => {
    try {
      const [sData, hData, aData] = await Promise.all([
        getStats().catch(() => null),
        getHealth().catch(() => ({ ok: false, database: 'error' })),
        getActivity(100).catch(() => ({ actividad: [] })),
      ])
      if (sData) setStats(sData.stats)
      setHealth(hData)
      setActivity(aData.actividad || sData?.ultimos_eventos || [])
    } catch (err) {
      console.error('Error loading console:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, load])

  const visibleEvents = showAllEvents ? activity : activity.slice(0, 20)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-40" style={{ color: 'var(--text-muted)' }}>
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando consola...
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--accent-primary-soft)' }}>
              <Monitor className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            Consola del Sistema
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Monitoreo en tiempo real, estadísticas y actividad</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="neo-btn-ghost flex items-center gap-1.5 text-xs"
            style={{ color: autoRefresh ? 'var(--success)' : 'var(--text-muted)' }}
          >
            <Zap className="w-3.5 h-3.5" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button onClick={load} className="neo-btn-outline flex items-center gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>
      </div>

      {/* Health Status */}
      <div className="grid grid-cols-3 gap-4">
        <HealthWidget
          icon={Server}
          label="API Backend"
          status={health?.ok ? 'online' : 'offline'}
          detail={health?.ok ? 'Railway — Operativo' : 'Error de conexión'}
        />
        <HealthWidget
          icon={Database}
          label="Base de Datos"
          status={health?.database === 'connected' ? 'online' : 'offline'}
          detail={health?.database === 'connected' ? 'PostgreSQL — Conectado' : 'Desconectado'}
        />
        <HealthWidget
          icon={Heart}
          label="Python Runtime"
          status="online"
          detail={`Python ${health?.python || '3.11'}`}
        />
      </div>

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard icon={FileText} label="Total Casos" value={stats.total_casos} color="text-brand-500" />
          <StatCard icon={Zap} label="Casos Hoy" value={stats.casos_hoy} color="text-emerald-500" />
          <StatCard icon={Users} label="Empleados" value={stats.total_empleados} color="text-cyan-500" />
          <StatCard icon={Building2} label="Empresas" value={stats.total_empresas} color="text-amber-500" />
          <StatCard icon={AlertTriangle} label="Alertas 180 (7d)" value={stats.alertas_180_7d} color="text-red-500" />
        </div>
      )}

      {/* Cases by Status + Activity Log side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution by estado */}
        {stats?.por_estado && (
          <div className="neo-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Activity className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} /> Distribución por Estado
            </h3>
            <div className="space-y-2.5">
              {Object.entries(stats.por_estado)
                .sort((a, b) => b[1] - a[1])
                .map(([estado, count]) => {
                  const pct = stats.total_casos > 0 ? (count / stats.total_casos * 100) : 0
                  const label = ESTADO_LABELS[estado] || estado
                  const barColor = ESTADO_COLORS[estado] || 'bg-gray-400'
                  return (
                    <div key={estado}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${Math.max(pct, 1)}%`, opacity: 0.85 }} />
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>
        )}

        {/* Activity Log */}
        <div className="neo-card p-5 flex flex-col">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} /> Actividad Reciente
          </h3>
          <div className="flex-1 overflow-y-auto max-h-[400px] -mx-1 px-1 space-y-0.5">
            {visibleEvents.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin actividad reciente</p>
            ) : (
              visibleEvents.map((ev, i) => (
                <div key={ev.id || i} className="flex items-start gap-2.5 p-2.5 rounded-xl transition-colors"
                  style={{ cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <EventIcon tipo={ev.tipo} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ev.tipo}</span>
                      {ev.detalle && <span> — {ev.detalle.substring(0, 80)}{ev.detalle.length > 80 ? '...' : ''}</span>}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Caso #{ev.case_id} · {ev.fecha ? formatRelativeTime(ev.fecha) : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {activity.length > 20 && (
            <button
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="mt-3 neo-btn-ghost text-xs flex items-center justify-center gap-1 w-full"
            >
              {showAllEvents ? <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</> : <><ChevronDown className="w-3.5 h-3.5" /> Ver {activity.length - 20} más</>}
            </button>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <p className="text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
        Última actualización: {health?.timestamp ? new Date(health.timestamp).toLocaleString('es-CO') : 'N/A'}
        {autoRefresh && ' · Auto-refresh cada 30s'}
      </p>

      {/* ── Zona Peligrosa ── */}
      <div className="neo-card p-5 border" style={{ borderColor: 'var(--error)', borderWidth: 1 }}>
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--error)' }}>
          <AlertTriangle className="w-4 h-4" /> Zona Peligrosa
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Estas acciones son irreversibles. Úsalas solo en entornos de prueba.
        </p>
        <button
          onClick={() => { setShowResetModal(true); setResetResult(null); setResetConfirm(''); setResetToken('') }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'var(--error-soft)', color: 'var(--error)', border: '1px solid var(--error)' }}
        >
          <Trash2 className="w-4 h-4" /> Factory Reset — Borrar todo
        </button>
      </div>

      {/* Modal factory reset */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="neo-card p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" style={{ color: 'var(--error)' }} />
              <h3 className="text-base font-bold" style={{ color: 'var(--error)' }}>Factory Reset</h3>
            </div>

            {!resetResult ? (
              <>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Esto borrará <strong>todas las empresas, empleados, casos y configuraciones de tenant</strong>.
                  Los superadmins y configs del sistema se conservan.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                      ADMIN_TOKEN del servidor
                    </label>
                    <input
                      type="password"
                      value={resetToken}
                      onChange={e => setResetToken(e.target.value)}
                      placeholder="Token secreto..."
                      className="neo-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                      Escribe <span style={{ color: 'var(--error)' }}>RESET</span> para confirmar
                    </label>
                    <input
                      type="text"
                      value={resetConfirm}
                      onChange={e => setResetConfirm(e.target.value)}
                      placeholder="RESET"
                      className="neo-input w-full text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="neo-btn-ghost flex-1 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={resetConfirm !== 'RESET' || !resetToken || resetting}
                    onClick={async () => {
                      setResetting(true)
                      try {
                        const res = await factoryReset(resetToken)
                        setResetResult(res)
                        if (res.ok) load()
                      } catch (e) {
                        setResetResult({ ok: false, error: e.message })
                      } finally {
                        setResetting(false)
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: (resetConfirm === 'RESET' && resetToken && !resetting) ? 'var(--error)' : 'rgba(255,255,255,0.05)',
                      color: (resetConfirm === 'RESET' && resetToken && !resetting) ? 'white' : 'var(--text-muted)',
                      cursor: (resetConfirm === 'RESET' && resetToken && !resetting) ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {resetting ? 'Borrando...' : 'Ejecutar Reset'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {resetResult.ok ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--success)' }}>
                      <CheckCircle2 className="w-4 h-4" /> Reset completado
                    </div>
                    <div className="text-xs rounded-xl p-3 overflow-y-auto max-h-48" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                      {Object.entries(resetResult.resumen).map(([tabla, count]) => (
                        <div key={tabla} className="flex justify-between py-0.5">
                          <span>{tabla}</span>
                          <span style={{ color: count > 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                            {typeof count === 'number' ? `−${count}` : count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--error)' }}>
                    Error: {resetResult.detail || resetResult.error}
                  </p>
                )}
                <button
                  onClick={() => setShowResetModal(false)}
                  className="neo-btn-outline w-full text-sm"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


function HealthWidget({ icon: Icon, label, status, detail }) {
  const isOk = status === 'online'
  return (
    <div
      className="neo-card p-4 relative overflow-hidden"
      style={{ borderTop: `2px solid ${isOk ? 'var(--success)' : 'var(--error)'}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-xl"
          style={{ background: isOk ? 'var(--success-soft)' : 'var(--error-soft)' }}
        >
          <Icon className="w-5 h-5" style={{ color: isOk ? 'var(--success)' : 'var(--error)' }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
            {isOk ? (
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
            ) : (
              <XCircle className="w-3.5 h-3.5" style={{ color: 'var(--error)' }} />
            )}
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{detail}</p>
        </div>
      </div>
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: isOk ? 'var(--success)' : 'var(--error)', boxShadow: isOk ? '0 0 6px var(--success)' : '0 0 6px var(--error)' }} />
    </div>
  )
}


function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-widget">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value?.toLocaleString?.() ?? value ?? 0}</p>
    </div>
  )
}


function EventIcon({ tipo }) {
  const t = (tipo || '').toLowerCase()
  if (t.includes('completa') || t.includes('success'))
    return <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500 flex-shrink-0" />
  if (t.includes('error') || t.includes('reject') || t.includes('fraude'))
    return <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0" />
  if (t.includes('alerta') || t.includes('warning'))
    return <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 flex-shrink-0" />
  return <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-400 flex-shrink-0" />
}


function formatRelativeTime(isoString) {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffMin < 1) return 'Ahora'
    if (diffMin < 60) return `Hace ${diffMin}m`
    if (diffHr < 24) return `Hace ${diffHr}h`
    if (diffDay < 7) return `Hace ${diffDay}d`
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
  } catch {
    return ''
  }
}
