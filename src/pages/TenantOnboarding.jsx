import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Building2, Palette, Mail, HardDrive, PartyPopper,
  ChevronRight, ChevronLeft, Check, Loader2, AlertCircle,
  Upload, Eye, RefreshCw, FolderOpen, MapPin, Clock
} from 'lucide-react'
import {
  getTenant, saveTenantOnboardingStep, completeTenantOnboarding,
  verifyTenantDrive, getOnboardingProgress
} from '../api'

// ─── Paletas predefinidas ─────────────────────────────────
const PALETAS = [
  { id: 'ocean',     label: 'Océano',    primary: '#0EA5E9', secondary: '#38BDF8', accent: '#7C3AED' },
  { id: 'terracota', label: 'Terracota', primary: '#C2603C', secondary: '#E8956D', accent: '#7B4F35' },
  { id: 'bosque',    label: 'Bosque',    primary: '#16A34A', secondary: '#4ADE80', accent: '#854D0E' },
  { id: 'lavanda',   label: 'Lavanda',   primary: '#7C3AED', secondary: '#A78BFA', accent: '#DB2777' },
  { id: 'carbon',    label: 'Carbón',    primary: '#374151', secondary: '#6B7280', accent: '#F59E0B' },
  { id: 'aurora',    label: 'Aurora',    primary: '#BE185D', secondary: '#F472B6', accent: '#0891B2' },
]

const ZONAS = [
  'America/Bogota', 'America/Caracas', 'America/Lima',
  'America/Mexico_City', 'America/New_York', 'Europe/Madrid',
]

const STEPS_CONFIG = [
  { id: 1, icon: Building2, label: 'Datos de la empresa',      desc: 'NIT, nombre y logo' },
  { id: 2, icon: Palette,   label: 'Identidad visual',         desc: 'Colores y marca' },
  { id: 3, icon: Mail,      label: 'Contacto y configuración', desc: 'Correo y reportes' },
  { id: 4, icon: HardDrive, label: 'Google Drive',             desc: 'Integración de archivos' },
  { id: 5, icon: PartyPopper, label: 'Bienvenida',             desc: 'Todo listo' },
]

// ─── Fondo nebulosa terracota ─────────────────────────────

function NebulaBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'oklch(0.09 0.03 275)',
      }} />
      {/* Nebula blob 1 — terracota central */}
      <div style={{
        position: 'absolute',
        width: '70vw', height: '70vw',
        top: '-15vw', left: '15vw',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, oklch(0.55 0.18 38 / 0.22) 0%, transparent 65%)',
        filter: 'blur(60px)',
        animation: 'nebula-drift 18s ease-in-out infinite alternate',
      }} />
      {/* Nebula blob 2 — deep magenta, bottom-left */}
      <div style={{
        position: 'absolute',
        width: '55vw', height: '55vw',
        bottom: '-10vw', left: '-10vw',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, oklch(0.40 0.20 310 / 0.25) 0%, transparent 60%)',
        filter: 'blur(80px)',
        animation: 'nebula-drift 22s ease-in-out infinite alternate-reverse',
      }} />
      {/* Nebula blob 3 — amber-gold, top-right */}
      <div style={{
        position: 'absolute',
        width: '45vw', height: '45vw',
        top: '5vw', right: '-8vw',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, oklch(0.65 0.15 65 / 0.18) 0%, transparent 60%)',
        filter: 'blur(70px)',
        animation: 'nebula-drift 26s ease-in-out infinite alternate',
      }} />
      {/* Nebula blob 4 — dusty rose, bottom-right */}
      <div style={{
        position: 'absolute',
        width: '40vw', height: '40vw',
        bottom: '5vw', right: '5vw',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, oklch(0.35 0.12 350 / 0.20) 0%, transparent 55%)',
        filter: 'blur(65px)',
        animation: 'nebula-drift 20s ease-in-out infinite alternate-reverse',
      }} />
      {/* Star field */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}>
        {Array.from({ length: 80 }, (_, i) => (
          <circle
            key={i}
            cx={`${(i * 137.508) % 100}%`}
            cy={`${(i * 97.3) % 100}%`}
            r={i % 5 === 0 ? 1.2 : 0.6}
            fill="white"
            opacity={0.3 + (i % 4) * 0.15}
          />
        ))}
      </svg>
      <style>{`
        @keyframes nebula-drift {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.1) translate(2%, 3%); }
        }
      `}</style>
    </div>
  )
}

