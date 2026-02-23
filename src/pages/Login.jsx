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
        highlightColor: 0x3d82a7,
        midtoneColor: 0xffffff,
        lowlightColor: 0xffffff,
        baseColor: 0xe3aeae,
        blurFactor: 0.90,
        speed: 2.50,
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
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-fluent-16 border border-surface-border/30 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-fluent-500 rounded-2xl mb-5 shadow-fluent-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Admin Incapacidades</h1>
            <p className="text-sm text-gray-400 mt-1">Panel de Control</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-fluent text-sm text-red-600 animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="fluent-input"
                placeholder="admin"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="fluent-input pr-10"
                  placeholder="••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="fluent-btn-primary w-full py-2.5 flex items-center justify-center gap-2"
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
                className="text-xs text-gray-400 hover:text-fluent-500 transition-colors inline-flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                {setupMode ? 'Ya tengo cuenta → Iniciar sesión' : '¿Primera vez? → Crear superadmin'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-300 mt-6">
          Sistema de Gestión de Incapacidades © 2026
        </p>
      </div>
    </div>
  )
}
