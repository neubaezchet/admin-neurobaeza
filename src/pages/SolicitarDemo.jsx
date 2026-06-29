/**
 * SolicitarDemo.jsx — Formulario público de solicitud de demo
 * Ruta: /solicitar-demo  (sin JWT)
 *
 * Fondo: gradiente nebulosa azul (mismo estilo que RegistroEmpresa)
 * Campos: NIT, empresa, empleados, contacto, email, teléfono, cómo conoció
 */

import { useState } from 'react'
import {
  Building2, Users, Mail, Phone, Send, CheckCircle2,
  AlertCircle, Loader2, ShieldCheck, Hash,
} from 'lucide-react'
import { solicitarDemo } from '../api'

// ─── Validación colombiana de NIT ─────────────────────────
function validarNIT(nit) {
  const solo = nit.replace(/[\s.\-]/g, '')
  return /^\d{7,10}$/.test(solo)
}

// ─── Opciones empleados ───────────────────────────────────
const RANGOS_EMPLEADOS = ['1-10', '11-50', '51-200', '201-500', '500+']

const COMO_CONOCIO = [
  { value: 'referido',  label: 'Me refirió alguien' },
  { value: 'google',    label: 'Google / búsqueda web' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'evento',    label: 'Evento o conferencia' },
  { value: 'otro',      label: 'Otro' },
]

// ─── Componentes base ─────────────────────────────────────

function Campo({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6,
        color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#F87171', display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  )
}

const inputStyle = (hasError) => ({
  width: '100%', boxSizing: 'border-box', padding: '11px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${hasError ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: 10, fontSize: 14, color: '#fff', outline: 'none',
  fontFamily: 'inherit',
})

// ─── Pantalla de éxito ────────────────────────────────────

function PantallaExito({ nombre }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
        background: 'rgba(16,185,129,0.12)', border: '2px solid #10B981',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircle2 size={36} color="#10B981" />
      </div>
      <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: '#fff' }}>
        ¡Solicitud recibida!
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
        Hola <strong style={{ color: '#fff' }}>{nombre}</strong>, tu solicitud de demo para{' '}
        <strong style={{ color: '#fff' }}>NeuroBareza</strong> ha sido enviada con éxito.
        <br />Nuestro equipo la revisará y te contactará en las próximas <strong style={{ color: '#38BDF8' }}>24 horas</strong>.
      </p>
      <div style={{
        padding: '14px 18px', borderRadius: 12,
        background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)',
        fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, textAlign: 'left',
      }}>
        <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#38BDF8' }}>¿Qué sigue?</p>
        <p style={{ margin: 0 }}>
          1. Revisaremos los datos de tu empresa.<br />
          2. Te enviaremos un link de acceso al demo por correo.<br />
          3. Tendrás acceso completo por unas horas para probar el sistema.
        </p>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────

