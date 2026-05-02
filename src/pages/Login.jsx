import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, AlertCircle, Loader2, Zap } from 'lucide-react'
import { login, setupSuperadmin } from '../api'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [setupMode, setSetupMode] = useState(false)

  const vantaRef = useRef(null)
  const vantaEffect = useRef(null)

  useEffect(() => {
    if (!vantaEffect.current && window.VANTA) {
      vantaEffect.current = window.VANTA.FOG({
        el: vantaRef.current,
        THREE: window.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        highlightColor: 0x6359A3,
        midtoneColor: 0xE8E4DF,
        lowlightColor: 0xD5CFC8,
        baseColor: 0xF8F6F4,
        blurFactor: 0.82,
        speed: 1.20,
      })
    }
    return () => { if (vantaEffect.current) vantaEffect.current.destroy() }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setError('')
    setLoading(true)

    try {
      let data
      if (setupMode) {
        data = await setupSuperadmin(username, password)
        // After setup, login normally
        data = await login(username, password)
      } else {
        data = await login(username, password)
      }
      if (data.ok && data.user) {
        onLogin(data.user)
        navigate('/')
      }
    } catch (err) {
      const msg = err.message || 'Error de conexión'
      if (msg.includes('401') || msg.includes('Credenciales')) {
        setError('Usuario o contraseña incorrectos')
      } else if (msg.includes('403') || msg.includes('Ya existe')) {
        setError('Ya existe un superadmin. Ingresa con tus credenciales.')
        setSetupMode(false)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={vantaRef} className="min-h-screen flex items-center justify-center p-4" style={{ position: 'relative' }}>
      {/* Content above Vanta */}
      <div className="relative w-full max-w-md" style={{ zIndex: 1 }}>
        {/* Card — Glassmorphism */}
        <div
          className="rounded-ios-xl overflow-hidden animate-scale-in"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.78)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-ios-lg mb-5"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
                boxShadow: '0 4px 16px rgba(99, 89, 163, 0.35)',
              }}
            >
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Admin Incapacidades
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Panel de Control Empresarial
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            {error && (
              <div
                className="flex items-center gap-2 px-3.5 py-3 rounded-ios text-sm animate-fade-in"
                style={{
                  backgroundColor: 'var(--error-soft)',
                  color: 'var(--error)',
                  border: '1px solid rgba(186, 26, 26, 0.15)',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div>
              <label
                className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="neo-input"
                placeholder="admin"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div>
              <label
                className="block text-[11px] font-bold mb-1.5 uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neo-input pr-10"
                  placeholder="••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-ios transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="neo-btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando...</>
              ) : (
                <>{setupMode ? 'Crear Superadmin' : 'Iniciar Sesión'}</>
              )}
            </button>

            {/* Toggle setup mode */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setSetupMode(!setupMode); setError('') }}
                className="text-xs transition-colors inline-flex items-center gap-1"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                <Zap className="w-3 h-3" />
                {setupMode ? 'Ya tengo cuenta → Iniciar sesión' : '¿Primera vez? → Crear superadmin'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] mt-6" style={{ color: 'var(--text-muted)' }}>
          Sistema de Gestión de Incapacidades © 2026
        </p>
      </div>
    </div>
  )
}
