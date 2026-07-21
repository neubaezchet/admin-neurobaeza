/**
 * TenantOnboarding — Wizard de configuración de empresa
 * ======================================================
 * 7 pasos + pantalla de bienvenida inicial (carrusel caligráfico multi-idioma)
 * Tema: Indigo 2026 — blanco + índigo + violeta
 * Fondo: CSS orbs (visible <1s) + VANTA FOG claro superpuesto (cargado desde CDN, opcional)
 * Transiciones: CSS puro (translateX + opacity, 320ms)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Building2, Palette, Mail, HardDrive, CheckSquare,
  ChevronRight, ChevronLeft, Check, Loader2, AlertCircle,
  Upload, RefreshCw, FolderOpen, MapPin, Clock, Network,
  Plus, X, Lock, Eye, EyeOff,
} from 'lucide-react'
import {
  getTenant, saveTenantOnboardingStep, completeTenantOnboarding,
  verifyTenantDrive, getOnboardingProgress, getServiceAccountEmail,
  validarTokenRegistro, completarRegistro, saveSession,
} from '../api'

// ─── Paletas (orden y valores canónicos del design handoff) ─
const PALETAS = [
  { id: 'indigo',    label: 'Índigo',    primary: '#4F46E5', secondary: '#818CF8', accent: '#7C3AED' },
  { id: 'ocean',     label: 'Océano',    primary: '#0EA5E9', secondary: '#38BDF8', accent: '#0369A1' },
  { id: 'terracota', label: 'Terracota', primary: '#C2603C', secondary: '#E8956D', accent: '#7B4F35' },
  { id: 'bosque',    label: 'Bosque',    primary: '#16A34A', secondary: '#4ADE80', accent: '#854D0E' },
  { id: 'aurora',    label: 'Aurora',    primary: '#BE185D', secondary: '#F472B6', accent: '#0891B2' },
  { id: 'carbon',    label: 'Carbón',    primary: '#374151', secondary: '#6B7280', accent: '#F59E0B' },
]

const ESTILOS_UI = [
  { id: 'default',     label: 'Default',      desc: 'Portal como está actualmente' },
  { id: 'futurista',   label: 'Futurista',    desc: 'Bordes neón, oscuro, tipografía tech' },
  { id: 'minimalista', label: 'Minimalista',  desc: 'Espacioso, limpio, profesional' },
  { id: 'ux_focus',    label: 'UX Focus',     desc: 'Información densa, compacto' },
]

const ZONAS = [
  'America/Bogota', 'America/Lima', 'America/Caracas',
  'America/Mexico_City', 'Europe/Madrid',
]

const STEPS_CONFIG = [
  { id: 1, Icon: Building2,   label: 'Empresa',      shortLabel: 'Empresa' },
  { id: 2, Icon: Network,     label: 'Estructura',   shortLabel: 'Estructura' },
  { id: 3, Icon: Clock,       label: 'Ciclo',        shortLabel: 'Ciclo' },
  { id: 4, Icon: Mail,        label: 'Contacto',     shortLabel: 'Contacto' },
  { id: 5, Icon: Palette,     label: 'Visual',       shortLabel: 'Visual' },
  { id: 6, Icon: HardDrive,   label: 'Drive',        shortLabel: 'Drive' },
  { id: 7, Icon: CheckSquare, label: 'Activar',      shortLabel: 'Activar' },
]

const STEPS_CONFIG_PUBLIC = [
  { id: 1, Icon: Building2,   label: 'Empresa',      shortLabel: 'Empresa' },
  { id: 2, Icon: Network,     label: 'Estructura',   shortLabel: 'Estructura' },
  { id: 3, Icon: Clock,       label: 'Ciclo',        shortLabel: 'Ciclo' },
  { id: 4, Icon: Mail,        label: 'Contacto',     shortLabel: 'Contacto' },
  { id: 5, Icon: Palette,     label: 'Visual',       shortLabel: 'Visual' },
  { id: 6, Icon: HardDrive,   label: 'Drive',        shortLabel: 'Drive' },
  { id: 7, Icon: Lock,        label: 'Acceso',       shortLabel: 'Acceso' },
  { id: 8, Icon: CheckSquare, label: 'Activar',      shortLabel: 'Activar' },
]

// Nombres en español para el carrusel caligráfico "hola"
const ES_NAMES = {
  en: 'Inglés', es: 'Español', fr: 'Francés', de: 'Alemán', it: 'Italiano',
  pt: 'Portugués', pt_BR: 'Portugués (Brasil)', nl: 'Neerlandés', da: 'Danés',
  sv: 'Sueco', nb: 'Noruego', fi: 'Finlandés', pl: 'Polaco', cs: 'Checo',
  sk: 'Eslovaco', hu: 'Húngaro', ro: 'Rumano', hr: 'Croata', ca: 'Catalán',
  el: 'Griego', bg: 'Búlgaro', ru: 'Ruso', uk: 'Ucraniano', tr: 'Turco',
  kk: 'Kazajo', ar: 'Árabe', he: 'Hebreo', hi: 'Hindi', th: 'Tailandés',
  vi: 'Vietnamita', id: 'Indonesio', ms: 'Malayo', ja: 'Japonés', ko: 'Coreano',
  'zh-Hans': 'Chino (simplificado)', 'zh-Hant': 'Chino (tradicional)', zh_HK: 'Chino (Hong Kong)',
}

// ─── Helpers ──────────────────────────────────────────────

function formatNIT(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 9) return digits
  return `${digits.slice(0, 9)}-${digits.slice(9)}`
}

function getPaleta(paletaId) {
  return PALETAS.find(p => p.id === paletaId) || PALETAS[0]
}

// Mapea un color hex al índice de paleta más cercano por matiz (hue)
function nearestPaleta(hex) {
  if (!hex) return 'indigo'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const hue = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI
  if (hue > 150 && hue <= 210) return 'ocean'
  if (hue > 0 && hue <= 30) return 'terracota'
  if (hue > 90 && hue <= 150) return 'bosque'
  if (hue > 240 && hue <= 300) return 'indigo'
  if (hue > 300) return 'aurora'
  return 'carbon'
}

// ─── Loader de scripts externos (VANTA / hello-carousel) ──

function loadScriptOnce(src, cb) {
  if (document.querySelector(`script[src="${src}"]`)) { setTimeout(cb, 50); return }
  const s = document.createElement('script')
  s.src = src; s.async = true
  s.onload = cb
  s.onerror = () => console.warn('Script no disponible (se continúa sin él):', src)
  document.head.appendChild(s)
}

// ─── Átomos de formulario ─────────────────────────────────

function Input({ error, className = '', ...props }) {
  return (
    <>
      <input className={`neo-input ${className}`} {...props} />
      {error && (
        <p role="alert" style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--error)' }}>
          {error}
        </p>
      )}
    </>
  )
}

function Select({ children, className = '', ...props }) {
  return (
    <select className={`neo-input neo-select ${className}`} {...props}>
      {children}
    </select>
  )
}

function FieldLabel({ children }) {
  return <label className="field-label">{children}</label>
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <FieldLabel>{label}</FieldLabel>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

// ─── Indicador de pasos ───────────────────────────────────

function StepIndicator({ current, paletaId, steps = STEPS_CONFIG }) {
  const paleta = getPaleta(paletaId)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '0 4px' }}>
      {steps.map((s, i) => {
        const done = s.id < current
        const active = s.id === current
        const { Icon } = s
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                background: done ? paleta.primary : active ? `${paleta.primary}1F` : 'rgba(15,23,42,0.04)',
                border: (done || active) ? `2px solid ${paleta.primary}` : '2px solid rgba(15,23,42,0.10)',
                transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
              }}>
                {done
                  ? <Check size={14} color="#fff" strokeWidth={2.5} />
                  : <Icon size={14} color={active ? paleta.primary : '#94A3B8'} />
                }
              </div>
              <span style={{
                fontSize: 9, fontWeight: active ? 700 : 400,
                color: active ? paleta.primary : done ? '#334155' : '#94A3B8',
                letterSpacing: '0.03em', whiteSpace: 'nowrap',
                transition: 'color 0.3s',
              }}>
                {s.shortLabel}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 28, height: 2, marginBottom: 20, flexShrink: 0,
                background: s.id < current ? paleta.primary : 'rgba(15,23,42,0.10)',
                transition: 'background 0.4s ease',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Card shell ───────────────────────────────────────────

function WizardCard({ children, title, desc, Icon, wide }) {
  return (
    <div className={`glass step-card${wide ? ' wide' : ''}`}>
      <div className="top-strip" />
      <div className="card-body">
        <div className="card-header">
          <div className="card-icon"><Icon size={20} color="#4F46E5" /></div>
          <div>
            <h2 className="card-title">{title}</h2>
            <p className="card-desc">{desc}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Step 1: Datos empresa ────────────────────────────────

function Step1({ data, onChange }) {
  const [logoPreview, setLogoPreview] = useState(data.logo_url || null)
  const [extracting, setExtracting] = useState(false)
  const fileRef = useRef(null)

  const handleLogoFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const previewUrl = e.target.result
      setLogoPreview(previewUrl)
      onChange({ logo_url: previewUrl })

      // FastAverageColor — cargar desde CDN si no está
      setExtracting(true)
      try {
        const loadFAC = () => new Promise((resolve) => {
          if (window.FastAverageColor) { resolve(window.FastAverageColor); return }
          const s = document.createElement('script')
          s.src = 'https://cdn.jsdelivr.net/npm/fast-average-color/dist/index.browser.min.js'
          s.onload = () => resolve(window.FastAverageColor)
          document.head.appendChild(s)
        })
        const FAC = await loadFAC()
        const fac = new FAC()
        const img = new Image()
        img.src = previewUrl
        img.onload = async () => {
          try {
            const result = await fac.getColorAsync(img)
            const hex = result.hex
            const sugeridaId = nearestPaleta(hex)
            const sugerida = getPaleta(sugeridaId)
            onChange({
              logo_url: previewUrl,
              paleta_id: sugeridaId,
              paleta_colores: {
                primary: sugerida.primary,
                secondary: sugerida.secondary,
                accent: sugerida.accent,
              },
            })
          } finally {
            setExtracting(false)
          }
        }
        img.onerror = () => setExtracting(false)
      } catch {
        setExtracting(false)
      }
    }
    reader.readAsDataURL(file)
  }, [onChange])

  return (
    <WizardCard Icon={Building2} title="Datos de la empresa" desc="Ingresa el NIT y el nombre con el que opera la empresa.">
      {/* Logo upload */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            border: `2px dashed ${logoPreview ? '#4F46E5' : 'rgba(15,23,42,0.18)'}`,
            background: logoPreview ? 'transparent' : 'rgba(15,23,42,0.03)',
            cursor: 'pointer', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s', position: 'relative',
          }}
          aria-label="Subir logo de la empresa"
        >
          {logoPreview
            ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <Upload size={20} color="#94A3B8" />
          }
          {extracting && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Loader2 size={18} color="#4F46E5" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}
        </button>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#334155' }}>Logo de la empresa</p>
          <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
            PNG, JPG o SVG — opcional.<br />La paleta se sugiere automáticamente.
          </p>
          {logoPreview && (
            <button
              type="button"
              onClick={() => { setLogoPreview(null); onChange({ logo_url: null }) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--error)', textDecoration: 'underline', padding: 0 }}
            >
              Eliminar logo
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => handleLogoFile(e.target.files?.[0])} />
      </div>

      <Field label="NIT de la empresa" hint="Formato colombiano: XXXXXXXXX-X (dígito de verificación)">
        <Input value={data.nit || ''} onChange={e => onChange({ nit: formatNIT(e.target.value) })}
          placeholder="900123456-7" inputMode="numeric" />
      </Field>

      <Field label="Nombre de la empresa">
        <Input value={data.nombre || ''} onChange={e => onChange({ nombre: e.target.value })}
          placeholder="Empresa S.A.S." />
      </Field>
    </WizardCard>
  )
}

