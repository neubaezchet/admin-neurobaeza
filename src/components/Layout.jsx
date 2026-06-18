import { NavLink, useNavigate } from 'react-router-dom'
import { Mail, Users, Monitor, LogOut, ShieldCheck, ChevronRight, Cpu, Bot, Settings, Building2, LayoutList, Activity } from 'lucide-react'
import { logout } from '../api'

const NAV_FULL = [
  { to: '/bots',                   icon: Bot,         label: 'Configuración de Bots',   desc: 'Bots de radicación' },
  { to: '/radicacion/campos',      icon: LayoutList,  label: 'Campos EPS / ARL',        desc: 'Manifests y OCR' },
  { to: '/radicacion/monitoreo',   icon: Activity,    label: 'Estado de Radicación',    desc: 'Sesiones en vivo' },
  { to: '/correos',                icon: Mail,        label: 'Directorio de Correos',   desc: 'Gestión de contactos' },
  { to: '/usuarios',               icon: Users,       label: 'Usuarios y Permisos',     desc: 'Control de acceso' },
  { to: '/consola',                icon: Monitor,     label: 'Consola del Sistema',     desc: 'Logs y monitoreo' },
]

export default function Layout({ user, children }) {
  const navigate = useNavigate()

  // Si es tenant admin solo ve sus módulos; company_id para rutas dinámicas
  const isTenantAdmin = !!user?.es_tenant_admin
  const NAV = isTenantAdmin
    ? [
        { to: '/usuarios',                             icon: Users,    label: 'Usuarios de mi empresa', desc: 'Gestión de acceso' },
        { to: `/tenants/${user?.company_id}/config`,   icon: Settings, label: 'Mi configuración',       desc: 'Portal y empresa' },
      ]
    : NAV_FULL

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = (user?.nombre || user?.username || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>

      {/* ════════════ SIDEBAR ════════════ */}
      <aside
        className="w-[240px] flex flex-col relative"
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-primary)',
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 120% 60% at 50% -20%, rgba(14,165,233,0.06) 0%, transparent 60%)',
          }}
        />

        {/* ── Marca / Logo ── */}
        <div
          className="relative px-5 py-5"
          style={{ borderBottom: '1px solid var(--border-primary)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                boxShadow: '0 4px 12px rgba(14,165,233,0.35)',
              }}
            >
              <ShieldCheck className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-tight tracking-tight gradient-text">
                NeuroBareza
              </h1>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {isTenantAdmin ? 'Portal Empresa' : 'Admin Portal'}
              </p>
            </div>
          </div>
          {/* Badge tenant admin */}
          {isTenantAdmin && (
            <div className="flex items-center gap-1.5 mt-3 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
              <Building2 className="w-3 h-3 flex-shrink-0" style={{ color: '#38BDF8' }} />
              <span className="text-[10px] font-semibold truncate" style={{ color: '#38BDF8' }}>
                {user?.nombre || user?.username}
              </span>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="relative flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[9px] font-bold uppercase tracking-widest px-2 mb-3" style={{ color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
            {isTenantAdmin ? 'Mi empresa' : 'Módulos'}
          </p>
          {NAV.map(({ to, icon: Icon, label, desc }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                 transition-all duration-200 relative
                 ${isActive ? 'active' : ''}`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'rgba(14,165,233,0.1)' : 'transparent',
                color: isActive ? '#38BDF8' : 'var(--text-tertiary)',
                border: isActive ? '1px solid rgba(14,165,233,0.25)' : '1px solid transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{
                      background: isActive ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="leading-tight truncate">{label}</p>
                    <p className="text-[10px] truncate mt-0.5 opacity-60">{desc}</p>
                  </div>
                  <ChevronRight
                    className="w-3.5 h-3.5 opacity-0 -translate-x-1 flex-shrink-0 transition-all duration-200
                               group-hover:opacity-40 group-hover:translate-x-0"
                  />
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: '#0EA5E9', boxShadow: '0 0 8px rgba(14,165,233,0.6)' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Separator ── */}
        <div className="mx-4" style={{ borderTop: '1px solid var(--border-primary)' }} />

        {/* ── User card ── */}
        <div className="relative p-3">
          <div
            className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-primary)' }}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(14,165,233,0.25), rgba(14,165,233,0.25))',
                color: '#38BDF8',
                border: '1px solid rgba(14,165,233,0.2)',
              }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.nombre || user?.username}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>
                  {user?.rol || 'admin'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg transition-all duration-200 flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FCA5A5'
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.background = 'transparent'
              }}
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── System indicator ── */}
        <div className="relative px-4 pb-4">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)' }}
          >
            <Cpu className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            <span className="text-[10px] font-medium" style={{ color: 'rgba(16,185,129,0.8)' }}>
              Sistema operativo
            </span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* ════════════ MAIN CONTENT ════════════ */}
      <main className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
