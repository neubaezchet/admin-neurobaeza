/**
 * TenantWelcome — Pantalla de activación
 * =====================================================
 * Secuencia animada de 4 fases:
 *   1. Logo + ring de luz expandiéndose  (0–1.2s)
 *   2. Nombre de la empresa fade-in      (1.2–2.2s)
 *   3. Cards de resumen slide-in         (2.2–3.4s)
 *   4. Credenciales + botón aparecen     (3.4s+)
 *
 * Tema: Indigo 2026 (fondo claro), acentuado con los colores propios
 * del tenant (paleta_colores.primary/secondary/accent).
 * Las credenciales se reciben desde TenantOnboarding vía navigate state.
 */

import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Building2, Palette, Mail, HardDrive, Clock, MapPin,
  CheckCircle2, ArrowRight, Sparkles, Lock, Copy, Check,
  ExternalLink, Shield, FileText, Upload,
} from 'lucide-react'
import { getTenantTheme } from '../api'

// ─── URLs de los 3 portales ───────────────────────────────
const PORTALES = [
  {
    id: 'admin',
    label: 'Portal Administración',
    desc: 'Configuración, usuarios y reportes',
    url: 'https://admin-neurobaeza.vercel.app',
    icon: Shield,
    color: '#4F46E5',
  },
  {
    id: 'validacion',
    label: 'Portal Validación',
    desc: 'Revisión y gestión de incapacidades',
    url: 'https://portal-neurobaeza.vercel.app',
    icon: FileText,
    color: '#0EA5E9',
  },
  {
    id: 'recepcion',
    label: 'RopoGemini',
    desc: 'Recepción y carga de incapacidades',
    url: 'https://repogemin.vercel.app',
    icon: Upload,
    color: '#F59E0B',
  },
]

// ─── Helpers ──────────────────────────────────────────────

const PHASE_DELAYS = { ring: 0, logo: 200, name: 1200, cards: 2200, button: 3600 }

// ─── Partículas flotantes de fondo ───────────────────────

function Particles({ color }) {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden
    >
      {Array.from({ length: 30 }, (_, i) => {
        const cx = (i * 127.3) % 100
        const cy = (i * 91.7) % 100
        const r = 1 + (i % 3)
        const delay = (i * 0.3) % 4
        return (
          <circle
            key={i}
            cx={`${cx}%`} cy={`${cy}%`} r={r}
            fill={color}
            opacity={0.10 + (i % 4) * 0.05}
            style={{ animation: `float-particle ${3 + (i % 3)}s ${delay}s ease-in-out infinite alternate` }}
          />
        )
      })}
    </svg>
  )
}