// ─── Step 2: Estructura empresarial ──────────────────────

function Step2({ data, onChange }) {
  const tipo = data.tipo_estructura || 'unica'
  const [subInput, setSubInput] = useState('')
  const subs = data.sub_empresas || []

  const addSub = () => {
    const v = subInput.trim()
    if (v && !subs.includes(v)) {
      onChange({ sub_empresas: [...subs, v] })
      setSubInput('')
    }
  }

  const removeSub = (name) => onChange({ sub_empresas: subs.filter(s => s !== name) })

  const OptCard = ({ id, icon, title, desc }) => (
    <button
      type="button"
      onClick={() => onChange({ tipo_estructura: id })}
      className={`opt-card${tipo === id ? ' active' : ''}`}
      aria-pressed={tipo === id}
    >
      <div className="opt-icon">{icon}</div>
      <div>
        <p className="opt-title">{title}</p>
        <p className="opt-desc">{desc}</p>
      </div>
    </button>
  )

  return (
    <WizardCard Icon={Network} title="Estructura empresarial" desc="Selecciona cómo están organizadas las empresas del tenant.">
      <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
        <OptCard
          id="unica"
          icon={<Building2 size={18} color={tipo === 'unica' ? '#4F46E5' : '#94A3B8'} />}
          title="Empresa única"
          desc="Una sola empresa con todos sus empleados"
        />
        <OptCard
          id="holding"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tipo === 'holding' ? '#4F46E5' : '#94A3B8'} strokeWidth="2">
              <circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/>
              <line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/>
            </svg>
          }
          title="Holding / Grupo"
          desc="Varias empresas bajo un mismo grupo"
        />
      </div>

      {tipo === 'holding' && (
        <div className="sub-box">
          <FieldLabel>Empresas del grupo</FieldLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              className="neo-input"
              style={{ flex: 1 }}
              value={subInput}
              onChange={e => setSubInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSub())}
              placeholder="Nombre de la empresa…"
            />
            <button
              type="button"
              onClick={addSub}
              style={{ padding: '0 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#4F46E5', color: '#fff', fontWeight: 600, fontSize: 13, flexShrink: 0 }}
              title="Agregar empresa"
            >
              <Plus size={16} />
            </button>
          </div>
          {subs.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {subs.map(s => (
                <div key={s} className="tag">
                  {s}
                  <button type="button" onClick={() => removeSub(s)} className="tag-x" aria-label={`Eliminar ${s}`}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </WizardCard>
  )
}

// ─── Step 3: Ciclo de reporte ─────────────────────────────

function Step3({ data, onChange }) {
  const ciclo = data.ciclo_reporte || 'mensual'

  const CicloCard = ({ id, icon, title, desc }) => (
    <button
      type="button"
      onClick={() => onChange({ ciclo_reporte: id })}
      className={`ciclo-card${ciclo === id ? ' active' : ''}`}
      aria-pressed={ciclo === id}
    >
      <div className="ciclo-icon">{icon}</div>
      <div>
        <p className="ciclo-title">{title}</p>
        <p className="ciclo-desc">{desc}</p>
      </div>
    </button>
  )

  return (
    <WizardCard Icon={Clock} title="Ciclo de reporte" desc="Define con qué frecuencia se generan los reportes de incapacidades.">
      <div className="ciclo-row">
        <CicloCard
          id="quincenal"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ciclo === 'quincenal' ? '#4F46E5' : '#94A3B8'} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="10" x2="12" y2="22"/></svg>}
          title="Quincenal"
          desc="Reportes del 1–15 y del 16–fin de mes"
        />
        <CicloCard
          id="mensual"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ciclo === 'mensual' ? '#4F46E5' : '#94A3B8'} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          title="Mensual"
          desc="Reporte completo al cierre de cada mes"
        />
      </div>
    </WizardCard>
  )
}

