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
    <div className="flex h-screen bg-surface-secondary overflow-hidden">
      {/* ══════ Sidebar ══════ */}
      <aside className="w-[260px] bg-white border-r border-surface-border flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-fluent-500 rounded-fluent flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">NeuroBarranquilla</h1>
              <p className="text-[11px] text-gray-400 font-medium">Panel Administrativo</p>
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
                `flex items-center gap-3 px-3 py-2.5 rounded-fluent text-[13px] font-medium transition-all duration-150 group
                ${isActive
                  ? 'bg-fluent-50 text-fluent-500 shadow-sm'
                  : 'text-gray-600 hover:bg-surface-hover hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0 transition-all" />
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="mx-3 mb-3 p-3 rounded-fluent bg-surface-tertiary">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-fluent-500/10 flex items-center justify-center text-fluent-500 font-bold text-xs">
              {(user?.nombre || user?.username || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.nombre || user?.username}</p>
              <p className="text-[10px] text-gray-400 capitalize">{user?.rol || 'admin'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-fluent hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
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