export default function SolicitarDemo() {
  const [form, setForm] = useState({
    empresa_nombre: '',
    nit: '',
    contacto_nombre: '',
    contacto_email: '',
    contacto_telefono: '',
    cantidad_empleados: '',
    como_conocio: '',
    mensaje: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const validar = () => {
    const errs = {}
    if (!form.empresa_nombre.trim()) errs.empresa_nombre = 'El nombre de la empresa es requerido'
    if (!form.nit.trim()) errs.nit = 'El NIT es requerido'
    else if (!validarNIT(form.nit)) errs.nit = 'Formato inválido. Ej: 900123456'
    if (!form.contacto_nombre.trim()) errs.contacto_nombre = 'Tu nombre es requerido'
    if (!form.contacto_email.trim()) errs.contacto_email = 'El correo es requerido'
    else if (!form.contacto_email.includes('@')) errs.contacto_email = 'Correo inválido'
    if (!form.cantidad_empleados) errs.cantidad_empleados = 'Selecciona el número de empleados'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorGlobal('')
    if (!validar()) return
    setLoading(true)
    try {
      await solicitarDemo({
        empresa_nombre: form.empresa_nombre.trim(),
        nit: form.nit.trim(),
        contacto_nombre: form.contacto_nombre.trim(),
        contacto_email: form.contacto_email.trim(),
        contacto_telefono: form.contacto_telefono.trim() || undefined,
        como_conocio: form.como_conocio || undefined,
        mensaje: form.cantidad_empleados,  // Reutilizamos mensaje para cantidad_empleados
        cantidad_empleados: form.cantidad_empleados,
      })
      setEnviado(true)
    } catch (e) {
      setErrorGlobal(e.message || 'No se pudo enviar la solicitud. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 60%, #080d1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '48px 16px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.22) !important; }
        select option { background: #0d1529; color: #fff; }
      `}</style>

      <div style={{ maxWidth: 560, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
            boxShadow: '0 8px 28px rgba(14,165,233,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Solicita tu Demo Gratuito
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            Gestión de incapacidades médicas — Pruébalo sin compromiso
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24, padding: '36px 36px 32px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          {enviado ? (
            <PantallaExito nombre={form.contacto_nombre} />
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>

                {/* Empresa */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Campo label="Nombre de la empresa *" error={errors.empresa_nombre}>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                      <input
                        value={form.empresa_nombre}
                        onChange={e => set('empresa_nombre', e.target.value)}
                        placeholder="Empresa XYZ S.A.S."
                        style={{ ...inputStyle(errors.empresa_nombre), paddingLeft: 36 }}
                      />
                    </div>
                  </Campo>
                </div>

                {/* NIT */}
                <Campo label="NIT de la empresa *" error={errors.nit}>
                  <div style={{ position: 'relative' }}>
                    <Hash size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input
                      value={form.nit}
                      onChange={e => set('nit', e.target.value)}
                      placeholder="900123456"
                      style={{ ...inputStyle(errors.nit), paddingLeft: 34 }}
                    />
                  </div>
                  {form.nit && !errors.nit && validarNIT(form.nit) && (
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: '#34D399', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <CheckCircle2 size={10} /> NIT válido
                    </p>
                  )}
                </Campo>

                {/* Empleados */}
                <Campo label="N.° de empleados *" error={errors.cantidad_empleados}>
                  <div style={{ position: 'relative' }}>
                    <Users size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                    <select
                      value={form.cantidad_empleados}
                      onChange={e => set('cantidad_empleados', e.target.value)}
                      style={{ ...inputStyle(errors.cantidad_empleados), paddingLeft: 34, cursor: 'pointer', appearance: 'none' }}
                    >
                      <option value="">Seleccionar...</option>
                      {RANGOS_EMPLEADOS.map(r => (
                        <option key={r} value={r}>{r} empleados</option>
                      ))}
                    </select>
                  </div>
                </Campo>

                {/* Nombre contacto */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Campo label="Tu nombre completo *" error={errors.contacto_nombre}>
                    <input
                      value={form.contacto_nombre}
                      onChange={e => set('contacto_nombre', e.target.value)}
                      placeholder="Juan Rodríguez"
                      style={inputStyle(errors.contacto_nombre)}
                    />
                  </Campo>
                </div>

                {/* Email */}
                <Campo label="Correo electrónico *" error={errors.contacto_email}>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input
                      type="email"
                      value={form.contacto_email}
                      onChange={e => set('contacto_email', e.target.value)}
                      placeholder="juan@empresa.com"
                      style={{ ...inputStyle(errors.contacto_email), paddingLeft: 34 }}
                    />
                  </div>
                </Campo>

                {/* Teléfono */}
                <Campo label="Teléfono" error={errors.contacto_telefono}>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input
                      value={form.contacto_telefono}
                      onChange={e => set('contacto_telefono', e.target.value)}
                      placeholder="+57 300 000 0000"
                      style={{ ...inputStyle(false), paddingLeft: 34 }}
                    />
                  </div>
                </Campo>

                {/* Cómo conoció */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Campo label="¿Cómo nos conociste?">
                    <select
                      value={form.como_conocio}
                      onChange={e => set('como_conocio', e.target.value)}
                      style={{ ...inputStyle(false), cursor: 'pointer', appearance: 'none' }}
                    >
                      <option value="">Seleccionar (opcional)...</option>
                      {COMO_CONOCIO.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Campo>
                </div>
              </div>

              {errorGlobal && (
                <div style={{
                  display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  fontSize: 13, color: '#FCA5A5',
                }}>
                  <AlertCircle size={15} color="#F87171" style={{ flexShrink: 0 }} />
                  {errorGlobal}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, marginTop: 8,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? 'rgba(14,165,233,0.3)' : 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 6px 24px rgba(14,165,233,0.4)',
                }}
              >
                {loading
                  ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                  : <><Send size={17} /> Solicitar Demo Gratuito</>
                }
              </button>

              <p style={{ textAlign: 'center', margin: '14px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                Sin compromiso. Nuestro equipo validará tu empresa antes de aprobar el acceso.
              </p>
            </form>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          NeuroBareza — Sistema de gestión de incapacidades médicas
        </p>
      </div>
    </div>
  )
}
