/**
 * TenantWelcome — Pantalla de activación estilo iPhone
 * =====================================================
 * Secuencia animada de 4 fases:
 *   1. Logo + ring de luz expandiéndose  (0–1.2s)
 *   2. Nombre de la empresa fade-in      (1.2–2.2s)
 *   3. Cards de resumen slide-in         (2.2–3.4s)
 *   4. Credenciales + botón aparecen     (3.4s+)
 *
 * Los colores se toman del tenant: paleta_colores.primary/secondary
 * Las credenciales se reciben desde TenantOnboarding vía navigate state.
 */

import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Building2, Palette, Mail, HardDrive, Clock, MapPin,
  CheckCircle2, ArrowRight, Sparkles, Lock, Copy, Check,
} from 'lucide-react'

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
            opacity={0.15 + (i % 4) * 0.06}
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
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px', borderRadius: 14,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}30`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ${delay}ms ease, transform 0.5s ${delay}ms ease`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${color}18`,
        border: `1px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>
          {value || '—'}
        </p>
      </div>
      <CheckCircle2 size={14} color={`${color}80`} style={{ marginLeft: 'auto', flexShrink: 0 }} />
    </div>
  )
}

// ─── Credentials card ─────────────────────────────────────

function CredentialsCard({ credentials, confirmed, onConfirm, visible }) {
  const [copiedField, setCopiedField] = useState(null) // 'username' | 'password'

  function copyToClipboard(text, field) {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback para navegadores sin clipboard API
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

  const fieldStyle = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 14px', borderRadius: 10,
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(251,191,36,0.2)',
  }

  const labelStyle = {
    margin: 0, fontSize: 10, fontWeight: 700,
    color: 'rgba(251,191,36,0.6)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
  }

  const valueStyle = {
    margin: '3px 0 0', fontSize: 14,
    color: 'rgba(255,255,255,0.9)', fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    letterSpacing: '0.03em',
  }

  const copyBtnStyle = (field) => ({
    marginLeft: 'auto', flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
    background: copiedField === field ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.1)',
    border: `1px solid ${copiedField === field ? 'rgba(16,185,129,0.35)' : 'rgba(251,191,36,0.25)'}`,
    color: copiedField === field ? '#10B981' : 'rgba(251,191,36,0.8)',
    fontSize: 11, fontWeight: 600,
    transition: 'all 0.2s ease',
  })

  return (
    <div style={{
      width: '100%', maxWidth: 480,
      borderRadius: 18,
      background: 'linear-gradient(135deg, rgba(120,53,15,0.35) 0%, rgba(92,30,10,0.25) 100%)',
      border: '1px solid rgba(251,191,36,0.3)',
      boxShadow: '0 8px 40px rgba(251,191,36,0.08), inset 0 1px 0 rgba(251,191,36,0.12)',
      padding: '20px 22px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: 'opacity 0.6s 3700ms ease, transform 0.6s 3700ms ease',
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: 'rgba(251,191,36,0.12)',
          border: '1px solid rgba(251,191,36,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lock size={17} color="#FBB924" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
            Guarda estas credenciales
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(251,191,36,0.7)', lineHeight: 1.4 }}>
            Esta contraseña <strong style={{ color: '#FBB924' }}>no se volverá a mostrar.</strong> Cópiala ahora.
          </p>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>

        {/* Username */}
        <div style={fieldStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={labelStyle}>Usuario</p>
            <p style={valueStyle}>{credentials.username || '—'}</p>
          </div>
          <button
            style={copyBtnStyle('username')}
            onClick={() => copyToClipboard(credentials.username, 'username')}
            title="Copiar usuario"
          >
            {copiedField === 'username'
              ? <><Check size={11} /> Copiado ✓</>
              : <><Copy size={11} /> Copiar</>
            }
          </button>
        </div>

        {/* Password */}
        <div style={fieldStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={labelStyle}>Contraseña temporal</p>
            <p style={{ ...valueStyle, letterSpacing: '0.12em' }}>{credentials.password || '—'}</p>
          </div>
          <button
            style={copyBtnStyle('password')}
            onClick={() => copyToClipboard(credentials.password, 'password')}
            title="Copiar contraseña"
          >
            {copiedField === 'password'
              ? <><Check size={11} /> Copiado ✓</>
              : <><Copy size={11} /> Copiar</>
            }
          </button>
        </div>
      </div>

      {/* Confirmation checkbox */}
      <label style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        cursor: 'pointer', userSelect: 'none',
      }}>
        <div style={{ position: 'relative', flexShrink: 0, marginTop: 1 }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => onConfirm(e.target.checked)}
            style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', margin: 0 }}
          />
          <div style={{
            width: 18, height: 18, borderRadius: 5,
            background: confirmed ? '#10B981' : 'rgba(0,0,0,0.3)',
            border: `1.5px solid ${confirmed ? '#10B981' : 'rgba(251,191,36,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s ease',
          }}>
            {confirmed && <Check size={11} color="white" strokeWidth={3} />}
          </div>
        </div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>
          Confirmé que guardé las credenciales en un lugar seguro
        </span>
      </label>
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
  const primary   = paleta.primary   || '#C2603C'
  const secondary = paleta.secondary || '#E8956D'
  const accent    = paleta.accent    || '#7B4F35'

  const [phase, setPhase] = useState({
    ring: false, logo: false, name: false, cards: false, button: false,
  })
  const [credConfirmed, setCredConfirmed] = useState(false)

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
    <div style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      background: `radial-gradient(ellipse 120% 80% at 50% -10%, ${primary}22 0%, transparent 55%),
                   radial-gradient(ellipse 80% 60% at 85% 80%, ${secondary}18 0%, transparent 50%),
                   oklch(0.09 0.03 275)`,
      fontFamily: 'Inter, DM Sans, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px',
    }}>
      <Particles color={primary} />

      {/* ── Phase 1: Logo con rings ── */}
      <div style={{ position: 'relative', marginBottom: 48 }}>

        {/* Pulse rings */}
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            inset: -(i * 24),
            borderRadius: '50%',
            border: `1px solid ${primary}`,
            opacity: phase.ring ? (0.25 / i) : 0,
            transform: phase.ring ? 'scale(1)' : 'scale(0.3)',
            transition: `all 0.9s ${i * 200}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            animation: phase.ring ? `ring-pulse 2.5s ${i * 400}ms ease-in-out infinite` : 'none',
          }} />
        ))}

        {/* Logo circle */}
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          boxShadow: `0 0 60px ${primary}50, 0 20px 60px rgba(0,0,0,0.4)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: phase.logo ? 1 : 0,
          transform: phase.logo ? 'scale(1)' : 'scale(0.4)',
          transition: 'opacity 0.6s 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative', zIndex: 1,
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

          {/* Check badge */}
          <div style={{
            position: 'absolute', bottom: -6, right: -6,
            width: 32, height: 32, borderRadius: '50%',
            background: '#10B981',
            border: '3px solid oklch(0.09 0.03 275)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: phase.name ? 1 : 0,
            transform: phase.name ? 'scale(1)' : 'scale(0)',
            transition: 'all 0.4s 1400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
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
          <Sparkles size={12} color={secondary} />
          <span style={{ fontSize: 11, color: secondary, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Empresa activada
          </span>
        </div>
        <h1 style={{
          margin: '0 0 8px',
          fontSize: 'clamp(28px, 5vw, 44px)',
          fontWeight: 800, letterSpacing: '-0.03em',
          color: 'rgba(255,255,255,0.96)',
          lineHeight: 1.1,
        }}>
          Bienvenido a<br />
          <span style={{ color: primary }}>{tenant.nombre || 'tu empresa'}</span>
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 420, lineHeight: 1.6 }}>
          La configuración se completó exitosamente. Tu portal está listo para gestionar incapacidades médicas.
        </p>
      </div>

      {/* ── Phase 3: Summary cards ── */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', gap: 10,
        marginBottom: 28,
      }}>
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
              : 'rgba(255,255,255,0.08)',
            border: canProceed ? 'none' : '1px solid rgba(255,255,255,0.12)',
            color: canProceed ? 'white' : 'rgba(255,255,255,0.3)',
            fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: canProceed ? `0 8px 40px ${primary}50, 0 2px 8px rgba(0,0,0,0.3)` : 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            if (!canProceed) return
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
            e.currentTarget.style.boxShadow = `0 16px 50px ${primary}60, 0 4px 12px rgba(0,0,0,0.4)`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = canProceed
              ? `0 8px 40px ${primary}50, 0 2px 8px rgba(0,0,0,0.3)`
              : 'none'
          }}
        >
          {hasCredentials ? 'Ir al portal' : 'Comenzar'} <ArrowRight size={18} />
        </button>

        {hasCredentials && !credConfirmed && (
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(251,191,36,0.6)', textAlign: 'center' }}>
            Confirma que guardaste las credenciales para continuar
          </p>
        )}

        <button
          onClick={() => navigate(`/tenants/${companyId}/users`)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: 'rgba(255,255,255,0.35)',
            textDecoration: 'underline', textDecorationStyle: 'dotted',
          }}
        >
          Agregar usuarios al tenant
        </button>
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
