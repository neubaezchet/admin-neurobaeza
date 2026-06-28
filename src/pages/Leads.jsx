import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Check, X, Copy, CheckCircle2, Clock,
  ExternalLink, Loader2, AlertCircle, ChevronRight,
  Users, RefreshCw, Filter,
} from 'lucide-react'
import { getLeads, aprobarLead, rechazarLead } from '../api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function EstadoChip({ estado }) {
  const map = {
    pendiente: { label: 'Pendiente', bg: 'rgba(251,191,36,0.12)', color: '#FCD34D', border: 'rgba(251,191,36,0.25)' },
    aprobado:  { label: 'Aprobado',  bg: 'rgba(16,185,129,0.12)', color: '#34D399', border: 'rgba(16,185,129,0.25)' },
    rechazado: { label: 'Rechazado', bg: 'rgba(239,68,68,0.12)',  color: '#F87171', border: 'rgba(239,68,68,0.25)' },
  }
  const s = map[estado] || map.pendiente
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {s.label}
    </span>
  )
}

// ─── Modal Aprobar ────────────────────────────────────────────────────────────

function ModalAprobar({ lead, onClose, onSuccess }) {
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleAprobar = async () => {
    setLoading(true); setError('')
    try {
      const res = await aprobarLead(lead.id, { notas_internas: notas || undefined })
      setResultado(res)
      onSuccess()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(resultado.link_registro)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => e.target === e.currentTarget && !resultado && onClose()}>
      <div style={{
        background: 'var(--bg-sidebar)', border: '1px solid var(--border-primary)',
        borderRadius: 20, padding: 32, maxWidth: 500, width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {!resultado ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Check size={20} color="#34D399" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Aprobar solicitud
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  {lead.empresa_nombre}
                </p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Se creará la empresa en el sistema y se enviará un link de registro a{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{lead.contacto_email}</strong>.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Notas internas (opcional)
              </label>
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={3}
                placeholder="Notas sobre esta aprobación..."
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-primary)',
                  borderRadius: 10, fontSize: 13, color: 'var(--text-primary)',
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>

            {error && (
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#FCA5A5',
              }}>
                <AlertCircle size={14} color="#F87171" />
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-primary)',
                  color: 'var(--text-muted)', fontWeight: 600, fontSize: 14,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAprobar}
                disabled={loading}
                style={{
                  flex: 2, padding: '11px', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? 'rgba(16,185,129,0.3)' : '#10B981',
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Procesando...</> : <><Check size={15} /> Confirmar aprobación</>}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(16,185,129,0.15)', border: '2px solid #10B981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={32} color="#10B981" />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                ¡Empresa aprobada!
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                Email enviado a {lead.contacto_email}
              </p>
            </div>

            <div style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 20,
              background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#38BDF8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Link de registro generado
              </p>
              <p style={{
                margin: '0 0 10px', fontSize: 12, color: 'var(--text-muted)',
                wordBreak: 'break-all', fontFamily: 'monospace',
              }}>
                {resultado.link_registro}
              </p>
              <button
                onClick={copyLink}
                style={{
                  padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(14,165,233,0.3)',
                  background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(14,165,233,0.12)',
                  color: copied ? '#34D399' : '#38BDF8',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {copied ? <><CheckCircle2 size={13} /> Copiado</> : <><Copy size={13} /> Copiar link</>}
              </button>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 20 }}>
              Expira: {new Date(resultado.expires_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>

            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '11px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)', fontWeight: 600, fontSize: 14,
              }}
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Modal Rechazar ───────────────────────────────────────────────────────────

function ModalRechazar({ lead, onClose, onSuccess }) {
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRechazar = async () => {
    setLoading(true); setError('')
    try {
      await rechazarLead(lead.id, { notas_internas: notas || undefined })
      onSuccess()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-sidebar)', border: '1px solid var(--border-primary)',
        borderRadius: 20, padding: 32, maxWidth: 440, width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <X size={20} color="#F87171" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              Rechazar solicitud
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {lead.empresa_nombre}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Motivo del rechazo (opcional)
          </label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
            placeholder="Ej: Información incompleta, empresa no aplica..."
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 12px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-primary)',
              borderRadius: 10, fontSize: 13, color: 'var(--text-primary)',
              resize: 'vertical', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {error && (
          <div style={{
            display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 8, marginBottom: 16,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 12, color: '#FCA5A5',
          }}>
            <AlertCircle size={14} color="#F87171" />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-primary)',
            color: 'var(--text-muted)', fontWeight: 600, fontSize: 14,
          }}>Cancelar</button>
          <button onClick={handleRechazar} disabled={loading} style={{
            flex: 2, padding: '11px', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.85)',
            border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Procesando...</> : <><X size={15} /> Confirmar rechazo</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({ pendientes: 0, aprobados: 0, rechazados: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('') // '' = todos
  const [modalAprobar, setModalAprobar] = useState(null)
  const [modalRechazar, setModalRechazar] = useState(null)
  const [copiedLink, setCopiedLink] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {}
      const res = await getLeads(params)
      setLeads(res.leads || [])
      setStats(res.stats || { pendientes: 0, aprobados: 0, rechazados: 0 })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filtroEstado])

  useEffect(() => { cargar() }, [cargar])

  const copyLink = (link, id) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(id)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const FILTROS = [
    { value: '', label: 'Todos' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'aprobado', label: 'Aprobados' },
    { value: 'rechazado', label: 'Rechazados' },
  ]

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Solicitudes de Demo
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Empresas que solicitan acceso al sistema
            </p>
          </div>
          <button
            onClick={cargar}
            title="Actualizar"
            style={{
              padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-primary)',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
        </div>

        {/* Stats chips */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          {[
            { label: 'Pendientes', value: stats.pendientes, color: '#FCD34D', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
            { label: 'Aprobadas',  value: stats.aprobados,  color: '#34D399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
            { label: 'Rechazadas', value: stats.rechazados, color: '#F87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
              borderRadius: 99, background: s.bg, border: `1px solid ${s.border}`,
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 500, opacity: 0.8 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <Filter size={14} color="var(--text-muted)" style={{ alignSelf: 'center', marginRight: 4 }} />
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltroEstado(f.value)}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              border: filtroEstado === f.value ? '1px solid rgba(14,165,233,0.4)' : '1px solid var(--border-primary)',
              background: filtroEstado === f.value ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.03)',
              color: filtroEstado === f.value ? '#38BDF8' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          fontSize: 13, color: '#FCA5A5',
        }}>
          <AlertCircle size={16} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={28} color="rgba(14,165,233,0.6)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        leads.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)',
            borderRadius: 16,
          }}>
            <Building2 size={40} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.4 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 6px' }}>
              No hay solicitudes
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', opacity: 0.6, margin: 0 }}>
              {filtroEstado ? `No hay solicitudes con estado "${filtroEstado}"` : 'Aún no has recibido solicitudes de demo'}
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* Cabecera tabla */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1.2fr 1.5fr 0.8fr 0.8fr 0.9fr 1.2fr',
              padding: '10px 20px', gap: 12,
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid var(--border-primary)',
            }}>
              {['Empresa', 'NIT', 'Contacto', 'Correo', 'Teléfono', 'Cómo nos conoció', 'Fecha', 'Acciones'].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Filas */}
            {leads.map((lead, i) => (
              <div
                key={lead.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1.2fr 1.5fr 0.8fr 0.8fr 0.9fr 1.2fr',
                  padding: '14px 20px', gap: 12, alignItems: 'center',
                  borderBottom: i < leads.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.empresa_nombre}
                  </p>
                  <EstadoChip estado={lead.estado} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{lead.nit || '—'}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.contacto_nombre}</span>
                <span style={{ fontSize: 12, color: '#38BDF8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.contacto_email}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.contacto_telefono || '—'}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.como_conocio || '—'}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtFecha(lead.created_at)}</span>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {lead.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => setModalAprobar(lead)}
                        style={{
                          padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                          color: '#34D399', display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <Check size={11} /> Aprobar
                      </button>
                      <button
                        onClick={() => setModalRechazar(lead)}
                        style={{
                          padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                          color: '#F87171', display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <X size={11} /> Rechazar
                      </button>
                    </>
                  )}
                  {lead.estado === 'aprobado' && (
                    <span style={{ fontSize: 11, color: '#34D399', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} /> Aprobado por {lead.aprobado_por}
                    </span>
                  )}
                  {lead.estado === 'rechazado' && (
                    <span style={{ fontSize: 11, color: '#F87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <X size={12} /> Rechazado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modales */}
      {modalAprobar && (
        <ModalAprobar
          lead={modalAprobar}
          onClose={() => setModalAprobar(null)}
          onSuccess={() => { cargar(); setModalAprobar(null) }}
        />
      )}
      {modalRechazar && (
        <ModalRechazar
          lead={modalRechazar}
          onClose={() => setModalRechazar(null)}
          onSuccess={cargar}
        />
      )}
    </div>
  )
}
