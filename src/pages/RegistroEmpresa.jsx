/**
 * RegistroEmpresa.jsx
 * Página PÚBLICA de registro self-service.
 * Ruta: /registro?token=XXX
 *
 * Wizard de 6 pasos que la empresa llena por sí sola
 * después de recibir el link de invitación del admin.
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Building2, CheckCircle2, ChevronRight, ChevronLeft,
  Loader2, AlertCircle, Eye, EyeOff, Lock, Mail,
  Hash, Users, BarChart2, Palette, Check, ShieldCheck,
  Clock, X,
} from 'lucide-react'
import { validarTokenRegistro, completarRegistro } from '../api'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PALETAS = [
  { id: 'ocean',   label: 'Océano',   primary: '#0EA5E9', secondary: '#0284C7', accent: '#38BDF8' },
  { id: 'forest',  label: 'Bosque',   primary: '#10B981', secondary: '#059669', accent: '#34D399' },
  { id: 'violet',  label: 'Violeta',  primary: '#8B5CF6', secondary: '#7C3AED', accent: '#A78BFA' },
  { id: 'amber',   label: 'Ámbar',    primary: '#F59E0B', secondary: '#D97706', accent: '#FCD34D' },
  { id: 'rose',    label: 'Rosa',     primary: '#F43F5E', secondary: '#E11D48', accent: '#FB7185' },
  { id: 'slate',   label: 'Pizarra',  primary: '#64748B', secondary: '#475569', accent: '#94A3B8' },
]

const CICLOS = [
  {
    id: 'quincenal',
    label: 'Quincenal',
    desc: 'Reportes y tablas vivas se actualizan cada 15 días',
    icon: '📅',
  },
  {
    id: 'mensual',
    label: 'Mensual',
    desc: 'Ciclo completo mes a mes. Ideal para empresas medianas/grandes',
    icon: '🗓️',
  },
]

const ESTILOS = [
  { id: 'default',     label: 'Estándar',    desc: 'Diseño limpio y profesional' },
  { id: 'futurista',   label: 'Futurista',   desc: 'Dark mode intenso con efectos neon' },
  { id: 'minimalista', label: 'Minimalista', desc: 'Simple, sin distracciones' },
  { id: 'ux_focus',    label: 'UX Focus',    desc: 'Prioriza la experiencia del usuario' },
]

const PASOS = [
  { num: 1, label: 'Empresa',    icon: Building2 },
  { num: 2, label: 'Estructura', icon: Users },
  { num: 3, label: 'Ciclo',     icon: BarChart2 },
  { num: 4, label: 'Acceso',    icon: Lock },
  { num: 5, label: 'Visual',    icon: Palette },
  { num: 6, label: 'Confirmar', icon: Check },
]

// ─── Componentes de input ─────────────────────────────────────────────────────

function Campo({ label, children, error }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 7,
        color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ margin: '5px 0 0', fontSize: 11, color: '#F87171', display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '12px 14px',
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12, fontSize: 14, color: '#fff', outline: 'none',
        fontFamily: 'inherit', transition: 'border-color 0.15s',
      }}
      onFocus={e => !error && (e.target.style.borderColor = 'rgba(14,165,233,0.6)')}
      onBlur={e => !error && (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
    />
  )
}

// ─── Paso 1: Empresa ──────────────────────────────────────────────────────────

function Paso1({ datos, setDatos, errors }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff' }}>
        Datos de tu empresa
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        Confirma o completa la información de tu empresa.
      </p>

      <Campo label="Nombre de la empresa *" error={errors?.nombre}>
        <Input
          value={datos.nombre || ''}
          onChange={e => setDatos(d => ({ ...d, nombre: e.target.value }))}
          placeholder="Ej: Empresa ABC S.A.S."
          error={errors?.nombre}
        />
      </Campo>

      <Campo label="NIT" error={errors?.nit}>
        <Input
          value={datos.nit || ''}
          onChange={e => setDatos(d => ({ ...d, nit: e.target.value }))}
          placeholder="900123456-7"
          error={errors?.nit}
        />
      </Campo>
    </div>
  )
}

// ─── Paso 2: Estructura ───────────────────────────────────────────────────────

function Paso2({ datos, setDatos }) {
  const [subEmpresaInput, setSubEmpresaInput] = useState('')

  const addSubEmpresa = () => {
    const nombre = subEmpresaInput.trim()
    if (!nombre) return
    setDatos(d => ({ ...d, sub_empresas: [...(d.sub_empresas || []), nombre] }))
    setSubEmpresaInput('')
  }

  const removeSubEmpresa = (idx) => {
    setDatos(d => ({ ...d, sub_empresas: d.sub_empresas.filter((_, i) => i !== idx) }))
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff' }}>
        Estructura de la empresa
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        ¿Tu empresa es independiente o forma parte de un grupo?
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[
          { id: 'unica', label: 'Empresa única', desc: 'Una sola empresa con su propia base de datos', icon: '🏢' },
          { id: 'holding', label: 'Holding / Grupo', desc: 'Varias empresas del mismo grupo con datos separados', icon: '🏗️' },
        ].map(opt => {
          const isActive = datos.tipo_estructura === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => setDatos(d => ({ ...d, tipo_estructura: opt.id, sub_empresas: [] }))}
              style={{
                padding: '20px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                background: isActive ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.04)',
                border: isActive ? '1.5px solid rgba(14,165,233,0.5)' : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.icon}</div>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: isActive ? '#38BDF8' : '#fff' }}>
                {opt.label}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                {opt.desc}
              </p>
            </button>
          )
        })}
      </div>

      {datos.tipo_estructura === 'holding' && (
        <div>
          <Campo label="Sub-empresas del grupo">
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={subEmpresaInput}
                onChange={e => setSubEmpresaInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubEmpresa())}
                placeholder="Nombre de la sub-empresa (Enter para agregar)"
              />
              <button
                onClick={addSubEmpresa}
                style={{
                  padding: '12px 18px', borderRadius: 12, cursor: 'pointer', flexShrink: 0,
                  background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)',
                  color: '#38BDF8', fontWeight: 700, fontSize: 14,
                }}
              >
                +
              </button>
            </div>
          </Campo>

          {(datos.sub_empresas || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {datos.sub_empresas.map((se, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                  borderRadius: 99, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)',
                }}>
                  <span style={{ fontSize: 13, color: '#38BDF8', fontWeight: 500 }}>{se}</span>
                  <button
                    onClick={() => removeSubEmpresa(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#F87171', display: 'flex' }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Paso 3: Ciclo ────────────────────────────────────────────────────────────

function Paso3({ datos, setDatos }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff' }}>
        Ciclo de reportes
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        Los reportes, tablas vivas y alertas se acoplan a este ciclo.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CICLOS.map(ciclo => {
          const isActive = datos.ciclo_reporte === ciclo.id
          return (
            <button
              key={ciclo.id}
              onClick={() => setDatos(d => ({ ...d, ciclo_reporte: ciclo.id }))}
              style={{
                padding: '20px 22px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                background: isActive ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.04)',
                border: isActive ? '1.5px solid rgba(14,165,233,0.5)' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 32 }}>{ciclo.icon}</span>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: isActive ? '#38BDF8' : '#fff' }}>
                  {ciclo.label}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                  {ciclo.desc}
                </p>
              </div>
              {isActive && (
                <CheckCircle2 size={20} color="#0EA5E9" style={{ marginLeft: 'auto', flexShrink: 0 }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Paso 4: Acceso ───────────────────────────────────────────────────────────

function Paso4({ datos, setDatos, errors }) {
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff' }}>
        Credenciales de acceso
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        Estas serán las credenciales del administrador principal de tu empresa.
        Guárdalas en un lugar seguro.
      </p>

      <Campo label="Correo electrónico (será tu usuario) *" error={errors?.contacto_email}>
        <Input
          type="email"
          value={datos.contacto_email || ''}
          onChange={e => setDatos(d => ({ ...d, contacto_email: e.target.value }))}
          placeholder="admin@tuempresa.com"
          error={errors?.contacto_email}
        />
      </Campo>

      <Campo label="Contraseña (mínimo 8 caracteres) *" error={errors?.admin_password}>
        <div style={{ position: 'relative' }}>
          <Input
            type={showPass ? 'text' : 'password'}
            value={datos.admin_password || ''}
            onChange={e => setDatos(d => ({ ...d, admin_password: e.target.value }))}
            placeholder="••••••••••••"
            error={errors?.admin_password}
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              padding: 0, display: 'flex',
            }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Campo>

      <Campo label="Confirmar contraseña *" error={errors?.confirmar_password}>
        <div style={{ position: 'relative' }}>
          <Input
            type={showConfirm ? 'text' : 'password'}
            value={datos.confirmar_password || ''}
            onChange={e => setDatos(d => ({ ...d, confirmar_password: e.target.value }))}
            placeholder="••••••••••••"
            error={errors?.confirmar_password}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              padding: 0, display: 'flex',
            }}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Campo>

      {datos.admin_password && datos.admin_password.length >= 8 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
          borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
          fontSize: 12, color: '#34D399',
        }}>
          <CheckCircle2 size={13} />
          Contraseña válida
        </div>
      )}
    </div>
  )
}

// ─── Paso 5: Visual ───────────────────────────────────────────────────────────

function Paso5({ datos, setDatos }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff' }}>
        Personaliza tu portal
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        Elige los colores y estilo de interfaz para tu equipo. Puedes cambiarlo después.
      </p>

      <Campo label="Paleta de colores">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {PALETAS.map(p => {
            const isActive = datos.paleta_id === p.id
            return (
              <button
                key={p.id}
                onClick={() => setDatos(d => ({ ...d, paleta_id: p.id, paleta_colores: { primary: p.primary, secondary: p.secondary, accent: p.accent } }))}
                style={{
                  padding: '12px', borderRadius: 12, cursor: 'pointer',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  border: isActive ? `1.5px solid ${p.primary}` : '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  {[p.primary, p.secondary, p.accent].map((c, i) => (
                    <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? p.accent : 'rgba(255,255,255,0.5)' }}>
                  {p.label}
                </span>
              </button>
            )
          })}
        </div>
      </Campo>

      <Campo label="Estilo de interfaz">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ESTILOS.map(e => {
            const isActive = datos.estilo_ui === e.id
            return (
              <button
                key={e.id}
                onClick={() => setDatos(d => ({ ...d, estilo_ui: e.id }))}
                style={{
                  padding: '14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  background: isActive ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.03)',
                  border: isActive ? '1.5px solid rgba(14,165,233,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.15s',
                }}
              >
                <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: isActive ? '#38BDF8' : '#fff' }}>
                  {e.label}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                  {e.desc}
                </p>
              </button>
            )
          })}
        </div>
      </Campo>
    </div>
  )
}

// ─── Paso 6: Confirmar ────────────────────────────────────────────────────────

function Paso6({ datos, company }) {
  const paleta = PALETAS.find(p => p.id === datos.paleta_id) || PALETAS[0]
  const ciclo = CICLOS.find(c => c.id === datos.ciclo_reporte) || CICLOS[1]

  const filas = [
    { label: 'Empresa', value: datos.nombre || company?.nombre },
    { label: 'NIT', value: datos.nit || company?.nit || '—' },
    { label: 'Tipo', value: datos.tipo_estructura === 'holding' ? `Holding (${(datos.sub_empresas || []).length} sub-empresas)` : 'Empresa única' },
    { label: 'Ciclo', value: ciclo.label },
    { label: 'Correo admin', value: datos.contacto_email },
    { label: 'Visual', value: `${paleta.label} / ${ESTILOS.find(e => e.id === datos.estilo_ui)?.label}` },
  ]

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff' }}>
        ¡Todo listo!
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        Revisa tu configuración antes de activar la empresa. No podrás editar el correo admin después.
      </p>

      <div style={{
        borderRadius: 14, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {filas.map(({ label, value }, i) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '13px 18px', gap: 12,
            background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
            borderBottom: i < filas.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 500, textAlign: 'right' }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 20, padding: '14px 16px', borderRadius: 10,
        background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
        display: 'flex', gap: 10,
      }}>
        <AlertCircle size={16} color="#FCD34D" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
          Al hacer clic en <strong style={{ color: '#FCD34D' }}>"Activar mi empresa"</strong> se crearán
          tus credenciales y tu base de datos de incapacidades. Esta acción no se puede revertir.
        </p>
      </div>
    </div>
  )
}

// ─── Pantalla de éxito ────────────────────────────────────────────────────────

function PantallaExito({ resultado, datos }) {
  const navigate = useNavigate()

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
        background: 'rgba(16,185,129,0.15)', border: '2px solid #10B981',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse 2s infinite',
      }}>
        <CheckCircle2 size={40} color="#10B981" />
      </div>

      <h2 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 800, color: '#fff' }}>
        ¡Empresa activada!
      </h2>
      <p style={{ margin: '0 0 32px', fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
        {resultado.mensaje}
      </p>

      <div style={{
        padding: '20px', borderRadius: 16, marginBottom: 28, textAlign: 'left',
        background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)',
      }}>
        <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Tus credenciales de acceso
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Usuario:</span>
            <span style={{ fontSize: 13, color: '#fff', fontFamily: 'monospace', fontWeight: 600 }}>
              {resultado.admin_username}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Correo:</span>
            <span style={{ fontSize: 13, color: '#fff', fontFamily: 'monospace' }}>{datos.contacto_email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Contraseña:</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>La que elegiste</span>
          </div>
        </div>
      </div>

      <p style={{ margin: '0 0 20px', fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
        📋 Guarda estas credenciales. Las necesitarás para ingresar al portal.
      </p>

      <button
        onClick={() => navigate('/login')}
        style={{
          width: '100%', padding: '14px', borderRadius: 14, cursor: 'pointer',
          background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
          border: 'none', color: '#fff', fontWeight: 800, fontSize: 16,
          boxShadow: '0 8px 24px rgba(14,165,233,0.35)',
        }}
      >
        Ir al portal →
      </button>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RegistroEmpresa() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [estado, setEstado] = useState('validando') // validando | listo | error | exito
  const [errorMsg, setErrorMsg] = useState('')
  const [company, setCompany] = useState(null)
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [resultado, setResultado] = useState(null)

  const [datos, setDatos] = useState({
    nombre: '',
    nit: '',
    tipo_estructura: 'unica',
    sub_empresas: [],
    ciclo_reporte: 'mensual',
    contacto_email: '',
    admin_password: '',
    confirmar_password: '',
    paleta_id: 'ocean',
    paleta_colores: { primary: '#0EA5E9', secondary: '#0284C7', accent: '#38BDF8' },
    estilo_ui: 'default',
  })

  // Validar token al cargar
  useEffect(() => {
    if (!token) {
      setEstado('error')
      setErrorMsg('No se encontró el token de invitación en el enlace.')
      return
    }

    validarTokenRegistro(token)
      .then(res => {
        setCompany(res.company)
        setDatos(d => ({
          ...d,
          nombre: res.company.nombre || '',
          nit: res.company.nit || '',
          contacto_email: res.company.contacto_email || '',
        }))
        if (res.onboarding_completado) {
          setEstado('error')
          setErrorMsg('Esta empresa ya completó su registro. Usa tus credenciales para ingresar.')
        } else {
          setEstado('listo')
        }
      })
      .catch(e => {
        setEstado('error')
        setErrorMsg(e.message || 'Token inválido o expirado.')
      })
  }, [token])

  const validarPaso = () => {
    const errs = {}
    if (paso === 1) {
      if (!datos.nombre?.trim()) errs.nombre = 'El nombre es requerido'
    }
    if (paso === 4) {
      if (!datos.contacto_email?.trim()) errs.contacto_email = 'El correo es requerido'
      if (!datos.contacto_email?.includes('@')) errs.contacto_email = 'Correo inválido'
      if (!datos.admin_password || datos.admin_password.length < 8) errs.admin_password = 'Mínimo 8 caracteres'
      if (datos.admin_password !== datos.confirmar_password) errs.confirmar_password = 'Las contraseñas no coinciden'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const siguientePaso = () => {
    if (!validarPaso()) return
    if (paso < 6) setPaso(p => p + 1)
  }

  const anteriorPaso = () => {
    if (paso > 1) setPaso(p => p - 1)
  }

  const handleSubmit = async () => {
    setLoading(true); setErrors({})
    try {
      const res = await completarRegistro({
        token,
        nombre: datos.nombre,
        nit: datos.nit,
        tipo_estructura: datos.tipo_estructura,
        sub_empresas: datos.sub_empresas,
        ciclo_reporte: datos.ciclo_reporte,
        contacto_email: datos.contacto_email,
        admin_password: datos.admin_password,
        paleta_id: datos.paleta_id,
        paleta_colores: datos.paleta_colores,
        estilo_ui: datos.estilo_ui,
      })
      setResultado(res)
      setEstado('exito')
    } catch (e) {
      setErrors({ submit: e.message })
    } finally {
      setLoading(false)
    }
  }

  const paleta = PALETAS.find(p => p.id === datos.paleta_id) || PALETAS[0]

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (estado === 'validando') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #080d1a 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} color="#0EA5E9" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Verificando tu invitación...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #080d1a 100%)',
        padding: 24,
      }}>
        <div style={{
          maxWidth: 440, width: '100%', textAlign: 'center', padding: 40,
          background: 'rgba(255,255,255,0.04)', borderRadius: 24,
          border: '1px solid rgba(248,113,113,0.2)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
            background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={30} color="#F87171" />
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#fff' }}>
            Enlace no válido
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            {errorMsg}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Si crees que es un error, contacta a NeuroBareza para obtener un nuevo enlace.
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 60%, #080d1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4) } 50% { box-shadow: 0 0 0 12px rgba(16,185,129,0) } }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
        textarea::placeholder { color: rgba(255,255,255,0.25) !important; }
      `}</style>

      <div style={{ maxWidth: 560, width: '100%' }}>

        {/* Logo / marca */}
        {estado !== 'exito' && (
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, margin: '0 auto 14px',
              background: `linear-gradient(135deg, ${paleta.primary}, ${paleta.secondary})`,
              boxShadow: `0 8px 24px ${paleta.primary}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={26} color="#fff" />
            </div>
            <h1 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              NeuroBareza
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              Registro de empresa
              {company && <> — <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{company.nombre}</strong></>}
            </p>
          </div>
        )}

        {/* Barra de progreso */}
        {estado === 'listo' && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 0 }}>
              {PASOS.map((p, i) => {
                const activo = paso === p.num
                const completado = paso > p.num
                return (
                  <div key={p.num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {i > 0 && (
                      <div style={{
                        position: 'absolute', top: 15, right: '50%', left: '-50%',
                        height: 2, zIndex: 0,
                        background: completado ? paleta.primary : 'rgba(255,255,255,0.08)',
                      }} />
                    )}
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', zIndex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: completado ? paleta.primary : activo ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                      border: activo ? `2px solid ${paleta.primary}` : completado ? 'none' : '1.5px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.3s',
                    }}>
                      {completado
                        ? <Check size={14} color="#fff" />
                        : <p.icon size={13} color={activo ? paleta.accent : 'rgba(255,255,255,0.3)'} />
                      }
                    </div>
                    <span style={{ fontSize: 9, marginTop: 4, color: activo ? paleta.accent : 'rgba(255,255,255,0.25)', fontWeight: activo ? 700 : 400 }}>
                      {p.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Card principal */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${estado === 'exito' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 24, padding: '36px 36px 32px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          {estado === 'exito' && resultado ? (
            <PantallaExito resultado={resultado} datos={datos} />
          ) : (
            <>
              {/* Contenido del paso */}
              {paso === 1 && <Paso1 datos={datos} setDatos={setDatos} errors={errors} />}
              {paso === 2 && <Paso2 datos={datos} setDatos={setDatos} />}
              {paso === 3 && <Paso3 datos={datos} setDatos={setDatos} />}
              {paso === 4 && <Paso4 datos={datos} setDatos={setDatos} errors={errors} />}
              {paso === 5 && <Paso5 datos={datos} setDatos={setDatos} />}
              {paso === 6 && <Paso6 datos={datos} company={company} />}

              {/* Error de submit */}
              {errors.submit && (
                <div style={{
                  display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, marginTop: 16,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  fontSize: 13, color: '#FCA5A5',
                }}>
                  <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0 }} />
                  {errors.submit}
                </div>
              )}

              {/* Navegación */}
              <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                {paso > 1 && (
                  <button
                    onClick={anteriorPaso}
                    style={{
                      flex: 1, padding: '13px', borderRadius: 12, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                )}

                {paso < 6 ? (
                  <button
                    onClick={siguientePaso}
                    style={{
                      flex: 2, padding: '13px', borderRadius: 12, cursor: 'pointer',
                      background: `linear-gradient(135deg, ${paleta.primary}, ${paleta.secondary})`,
                      border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: `0 6px 20px ${paleta.primary}40`,
                    }}
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      flex: 2, padding: '13px', borderRadius: 12,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      background: loading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10B981, #059669)',
                      border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: loading ? 'none' : '0 6px 20px rgba(16,185,129,0.4)',
                    }}
                  >
                    {loading
                      ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Activando empresa...</>
                      : <><CheckCircle2 size={16} /> Activar mi empresa</>
                    }
                  </button>
                )}
              </div>

              {/* Progreso texto */}
              <p style={{ textAlign: 'center', margin: '16px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                Paso {paso} de {PASOS.length}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
