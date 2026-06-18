import { useState, useEffect, useCallback } from 'react'
import {
  Activity, CheckCircle, AlertCircle, Clock, Loader,
  Globe, Mail, Layers, RefreshCw, WifiOff, Zap
} from 'lucide-react'

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

// ── Badge de estado de sesión ──
const ESTADO_COLORS = {
  exitosa:  { bg: 'rgba(16,185,129,0.06)',  border: '#1D9E75', badge: { bg: 'rgba(16,185,129,0.12)',  color: '#34D399'  }, dot: '#10B981' },
  en_curso: { bg: 'rgba(245,158,11,0.06)',  border: '#EF9F27', badge: { bg: 'rgba(245,158,11,0.12)',  color: '#FBBF24'  }, dot: '#F59E0B' },
  fallida:  { bg: 'rgba(226,75,74,0.06)',   border: '#E24B4A', badge: { bg: 'rgba(239,68,68,0.12)',   color: '#F87171'  }, dot: '#EF4444' },
  esperando:{ bg: 'rgba(255,255,255,0.02)', border: '#374151', badge: { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }, dot: '#374151' },
  enviado:  { bg: 'rgba(16,185,129,0.06)',  border: '#1D9E75', badge: { bg: 'rgba(16,185,129,0.12)',  color: '#34D399'  }, dot: '#10B981' },
  error:    { bg: 'rgba(226,75,74,0.06)',   border: '#E24B4A', badge: { bg: 'rgba(239,68,68,0.12)',   color: '#F87171'  }, dot: '#EF4444' },
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#EF9F27', borderRadius: '50%', animation: 'spin .8s linear infinite', marginRight: 4 }} />
  )
}

function SesionCard({ sesion }) {
  const col = ESTADO_COLORS[sesion.estado] || ESTADO_COLORS.esperando
  const isEmail = sesion.medio === 'email'

  return (
    <div style={{
      borderRadius: 12, padding: '12px 14px', marginBottom: 8,
      background: col.bg, borderLeft: `3px solid ${col.border}`,
      border: `1px solid ${col.border}20`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{sesion.eps}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, padding: '1px 6px', borderRadius: 20,
              background: isEmail ? 'rgba(16,185,129,0.10)' : 'rgba(99,102,241,0.10)',
              color: isEmail ? '#34D399' : '#818CF8' }}>
              {isEmail ? <Mail size={8} /> : <Globe size={8} />}
              {isEmail ? 'Email' : 'Portal'}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {sesion.empresa} · {sesion.documento}
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
          background: col.badge.bg, color: col.badge.color,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          {sesion.estado === 'en_curso' && <Spinner />}
          {sesion.estado === 'exitosa' && '✓ '}
          {sesion.estado === 'enviado' && '✓ '}
          {sesion.estado === 'fallida' && '✗ '}
          {sesion.estado === 'error' && '✗ '}
          {{ exitosa: 'Radicada', en_curso: 'En curso', fallida: 'Falló', esperando: 'En espera', enviado: 'Enviado', error: 'Error' }[sesion.estado] || sesion.estado}
        </span>
      </div>

      {/* Contenido según estado */}
      {sesion.estado === 'en_curso' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#38BDF8', marginBottom: 6 }}>
            <Activity size={12} /> Vista en vivo activa
          </div>
          {sesion.logs?.map((log, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: i === sesion.logs.length - 1 ? '#38BDF8' : '#10B981', marginTop: 3, flexShrink: 0 }} />
              {log}
            </div>
          ))}
          {typeof sesion.progreso === 'number' && (
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 3, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ width: `${sesion.progreso}%`, height: '100%', background: '#38BDF8', borderRadius: 4, transition: 'width .5s' }} />
            </div>
          )}
        </>
      )}

      {(sesion.estado === 'exitosa' || sesion.estado === 'enviado') && (
        <>
          {sesion.radicado && (
            <div style={{ fontSize: 11, color: '#34D399', fontWeight: 600, marginBottom: 4 }}>
              <CheckCircle size={11} style={{ display: 'inline', marginRight: 4 }} />
              {sesion.estado === 'enviado' ? 'Correo enviado correctamente' : `Radicado: ${sesion.radicado}`}
            </div>
          )}
          {sesion.cached && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              <Zap size={10} style={{ display: 'inline', marginRight: 3, color: '#34D399' }} />
              Skill cacheada · $0 tokens
            </div>
          )}
        </>
      )}

      {(sesion.estado === 'fallida' || sesion.estado === 'error') && (
        <div style={{ fontSize: 11, color: '#F87171', marginTop: 4 }}>
          <AlertCircle size={11} style={{ display: 'inline', marginRight: 4 }} />
          {sesion.error || 'Error en la radicación — WhatsApp enviado'}
        </div>
      )}
    </div>
  )
}

function SkillBar({ nombre, costo, estado }) {
  const pct = estado === 'activa' ? 100 : estado === 'explorando' ? 60 : estado === 'fallo' ? 20 : 0
  const barColor = estado === 'activa' ? '#10B981' : estado === 'explorando' ? '#F59E0B' : '#EF4444'
  const costoColor = estado === 'activa' ? '#34D399' : estado === 'explorando' ? '#FBBF24' : '#F87171'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{nombre}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 80, background: 'var(--bg-secondary)', borderRadius: 3, height: 4 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 11, color: costoColor, minWidth: 40, textAlign: 'right' }}>{costo}</span>
      </div>
    </div>
  )
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

