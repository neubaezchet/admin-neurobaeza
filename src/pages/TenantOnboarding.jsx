/**
 * TenantOnboarding — Wizard de configuración de empresa
 * ======================================================
 * 7 pasos + pantalla de bienvenida inicial
 * Fondo: VANTA FOG (cargado dinámicamente desde CDN)
 * Transiciones: CSS puro (translateX + opacity, 320ms)
 * Sin Framer Motion (no disponible en este repo)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Building2, Palette, Mail, HardDrive, CheckSquare,
  ChevronRight, ChevronLeft, Check, Loader2, AlertCircle,
  Upload, RefreshCw, FolderOpen, MapPin, Clock, Network,
  Plus, X, Lock,
} from 'lucide-react'
import {
  getTenant, saveTenantOnboardingStep, completeTenantOnboarding,
  verifyTenantDrive, getOnboardingProgress, getServiceAccountEmail,
} from '../api'

// ─── Paletas ──────────────────────────────────────────────
const PALETAS = [
  { id: 'ocean',     label: 'Océano',    primary: '#0EA5E9', secondary: '#38BDF8', accent: '#7C3AED' },
  { id: 'terracota', label: 'Terracota', primary: '#C2603C', secondary: '#E8956D', accent: '#7B4F35' },
  { id: 'bosque',    label: 'Bosque',    primary: '#16A34A', secondary: '#4ADE80', accent: '#854D0E' },
  { id: 'lavanda',   label: 'Lavanda',   primary: '#7C3AED', secondary: '#A78BFA', accent: '#DB2777' },
  { id: 'carbon',    label: 'Carbón',    primary: '#374151', secondary: '#6B7280', accent: '#F59E0B' },
  { id: 'aurora',    label: 'Aurora',    primary: '#BE185D', secondary: '#F472B6', accent: '#0891B2' },
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

// ─── Helpers ──────────────────────────────────────────────

function formatNIT(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 9) return digits
  return `${digits.slice(0, 9)}-${digits.slice(9)}`
}

function getPaleta(paletaId) {
  return PALETAS.find(p => p.id === paletaId) || PALETAS[0]
}

// Mapea un color hex al índice de paleta más cercano por luminancia
function nearestPaleta(hex) {
  if (!hex) return 'ocean'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const hue = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI
  if (hue > 150 && hue <= 210) return 'ocean'
  if (hue > 0 && hue <= 30) return 'terracota'
  if (hue > 90 && hue <= 150) return 'bosque'
  if (hue > 240 && hue <= 300) return 'lavanda'
  if (hue > 300) return 'aurora'
  return 'carbon'
}

// ─── Estilos base ─────────────────────────────────────────

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10, fontSize: 14,
  color: 'rgba(255,255,255,0.9)',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
}

function Input({ error, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <>
      <input
        {...props}
        style={{
          ...inputStyle,
          borderColor: error
            ? 'rgba(239,68,68,0.6)'
            : focused ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error && (
        <p role="alert" style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(252,165,165,0.9)' }}>
          {error}
        </p>
      )}
    </>
  )
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        ...inputStyle, cursor: 'pointer', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='rgba(255,255,255,0.4)' d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
        paddingRight: 36,
      }}
    >
      {children}
    </select>
  )
}

function FieldLabel({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: 11, fontWeight: 700,
      marginBottom: 6, color: 'rgba(255,255,255,0.45)',
      letterSpacing: '0.07em', textTransform: 'uppercase',
    }}>
      {children}
    </label>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {hint && <p style={{ margin: '5px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{hint}</p>}
    </div>
  )
}

// ─── Indicador de pasos ───────────────────────────────────

function StepIndicator({ current, paletaId }) {
  const paleta = getPaleta(paletaId)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      overflowX: 'auto', padding: '0 4px',
    }}>
      {STEPS_CONFIG.map((s, i) => {
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
                background: done ? paleta.primary : active ? `${paleta.primary}28` : 'rgba(255,255,255,0.06)',
                border: (done || active) ? `2px solid ${paleta.primary}` : '2px solid rgba(255,255,255,0.12)',
                transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
              }}>
                {done
                  ? <Check size={14} color="#fff" strokeWidth={2.5} />
                  : <Icon size={14} color={active ? paleta.primary : 'rgba(255,255,255,0.35)'} />
                }
              </div>
              <span style={{
                fontSize: 9, fontWeight: active ? 700 : 400,
                color: active ? paleta.primary : done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                letterSpacing: '0.03em', whiteSpace: 'nowrap',
                transition: 'color 0.3s',
              }}>
                {s.shortLabel}
              </span>
            </div>
            {i < STEPS_CONFIG.length - 1 && (
              <div style={{
                width: 28, height: 2,
                marginBottom: 20, flexShrink: 0,
                background: s.id < current ? paleta.primary : 'rgba(255,255,255,0.1)',
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

function WizardCard({ children, title, desc, Icon, paletaId, style }) {
  const paleta = getPaleta(paletaId)
  return (
    <div style={{
      background: 'rgba(14,20,30,0.88)',
      backdropFilter: 'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 24,
      padding: '36px 40px',
      boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      width: '100%',
      maxWidth: 560,
      ...style,
    }}>
      {/* Step header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${paleta.primary}1A`,
          border: `1px solid ${paleta.primary}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={paleta.primary} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.2 }}>
            {title}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
            {desc}
          </p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── Step 1: Datos empresa ────────────────────────────────

function Step1({ data, onChange, paletaId }) {
  const paleta = getPaleta(paletaId)
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
    <WizardCard
      Icon={Building2} title="Datos de la empresa"
      desc="Ingresa el NIT y el nombre con el que opera la empresa."
      paletaId={paletaId}
    >
      {/* Logo upload */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            width: 88, height: 88, borderRadius: '50%', flexShrink: 0,
            border: `2px dashed ${logoPreview ? paleta.primary : 'rgba(255,255,255,0.18)'}`,
            background: logoPreview ? 'transparent' : 'rgba(255,255,255,0.04)',
            cursor: 'pointer', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s',
            position: 'relative',
          }}
          aria-label="Subir logo de la empresa"
        >
          {logoPreview
            ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <Upload size={22} color="rgba(255,255,255,0.3)" />
          }
          {extracting && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Loader2 size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}
        </button>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
            Logo de la empresa
          </p>
          <p style={{ margin: '4px 0 8px', fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
            PNG, JPG o SVG. Al subir el logo,<br />la paleta se sugiere automáticamente.
          </p>
          {logoPreview && (
            <button
              type="button"
              onClick={() => { setLogoPreview(null); onChange({ logo_url: null }) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'rgba(255,100,100,0.7)',
                textDecoration: 'underline', padding: 0,
              }}
            >
              Eliminar logo
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => handleLogoFile(e.target.files?.[0])}
        />
      </div>

      <Field
        label="NIT de la empresa"
        hint="Formato colombiano: XXXXXXXXX-X (dígito de verificación)"
      >
        <Input
          value={data.nit || ''}
          onChange={e => onChange({ nit: formatNIT(e.target.value) })}
          placeholder="900123456-7"
          inputMode="numeric"
        />
      </Field>

      <Field label="Nombre de la empresa">
        <Input
          value={data.nombre || ''}
          onChange={e => onChange({ nombre: e.target.value })}
          placeholder="Empresa S.A.S."
        />
      </Field>
    </WizardCard>
  )
}

// ─── Step 2: Estructura empresarial ──────────────────────

function Step2({ data, onChange, paletaId }) {
  const paleta = getPaleta(paletaId)
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

  const removeSub = (name) =>
    onChange({ sub_empresas: subs.filter(s => s !== name) })

  const CardOption = ({ id, icon, title, desc }) => (
    <button
      type="button"
      onClick={() => onChange({ tipo_estructura: id })}
      style={{
        padding: '18px 20px', borderRadius: 14, cursor: 'pointer',
        textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 14,
        border: tipo === id
          ? `2px solid ${paleta.primary}`
          : '2px solid rgba(255,255,255,0.1)',
        background: tipo === id ? `${paleta.primary}12` : 'rgba(255,255,255,0.03)',
        transition: 'all 0.2s ease',
        flex: 1,
      }}
      aria-pressed={tipo === id}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: tipo === id ? `${paleta.primary}20` : 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <p style={{
          margin: 0, fontSize: 14, fontWeight: 700,
          color: tipo === id ? paleta.primary : 'rgba(255,255,255,0.8)',
        }}>
          {title}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
          {desc}
        </p>
      </div>
    </button>
  )

  return (
    <WizardCard
      Icon={Network} title="Estructura empresarial"
      desc="Selecciona cómo están organizadas las empresas del tenant."
      paletaId={paletaId}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <CardOption
          id="unica"
          icon={<Building2 size={18} color={tipo === 'unica' ? paleta.primary : 'rgba(255,255,255,0.4)'} />}
          title="Empresa única"
          desc="Una sola empresa con todos sus empleados"
        />
        <CardOption
          id="holding"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tipo === 'holding' ? paleta.primary : 'rgba(255,255,255,0.4)'} strokeWidth="2">
              <circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/>
              <line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/>
            </svg>
          }
          title="Holding / Grupo"
          desc="Varias empresas bajo un mismo grupo"
        />
      </div>

      {tipo === 'holding' && (
        <div style={{
          padding: '16px 18px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <FieldLabel>Empresas del grupo</FieldLabel>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={subInput}
              onChange={e => setSubInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSub())}
              placeholder="Nombre de la empresa…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={addSub}
              style={{
                padding: '0 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: paleta.primary, color: '#fff', fontWeight: 600, fontSize: 13,
                flexShrink: 0,
              }}
              title="Agregar empresa"
            >
              <Plus size={16} />
            </button>
          </div>
          {subs.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {subs.map(s => (
                <div key={s} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px 4px 12px', borderRadius: 20,
                  background: `${paleta.primary}18`,
                  border: `1px solid ${paleta.primary}35`,
                  fontSize: 12, color: 'rgba(255,255,255,0.8)',
                }}>
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSub(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                    aria-label={`Eliminar ${s}`}
                  >
                    <X size={12} color="rgba(255,255,255,0.5)" />
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

function Step3({ data, onChange, paletaId }) {
  const paleta = getPaleta(paletaId)
  const ciclo = data.ciclo_reporte || 'mensual'

  const CicloCard = ({ id, icon, title, desc }) => (
    <button
      type="button"
      onClick={() => onChange({ ciclo_reporte: id })}
      style={{
        padding: '20px', borderRadius: 14, cursor: 'pointer',
        textAlign: 'center', flex: 1,
        border: ciclo === id ? `2px solid ${paleta.primary}` : '2px solid rgba(255,255,255,0.1)',
        background: ciclo === id ? `${paleta.primary}12` : 'rgba(255,255,255,0.03)',
        transition: 'all 0.2s ease', display: 'flex',
        flexDirection: 'column', alignItems: 'center', gap: 10,
      }}
      aria-pressed={ciclo === id}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: ciclo === id ? `${paleta.primary}20` : 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <p style={{
          margin: 0, fontSize: 15, fontWeight: 700,
          color: ciclo === id ? paleta.primary : 'rgba(255,255,255,0.8)',
        }}>{title}</p>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
          {desc}
        </p>
      </div>
      {ciclo === id && (
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: paleta.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={12} color="#fff" strokeWidth={3} />
        </div>
      )}
    </button>
  )

  return (
    <WizardCard
      Icon={Clock} title="Ciclo de reporte"
      desc="Define con qué frecuencia se generan los reportes de incapacidades."
      paletaId={paletaId}
    >
      <div style={{ display: 'flex', gap: 14 }}>
        <CicloCard
          id="quincenal"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ciclo === 'quincenal' ? paleta.primary : 'rgba(255,255,255,0.45)'} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="10" x2="12" y2="22"/></svg>}
          title="Quincenal"
          desc="Reportes del 1–15 y del 16–fin de mes"
        />
        <CicloCard
          id="mensual"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ciclo === 'mensual' ? paleta.primary : 'rgba(255,255,255,0.45)'} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          title="Mensual"
          desc="Reporte completo al cierre de cada mes"
        />
      </div>
    </WizardCard>
  )
}

// ─── Step 4: Contacto ─────────────────────────────────────

function Step4({ data, onChange, paletaId }) {
  return (
    <WizardCard
      Icon={Mail} title="Información de contacto"
      desc="Correos con los que el sistema se comunicará para esta empresa."
      paletaId={paletaId}
    >
      <Field label="Correo del administrador de la empresa">
        <Input
          type="email"
          value={data.contacto_email || ''}
          onChange={e => onChange({ contacto_email: e.target.value })}
          placeholder="admin@empresa.com"
        />
      </Field>
      <Field label="Correo para carpeta de Google Drive">
        <Input
          type="email"
          value={data.correo_drive || ''}
          onChange={e => onChange({ correo_drive: e.target.value })}
          placeholder="drive@empresa.com"
        />
      </Field>
      <Field label="Zona horaria">
        <Select
          value={data.zona_horaria || 'America/Bogota'}
          onChange={e => onChange({ zona_horaria: e.target.value })}
        >
          {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
        </Select>
      </Field>
    </WizardCard>
  )
}

// ─── Step 5: Preview Box ──────────────────────────────────

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
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
      fontSize: 11, fontFamily,
      aspectRatio: '3/2', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        height: 32, background: p,
        display: 'flex', alignItems: 'center',
        padding: '0 10px', gap: 8, flexShrink: 0,
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>
                {(nombre || 'E')[0].toUpperCase()}
              </span>
          }
        </div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 10, flex: 1, truncate: 'ellipsis' }}>
          {nombre || 'Mi Empresa'}
        </span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: isUxFocus ? 28 : 36, background: sidebarBg,
          borderRight: isFuturista ? `1px solid ${p}` : '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '8px 0', gap: 8, flexShrink: 0,
        }}>
          {['⬡','◈','▣','◉','⊕'].map((ico, i) => (
            <div key={i} style={{
              width: isUxFocus ? 18 : 22, height: isUxFocus ? 18 : 22,
              borderRadius: 5,
              background: i === 0 ? `${a}35` : 'transparent',
              border: i === 0 ? `1px solid ${a}60` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: i === 0 ? a : textSub,
              cursor: 'default',
            }}>
              {ico}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1, background: bgContent, padding: '8px 10px',
          display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'hidden',
        }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'Activos', val: '12' },
              { label: 'Pendientes', val: '3' },
            ].map(({ label, val }) => (
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

          {/* Mini table */}
          <div style={{
            borderRadius: 6, overflow: 'hidden',
            border: isFuturista ? `1px solid ${p}30` : '1px solid rgba(255,255,255,0.06)',
          }}>
            {['García, L.', 'Martínez, R.', 'López, M.'].map((name, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 7px',
                background: i % 2 === 0
                  ? (isMinimalista ? '#f8fafc' : 'rgba(255,255,255,0.03)')
                  : 'transparent',
                borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <span style={{ flex: 1, fontSize: 9, color: textColor }}>{name}</span>
                <span style={{
                  padding: '1px 5px', borderRadius: 4, fontSize: 8, fontWeight: 600,
                  background: i === 0 ? `${p}25` : i === 1 ? `${a}25` : `${s}25`,
                  color: i === 0 ? p : i === 1 ? a : s,
                }}>
                  {i === 0 ? 'VERDE' : i === 1 ? 'AMBAR' : 'NUEVO'}
                </span>
              </div>
            ))}
          </div>

          {/* Button */}
          <button style={{
            padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'default',
            background: p, color: '#fff', fontSize: 9, fontWeight: 700,
            alignSelf: 'flex-start',
          }}>
            + Nueva incapacidad
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 5: Personalización visual ──────────────────────

function Step5({ data, onChange, nombre, logoUrl }) {
  const paletaId = data.paleta_id || 'ocean'
  const estilo = data.estilo_ui || 'default'
  const paleta = getPaleta(paletaId)

  return (
    <WizardCard
      Icon={Palette} title="Identidad visual"
      desc="Elige los colores y el estilo del portal de incapacidades."
      paletaId={paletaId}
      style={{ maxWidth: 760 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Columna izquierda */}
        <div>
          {/* Paletas */}
          <FieldLabel>Paleta de colores</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
            {PALETAS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange({
                  paleta_id: p.id,
                  paleta_colores: { primary: p.primary, secondary: p.secondary, accent: p.accent },
                })}
                style={{
                  padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                  border: paletaId === p.id ? `2px solid ${p.primary}` : '2px solid transparent',
                  background: paletaId === p.id ? `${p.primary}15` : 'rgba(255,255,255,0.04)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  transition: 'all 0.15s ease',
                }}
                aria-label={p.label}
                aria-pressed={paletaId === p.id}
              >
                <div style={{ display: 'flex', gap: 3 }}>
                  {[p.primary, p.secondary, p.accent].map((c, i) => (
                    <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: paletaId === p.id ? 700 : 400,
                  color: paletaId === p.id ? p.primary : 'rgba(255,255,255,0.5)',
                }}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>

          {/* Estilos UI */}
          <FieldLabel>Estilo de interfaz</FieldLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ESTILOS_UI.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => onChange({ estilo_ui: e.id })}
                style={{
                  padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                  border: estilo === e.id ? `1px solid ${paleta.primary}` : '1px solid rgba(255,255,255,0.08)',
                  background: estilo === e.id ? `${paleta.primary}10` : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.15s ease',
                }}
                aria-pressed={estilo === e.id}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: estilo === e.id ? paleta.primary : 'rgba(255,255,255,0.2)',
                  transition: 'background 0.2s',
                }} />
                <div>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: estilo === e.id ? 700 : 500,
                    color: estilo === e.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)',
                  }}>
                    {e.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{e.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Columna derecha: Preview vivo */}
        <div>
          <FieldLabel>Vista previa en tiempo real</FieldLabel>
          <PreviewBox
            paleta={paleta}
            estilo={estilo}
            nombre={nombre}
            logoUrl={logoUrl}
          />
          <p style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
            Los cambios se reflejan al instante
          </p>
        </div>
      </div>
    </WizardCard>
  )
}