// ─── Step 4: Contacto ─────────────────────────────────────

function Step4({ data, onChange }) {
  return (
    <WizardCard Icon={Mail} title="Información de contacto" desc="Correos con los que el sistema se comunicará para esta empresa.">
      <Field label="Correo del administrador de la empresa">
        <Input type="email" value={data.contacto_email || ''} onChange={e => onChange({ contacto_email: e.target.value })} placeholder="admin@empresa.com" />
      </Field>
      <Field label="Correo para carpeta de Google Drive">
        <Input type="email" value={data.correo_drive || ''} onChange={e => onChange({ correo_drive: e.target.value })} placeholder="drive@empresa.com" />
      </Field>
      <Field label="Zona horaria">
        <Select value={data.zona_horaria || 'America/Bogota'} onChange={e => onChange({ zona_horaria: e.target.value })}>
          {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
        </Select>
      </Field>
    </WizardCard>
  )
}

// ─── Step 5: Preview Box (mockup del portal del tenant) ───

function PreviewBox({ paleta, estilo, nombre, logoUrl }) {
  const p = paleta.primary
  const s = paleta.secondary
  const a = paleta.accent

  const isFuturista = estilo === 'futurista'
  const isMinimalista = estilo === 'minimalista'
  const isUxFocus = estilo === 'ux_focus'

  const bgContent = isFuturista ? '#050507' : isMinimalista ? '#FAFAFA' : '#0F172A'
  const textColor = isMinimalista ? '#1e293b' : 'rgba(255,255,255,0.85)'
  const textSub = isMinimalista ? '#64748b' : 'rgba(255,255,255,0.4)'
  const sidebarBg = `${p}22`
  const fontFamily = isFuturista ? 'monospace, monospace' : 'inherit'

  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden',
      border: '1px solid rgba(15,23,42,0.08)',
      boxShadow: '0 8px 32px rgba(15,23,42,0.12)',
      fontSize: 11, fontFamily,
      aspectRatio: '3/2', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ height: 32, background: p, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>{(nombre || 'E')[0].toUpperCase()}</span>
          }
        </div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 10, flex: 1 }}>{nombre || 'Mi Empresa'}</span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: isUxFocus ? 28 : 36, background: sidebarBg,
          borderRight: isFuturista ? `1px solid ${p}` : '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 8, flexShrink: 0,
        }}>
          {['⬡','◈','▣','◉','⊕'].map((ico, i) => (
            <div key={i} style={{
              width: isUxFocus ? 18 : 22, height: isUxFocus ? 18 : 22, borderRadius: 5,
              background: i === 0 ? `${a}35` : 'transparent',
              border: i === 0 ? `1px solid ${a}60` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: i === 0 ? a : textSub, cursor: 'default',
            }}>{ico}</div>
          ))}
        </div>

        <div style={{ flex: 1, background: bgContent, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'hidden' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ label: 'Activos', val: '12' }, { label: 'Pendientes', val: '3' }].map(({ label, val }) => (
              <div key={label} style={{
                flex: 1, padding: '5px 7px', borderRadius: 6,
                background: isMinimalista ? '#f1f5f9' : 'rgba(255,255,255,0.05)',
                border: isFuturista ? `1px solid ${p}40` : '1px solid rgba(255,255,255,0.06)',
              }}>
                <p style={{ margin: 0, fontSize: 8, color: textSub }}>{label}</p>
                <p style={{ margin: '1px 0 0', fontSize: 13, fontWeight: 700, color: textColor }}>{val}</p>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: 6, overflow: 'hidden', border: isFuturista ? `1px solid ${p}30` : '1px solid rgba(255,255,255,0.06)' }}>
            {['García, L.', 'Martínez, R.', 'López, M.'].map((name, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 7px',
                background: i % 2 === 0 ? (isMinimalista ? '#f8fafc' : 'rgba(255,255,255,0.03)') : 'transparent',
                borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <span style={{ flex: 1, fontSize: 9, color: textColor }}>{name}</span>
                <span style={{
                  padding: '1px 5px', borderRadius: 4, fontSize: 8, fontWeight: 600,
                  background: i === 0 ? `${p}25` : i === 1 ? `${a}25` : `${s}25`,
                  color: i === 0 ? p : i === 1 ? a : s,
                }}>{i === 0 ? 'VERDE' : i === 1 ? 'AMBAR' : 'NUEVO'}</span>
              </div>
            ))}
          </div>

          <button style={{ padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'default', background: p, color: '#fff', fontSize: 9, fontWeight: 700, alignSelf: 'flex-start' }}>
            + Nueva incapacidad
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 5: Personalización visual ──────────────────────

