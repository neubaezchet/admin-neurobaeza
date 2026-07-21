/**
 * RegistroEmpresa.jsx
 * Página PÚBLICA de registro self-service.
 * Ruta: /registro?token=XXX
 *
 * Wizard de 3 pasos:
 *   1. Confirmar datos de la empresa (pre-llenado)
 *   2. Crear credenciales del administrador
 *   3. Activar → auto-login → redirige al onboarding completo
 *
 * Tema: Indigo 2026 — fondo claro, orbs + acento índigo/violeta.
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

const PRIMARY = '#4F46E5'
const SECONDARY = '#818CF8'
const ACCENT = '#7C3AED'

// ─── Componentes base ─────────────────────────────────────

function Campo({ label, children, error }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
      {error && (
        <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function Input({ error, className = '', style, ...props }) {
  return (
    <input
      className={`neo-input ${className}`}
      style={{ ...(error ? { borderColor: 'rgba(220,38,38,0.5)' } : null), ...style }}
      {...props}
    />
  )
}

// ─── Paso 1: Datos de la empresa ──────────────────────────

function Paso1({ datos, setDatos, errors }) {
  return (
    <div>
      <h2 className="card-title" style={{ marginBottom: 6 }}>Datos de tu empresa</h2>
      <p className="card-desc" style={{ marginBottom: 24 }}>
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
      <h2 className="card-title" style={{ marginBottom: 6 }}>Crea tu cuenta de administrador</h2>
      <p className="card-desc" style={{ marginBottom: 24 }}>
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
              background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
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
              background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
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
          borderRadius: 8, background: 'var(--success-soft)', border: '1px solid rgba(16,185,129,0.25)',
          fontSize: 12, color: '#047857',
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
      <h2 className="card-title" style={{ marginBottom: 6 }}>¡Todo listo!</h2>
      <p className="card-desc" style={{ marginBottom: 20 }}>
        Revisa los datos antes de activar tu empresa.
      </p>

      <div>
        {[
          { label: 'Empresa',       value: datos.nombre },
          { label: 'NIT',           value: datos.nit || '—' },
          { label: 'Correo admin',  value: datos.contacto_email },
        ].map(({ label, value }) => (
          <div key={label} className="summary-item">
            <span className="summary-label">{label}</span>
            <span className="summary-val">{value}</span>
          </div>
        ))}
      </div>

      <div className="sa-box" style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <AlertCircle size={16} color={PRIMARY} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>
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

  // ─── Fondo compartido (orbs + VANTA-ready) ───────────────

  const Background = () => (
    <div className="vanta-bg">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  )

  // ─── Pantalla de carga / error ───────────────────────────

  if (estado === 'validando') {
    return (
      <div className="onb-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Background />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Loader2 size={36} color={PRIMARY} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p style={{ color: '#64748B', fontSize: 14 }}>Verificando tu invitación...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (estado === 'error') {
    return (
      <div className="onb-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Background />
        <div className="glass" style={{
          maxWidth: 440, width: '100%', textAlign: 'center', padding: 40,
          borderRadius: 24, position: 'relative', zIndex: 1,
          border: '1px solid rgba(220,38,38,0.2)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
            background: 'var(--error-soft)', border: '1.5px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={30} color="var(--error)" />
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Enlace no válido</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
            {errorMsg}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
            Contacta a Neurobaeza para obtener un nuevo enlace.
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ─── Wizard principal ────────────────────────────────────

  return (
    <div className="onb-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <Background />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ maxWidth: 520, width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Marca */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 14px',
            background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
            boxShadow: `0 8px 24px ${PRIMARY}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={26} color="#fff" />
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', fontFamily: "'Outfit',sans-serif" }}>
            Neurobaeza
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
            {esDemo
              ? <span style={{ color: ACCENT, fontWeight: 700 }}>⏱ DEMO {horasDemo}h — </span>
              : null
            }
            Registro de empresa
            {company && <> — <strong style={{ color: '#334155' }}>{company.nombre}</strong></>}
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
                      background: completado ? PRIMARY : 'rgba(15,23,42,0.10)',
                    }} />
                  )}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', zIndex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: completado ? PRIMARY : activo ? `${PRIMARY}1F` : 'rgba(15,23,42,0.04)',
                    border: activo ? `2px solid ${PRIMARY}` : completado ? 'none' : '1.5px solid rgba(15,23,42,0.10)',
                    transition: 'all 0.3s',
                  }}>
                    {completado
                      ? <Check size={14} color="#fff" />
                      : <p.icon size={13} color={activo ? PRIMARY : '#94A3B8'} />
                    }
                  </div>
                  <span style={{ fontSize: 9, marginTop: 4, color: activo ? PRIMARY : '#94A3B8', fontWeight: activo ? 700 : 400 }}>
                    {p.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card */}
        <div className="glass" style={{ borderRadius: 24, padding: '36px 36px 32px' }}>
          {paso === 1 && <Paso1 datos={datos} setDatos={setDatos} errors={errors} />}
          {paso === 2 && <Paso2 datos={datos} setDatos={setDatos} errors={errors} />}
          {paso === 3 && <Paso3 datos={datos} />}

          {errors.submit && (
            <div role="alert" className="error-row" style={{ marginTop: 16 }}>
              <AlertCircle size={15} />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Navegación */}
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            {paso > 1 && (
              <button onClick={anteriorPaso} className="btn-back" style={{ flex: 1 }}>
                <ChevronLeft size={16} /> Anterior
              </button>
            )}

            {paso < 3 ? (
              <button onClick={siguientePaso} className="btn-next" style={{ flex: 2 }}>
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-next"
                style={{
                  flex: 2,
                  background: loading ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10B981, #059669)',
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(16,185,129,0.35)',
                }}
              >
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Activando empresa...</>
                  : <><CheckCircle2 size={16} /> Activar mi empresa</>
                }
              </button>
            )}
          </div>

          <p style={{ textAlign: 'center', margin: '16px 0 0', fontSize: 11, color: '#94A3B8' }}>
            Paso {paso} de {PASOS.length}
          </p>
        </div>
      </div>
    </div>
  )
}