// ─── Summary card ─────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, color, delay, visible }) {
  return (
    <div className="act-sum-card" style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ${delay}ms ease, transform 0.5s ${delay}ms ease`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${color}16`,
        border: `1px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 11, color: '#94A3B8',
          textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 14, color: '#0F172A', fontWeight: 500 }}>
          {value || '—'}
        </p>
      </div>
      <CheckCircle2 size={14} color={`${color}90`} style={{ marginLeft: 'auto', flexShrink: 0 }} />
    </div>
  )
}

// ─── Credentials card ─────────────────────────────────────

function CredentialsCard({ credentials, confirmed, onConfirm, visible }) {
  const [copiedField, setCopiedField] = useState(null) // 'username' | 'password'

  function copyToClipboard(text, field) {
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const copyBtnStyle = (field) => ({
    background: copiedField === field ? 'var(--success-soft)' : 'rgba(245,158,11,0.12)',
    border: `1px solid ${copiedField === field ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.28)'}`,
    color: copiedField === field ? '#047857' : '#B45309',
  })

  return (
    <div className="cred-card" style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: 'opacity 0.6s 3700ms ease, transform 0.6s 3700ms ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: 'rgba(245,158,11,0.14)',
          border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lock size={17} color="#B45309" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
            Guarda estas credenciales
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#B45309', lineHeight: 1.4 }}>
            Esta contraseña <strong>no se volverá a mostrar.</strong> Cópiala ahora.
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="cred-field">
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="cred-label">Usuario</p>
          <p className="cred-val">{credentials.username || '—'}</p>
        </div>
        <button className="cred-copy-btn" style={copyBtnStyle('username')}
          onClick={() => copyToClipboard(credentials.username, 'username')} title="Copiar usuario">
          {copiedField === 'username' ? <><Check size={11} /> Copiado ✓</> : <><Copy size={11} /> Copiar</>}
        </button>
      </div>

      <div className="cred-field" style={{ marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="cred-label">Contraseña temporal</p>
          <p className="cred-val" style={{ letterSpacing: '0.12em' }}>{credentials.password || '—'}</p>
        </div>
        <button className="cred-copy-btn" style={copyBtnStyle('password')}
          onClick={() => copyToClipboard(credentials.password, 'password')} title="Copiar contraseña">
          {copiedField === 'password' ? <><Check size={11} /> Copiado ✓</> : <><Copy size={11} /> Copiar</>}
        </button>
      </div>

      {/* Confirmation checkbox */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ position: 'relative', flexShrink: 0, marginTop: 1 }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => onConfirm(e.target.checked)}
            style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', margin: 0 }}
          />
          <div style={{
            width: 18, height: 18, borderRadius: 5,
            background: confirmed ? '#10B981' : '#FFFFFF',
            border: `1.5px solid ${confirmed ? '#10B981' : 'rgba(245,158,11,0.4)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s ease',
          }}>
            {confirmed && <Check size={11} color="white" strokeWidth={3} />}
          </div>
        </div>
        <span style={{ fontSize: 13, color: '#64748B', lineHeight: 1.45 }}>
          Confirmé que guardé las credenciales en un lugar seguro
        </span>
      </label>
    </div>
  )
}

// ─── Portales card ────────────────────────────────────────

// Mapea el id visual de PORTALES a la clave del objeto `links` del backend
const LINK_KEY = { admin: 'admin', validacion: 'portal', recepcion: 'repogemin' }

function PortalesCard({ visible, links }) {
  const [copiedId, setCopiedId] = useState(null)
  const urlDe = (p) => (links && links[LINK_KEY[p.id]]) || p.url

  const copyUrl = (id, url) => {
    navigator.clipboard.writeText(url).catch(() => {
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="portal-card" style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: 'opacity 0.6s 3900ms ease, transform 0.6s 3900ms ease',
    }}>
      <p style={{
        margin: '0 0 14px', fontSize: 11, fontWeight: 700,
        color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        Tus 3 portales de acceso
      </p>

      <div>
        {PORTALES.map(p => (
          <div key={p.id} className="portal-item">
            <div className="portal-icon" style={{ background: `${p.color}16`, border: `1px solid ${p.color}35` }}>
              <p.icon size={15} color={p.color} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                {p.label}
              </p>
              <p style={{
                margin: '1px 0 0', fontSize: 10, color: '#94A3B8',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {urlDe(p)}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
              <button
                onClick={() => copyUrl(p.id, urlDe(p))}
                title="Copiar URL"
                style={{
                  padding: '5px 8px', borderRadius: 7, cursor: 'pointer', border: 'none',
                  background: copiedId === p.id ? 'var(--success-soft)' : 'rgba(15,23,42,0.05)',
                  color: copiedId === p.id ? '#047857' : '#64748B',
                  fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                {copiedId === p.id ? <><Check size={10} /> OK</> : <><Copy size={10} /> Copiar</>}
              </button>
              <a
                href={urlDe(p)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '5px 8px', borderRadius: 7, cursor: 'pointer',
                  background: `${p.color}12`, border: `1px solid ${p.color}30`,
                  color: p.color, fontSize: 10, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none',
                }}
              >
                <ExternalLink size={10} /> Abrir
              </a>
            </div>
          </div>
        ))}
      </div>

      <p style={{ margin: '12px 0 0', fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>
        Usa las credenciales de arriba para ingresar a los 3 portales. Compártelos con tu equipo.
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────

export default function TenantWelcome() {
  const { companyId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const tenant      = state?.tenant      || {}
  const credentials = state?.credentials || {}
  const hasCredentials = !!(credentials.username && credentials.password)

  const paleta    = tenant.paleta_colores || {}
  const primary   = paleta.primary   || '#4F46E5'
  const secondary = paleta.secondary || '#818CF8'
  const accent    = paleta.accent    || '#7C3AED'

  const [phase, setPhase] = useState({
    ring: false, logo: false, name: false, cards: false, button: false,
  })
  const [credConfirmed, setCredConfirmed] = useState(false)

  // Links por slug de la empresa (si falla, PortalesCard usa los genéricos)
  const [tenantLinks, setTenantLinks] = useState(null)
  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    getTenantTheme(companyId)
      .then(d => { if (!cancelled && d?.links) setTenantLinks(d.links) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [companyId])

  useEffect(() => {
    const timers = Object.entries(PHASE_DELAYS).map(([key, delay]) =>
      setTimeout(() => setPhase(p => ({ ...p, [key]: true })), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  const canProceed = !hasCredentials || credConfirmed

  const summaryItems = [
    { icon: Building2, label: 'NIT',          value: tenant.nit,                   color: primary },
    { icon: Mail,      label: 'Administrador', value: tenant.contacto_email,         color: secondary },
    { icon: Clock,     label: 'Reportes',      value: tenant.ciclo_reporte,          color: accent },
    { icon: MapPin,    label: 'Zona horaria',  value: tenant.zona_horaria,           color: primary },
    { icon: HardDrive, label: 'Google Drive',  value: tenant.google_workspace_drive_id ? 'Conectado' : 'Pendiente', color: secondary },
    { icon: Palette,   label: 'Identidad',     value: 'Configurada',                color: accent },
  ].filter(i => i.value)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div className="vanta-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="activation" style={{ zIndex: 1 }}>
        <Particles color={primary} />

        {/* ── Phase 1: Logo con rings ── */}
        <div style={{ position: 'relative', marginBottom: 48 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="act-ring" style={{
              inset: -(i * 24),
              borderColor: primary,
              opacity: phase.ring ? (0.25 / i) : 0,
              transform: phase.ring ? 'scale(1)' : 'scale(0.3)',
              transitionDelay: `${i * 200}ms`,
              animation: phase.ring ? `ring-pulse 2.5s ${i * 400}ms ease-in-out infinite` : 'none',
            }} />
          ))}

          <div className="act-logo" style={{
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            boxShadow: `0 0 60px ${primary}45, 0 20px 50px rgba(15,23,42,0.18)`,
            opacity: phase.logo ? 1 : 0,
            transform: phase.logo ? 'scale(1)' : 'scale(0.4)',
          }}>
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.nombre}
                style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 8 }}
              />
            ) : (
              <Building2 size={52} color="white" strokeWidth={1.5} />
            )}

            <div style={{
              position: 'absolute', bottom: -6, right: -6,
              width: 32, height: 32, borderRadius: '50%',
              background: '#10B981',
              border: '3px solid #FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: phase.name ? 1 : 0,
              transform: phase.name ? 'scale(1)' : 'scale(0)',
              transition: 'all 0.4s 1400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 2px 10px rgba(16,185,129,0.35)',
            }}>
              <CheckCircle2 size={16} color="white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* ── Phase 2: Nombre ── */}
        <div style={{
          textAlign: 'center', marginBottom: 40,
          opacity: phase.name ? 1 : 0,
          transform: phase.name ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s 1200ms ease, transform 0.7s 1200ms ease',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: `${primary}14`, border: `1px solid ${primary}30`,
            borderRadius: 999, padding: '5px 16px', marginBottom: 16,
          }}>
            <Sparkles size={12} color={accent} />
            <span style={{ fontSize: 11, color: accent, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Empresa activada
            </span>
          </div>
          <h1 className="act-h1">
            Bienvenido a<br />
            <span style={{ color: primary }}>{tenant.nombre || 'tu empresa'}</span>
          </h1>
          <p className="act-sub">
            La configuración se completó exitosamente. Tu portal está listo para gestionar incapacidades médicas.
          </p>
        </div>

        {/* ── Phase 3: Summary cards ── */}
        <div style={{ width: '100%', maxWidth: 480, marginBottom: 20 }}>
          {summaryItems.map((item, i) => (
            <SummaryCard
              key={item.label}
              {...item}
              delay={i * 120}
              visible={phase.cards}
            />
          ))}
        </div>

        {/* ── Phase 4: Credentials card (solo si vienen credenciales) ── */}
        {hasCredentials && (
          <CredentialsCard
            credentials={credentials}
            confirmed={credConfirmed}
            onConfirm={setCredConfirmed}
            visible={phase.button}
          />
        )}

        {/* ── Phase 4: Los 3 portales ── */}
        <PortalesCard visible={phase.button} links={tenantLinks} />

        {/* ── Phase 4: CTA ── */}
        <div style={{
          opacity: phase.button ? 1 : 0,
          transform: phase.button ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
          transition: 'opacity 0.5s 3600ms ease, transform 0.5s 3600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <button
            onClick={() => canProceed && navigate('/')}
            disabled={!canProceed}
            style={{
              padding: '16px 48px', borderRadius: 16,
              cursor: canProceed ? 'pointer' : 'not-allowed',
              background: canProceed
                ? `linear-gradient(135deg, ${primary}, ${secondary})`
                : 'rgba(15,23,42,0.06)',
              border: canProceed ? 'none' : '1px solid rgba(15,23,42,0.10)',
              color: canProceed ? 'white' : '#94A3B8',
              fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: canProceed ? `0 8px 32px ${primary}40, 0 2px 8px rgba(15,23,42,0.10)` : 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (!canProceed) return
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
              e.currentTarget.style.boxShadow = `0 16px 40px ${primary}4D, 0 4px 12px rgba(15,23,42,0.14)`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = canProceed
                ? `0 8px 32px ${primary}40, 0 2px 8px rgba(15,23,42,0.10)`
                : 'none'
            }}
          >
            {hasCredentials ? 'Ir al portal' : 'Comenzar'} <ArrowRight size={18} />
          </button>

          {hasCredentials && !credConfirmed && (
            <p style={{ margin: 0, fontSize: 12, color: '#B45309', textAlign: 'center' }}>
              Confirma que guardaste las credenciales para continuar
            </p>
          )}

          <button
            onClick={() => navigate(`/tenants/${companyId}/users`)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#94A3B8',
              textDecoration: 'underline', textDecorationStyle: 'dotted',
            }}
          >
            Agregar usuarios al tenant
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ring-pulse {
          0%   { opacity: var(--ro); transform: scale(1); }
          50%  { opacity: calc(var(--ro) * 0.5); transform: scale(1.06); }
          100% { opacity: var(--ro); transform: scale(1); }
        }
        @keyframes float-particle {
          from { transform: translateY(0px); }
          to   { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  )
}