// ─── Step indicator ───────────────────────────────────────

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS_CONFIG.map((step, i) => {
        const done = step.id < current
        const active = step.id === current
        const Icon = step.icon
        return (
          <div key={step.id} className="flex items-center">
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done
                  ? 'oklch(0.62 0.16 38)'
                  : active
                    ? 'oklch(0.62 0.16 38 / 0.25)'
                    : 'oklch(0.18 0.03 275)',
                border: active
                  ? '2px solid oklch(0.62 0.16 38)'
                  : done
                    ? '2px solid oklch(0.62 0.16 38)'
                    : '2px solid oklch(0.28 0.04 275)',
                transition: 'all 0.3s ease',
              }}>
                {done
                  ? <Check size={16} color="white" strokeWidth={2.5} />
                  : <Icon size={16} color={active ? 'oklch(0.85 0.12 38)' : 'oklch(0.45 0.04 275)'} />
                }
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 400,
                color: active ? 'oklch(0.85 0.12 38)' : done ? 'oklch(0.70 0.10 38)' : 'oklch(0.45 0.04 275)',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}>
                {step.label.split(' ')[0]}
              </span>
            </div>
            {i < STEPS_CONFIG.length - 1 && (
              <div style={{
                width: 48, height: 2, margin: '0 4px',
                marginBottom: 22,
                background: step.id < current
                  ? 'oklch(0.62 0.16 38)'
                  : 'oklch(0.22 0.03 275)',
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

function WizardCard({ children, title, desc, icon: Icon }) {
  return (
    <div style={{
      background: 'oklch(0.13 0.025 275 / 0.88)',
      backdropFilter: 'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
      border: '1px solid oklch(0.62 0.16 38 / 0.22)',
      borderRadius: 24,
      padding: '40px 44px',
      boxShadow: '0 32px 80px oklch(0 0 0 / 0.7), 0 0 60px oklch(0.55 0.18 38 / 0.10)',
      width: '100%',
      maxWidth: 560,
    }}>
      {/* Step header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 32 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: 'oklch(0.62 0.16 38 / 0.18)',
          border: '1px solid oklch(0.62 0.16 38 / 0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color="oklch(0.78 0.14 38)" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'oklch(0.95 0.01 275)', lineHeight: 1.2 }}>
            {title}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'oklch(0.55 0.04 275)' }}>
            {desc}
          </p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── Field components ─────────────────────────────────────

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6,
        color: 'oklch(0.68 0.07 38)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ margin: '5px 0 0', fontSize: 11, color: 'oklch(0.42 0.03 275)' }}>{hint}</p>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px',
  background: 'oklch(0.17 0.03 275)',
  border: '1px solid oklch(0.28 0.05 275)',
  borderRadius: 10, fontSize: 14,
  color: 'oklch(0.92 0.01 275)',
  outline: 'none',
  transition: 'border-color 0.2s',
}

function Input({ ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{ ...inputStyle, borderColor: focused ? 'oklch(0.62 0.16 38)' : 'oklch(0.28 0.05 275)' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function Select({ value, onChange, children, ...props }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
      {...props}
    >
      {children}
    </select>
  )
}

// ─── Step 1: Datos empresa ────────────────────────────────

function Step1({ data, onChange }) {
  return (
    <WizardCard icon={Building2} title="Datos de la empresa" desc="Identifica legalmente el tenant en el sistema.">
      <Field label="NIT de la empresa" hint="Formato colombiano: XXXXXXXXX-X (con dígito de verificación)">
        <Input
          value={data.nit || ''}
          onChange={e => onChange({ nit: e.target.value })}
          placeholder="900123456-7"
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

// ─── Step 2: Identidad visual ─────────────────────────────

function Step2({ data, onChange, tenantNombre }) {
  const selected = data.paleta_id || 'terracota'
  const paleta = PALETAS.find(p => p.id === selected) || PALETAS[1]

  return (
    <WizardCard icon={Palette} title="Identidad visual" desc="El portal se adaptará a los colores de tu empresa.">
      <Field label="Paleta de colores">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {PALETAS.map(p => (
            <button
              key={p.id}
              onClick={() => onChange({ paleta_id: p.id, paleta_colores: { primary: p.primary, secondary: p.secondary, accent: p.accent } })}
              style={{
                padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                border: selected === p.id
                  ? `2px solid ${p.primary}`
                  : '2px solid transparent',
                background: selected === p.id ? `${p.primary}18` : 'oklch(0.17 0.03 275)',
                transition: 'all 0.18s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                {[p.primary, p.secondary, p.accent].map((c, i) => (
                  <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: 'oklch(0.75 0.04 275)', fontWeight: selected === p.id ? 600 : 400 }}>
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </Field>

      {/* Preview */}
      <div style={{
        marginTop: 8, padding: '16px 20px',
        borderRadius: 12,
        background: 'oklch(0.10 0.02 275)',
        border: `1px solid ${paleta.primary}30`,
      }}>
        <p style={{ margin: 0, fontSize: 11, color: 'oklch(0.45 0.03 275)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Vista previa del portal
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${paleta.primary}, ${paleta.secondary})`,
            boxShadow: `0 4px 16px ${paleta.primary}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={18} color="white" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: paleta.primary }}>
              {tenantNombre || 'Mi Empresa'}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'oklch(0.48 0.03 275)' }}>Portal de Incapacidades</p>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <div style={{ height: 28, borderRadius: 6, padding: '0 14px', display: 'flex', alignItems: 'center',
            background: paleta.primary, fontSize: 12, color: 'white', fontWeight: 600 }}>
            Acción Principal
          </div>
          <div style={{ height: 28, borderRadius: 6, padding: '0 14px', display: 'flex', alignItems: 'center',
            background: `${paleta.accent}22`, border: `1px solid ${paleta.accent}40`,
            fontSize: 12, color: paleta.accent, fontWeight: 500 }}>
            Secundaria
          </div>
        </div>
      </div>
    </WizardCard>
  )
}

// ─── Step 3: Contacto y configuración ────────────────────

function Step3({ data, onChange }) {
  return (
    <WizardCard icon={Mail} title="Contacto y configuración" desc="Define cómo y cuándo recibirás los reportes del sistema.">
      <Field label="Correo del administrador de la empresa">
        <Input
          type="email"
          value={data.contacto_email || ''}
          onChange={e => onChange({ contacto_email: e.target.value })}
          placeholder="admin@empresa.com"
        />
      </Field>
      <Field label="Correo para compartir carpetas de Drive">
        <Input
          type="email"
          value={data.correo_drive || ''}
          onChange={e => onChange({ correo_drive: e.target.value })}
          placeholder="drive@empresa.com"
        />
      </Field>
      <Field label="Frecuencia de reportes">
        <Select value={data.frecuencia_reportes || 'mensual'} onChange={e => onChange({ frecuencia_reportes: e.target.value })}>
          <option value="mensual">Mensual</option>
          <option value="quincenal">Quincenal</option>
        </Select>
      </Field>
      <Field label="Zona horaria">
        <Select value={data.zona_horaria || 'America/Bogota'} onChange={e => onChange({ zona_horaria: e.target.value })}>
          {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
        </Select>
      </Field>
    </WizardCard>
  )
}

// ─── Step 4: Google Drive ─────────────────────────────────

function Step4({ data, onChange, companyId }) {
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const verify = async () => {
    if (!data.google_workspace_drive_id?.trim()) {
      setError('Ingresa el ID de la carpeta de Drive')
      return
    }
    setVerifying(true)
    setError('')
    setResult(null)
    try {
      const res = await verifyTenantDrive(companyId, {
        drive_folder_id: data.google_workspace_drive_id.trim(),
        correo_drive: data.correo_drive,
      })
      setResult(res)
      if (res.acceso) onChange({ drive_verificado: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <WizardCard icon={HardDrive} title="Integración Google Drive" desc="Conecta la carpeta de Drive donde se guardarán los archivos del tenant.">
      <Field label="ID de la carpeta de Google Drive"
        hint="El ID está en la URL de Drive después de /folders/">
        <Input
          value={data.google_workspace_drive_id || ''}
          onChange={e => onChange({ google_workspace_drive_id: e.target.value })}
          placeholder="1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
        />
      </Field>

      {/* Instrucciones */}
      <div style={{
        padding: '14px 16px', borderRadius: 10, marginBottom: 20,
        background: 'oklch(0.17 0.03 275)',
        border: '1px solid oklch(0.28 0.04 275)',
        fontSize: 12, color: 'oklch(0.60 0.04 275)', lineHeight: 1.6
      }}>
        <strong style={{ color: 'oklch(0.75 0.08 38)', display: 'block', marginBottom: 6 }}>
          Cómo compartir la carpeta:
        </strong>
        1. Abre la carpeta en Google Drive<br />
        2. Clic derecho → "Compartir"<br />
        3. Agrega la service account del sistema<br />
        4. Otorga rol "Editor" y guarda<br />
        5. Pega el ID de la carpeta arriba y verifica
      </div>

      <button
        onClick={verify}
        disabled={verifying}
        style={{
          width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
          background: verifying ? 'oklch(0.22 0.04 275)' : 'oklch(0.62 0.16 38)',
          border: 'none', color: 'white', fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s',
        }}
      >
        {verifying ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verificando...</>
          : <><RefreshCw size={16} /> Verificar acceso a Drive</>}
      </button>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: 'oklch(0.18 0.05 12 / 0.5)', border: '1px solid oklch(0.50 0.15 12 / 0.4)',
          display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle size={14} color="oklch(0.65 0.18 12)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: 'oklch(0.75 0.12 12)' }}>{error}</span>
        </div>
      )}

      {result?.acceso && (
        <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 10,
          background: 'oklch(0.18 0.06 148 / 0.4)', border: '1px solid oklch(0.55 0.14 148 / 0.4)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'oklch(0.72 0.14 148)' }}>
            ✓ Acceso verificado: "{result.carpeta_nombre}"
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.estructura?.map(f => (
              <div key={f.name} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 6,
                background: 'oklch(0.22 0.04 275)',
                fontSize: 12, color: 'oklch(0.68 0.05 275)',
              }}>
                <FolderOpen size={12} color="oklch(0.65 0.14 60)" />
                {f.name}
                {f.nuevo && <span style={{ color: 'oklch(0.65 0.14 148)', fontWeight: 600 }}>nuevo</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {result && !result.acceso && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: 'oklch(0.18 0.05 12 / 0.5)', border: '1px solid oklch(0.50 0.15 12 / 0.4)',
          fontSize: 13, color: 'oklch(0.70 0.10 12)' }}>
          {result.error}
        </div>
      )}

      <p style={{ marginTop: 14, fontSize: 11, color: 'oklch(0.40 0.03 275)', lineHeight: 1.5 }}>
        La integración con Drive es opcional. Puedes continuar sin verificar y configurarla después.
      </p>
    </WizardCard>
  )
}

// ─── Step 5: Resumen final ────────────────────────────────

function Step5({ data, paleta }) {
  const items = [
    { icon: Building2, label: 'NIT',      value: data.nit },
    { icon: Building2, label: 'Empresa',  value: data.nombre },
    { icon: Palette,   label: 'Paleta',   value: PALETAS.find(p => p.id === data.paleta_id)?.label || 'Terracota' },
    { icon: Mail,      label: 'Correo',   value: data.contacto_email },
    { icon: Clock,     label: 'Reportes', value: data.frecuencia_reportes },
    { icon: MapPin,    label: 'Zona',     value: data.zona_horaria },
    { icon: HardDrive, label: 'Drive',    value: data.drive_verificado ? 'Verificado ✓' : 'Pendiente' },
  ].filter(i => i.value)

  return (
    <WizardCard icon={PartyPopper} title="Todo está configurado" desc="Revisa el resumen antes de activar el tenant.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 10,
            background: 'oklch(0.17 0.03 275)',
            border: '1px solid oklch(0.24 0.04 275)',
          }}>
            <Icon size={14} color="oklch(0.65 0.14 38)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'oklch(0.48 0.03 275)', width: 72, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, color: 'oklch(0.88 0.02 275)', fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'oklch(0.45 0.03 275)', lineHeight: 1.6, margin: 0 }}>
        Al hacer clic en "Activar empresa" se aplicará toda la configuración y el tenant quedará listo para operar.
      </p>
    </WizardCard>
  )
}

// ─── Main wizard ──────────────────────────────────────────

export default function TenantOnboarding() {
  const { companyId } = useParams()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tenant, setTenant] = useState(null)

  // Cargar progreso guardado al montar
  useEffect(() => {
    const load = async () => {
      try {
        const [t, prog] = await Promise.all([
          getTenant(companyId),
          getOnboardingProgress(companyId),
        ])
        setTenant(t)
        if (prog.data_acumulada && Object.keys(prog.data_acumulada).length > 0) {
          setData({ ...prog.data_acumulada, nombre: t.nombre, nit: t.nit })
          setStep(Math.min(prog.step_actual || 1, 5))
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

  const saveStep = async (nextStep) => {
    setSaving(true)
    setError('')
    try {
      await saveTenantOnboardingStep(companyId, { step, data })
      setStep(nextStep)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleNext = () => {
    if (step < 5) saveStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleComplete = async () => {
    setSaving(true)
    setError('')
    try {
      await saveTenantOnboardingStep(companyId, { step: 5, data })
      await completeTenantOnboarding(companyId)
      navigate(`/tenants/${companyId}/welcome`, { state: { tenant: { ...tenant, ...data } } })
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'oklch(0.09 0.03 275)' }}>
        <Loader2 size={32} color="oklch(0.62 0.16 38)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const paleta = PALETAS.find(p => p.id === data.paleta_id) || PALETAS[1]

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: 'Inter, DM Sans, sans-serif' }}>
      <NebulaBackground />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'oklch(0.62 0.16 38 / 0.12)',
            border: '1px solid oklch(0.62 0.16 38 / 0.30)',
            borderRadius: 999, padding: '6px 18px', marginBottom: 16,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.78 0.14 38)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: 'oklch(0.75 0.12 38)', fontWeight: 600, letterSpacing: '0.05em' }}>
              CONFIGURACIÓN DE EMPRESA
            </span>
          </div>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 800,
            color: 'oklch(0.96 0.01 275)',
            letterSpacing: '-0.02em',
          }}>
            {tenant?.nombre || 'Nueva Empresa'}
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'oklch(0.50 0.04 275)' }}>
            Configura tu empresa paso a paso
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ marginBottom: 40 }}>
          <StepIndicator current={step} total={5} />
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 560,
          animation: 'slideUp 0.3s ease',
        }}>
          {step === 1 && <Step1 data={data} onChange={mergeData} />}
          {step === 2 && <Step2 data={data} onChange={mergeData} tenantNombre={data.nombre || tenant?.nombre} />}
          {step === 3 && <Step3 data={data} onChange={mergeData} />}
          {step === 4 && <Step4 data={data} onChange={mergeData} companyId={companyId} />}
          {step === 5 && <Step5 data={data} paleta={paleta} />}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 16, maxWidth: 560, width: '100%',
            padding: '10px 16px', borderRadius: 10,
            background: 'oklch(0.18 0.05 12 / 0.6)',
            border: '1px solid oklch(0.50 0.15 12 / 0.4)',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <AlertCircle size={14} color="oklch(0.65 0.18 12)" />
            <span style={{ fontSize: 13, color: 'oklch(0.75 0.12 12)' }}>{error}</span>
          </div>
        )}

        {/* Nav buttons */}
        <div style={{
          marginTop: 28, display: 'flex', gap: 12,
          width: '100%', maxWidth: 560,
        }}>
          {step > 1 && (
            <button
              onClick={handleBack}
              disabled={saving}
              style={{
                flex: 1, padding: '13px', borderRadius: 12, cursor: 'pointer',
                background: 'oklch(0.17 0.03 275)',
                border: '1px solid oklch(0.28 0.04 275)',
                color: 'oklch(0.65 0.05 275)', fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
          )}
          <button
            onClick={step === 5 ? handleComplete : handleNext}
            disabled={saving}
            style={{
              flex: 2, padding: '13px', borderRadius: 12, cursor: 'pointer',
              background: saving ? 'oklch(0.35 0.08 38)' : 'oklch(0.62 0.16 38)',
              border: 'none',
              color: 'white', fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
              boxShadow: saving ? 'none' : '0 4px 20px oklch(0.55 0.18 38 / 0.35)',
            }}
          >
            {saving ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</>
            ) : step === 5 ? (
              <><PartyPopper size={16} /> Activar empresa</>
            ) : (
              <>Continuar <ChevronRight size={16} /></>
            )}
          </button>
        </div>

        {/* Skip Drive */}
        {step === 4 && (
          <button
            onClick={() => saveStep(5)}
            style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'oklch(0.42 0.03 275)',
              textDecoration: 'underline', textDecorationStyle: 'dotted' }}
          >
            Configurar Drive después
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