function Step5({ data, onChange, nombre, logoUrl }) {
  const paletaId = data.paleta_id || 'indigo'
  const estilo = data.estilo_ui || 'default'
  const paleta = getPaleta(paletaId)

  return (
    <WizardCard Icon={Palette} title="Identidad visual" desc="Elige los colores y el estilo del portal de incapacidades." wide>
      <div style={{ display: 'grid', gridTemplateColumns: '264px 1fr', gap: 28 }}>
        <div>
          <FieldLabel>Paleta de colores</FieldLabel>
          <div className="paleta-grid">
            {PALETAS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({ paleta_id: p.id, paleta_colores: { primary: p.primary, secondary: p.secondary, accent: p.accent } })}
                className={`pal-btn${paletaId === p.id ? ' active' : ''}`}
                aria-label={p.label}
                aria-pressed={paletaId === p.id}
              >
                <div className="pal-dots">
                  {[p.primary, p.secondary, p.accent].map((c, i) => (
                    <div key={i} className="pal-dot" style={{ background: c }} />
                  ))}
                </div>
                <span className="pal-name">{p.label}</span>
              </button>
            ))}
          </div>

          <FieldLabel>Estilo de interfaz</FieldLabel>
          <div>
            {ESTILOS_UI.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => onChange({ estilo_ui: e.id })}
                className={`est-btn${estilo === e.id ? ' active' : ''}`}
                aria-pressed={estilo === e.id}
              >
                <div className="est-radio" />
                <div>
                  <p className="est-label">{e.label}</p>
                  <p className="est-desc">{e.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FieldLabel>Vista previa del portal</FieldLabel>
          <PreviewBox paleta={paleta} estilo={estilo} nombre={nombre} logoUrl={logoUrl} />
          <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
            Los cambios se reflejan al instante
          </p>
        </div>
      </div>
    </WizardCard>
  )
}