// ─── Step 6: Google Drive ─────────────────────────────────

function Step6({ data, onChange, companyId, paletaId, serviceAccountEmail }) {
  const paleta = getPaleta(paletaId)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult]       = useState(null)
  const [err, setErr]             = useState('')
  const [copied, setCopied]       = useState(false)

  // Extrae el ID de carpeta desde un link de Drive pegado
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
    <WizardCard
      Icon={HardDrive} title="Carpeta de Google Drive"
      desc="Conecta la carpeta donde se guardan las incapacidades. Este paso es opcional."
      paletaId={paletaId}
    >
      {/* Correo de la cuenta de servicio */}
      <div style={{
        padding: '14px 16px', borderRadius: 10, marginBottom: 18,
        background: `${paleta.primary}10`, border: `1px solid ${paleta.primary}30`,
      }}>
        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700,
          color: paleta.primary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Paso 1 — Comparte tu carpeta con este correo
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code style={{
            flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.85)',
            background: 'rgba(0,0,0,0.3)', padding: '7px 10px',
            borderRadius: 7, wordBreak: 'break-all',
          }}>
            {serviceAccountEmail || 'Cargando...'}
          </code>
          <button type="button" onClick={copyEmail}
            title="Copiar correo"
            style={{
              background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 7, padding: '7px 10px', cursor: 'pointer',
              color: copied ? '#6ee7b7' : 'rgba(255,255,255,0.6)', fontSize: 12,
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          En Google Drive → tu carpeta → Clic derecho → Compartir → pega este correo → rol <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Editor</strong> → Enviar
        </p>
      </div>

      {/* Input de URL o ID */}
      <Field
        label="Paso 2 — Pega el link de tu carpeta de Drive"
        hint="Ej: drive.google.com/drive/folders/1aBcDeFgH... — el ID se extrae automáticamente"
      >
        <Input
          value={data.google_workspace_drive_id || ''}
          onChange={e => handleDriveUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/ABC123..."
        />
      </Field>

      {/* ID detectado */}
      {data.google_workspace_drive_id && (
        <p style={{ margin: '-8px 0 14px', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          ID detectado: <code style={{ color: 'rgba(255,255,255,0.55)' }}>{data.google_workspace_drive_id}</code>
        </p>
      )}

      {/* Botón verificar */}
      <button
        type="button"
        onClick={verify}
        disabled={verifying || !data.google_workspace_drive_id}
        style={{
          width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
          background: verifying ? 'rgba(255,255,255,0.06)' : paleta.primary,
          border: 'none', color: '#fff', fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s', opacity: (verifying || !data.google_workspace_drive_id) ? 0.5 : 1,
        }}
      >
        {verifying
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verificando acceso...</>
          : <><RefreshCw size={16} /> Verificar que el sistema tiene acceso</>
        }
      </button>

      {/* Error */}
      {err && (
        <div role="alert" style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: '#fca5a5' }}>{err}</span>
        </div>
      )}

      {/* Éxito */}
      {result?.acceso && (
        <div style={{
          marginTop: 12, padding: '14px 16px', borderRadius: 10,
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
        }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#6ee7b7' }}>
            ✅ Acceso confirmado: "{result.carpeta_nombre}"
          </p>
          {result.estructura?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {result.estructura.map(f => (
                <div key={f.name} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 9px', borderRadius: 5,
                  background: 'rgba(255,255,255,0.05)', fontSize: 11, color: 'rgba(255,255,255,0.6)',
                }}>
                  <FolderOpen size={11} color="#f59e0b" />
                  {f.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No acceso */}
      {result && !result.acceso && (
        <div role="alert" style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          fontSize: 12, color: '#fca5a5',
        }}>
          ⚠️ Sin acceso aún. Asegúrate de haber compartido la carpeta con el correo de arriba y vuelve a verificar.
        </div>
      )}
    </WizardCard>
  )
}


// ─── Step 7: Resumen ──────────────────────────────────────

function Step7({ data, paletaId }) {
  const paleta = getPaleta(paletaId)
  const PALETA_LABEL = PALETAS.find(p => p.id === (data.paleta_id || 'ocean'))?.label || 'Océano'
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
    <WizardCard
      Icon={CheckSquare} title="Resumen de configuración"
      desc="Revisa los datos antes de activar la empresa en el sistema."
      paletaId={paletaId}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        {items.map(({ Icon, label, value }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <Icon size={14} color={paleta.primary} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 90, flexShrink: 0 }}>{label}</span>
            <span style={{
              fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6, margin: 0 }}>
        Al activar la empresa se creará automáticamente un usuario administrador para el tenant. Las credenciales se mostrarán en el siguiente paso.
      </p>
    </WizardCard>
  )
}

// ─── Pantalla de bienvenida (paso 0) ─────────────────────

function WelcomeScreen({ onStart }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100)
    const t2 = setTimeout(() => setPhase(2), 600)
    const t3 = setTimeout(() => setPhase(3), 1300)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', textAlign: 'center',
      padding: '0 24px',
    }}>
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <p style={{
          fontSize: 'clamp(52px, 8vw, 80px)', margin: '0 0 8px',
          fontWeight: 800, color: 'rgba(255,255,255,0.96)',
          letterSpacing: '-0.03em', lineHeight: 1,
        }}>
          Hola
        </p>
      </div>

      <div style={{
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s 0.1s ease, transform 0.6s 0.1s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)', margin: '0 0 48px',
          color: 'rgba(255,255,255,0.45)', fontWeight: 400,
          maxWidth: 380,
        }}>
          Configura tu empresa en minutos
        </p>
      </div>

      <div style={{
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <button
          onClick={onStart}
          style={{
            padding: '15px 40px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: 16, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.18)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.10)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Comenzar
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────

export default function TenantOnboarding() {
  const { companyId } = useParams()
  const navigate = useNavigate()

  const vantaRef = useRef(null)
  const vantaEffect = useRef(null)

  // Estados
  const [showWelcome, setShowWelcome] = useState(true)
  const [step, setStep] = useState(1)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tenant, setTenant] = useState(null)
  const [serviceAccountEmail, setServiceAccountEmail] = useState('')

  // Cargar email de cuenta de servicio para el paso Drive
  useEffect(() => {
    getServiceAccountEmail().then(r => { if (r?.email) setServiceAccountEmail(r.email) }).catch(() => {})
  }, [])

  // ── Cargar VANTA FOG ──────────────────────────────────
  useEffect(() => {
    const initVanta = () => {
      if (vantaEffect.current || !vantaRef.current) return
      if (!window.VANTA?.FOG) return
      vantaEffect.current = window.VANTA.FOG({
        el: vantaRef.current,
        THREE: window.THREE,
        highlightColor: 0x0ea5e9,
        midtoneColor: 0x050507,
        lowlightColor: 0x0b0b10,
        baseColor: 0x000000,
        blurFactor: 0.90,
        speed: 2.50,
      })
    }

    if (window.THREE && window.VANTA?.FOG) {
      initVanta()
      return
    }

    const loadScript = (src, cb) => {
      if (document.querySelector(`script[src="${src}"]`)) { setTimeout(cb, 50); return }
      const s = document.createElement('script')
      s.src = src; s.async = true
      s.onload = cb
      s.onerror = () => console.warn('VANTA script failed to load:', src)
      document.head.appendChild(s)
    }

    loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js',
      () => loadScript(
        'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js',
        initVanta,
      )
    )

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
        vantaEffect.current = null
      }
    }
  }, [])

  // ── Cargar progreso guardado ──────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [t, prog] = await Promise.all([
          getTenant(companyId),
          getOnboardingProgress(companyId),
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
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [companyId])

  const mergeData = useCallback((patch) => {
    setData(prev => ({ ...prev, ...patch }))
  }, [])

  const saveStep = async (targetStep) => {
    setSaving(true); setError('')
    try {
      await saveTenantOnboardingStep(companyId, { step, data })
      setStep(targetStep)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Paso 5 → 6 (Drive opcional) → 7 (Activar)
  const handleNext = () => { if (step < 7) saveStep(step + 1) }
  const handleBack = () => { if (step > 1) setStep(step - 1) }
  const handleSkipDrive = () => saveStep(7)

  const handleComplete = async () => {
    setSaving(true); setError('')
    try {
      await saveTenantOnboardingStep(companyId, { step: 7, data })
      const result = await completeTenantOnboarding(companyId)
      navigate(`/tenants/${companyId}/welcome`, {
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

  // ── Render ────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#000',
      }}>
        <Loader2 size={32} color="rgba(14,165,233,0.8)"
          style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const paletaId = data.paleta_id || 'ocean'
  const paleta = getPaleta(paletaId)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: '"Inter", "DM Sans", system-ui, sans-serif' }}>
      {/* VANTA FOG fondo — z-index 0 */}
      <div
        ref={vantaRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: '#000010',  // Fallback mientras carga VANTA
        }}
      />

      {/* Pantalla de bienvenida */}
      {showWelcome && !loading && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <WelcomeScreen onStart={() => setShowWelcome(false)} />
        </div>
      )}

      {/* Wizard content */}
      {!showWelcome && (
        <div style={{
          position: 'relative', zIndex: 1,
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 24px 60px',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${paleta.primary}14`,
              border: `1px solid ${paleta.primary}30`,
              borderRadius: 999, padding: '5px 16px', marginBottom: 14,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: paleta.primary, animation: 'pulse 2s infinite',
              }} />
              <span style={{
                fontSize: 11, color: paleta.primary, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Configuración de empresa
              </span>
            </div>
            <h1 style={{
              margin: 0, fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800,
              color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em',
            }}>
              {tenant?.nombre || 'Nueva Empresa'}
            </h1>
          </div>

          {/* Step indicator */}
          <div style={{ marginBottom: 32 }}>
            <StepIndicator current={step} paletaId={paletaId} />
          </div>

          {/* Step cards con transición */}
          <div style={{
            width: '100%', maxWidth: step === 5 ? 780 : 560,
            transition: 'max-width 0.32s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {step === 1 && <Step1 data={data} onChange={mergeData} paletaId={paletaId} />}
            {step === 2 && <Step2 data={data} onChange={mergeData} paletaId={paletaId} />}
            {step === 3 && <Step3 data={data} onChange={mergeData} paletaId={paletaId} />}
            {step === 4 && <Step4 data={data} onChange={mergeData} paletaId={paletaId} />}
            {step === 5 && (
              <Step5
                data={data} onChange={mergeData}
                nombre={data.nombre || tenant?.nombre}
                logoUrl={data.logo_url}
              />
            )}
            {step === 6 && (
              <Step6 data={data} onChange={mergeData} companyId={companyId} paletaId={paletaId} serviceAccountEmail={serviceAccountEmail} />
            )}
            {step === 7 && <Step7 data={data} paletaId={paletaId} />}
          </div>

          {/* Error */}
          {error && (
            <div role="alert" style={{
              marginTop: 14, maxWidth: 560, width: '100%',
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <AlertCircle size={14} color="#f87171" />
              <span style={{ fontSize: 13, color: '#fca5a5' }}>{error}</span>
            </div>
          )}

          {/* Nav */}
          <div style={{
            marginTop: 24, display: 'flex', gap: 10,
            width: '100%', maxWidth: 560, alignItems: 'center',
          }}>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                style={{
                  padding: '13px 20px', borderRadius: 12, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
            )}

            <button
              type="button"
              onClick={step === 7 ? handleComplete : handleNext}
              disabled={saving}
              style={{
                flex: 1, padding: '13px', borderRadius: 12, cursor: saving ? 'not-allowed' : 'pointer',
                background: saving ? 'rgba(255,255,255,0.06)' : paleta.primary,
                border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: saving ? 'none' : `0 4px 20px ${paleta.primary}45`,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</>
              ) : step === 7 ? (
                <><Lock size={16} /> Activar empresa</>
              ) : (
                <>Continuar <ChevronRight size={16} /></>
              )}
            </button>
          </div>

          {/* Skip Drive — solo en paso 6 */}
          {step === 6 && !saving && (
            <button
              type="button"
              onClick={handleSkipDrive}
              style={{
                marginTop: 10, background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'rgba(255,255,255,0.3)',
                textDecoration: 'underline', textDecorationStyle: 'dotted',
              }}
            >
              Configurar carpeta de Drive después
            </button>
          )}

        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>
    </div>
  )
}
