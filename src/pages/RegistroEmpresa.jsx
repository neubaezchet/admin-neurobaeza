/**
 * RegistroEmpresa.jsx
 * Página PÚBLICA de registro self-service.
 * Ruta: /registro?token=XXX
 *
 * Wizard de 3 pasos:
 *   1. Confirmar datos de la empresa (pre-llenado)
 *   2. Crear credenciales del administrador
 *   3. Activar → auto-login → redirige al onboarding completo
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Building2, CheckCircle2, ChevronRight, ChevronLeft,
  Loader2, AlertCircle, Eye, EyeOff, Lock,
  Check, ShieldCheck,
} from 'lucide-react'
import { validarTokenRegistro, completarRegistro, saveSession } from '../api'

const PASOS = [
  { num: 1, label: 'Empresa', icon: Building2 },
  { num: 2, label: 'Acceso',  icon: Lock },
  { num: 3, label: 'Activar', icon: Check },
]

const PRIMARY = '#0EA5E9'
const SECONDARY = '#0284C7'
const ACCENT = '#38BDF8'

// ─── Componentes base ─────────────────────────────────────

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

function Input({ error, style: extraStyle, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', boxSizing: 'border-box', padding: '12px 14px',
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12, fontSize: 14, color: '#fff', outline: 'none',
        fontFamily: 'inherit', transition: 'border-color 0.15s',
        ...extraStyle,
      }}
      onFocus={e => !error && (e.target.style.borderColor = 'rgba(14,165,233,0.6)')}
      onBlur={e => !error && (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
    />
  )
}

// ─── Paso 1: Datos de la empresa ──────────────────────────

function Paso1({ datos, setDatos, errors }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff' }}>
        Datos de tu empresa
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        Confirma o corrige la información. Podrás actualizar más detalles después.
      </p>
      <Campo label="Nombre de la empresa *" error={errors?.nombre}>
        <Input
          value={datos.nombre || ''}
          onChange={e => setDatos(d => ({ ...d, nombre: e.target.value }))}
          placeholder="Ej: Empresa ABC S.A.S."
          error={errors?.nombre}
        />
      </Campo>
      <Campo label="NIT">
        <Input
          value={datos.nit || ''}
          onChange={e => setDatos(d => ({ ...d, nit: e.target.value }))}
          placeholder="900123456-7"
        />
      </Campo>
    </div>
  )
}

// ─── Paso 2: Credenciales del admin ───────────────────────

function Paso2({ datos, setDatos, errors }) {
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff' }}>
        Crea tu cuenta de administrador
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        Estas serán tus credenciales para acceder al portal. Guárdalas en un lugar seguro.
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
          <CheckCircle2 size={13} /> Contraseña válida
        </div>
      )}
    </div>
  )
}

// ─── Paso 3: Confirmar y activar ──────────────────────────

function Paso3({ datos }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff' }}>
        ¡Todo listo!
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        Revisa los datos antes de activar tu empresa.
      </p>

      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        {[
          { label: 'Empresa',       value: datos.nombre },
          { label: 'NIT',           value: datos.nit || '—' },
          { label: 'Correo admin',  value: datos.contacto_email },
        ].map(({ label, value }, i) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '13px 18px', gap: 12,
            background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
            borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 500, textAlign: 'right' }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 20, padding: '14px 16px', borderRadius: 10,
        background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)',
        display: 'flex', gap: 10,
      }}>
        <AlertCircle size={16} color="#38BDF8" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
          Al activar, entrarás directamente a configurar tu portal (Google Sheets, Drive, paleta de colores y más).
        </p>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────

export default function RegistroEmpresa() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const esDemo = searchParams.get('demo') === '1'
  const horasDemo = parseInt(searchParams.get('horas') || '4', 10)

  const [estado, setEstado] = useState('validando') // validando | listo | error
  const [errorMsg, setErrorMsg] = useState('')
  const [company, setCompany] = useState(null)
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [datos, setDatos] = useState({
    nombre: '',
    nit: '',
    contacto_email: '',
    admin_password: '',
    confirmar_password: '',
  })

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
    if (paso === 2) {
      if (!datos.contacto_email?.trim()) errs.contacto_email = 'El correo es requerido'
      else if (!datos.contacto_email.includes('@')) errs.contacto_email = 'Correo inválido'
      if (!datos.admin_password || datos.admin_password.length < 8) errs.admin_password = 'Mínimo 8 caracteres'
      if (datos.admin_password !== datos.confirmar_password) errs.confirmar_password = 'Las contraseñas no coinciden'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const siguientePaso = () => {
    if (!validarPaso()) return
    if (paso < 3) setPaso(p => p + 1)
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
        contacto_email: datos.contacto_email,
        admin_password: datos.admin_password,
      })
      if (res.token && res.user) {
        saveSession(res.token, res.user)
        navigate(`/tenants/${res.user.company_id}/onboarding`)
      } else {
        // Fallback: redirigir al login con credenciales creadas
        navigate('/login')
      }
    } catch (e) {
      setErrors({ submit: e.message })
    } finally {
      setLoading(false)
    }
  }

  // ─── Pantalla de carga / error ───────────────────────────

  const bgBase = {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #080d1a 100%)',
    padding: 24,
  }

  if (estado === 'validando') {
    return (
      <div style={bgBase}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} color={PRIMARY} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Verificando tu invitación...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div style={bgBase}>
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
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#fff' }}>Enlace no válido</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            {errorMsg}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Contacta a NeuroBareza para obtener un nuevo enlace.
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ─── Wizard principal ────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 60%, #080d1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
      `}</style>

      <div style={{ maxWidth: 520, width: '100%' }}>

        {/* Marca */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 14px',
            background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
            boxShadow: `0 8px 24px ${PRIMARY}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={26} color="#fff" />
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            NeuroBareza
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            {esDemo
              ? <span style={{ color: '#38BDF8', fontWeight: 700 }}>⏱ DEMO {horasDemo}h — </span>
              : null
            }
            Registro de empresa
            {company && <> — <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{company.nombre}</strong></>}
          </p>
        </div>

        {/* Barra de pasos */}
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
                      background: completado ? PRIMARY : 'rgba(255,255,255,0.08)',
                    }} />
                  )}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', zIndex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: completado ? PRIMARY : activo ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                    border: activo ? `2px solid ${PRIMARY}` : completado ? 'none' : '1.5px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.3s',
                  }}>
                    {completado
                      ? <Check size={14} color="#fff" />
                      : <p.icon size={13} color={activo ? ACCENT : 'rgba(255,255,255,0.3)'} />
                    }
                  </div>
                  <span style={{ fontSize: 9, marginTop: 4, color: activo ? ACCENT : 'rgba(255,255,255,0.25)', fontWeight: activo ? 700 : 400 }}>
                    {p.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24, padding: '36px 36px 32px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          {paso === 1 && <Paso1 datos={datos} setDatos={setDatos} errors={errors} />}
          {paso === 2 && <Paso2 datos={datos} setDatos={setDatos} errors={errors} />}
          {paso === 3 && <Paso3 datos={datos} />}

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

            {paso < 3 ? (
              <button
                onClick={siguientePaso}
                style={{
                  flex: 2, padding: '13px', borderRadius: 12, cursor: 'pointer',
                  background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: `0 6px 20px ${PRIMARY}40`,
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

          <p style={{ textAlign: 'center', margin: '16px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            Paso {paso} de {PASOS.length}
          </p>
        </div>
      </div>
    </div>
  )
}