// ─── Step 6: Google Drive ─────────────────────────────────

function Step6({ data, onChange, companyId, serviceAccountEmail }) {
  const [verifying, setVerifying] = useState(false)
  const [result, setResult]       = useState(null)
  const [err, setErr]             = useState('')
  const [copied, setCopied]       = useState(false)

  const handleDriveUrl = (raw) => {
    const match = raw.match(/\/folders\/([a-zA-Z0-9_-]{10,})/)
    const id = match ? match[1] : raw.trim()
    onChange({ google_workspace_drive_id: id, drive_verificado: false })
    setResult(null); setErr('')
  }

  const copyEmail = () => {
    if (!serviceAccountEmail) return
    navigator.clipboard.writeText(serviceAccountEmail).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const verify = async () => {
    if (!data.google_workspace_drive_id?.trim()) {
      setErr('Pega el link de la carpeta de Drive antes de verificar.')
      return
    }
    setVerifying(true); setErr(''); setResult(null)
    try {
      const res = await verifyTenantDrive(companyId, {
        drive_folder_id: data.google_workspace_drive_id.trim(),
        correo_drive: data.correo_drive,
      })
      setResult(res)
      if (res.acceso) onChange({ drive_verificado: true })
    } catch (e) {
      setErr(e.message)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <WizardCard Icon={HardDrive} title="Carpeta de Google Drive" desc="Conecta la carpeta donde se guardan las incapacidades. Este paso es opcional.">
      <div className="sa-box">
        <span className="sa-label">Paso 1 — Comparte tu carpeta con este correo</span>
        <div className="sa-row">
          <code className="sa-code">{serviceAccountEmail || 'Cargando...'}</code>
          <button type="button" onClick={copyEmail} className="copy-btn">
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#94A3B8', lineHeight: 1.55 }}>
          Carpeta de Drive → Compartir → pega este correo → rol <strong style={{ color: '#334155' }}>Editor</strong> → Enviar
        </p>
      </div>

      <Field label="Paso 2 — Pega el link de tu carpeta de Drive" hint="El ID se extrae automáticamente del link">
        <Input value={data.google_workspace_drive_id || ''} onChange={e => handleDriveUrl(e.target.value)} placeholder="https://drive.google.com/drive/folders/ABC123..." />
      </Field>

      {data.google_workspace_drive_id && (
        <p style={{ margin: '-8px 0 14px', fontSize: 11, color: '#94A3B8' }}>
          ID detectado: <code style={{ color: '#64748B' }}>{data.google_workspace_drive_id}</code>
        </p>
      )}

      {companyId ? (
        <button
          type="button"
          onClick={verify}
          disabled={verifying || !data.google_workspace_drive_id}
          className="btn-next"
          style={{ width: '100%' }}
        >
          {verifying
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verificando acceso...</>
            : <><RefreshCw size={16} /> Verificar que el sistema tiene acceso</>
          }
        </button>
      ) : (
        <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', margin: 0 }}>
          La verificación de acceso estará disponible después de activar tu empresa.
        </p>
      )}

      {err && (
        <div role="alert" style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: 'var(--error-soft)', border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <AlertCircle size={14} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: '#B91C1C' }}>{err}</span>
        </div>
      )}

      {result?.acceso && (
        <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 12, background: 'var(--success-soft)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#047857' }}>
            ✅ Acceso confirmado: "{result.carpeta_nombre}"
          </p>
          {result.estructura?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {result.estructura.map(f => (
                <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 5, background: 'rgba(15,23,42,0.04)', fontSize: 11, color: '#334155' }}>
                  <FolderOpen size={11} color="#F59E0B" />
                  {f.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result && !result.acceso && (
        <div role="alert" style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--error-soft)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: '#B91C1C' }}>
          ⚠️ Sin acceso aún. Asegúrate de haber compartido la carpeta con el correo de arriba y vuelve a verificar.
        </div>
      )}
    </WizardCard>
  )
}