export default function RadicacionMonitoreo() {
  const [stats, setStats] = useState({ total: 0, exitosas: 0, en_curso: 0, fallidas: 0 })
  const [sesiones, setSesiones] = useState([])
  const [cola, setCola] = useState([])
  const [skills, setSkills] = useState([])
  const [sinConexion, setSinConexion] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [ultimaAct, setUltimaAct] = useState(null)

  const cargar = useCallback(async () => {
    const [statsData, sesData, colaData, skillsData] = await Promise.all([
      fetchSafe('/admin/radicacion/stats'),
      fetchSafe('/admin/radicacion/sesiones'),
      fetchSafe('/admin/radicacion/cola'),
      fetchSafe('/admin/radicacion/skills'),
    ])

    const hayDatos = statsData || sesData || colaData || skillsData
    setSinConexion(!hayDatos)

    if (statsData) setStats(statsData)
    if (sesData) setSesiones(sesData.sesiones || [])
    if (colaData) setCola(colaData.items || [])
    if (skillsData) setSkills(skillsData.skills || [])

    setCargando(false)
    setUltimaAct(new Date())
  }, [])

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 5000)
    return () => clearInterval(interval)
  }, [cargar])

  const hayFallas = sesiones.some(s => s.estado === 'fallida' || s.estado === 'error')
  const sesActivas = sesiones.filter(s => s.estado === 'en_curso')
  const sesHistorial = sesiones.filter(s => s.estado !== 'en_curso')

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 64px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)', color: '#38BDF8' }}>
            <Activity size={24} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Estado de Radicación
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {ultimaAct && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Actualizado {ultimaAct.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button onClick={cargar} disabled={cargando} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#38BDF8', background: 'rgba(14,165,233,0.10)', border: '1px solid rgba(14,165,233,0.2)', cursor: 'pointer' }}>
            <RefreshCw size={13} style={{ animation: cargando ? 'spin .8s linear infinite' : 'none' }} /> Actualizar
          </button>
        </div>
      </div>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginBottom: 24 }}>
        Monitoreo en vivo · Sesiones activas · Cola de trabajo · Estado de skills
      </p>

      {/* Alerta si hay fallas */}
      {hayFallas && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#FBBF24', fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
          <AlertCircle size={15} />
          Hay radicaciones fallidas — se enviaron alertas por WhatsApp para intervención manual.
        </div>
      )}

      {/* Sin conexión con backend de radicación */}
      {sinConexion && !cargando && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-primary)', color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
          <WifiOff size={14} /> El módulo de monitoreo de radicación aún no está activo en el backend. Los datos aparecerán aquí cuando se activen los endpoints <code style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>/admin/radicacion/*</code>.
        </div>
      )}

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <MetricCard label="Lote actual" value={stats.total ?? 0} />
        <MetricCard label="Exitosas" value={stats.exitosas ?? 0} color="#34D399" />
        <MetricCard label="En curso" value={stats.en_curso ?? 0} color="#FBBF24" />
        <MetricCard label="Fallidas" value={stats.fallidas ?? 0} color="#F87171" />
      </div>

      {/* Grid principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Columna izquierda — Sesiones */}
        <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)', borderRadius: 18, padding: '16px 18px' }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <Activity size={13} /> Sesiones activas
            {sesActivas.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#FBBF24' }}>
                {sesActivas.length} en curso
              </span>
            )}
          </h4>

          {cargando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Loader size={28} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            </div>
          ) : sesiones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
              <Activity size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
              <p>No hay sesiones activas en este momento.</p>
              <p style={{ fontSize: 11, marginTop: 6 }}>Las radicaciones aparecerán aquí cuando se procesen.</p>
            </div>
          ) : (
            <>
              {sesActivas.map((s, i) => <SesionCard key={i} sesion={s} />)}
              {sesHistorial.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '14px 0 8px', fontWeight: 700 }}>Historial reciente</div>
                  {sesHistorial.map((s, i) => <SesionCard key={i} sesion={s} />)}
                </>
              )}
            </>
          )}
        </div>

        {/* Columna derecha — Cola + Skills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Cola pendiente */}
          <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)', borderRadius: 18, padding: '16px 18px', flex: '0 0 auto' }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <Layers size={13} /> Cola pendiente
              {cola.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(14,165,233,0.15)', color: '#38BDF8' }}>
                  {cola.length}
                </span>
              )}
            </h4>
            {cola.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0' }}>Cola vacía — sin pendientes.</p>
            ) : (
              cola.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < cola.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.eps}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}> · {item.documento}</span>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                    En espera
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Skills activas */}
          <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)', borderRadius: 18, padding: '16px 18px', flex: 1 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <Zap size={13} /> Skills de radicación
            </h4>
            {skills.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin datos de skills aún.</p>
            ) : (
              skills.map((s, i) => (
                <SkillBar key={i} nombre={s.nombre} costo={s.costo} estado={s.estado} />
              ))
            )}
            {/* Leyenda de costo */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { color: '#10B981', label: 'Skill cacheada — $0 tokens (replay)' },
                { color: '#F59E0B', label: 'Explorando — LLM activo (~$0.08)' },
                { color: '#EF4444', label: 'Falló — requiere re-entrenamiento' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
