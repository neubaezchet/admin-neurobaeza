import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, CheckCircle2, Clock, Mail, Hash, Search,
  ChevronRight, Loader2, AlertCircle, RefreshCw, ExternalLink,
  FileSpreadsheet, Users,
} from 'lucide-react'
import { getEmpresas, getTenant } from '../api'

// ─── Chip de estado ───────────────────────────────────────────────────────────

function Chip({ label, color, bg, border }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
      background: bg, color, border: `1px solid ${border}`,
      letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ─── Tarjeta de empresa ───────────────────────────────────────────────────────

function EmpresaCard({ empresa }) {
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const cargarConfig = useCallback(async () => {
    if (config !== null || loadingConfig) return
    setLoadingConfig(true)
    try {
      const res = await getTenant(empresa.id)
      setConfig(res.tenant_config || {})
    } catch {
      setConfig({})
    } finally {
      setLoadingConfig(false)
    }
  }, [empresa.id, config, loadingConfig])

  const handleExpand = () => {
    if (!expanded) cargarConfig()
    setExpanded(!expanded)
  }

  const tieneSheet = config?.google_sheets_id
  const onboardingOk = config?.onboarding_completado
  const ciclo = config?.ciclo_reporte

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)',
      borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(14,165,233,0.25)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
    >
      {/* Card header */}
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Icono */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={20} color="#38BDF8" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              margin: '0 0 2px', fontSize: 15, fontWeight: 700,
              color: 'var(--text-primary)', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {empresa.nombre}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {empresa.nit && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  NIT: {empresa.nit}
                </span>
              )}
            </div>

            {empresa.contacto_email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <Mail size={11} color="var(--text-muted)" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{empresa.contacto_email}</span>
              </div>
            )}
          </div>

          {/* Botón expandir */}
          <button
            onClick={handleExpand}
            style={{
              padding: '6px 10px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-primary)',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
            }}
          >
            {loadingConfig
              ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              : <ChevronRight size={12} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            }
            {expanded ? 'Cerrar' : 'Ver más'}
          </button>
        </div>
      </div>

      {/* Chips de estado (siempre visibles si config cargada) */}
      {config && (
        <div style={{ padding: '0 20px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tieneSheet
            ? <Chip label="Sheet ✓" color="#34D399" bg="rgba(16,185,129,0.1)" border="rgba(16,185,129,0.2)" />
            : <Chip label="Sin Sheet" color="#94A3B8" bg="rgba(148,163,184,0.08)" border="rgba(148,163,184,0.15)" />
          }
          {onboardingOk
            ? <Chip label="Activa ✓" color="#34D399" bg="rgba(16,185,129,0.1)" border="rgba(16,185,129,0.2)" />
            : <Chip label="Onboarding pendiente" color="#FCD34D" bg="rgba(251,191,36,0.1)" border="rgba(251,191,36,0.2)" />
          }
          {ciclo && (
            <Chip
              label={ciclo === 'quincenal' ? 'Quincenal' : 'Mensual'}
              color="#38BDF8" bg="rgba(14,165,233,0.1)" border="rgba(14,165,233,0.2)"
            />
          )}
        </div>
      )}

      {/* Detalle expandido */}
      {expanded && config && (
        <div style={{
          padding: '16px 20px', borderTop: '1px solid var(--border-primary)',
          background: 'rgba(255,255,255,0.015)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Estructura', value: config.tipo_estructura === 'holding' ? 'Holding / Grupo' : 'Empresa única' },
              { label: 'Zona horaria', value: config.zona_horaria || '—' },
              { label: 'Correo contacto', value: config.contacto_email || '—' },
              { label: 'Paleta', value: config.paleta_id || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {config.google_sheets_url && (
              <a
                href={config.google_sheets_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                  borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                  color: '#34D399', fontSize: 12, fontWeight: 600, textDecoration: 'none',
                }}
              >
                <FileSpreadsheet size={13} /> Ver Sheet
              </a>
            )}
            <button
              onClick={() => navigate(`/tenants/${empresa.id}/onboarding`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 8, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)',
                color: '#38BDF8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <ExternalLink size={13} /> Configuración
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Empresas() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await getEmpresas()
      setEmpresas(res.empresas || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const empresasFiltradas = empresas.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (e.nit && e.nit.includes(busqueda)) ||
    (e.contacto_email && e.contacto_email.toLowerCase().includes(busqueda.toLowerCase()))
  )

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Empresas Registradas
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {loading ? 'Cargando...' : `${empresas.length} tenant${empresas.length !== 1 ? 's' : ''} en el sistema`}
            </p>
          </div>
          <button
            onClick={cargar}
            style={{
              padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-primary)',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
            }}
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {/* Buscador */}
        <div style={{
          marginTop: 18, position: 'relative', maxWidth: 360,
        }}>
          <Search size={15} color="var(--text-muted)" style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
          }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, NIT o correo..."
            style={{
              width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 36px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-primary)',
              borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          fontSize: 13, color: '#FCA5A5',
        }}>
          <AlertCircle size={16} color="#F87171" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={28} color="rgba(14,165,233,0.6)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Grid de empresas */}
      {!loading && !error && (
        empresasFiltradas.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-primary)',
            borderRadius: 16,
          }}>
            <Building2 size={40} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.4 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 6px' }}>
              {busqueda ? 'No se encontraron empresas' : 'No hay empresas registradas'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', opacity: 0.6, margin: 0 }}>
              {busqueda ? 'Intenta con otro término de búsqueda' : 'Aprueba solicitudes de demo para registrar empresas'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}>
            {empresasFiltradas.map(empresa => (
              <EmpresaCard key={empresa.id} empresa={empresa} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
