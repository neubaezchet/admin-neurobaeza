import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, AlertCircle, Loader2, Sparkles, Lock } from 'lucide-react'
import { login, setupSuperadmin } from '../api'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [setupMode, setSetupMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  const vantaRef = useRef(null)
  const vantaEffect = useRef(null)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      if (!vantaEffect.current && window.VANTA) {
        vantaEffect.current = window.VANTA.NET({
          el: vantaRef.current,
          THREE: window.THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x0EA5E9,
          backgroundColor: 0x050507,
          points: 12.0,
          maxDistance: 22.0,
          spacing: 18.0,
        })
      }
    }, 100)
    return () => {
      clearTimeout(timer)
      if (vantaEffect.current) vantaEffect.current.destroy()
    }
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
    <div
      ref={vantaRef}
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(14,165,233,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Login Card */}
      <div
        className={`relative w-full max-w-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ zIndex: 1 }}
      >
        {/* Glow ring behind card */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(14,165,233,0.12) 0%, transparent 70%)',
            transform: 'scale(1.2)',
            filter: 'blur(20px)',
          }}
        />

        <div
          className="relative rounded-3xl overflow-hidden animate-scale-in"
          style={{
            background: 'rgba(14, 20, 30, 0.85)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(14, 165, 233, 0.18)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(14,165,233,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Top gradient strip */}
          <div
            style={{
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #0EA5E9 40%, #38BDF8 70%, transparent)',
            }}
          />

          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            {/* Logo Icon */}
            <div className="inline-flex items-center justify-center mb-6 animate-float">
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%)',
                  boxShadow: '0 8px 32px rgba(14,165,233,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <ShieldCheck className="w-8 h-8 text-white" strokeWidth={1.75} />
                {/* Corner sparkle */}
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #FCD34D)', boxShadow: '0 2px 8px rgba(245,158,11,0.5)' }}
                >
                  <Sparkles className="w-2.5 h-2.5 text-yellow-900" />
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
              <span className="gradient-text">NeuroBareza</span>
            </h1>
            <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {setupMode ? 'Configuración Inicial' : 'Portal Administrativo'}
            </p>

            {/* Divider with dot */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px" style={{ background: 'var(--border-primary)' }} />
              <Lock className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
              <div className="flex-1 h-px" style={{ background: 'var(--border-primary)' }} />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            {/* Error alert */}
            {error && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm animate-fade-in"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="neo-label">Usuario</label>
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

            {/* Password */}
            <div>
              <label className="neo-label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neo-input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="neo-btn-primary w-full py-3 mt-2 gap-2 font-semibold text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  {setupMode ? 'Crear Superadmin' : 'Iniciar Sesión'}
                </>
              )}
            </button>

            {/* Setup toggle */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setSetupMode(!setupMode); setError('') }}
                className="text-xs transition-colors inline-flex items-center gap-1.5"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <Sparkles className="w-3 h-3" />
                {setupMode ? 'Ya tengo cuenta → Iniciar sesión' : '¿Primera vez? → Crear superadmin'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] mt-5 font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>
          NeuroBareza © {new Date().getFullYear()} · Sistema de Gestión Empresarial
        </p>
      </div>
    </div>
  )
}
