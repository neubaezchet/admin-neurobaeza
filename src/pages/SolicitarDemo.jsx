/**
 * SolicitarDemo.jsx — Landing page pública + formulario de demo auto-servicio
 * Ruta: /solicitar-demo  (sin JWT)
 *
 * Layout:
 *   Izquierda — Showcase de características
 *   Derecha   — Botón grande → transición al formulario → redirige al wizard "Hola"
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, Mail, Phone, Hash,
  CheckCircle2, AlertCircle, Loader2,
  Settings, ShieldCheck, Clock, Zap, ChevronRight,
  LayoutDashboard, MessageSquare,
} from 'lucide-react'
import { solicitarDemoAuto } from '../api'

// ─── Validación colombiana de NIT ─────────────────────────
function validarNIT(nit) {
  const solo = nit.replace(/[\s.\-]/g, '')
  return /^\d{7,10}$/.test(solo)
}

const RANGOS_EMPLEADOS = ['1-10', '11-50', '51-200', '201-500', '500+']

const COMO_CONOCIO = [
  { value: 'referido',  label: 'Me refirió alguien' },
  { value: 'google',    label: 'Google / búsqueda web' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'evento',    label: 'Evento o conferencia' },
  { value: 'otro',      label: 'Otro' },
]

// ─── Estilos compartidos ──────────────────────────────────
const inputBase = (hasError) => ({
  width: '100%', boxSizing: 'border-box', padding: '11px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: `1px solid ${hasError ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)'}`,
  borderRadius: 10, fontSize: 14, color: '#fff', outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.2s',
})

function Campo({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 10, fontWeight: 700, marginBottom: 5,
        color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#F87171', display: 'flex', alignItems: 'center', gap: 3 }}>
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  )
}

// ─── Feature card (izquierda) ─────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color }) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 14,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
          {title}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          {desc}
        </p>
      </div>
    </div>
  )
}

// ─── Pantalla éxito (después de enviar) ──────────────────
function PantallaExito({ nombre, email }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
        background: 'rgba(16,185,129,0.12)', border: '2px solid #10B981',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircle2 size={30} color="#10B981" />
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#fff' }}>
        📬 ¡Revisa tu correo!
      </h2>
      <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
        Hola <strong style={{ color: '#fff' }}>{nombre}</strong>, enviamos el enlace de
        registro a <strong style={{ color: '#34D399' }}>{email}</strong>.
        <br />Expira en 24 horas. Si no llega, revisa la carpeta de spam.
      </p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────
export default function SolicitarDemo() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    empresa_nombre: '', nit: '', contacto_nombre: '',
    contacto_email: '', contacto_telefono: '',
    cantidad_empleados: '', como_conocio: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const validar = () => {
    const errs = {}
    if (!form.empresa_nombre.trim()) errs.empresa_nombre = 'Requerido'
    if (!form.nit.trim()) errs.nit = 'Requerido'
    else if (!validarNIT(form.nit)) errs.nit = 'Formato inválido. Ej: 900123456'
    if (!form.cantidad_empleados) errs.cantidad_empleados = 'Requerido'
    if (!form.contacto_nombre.trim()) errs.contacto_nombre = 'Requerido'
    if (!form.contacto_email.trim()) errs.contacto_email = 'Requerido'
    else if (!form.contacto_email.includes('@')) errs.contacto_email = 'Correo inválido'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorGlobal('')
    if (!validar()) return
    setLoading(true)
    try {
      const res = await solicitarDemoAuto({
        empresa_nombre: form.empresa_nombre.trim(),
        nit: form.nit.trim(),
        contacto_nombre: form.contacto_nombre.trim(),
        contacto_email: form.contacto_email.trim(),
        contacto_telefono: form.contacto_telefono.trim() || undefined,
        cantidad_empleados: form.cantidad_empleados,
        como_conocio: form.como_conocio || undefined,
      })
      if (!res.ok) {
        if (res.ya_existe) {
          setErrorGlobal('Ya existe una solicitud de demo para este correo. Revisa tu bandeja de entrada o contáctanos.')
        } else {
          setErrorGlobal(res.mensaje || 'No se pudo procesar la solicitud.')
        }
        return
      }
      // ✅ El link de registro llega SOLO por correo (seguridad)
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
      background: 'linear-gradient(135deg, #050810 0%, #080d1a 50%, #060913 100%)',
      display: 'flex', alignItems: 'stretch',
      fontFamily: '"Inter", "DM Sans", system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2) !important; }
        select option { background: #0d1529; color: #fff; }
        input:focus, select:focus {
          border-color: rgba(14,165,233,0.5) !important;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.08);
        }
      `}</style>

      {/* ── Columna izquierda: Features showcase ── */}
      <div style={{
        flex: '0 0 55%', padding: '64px 56px 64px 64px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow de fondo */}
        <div style={{
          position: 'absolute', top: '20%', left: '10%',
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Encabezado */}
        <div style={{ marginBottom: 40, animation: 'fadeUp 0.6s ease both' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)',
            borderRadius: 999, padding: '5px 14px', marginBottom: 20,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9',
              boxShadow: '0 0 6px #0EA5E9', animation: 'spin 3s linear infinite',
            }} />
            <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Demo gratuito · 3 horas · Sin tarjeta
            </span>
          </div>

          <h1 style={{
            margin: '0 0 14px', fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 800,
            color: 'rgba(255,255,255,0.97)', letterSpacing: '-0.03em', lineHeight: 1.15,
          }}>
            Prueba la gestión de incapacidades médicas en tu empresa
          </h1>
          <p style={{
            margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 460,
          }}>
            Explora el flujo completo: desde que el empleado sube su incapacidad
            hasta que queda validada y radicada.
          </p>
        </div>

        {/* Feature cards */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32,
          animation: 'fadeUp 0.7s 0.1s ease both',
        }}>
          <FeatureCard
            icon={LayoutDashboard}
            color="#0EA5E9"
            title="Portal de administración"
            desc="Configura tu empresa, usuarios y reportes"
          />
          <FeatureCard
            icon={ShieldCheck}
            color="#10B981"
            title="Portal de validación y radicación"
            desc="Revisa y aprueba incapacidades en tiempo real"
          />
          <FeatureCard
            icon={MessageSquare}
            color="#F59E0B"
            title="RopoGemini"
            desc="Recepción digital de incapacidades médicas"
          />
        </div>

        {/* Badge de 3 horas */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, marginBottom: 20,
          animation: 'fadeUp 0.7s 0.2s ease both',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={20} color="#38BDF8" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              3 horas completas
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              Tiempo suficiente para recorrer todo el flujo
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p style={{
          fontSize: 12, color: 'rgba(255,255,255,0.28)', lineHeight: 1.7, maxWidth: 440,
          animation: 'fadeUp 0.7s 0.3s ease both',
        }}>
          Los datos del demo se eliminan automáticamente al vencer. Si decides contratar,
          tu configuración se transfiere sin re-registro.
        </p>
      </div>

      {/* ── Columna derecha: Botón → Formulario ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 48px 48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Estado: solo botón */}
          {!showForm && (
            <div style={{ textAlign: 'center', animation: 'fadeUp 0.6s ease both' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                boxShadow: '0 12px 40px rgba(14,165,233,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={28} color="#fff" />
              </div>

              <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: '#fff' }}>
                Empieza en minutos
              </h2>
              <p style={{ margin: '0 0 36px', fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                Sin tarjeta de crédito · Sin compromiso
                <br />Acceso completo durante 3 horas
              </p>

              <button
                onClick={() => setShowForm(true)}
                style={{
                  width: '100%', padding: '16px 24px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                  border: 'none', color: '#fff', fontWeight: 800, fontSize: 16,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 8px 32px rgba(14,165,233,0.4)',
                  transition: 'all 0.2s ease',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(14,165,233,0.5)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(14,165,233,0.4)'
                }}
              >
                Empezar prueba gratuita
                <ChevronRight size={20} />
              </button>

              <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                Sin compromiso · Te respondemos en menos de 24h
              </p>
            </div>
          )}

          {/* Estado: formulario */}
          {showForm && (
            <div style={{ animation: 'fadeUp 0.45s ease both' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 22, padding: '32px 30px 28px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              }}>
                {enviado ? (
                  <PantallaExito nombre={form.contacto_nombre} email={form.contacto_email} />
                ) : (
                  <form onSubmit={handleSubmit}>
                    <h3 style={{ margin: '0 0 24px', fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                      Datos del demo
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>

                      {/* Empresa */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Campo label="Nombre de la empresa *" error={errors.empresa_nombre}>
                          <div style={{ position: 'relative' }}>
                            <Building2 size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                            <input
                              value={form.empresa_nombre}
                              onChange={e => set('empresa_nombre', e.target.value)}
                              placeholder="Empresa XYZ S.A.S."
                              style={{ ...inputBase(errors.empresa_nombre), paddingLeft: 34 }}
                            />
                          </div>
                        </Campo>
                      </div>

                      {/* NIT */}
                      <Campo label="NIT *" error={errors.nit}>
                        <div style={{ position: 'relative' }}>
                          <Hash size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                          <input
                            value={form.nit}
                            onChange={e => set('nit', e.target.value)}
                            placeholder="900123456"
                            inputMode="numeric"
                            style={{ ...inputBase(errors.nit), paddingLeft: 32 }}
                          />
                        </div>
                        {form.nit && !errors.nit && validarNIT(form.nit) && (
                          <p style={{ margin: '3px 0 0', fontSize: 10, color: '#34D399', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <CheckCircle2 size={9} /> NIT válido
                          </p>
                        )}
                      </Campo>

                      {/* Empleados */}
                      <Campo label="N.° empleados *" error={errors.cantidad_empleados}>
                        <div style={{ position: 'relative' }}>
                          <Users size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                          <select
                            value={form.cantidad_empleados}
                            onChange={e => set('cantidad_empleados', e.target.value)}
                            style={{ ...inputBase(errors.cantidad_empleados), paddingLeft: 32, cursor: 'pointer', appearance: 'none' }}
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
                            style={inputBase(errors.contacto_nombre)}
                          />
                        </Campo>
                      </div>

                      {/* Email */}
                      <Campo label="Correo *" error={errors.contacto_email}>
                        <div style={{ position: 'relative' }}>
                          <Mail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                          <input
                            type="email"
                            value={form.contacto_email}
                            onChange={e => set('contacto_email', e.target.value)}
                            placeholder="juan@empresa.com"
                            style={{ ...inputBase(errors.contacto_email), paddingLeft: 32 }}
                          />
                        </div>
                      </Campo>

                      {/* Teléfono */}
                      <Campo label="Teléfono" error={errors.contacto_telefono}>
                        <div style={{ position: 'relative' }}>
                          <Phone size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                          <input
                            value={form.contacto_telefono}
                            onChange={e => set('contacto_telefono', e.target.value)}
                            placeholder="+57 300 000 0000"
                            style={{ ...inputBase(false), paddingLeft: 32 }}
                          />
                        </div>
                      </Campo>

                      {/* Cómo conoció */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Campo label="¿Cómo nos conociste?">
                          <select
                            value={form.como_conocio}
                            onChange={e => set('como_conocio', e.target.value)}
                            style={{ ...inputBase(false), cursor: 'pointer', appearance: 'none' }}
                          >
                            <option value="">Opcional...</option>
                            {COMO_CONOCIO.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </Campo>
                      </div>
                    </div>

                    {errorGlobal && (
                      <div style={{
                        display: 'flex', gap: 8, padding: '10px 13px', borderRadius: 10, marginBottom: 14,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        fontSize: 12, color: '#FCA5A5',
                      }}>
                        <AlertCircle size={14} color="#F87171" style={{ flexShrink: 0 }} />
                        {errorGlobal}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: '100%', padding: '13px', borderRadius: 12, marginTop: 6,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        background: loading ? 'rgba(14,165,233,0.3)' : 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                        border: 'none', color: '#fff', fontWeight: 700, fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: loading ? 'none' : '0 6px 24px rgba(14,165,233,0.35)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {loading
                        ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Procesando...</>
                        : <>Solicitar demo gratuito <ChevronRight size={16} /></>
                      }
                    </button>

                    <p style={{ textAlign: 'center', margin: '12px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>
                      Sin tarjeta de crédito · Te contactamos en menos de 24h
                    </p>
                  </form>
                )}
              </div>

              {/* Volver al botón */}
              {!enviado && (
                <button
                  onClick={() => { setShowForm(false); setErrors({}); setErrorGlobal('') }}
                  style={{
                    display: 'block', margin: '14px auto 0', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.25)',
                    textDecoration: 'underline', textDecorationStyle: 'dotted',
                  }}
                >
                  ← Volver
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