// ─── Step 7: Resumen ──────────────────────────────────────

function Step7({ data }) {
  const PALETA_LABEL = PALETAS.find(p => p.id === (data.paleta_id || 'indigo'))?.label || 'Índigo'
  const ESTILO_LABEL = ESTILOS_UI.find(e => e.id === (data.estilo_ui || 'default'))?.label || 'Default'

  const items = [
    { Icon: Building2, label: 'NIT',            value: data.nit },
    { Icon: Building2, label: 'Empresa',        value: data.nombre },
    { Icon: Network,   label: 'Estructura',     value: data.tipo_estructura === 'holding' ? 'Holding / Grupo' : 'Empresa única' },
    { Icon: Clock,     label: 'Ciclo',          value: data.ciclo_reporte === 'quincenal' ? 'Quincenal' : 'Mensual' },
    { Icon: Mail,      label: 'Correo',         value: data.contacto_email },
    { Icon: MapPin,    label: 'Zona horaria',   value: data.zona_horaria },
    { Icon: Palette,   label: 'Paleta',         value: PALETA_LABEL },
    { Icon: Palette,   label: 'Estilo',         value: ESTILO_LABEL },
    { Icon: HardDrive, label: 'Google Drive',   value: data.drive_verificado ? 'Verificado' : 'Pendiente de configurar' },
  ].filter(i => i.value)

  return (
    <WizardCard Icon={CheckSquare} title="Resumen de configuración" desc="Revisa los datos antes de activar la empresa en el sistema.">
      <div style={{ marginBottom: 20 }}>
        {items.map(({ Icon, label, value }) => (
          <div key={label} className="summary-item">
            <Icon size={14} color="#4F46E5" style={{ flexShrink: 0 }} />
            <span className="summary-label">{label}</span>
            <span className="summary-val">{value}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.7, margin: 0 }}>
        Al activar la empresa se creará automáticamente un usuario administrador para el tenant. Las credenciales se mostrarán en el siguiente paso.
      </p>
    </WizardCard>
  )
}

// ─── Pantalla de bienvenida (paso 0) — carrusel caligráfico ─

function WelcomeScreen({ onStart }) {
  const stageRef = useRef(null)
  const engineRef = useRef(null)
  const [langLabel, setLangLabel] = useState('Español')

  useEffect(() => {
    let cancelled = false
    const start = () => {
      if (cancelled) return
      if (stageRef.current && window.NeurobaezaHelloCarousel && !engineRef.current) {
        engineRef.current = window.NeurobaezaHelloCarousel(stageRef.current, {
          color: '#5B21B6',
          onWord: (entry) => setLangLabel(ES_NAMES[entry.code] || entry.label),
        })
      } else if (!window.NeurobaezaHelloCarousel) {
        setTimeout(start, 100)
      }
    }
    loadScriptOnce('/hello-carousel.js', start)
    return () => {
      cancelled = true
      if (engineRef.current) { engineRef.current.stop(); engineRef.current = null }
    }
  }, [])

  return (
    <div className="welcome">
      <div className="welcome-badge">
        <div className="welcome-badge-dot" />
        Bienvenido a Neurobaeza
      </div>
      <div className="hello-wrap">
        <div id="hello-svg-stage" ref={stageRef} style={{ position: 'relative', width: 'min(70vw,460px)', height: 'min(32vw,180px)' }} />
      </div>
      <div className="lang-chip">{langLabel}</div>
      <p className="welcome-sub">Configura tu empresa y comienza a gestionar incapacidades médicas en minutos.</p>
      <button className="btn-start" onClick={onStart}>
        Comenzar <ChevronRight size={18} />
      </button>
    </div>
  )
}

// ─── Step 7 público: Acceso ───────────────────────────────

function StepAcceso({ data, onChange }) {
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const passwordMismatch = data.admin_password_confirm && data.admin_password !== data.admin_password_confirm

  return (
    <WizardCard Icon={Lock} title="Acceso al sistema" desc="Crea la contraseña que usarás para entrar al portal de administración.">
      <div className="sa-box" style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
        Tu nombre de usuario se genera automáticamente a partir de tu correo electrónico.
        La contraseña que elijas aquí es la que usarás para ingresar al sistema.
      </div>

      <Field label="Contraseña *" hint="Mínimo 8 caracteres">
        <div style={{ position: 'relative' }}>
          <Input
            type={showPass ? 'text' : 'password'}
            value={data.admin_password || ''}
            onChange={e => onChange({ admin_password: e.target.value })}
            placeholder="Tu contraseña"
          />
          <button type="button" onClick={() => setShowPass(v => !v)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94A3B8' }}>
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>

      <Field label="Confirmar contraseña *">
        <div style={{ position: 'relative' }}>
          <Input
            type={showConfirm ? 'text' : 'password'}
            value={data.admin_password_confirm || ''}
            onChange={e => onChange({ admin_password_confirm: e.target.value })}
            placeholder="Repite tu contraseña"
            error={passwordMismatch ? 'Las contraseñas no coinciden' : undefined}
          />
          <button type="button" onClick={() => setShowConfirm(v => !v)}
            style={{ position: 'absolute', right: 10, top: passwordMismatch ? '35%' : '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94A3B8' }}>
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>
    </WizardCard>
  )
}

// ─── Main wizard ──────────────────────────────────────────

export default function TenantOnboarding() {
  const { companyId: companyIdParam } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const isPublicMode = !!token
  const navigate = useNavigate()

  const vantaRef = useRef(null)
  const vantaEffect = useRef(null)

  const MAX_STEP = isPublicMode ? 8 : 7
  const steps    = isPublicMode ? STEPS_CONFIG_PUBLIC : STEPS_CONFIG

  const [showWelcome, setShowWelcome] = useState(true)
  const [step, setStep] = useState(1)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tenant, setTenant] = useState(null)
  const [serviceAccountEmail, setServiceAccountEmail] = useState('')

  useEffect(() => {
    getServiceAccountEmail().then(r => { if (r?.email) setServiceAccountEmail(r.email) }).catch(() => {})
  }, [])

  // ── VANTA FOG claro — capa de movimiento sobre el fondo CSS ──
  useEffect(() => {
    const initVanta = () => {
      if (vantaEffect.current || !vantaRef.current) return
      if (!window.VANTA?.FOG) return
      vantaEffect.current = window.VANTA.FOG({
        el: vantaRef.current,
        THREE: window.THREE,
        highlightColor: 0xA5B4FC,
        midtoneColor: 0xC7D2FE,
        lowlightColor: 0xEEF2FF,
        baseColor: 0xFFFFFF,
        blurFactor: 0.72,
        speed: 3.50,
      })
    }

    if (window.THREE && window.VANTA?.FOG) {
      initVanta()
      return
    }

    loadScriptOnce(
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js',
      () => loadScriptOnce('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js', initVanta),
    )

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
        vantaEffect.current = null
      }
    }
  }, [])

  // ── Cargar datos iniciales ────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        if (isPublicMode) {
          const res = await validarTokenRegistro(token)
          setTenant(res.company)
          setData({
            nombre: res.company.nombre,
            nit: res.company.nit,
            contacto_email: res.company.contacto_email || '',
          })
        } else {
          const [t, prog] = await Promise.all([
            getTenant(companyIdParam),
            getOnboardingProgress(companyIdParam),
          ])
          setTenant(t)
          const acumulado = prog.data_acumulada || {}
          if (Object.keys(acumulado).length > 0) {
            setData({ ...acumulado, nombre: acumulado.nombre || t.nombre, nit: acumulado.nit || t.nit })
            setStep(Math.min(prog.step_actual || 1, 7))
            if (prog.step_actual > 1) setShowWelcome(false)
          } else {
            setData({ nombre: t.nombre, nit: t.nit })
          }
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isPublicMode ? token : companyIdParam])

  const mergeData = useCallback((patch) => {
    setData(prev => ({ ...prev, ...patch }))
  }, [])

  const saveStep = async (targetStep) => {
    setSaving(true); setError('')
    try {
      if (!isPublicMode) {
        await saveTenantOnboardingStep(companyIdParam, { step, data })
      }
      setStep(targetStep)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleNext = () => { if (step < MAX_STEP) saveStep(step + 1) }
  const handleBack = () => { if (step > 1) setStep(step - 1) }
  const handleSkipDrive = () => saveStep(step + 1)

  const handleComplete = async () => {
    setSaving(true); setError('')
    try {
      await saveTenantOnboardingStep(companyIdParam, { step: 7, data })
      const result = await completeTenantOnboarding(companyIdParam)
      navigate(`/tenants/${companyIdParam}/welcome`, {
        state: {
          tenant: { ...tenant, ...data, ...result.company },
          credentials: {
            username: result.tenant_admin_username,
            password: result.tenant_admin_password_temporal,
          },
        },
      })
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  const handleCompletePublico = async () => {
    if (!data.admin_password || data.admin_password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (data.admin_password !== data.admin_password_confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setSaving(true); setError('')
    try {
      const result = await completarRegistro({
        token,
        nit:                        data.nit,
        nombre:                     data.nombre,
        tipo_estructura:            data.tipo_estructura            || 'unica',
        sub_empresas:               data.sub_empresas               || [],
        ciclo_reporte:              data.ciclo_reporte              || 'mensual',
        zona_horaria:               data.zona_horaria               || 'America/Bogota',
        contacto_email:             data.contacto_email,
        correo_drive:               data.correo_drive,
        admin_password:             data.admin_password,
        paleta_id:                  data.paleta_id                  || 'indigo',
        paleta_colores:             data.paleta_colores             || {},
        estilo_ui:                  data.estilo_ui                  || 'default',
        logo_url:                   data.logo_url                   || null,
        google_workspace_drive_id:  data.google_workspace_drive_id  || null,
      })
      saveSession(result.token, result.user)
      navigate(`/tenants/${result.company.id}/welcome`, {
        state: {
          tenant: { ...tenant, ...data, ...result.company },
          credentials: { username: result.admin_username },
        },
      })
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFBFF' }}>
        <Loader2 size={32} color="#4F46E5" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const paletaId = data.paleta_id || 'indigo'
  const paleta = getPaleta(paletaId)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Fondo: CSS orbs (visible de inmediato) + VANTA FOG claro superpuesto */}
      <div ref={vantaRef} className="vanta-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="onb-page">
        {showWelcome && (
          <WelcomeScreen onStart={() => setShowWelcome(false)} />
        )}

        {!showWelcome && (
          <div className="wizard">
            <div className="wizard-header">
              <div className="config-pill">
                <div className="pill-dot" />
                <span className="pill-label">Configuración de empresa</span>
              </div>
              <h1 className="company-name">{data.nombre || tenant?.nombre || 'Tu empresa'}</h1>
            </div>

            <div style={{ marginBottom: 26 }}>
              <StepIndicator current={step} paletaId={paletaId} steps={steps} />
            </div>

            {step === 1 && <Step1 data={data} onChange={mergeData} />}
            {step === 2 && <Step2 data={data} onChange={mergeData} />}
            {step === 3 && <Step3 data={data} onChange={mergeData} />}
            {step === 4 && <Step4 data={data} onChange={mergeData} />}
            {step === 5 && (
              <Step5 data={data} onChange={mergeData} nombre={data.nombre || tenant?.nombre} logoUrl={data.logo_url} />
            )}
            {step === 6 && (
              <Step6
                data={data} onChange={mergeData}
                companyId={isPublicMode ? null : companyIdParam}
                serviceAccountEmail={serviceAccountEmail}
              />
            )}
            {step === 7 && isPublicMode && (
              <StepAcceso data={data} onChange={mergeData} />
            )}
            {step === (isPublicMode ? 8 : 7) && <Step7 data={data} />}

            {error && (
              <div role="alert" className="error-row">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="wizard-nav">
              {step > 1 && (
                <button type="button" onClick={handleBack} disabled={saving} className="btn-back">
                  <ChevronLeft size={16} /> Anterior
                </button>
              )}

              <button
                type="button"
                onClick={step === MAX_STEP ? (isPublicMode ? handleCompletePublico : handleComplete) : handleNext}
                disabled={saving}
                className="btn-next"
              >
                {saving ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {isPublicMode ? 'Activando...' : 'Guardando...'}</>
                ) : step === MAX_STEP ? (
                  <><Lock size={16} /> Activar empresa</>
                ) : (
                  <>Continuar <ChevronRight size={16} /></>
                )}
              </button>
            </div>

            {step === 6 && !saving && (
              <button type="button" onClick={handleSkipDrive} className="skip-link">
                Configurar carpeta de Drive después →
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
