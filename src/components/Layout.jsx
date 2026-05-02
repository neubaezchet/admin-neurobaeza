import { NavLink, useNavigate } from 'react-router-dom'
import { Mail, Users, Monitor, LogOut, Shield, ChevronRight } from 'lucide-react'
import { logout } from '../api'

const NAV = [
  { to: '/correos',  icon: Mail,    label: 'Directorio de Correos' },
  { to: '/usuarios', icon: Users,   label: 'Usuarios y Permisos' },
  { to: '/consola',  icon: Monitor, label: 'Consola del Sistema' },
]

export default function Layout({ user, children }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* ══════ Sidebar ══════ */}
      <aside
        className="w-[260px] flex flex-col"
        style={{
          backgroundColor: 'var(--bg-card-solid)',
          borderRight: '1px solid var(--border-primary)',
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-ios flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
                boxShadow: '0 2px 8px rgba(99, 89, 163, 0.3)',
              }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                Admin Incapacidades
              </h1>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Panel de Control
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-ios text-[13px] font-medium transition-all duration-200 group`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--accent-primary-soft)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              })}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0 transition-all" />
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div
          className="mx-3 mb-3 p-3 rounded-ios"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
              style={{
                backgroundColor: 'var(--accent-primary-soft)',
                color: 'var(--accent-primary)',
              }}
            >
              {(user?.nombre || user?.username || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.nombre || user?.username}
              </p>
              <p className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>
                {user?.rol || 'admin'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-ios transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.backgroundColor = 'var(--error-soft)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent' }}
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════ Main content ══════ */}
      <main className="flex-1 overflow-auto">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}
