import { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, Pencil, Trash2, Search, Check, X,
  ShieldCheck, Building2, RefreshCw, AlertCircle, Eye, EyeOff,
  UserCircle, Key, ToggleLeft, ToggleRight
} from 'lucide-react'
import { getUsers, createUser, updateUser, deleteUser, getEmpresas, getStoredUser } from '../api'

const ROLES = [
  { value: 'superadmin', label: 'Super Admin',    color: 'text-red-400',    bg: 'rgba(239,68,68,0.1)',     desc: 'Acceso total al sistema' },
  { value: 'admin',      label: 'Administrador',  color: 'text-blue-400',   bg: 'rgba(59,130,246,0.1)',    desc: 'Gestión completa excepto superadmin' },
  { value: 'th',         label: 'Talento Humano', color: 'text-emerald-400',bg: 'rgba(16,185,129,0.1)',   desc: 'Solo tabla TH y reportes TH' },
  { value: 'sst',        label: 'SST',            color: 'text-green-400',  bg: 'rgba(34,197,94,0.1)',    desc: 'Solo Power BI y reportes SST' },
  { value: 'nomina',     label: 'Nómina',         color: 'text-amber-400',  bg: 'rgba(245,158,11,0.1)',   desc: 'Solo reportes de nómina' },
  { value: 'viewer',     label: 'Visualizador',   color: 'text-slate-400',  bg: 'rgba(148,163,184,0.1)',  desc: 'Solo lectura' },
]

const PERMISOS_DISPONIBLES = [
  { key: 'validador',     label: 'Validador',        desc: 'Acceso al validador de incapacidades' },
  { key: 'reportes',      label: 'Reportes',         desc: 'Dashboard de reportes y estadísticas' },
  { key: 'exportaciones', label: 'Exportaciones',    desc: 'Exportaciones masivas PDF' },
  { key: 'powerbi',       label: 'Power BI',         desc: 'Dashboard Power BI embebido' },
  { key: 'directorio',    label: 'Dir. Correos',     desc: 'Gestión de directorio de correos' },
  { key: 'consola',       label: 'Consola Sistema',  desc: 'Monitoreo y logs del sistema' },
]

// Permisos específicos del portal de incapacidades (tenant_permisos)
const TENANT_PERMISOS = [
  { key: 'tabla_viva',    label: 'Tabla Viva',                desc: 'Vista en tiempo real de incapacidades activas' },
  { key: 'reportes',      label: 'Reportes y Estadísticas',   desc: 'Dashboards y gráficas de gestión' },
  { key: 'powerbi',       label: 'Power BI',                  desc: 'Dashboard Power BI embebido' },
  { key: 'exportaciones', label: 'Exportaciones masivas',     desc: 'Descargar datos en Excel / PDF' },
  { key: 'plano',         label: 'Plano de Incapacidades',    desc: 'Vista plano / calendar de incapacidades' },
  { key: 'pendientes',    label: 'Pendientes de Envío',       desc: 'Casos pendientes de radicación ante EPS' },
]

function RoleBadge({ rol }) {
  const cfg = ROLES.find(r => r.value === rol) || ROLES[5]
  return (
    <span
      className={`neo-badge ${cfg.color}`}
      style={{ background: cfg.bg }}
    >
      {cfg.label}
    </span>
  )
}

export default function UsersPermissions() {
  const currentUser = getStoredUser()
  const isTenantAdmin = !!currentUser?.es_tenant_admin
  const myCompanyId = currentUser?.company_id

  const [users, setUsers] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [uData, eData] = await Promise.all([getUsers(), getEmpresas()])
      setUsers(uData.users || [])
      setEmpresas(eData.empresas || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = users.filter(u => {
    // Tenant admin: solo ve usuarios de su empresa
    if (isTenantAdmin && u.company_id !== myCompanyId) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.username?.toLowerCase().includes(q) ||
      u.nombre?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.rol?.toLowerCase().includes(q)
    )
  })

  const handleDelete = async (id, username) => {
    if (!confirm(`¿Eliminar usuario "${username}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteUser(id)
      setSuccess(`Usuario "${username}" eliminado`)
      load()
    } catch (err) { setError(err.message) }
    setTimeout(() => setSuccess(''), 3000)
  }

  // Stats
  const totalActive = users.filter(u => u.activo).length
  const byRole = ROLES.map(r => ({ ...r, count: users.filter(u => u.rol === r.value).length }))

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--accent-primary-soft)' }}>
              <Users className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            Usuarios y Permisos
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Control de acceso al portal de incapacidades</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true) }} className="neo-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm animate-fade-in" style={{ background: 'var(--error-soft)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm animate-fade-in" style={{ background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Widgets row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-stagger">
        <div className="stat-widget">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>Total usuarios</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{users.length}</p>
        </div>
        <div className="stat-widget" style={{ ['--stat-color']: 'var(--success)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>Activos</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>{totalActive}</p>
        </div>
        {byRole.filter(r => r.count > 0).slice(0, 2).map(r => (
          <div key={r.value} className="stat-widget">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{r.label}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{r.count}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="neo-card p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} className="neo-input pl-9" placeholder="Buscar por usuario, nombre o email..." />
          </div>
          <button onClick={load} className="neo-btn-outline flex items-center gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Recargar
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando usuarios...
        </div>
      ) : (
        <div className="neo-card overflow-hidden">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Empresa</th>
                <th>Permisos</th>
                <th>Estado</th>
                <th>Último login</th>
                <th className="w-24 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px]" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
                        {(u.nombre || u.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{u.nombre || u.username}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{u.email || '—'}</td>
                  <td><RoleBadge rol={u.rol} /></td>
                  <td className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {u.empresa ? (
                      <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> {u.empresa}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Todas</span>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {u.permisos && Object.entries(u.permisos).filter(([,v]) => v).map(([k]) => (
                        <span key={k} className="neo-badge text-[10px]" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>{k}</span>
                      ))}
                      {(!u.permisos || Object.values(u.permisos).filter(v=>v).length === 0) && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="neo-badge" style={u.activo ? { background: 'var(--success-soft)', color: 'var(--success)' } : { background: 'rgba(15,23,42,0.05)', color: 'var(--text-muted)' }}>
                      <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block" style={{ background: u.activo ? 'var(--success)' : 'var(--text-muted)' }} />
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {u.ultimo_login ? new Date(u.ultimo_login).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                  </td>
                  <td className="text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => { setEditing(u); setShowModal(true) }} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-primary-soft)';e.currentTarget.style.color='var(--accent-primary)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-muted)'}}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.username)} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }} onMouseEnter={e=>{e.currentTarget.style.background='var(--error-soft)';e.currentTarget.style.color='var(--error)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-muted)'}}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      )}

      {/* Roles reference */}
      <div className="neo-card p-5">
        <h4 className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-1.5" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          <Key className="w-3.5 h-3.5" /> Referencia de Roles
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {ROLES.map(r => (
            <div key={r.value} className="flex items-start gap-2 p-2.5 rounded-xl transition-colors" style={{ border: '1px solid transparent' }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(15,23,42,0.03)';e.currentTarget.style.borderColor='var(--border-primary)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='transparent'}}>
              <RoleBadge rol={r.value} />
              <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editing}
          empresas={empresas}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={(msg) => { setSuccess(msg); load(); setTimeout(() => setSuccess(''), 3000) }}
          onError={setError}
        />
      )}
    </div>
  )
}


function UserModal({ user, empresas, onClose, onSaved, onError }) {
  const isEdit = !!user
  const isTenantAdmin = !!user?.es_tenant_admin

  const [form, setForm] = useState({
    username:        user?.username        || '',
    nombre:          user?.nombre          || '',
    email:           user?.email           || '',
    rol:             user?.rol             || 'viewer',
    company_id:      user?.company_id      || '',
    permisos:        user?.permisos        || {},
    tenant_permisos: user?.tenant_permisos || {},
    activo:          user?.activo          ?? true,
    password: '',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)

  const togglePermiso = (key) => {
    setForm(f => ({ ...f, permisos: { ...f.permisos, [key]: !f.permisos[key] } }))
  }

  const toggleTenantPermiso = (key) => {
    setForm(f => ({ ...f, tenant_permisos: { ...f.tenant_permisos, [key]: !f.tenant_permisos[key] } }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.username || (!isEdit && !form.password)) return
    setSaving(true)
    try {
      if (isEdit) {
        const payload = {
          nombre:          form.nombre,
          email:           form.email,
          rol:             form.rol,
          company_id:      form.company_id ? parseInt(form.company_id) : 0,
          permisos:        form.permisos,
          tenant_permisos: form.tenant_permisos,
          activo:          form.activo,
        }
        if (form.password) payload.password = form.password
        await updateUser(user.id, payload)
        onSaved(`Usuario "${form.username}" actualizado`)
      } else {
        await createUser({
          username:        form.username,
          password:        form.password,
          nombre:          form.nombre,
          email:           form.email,
          rol:             form.rol,
          company_id:      form.company_id ? parseInt(form.company_id) : null,
          permisos:        form.permisos,
          tenant_permisos: form.tenant_permisos,
        })
        onSaved(`Usuario "${form.username}" creado`)
      }
      onClose()
    } catch (err) {
      onError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div
        className="relative rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-scale-in"
        style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div
          style={{ height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent-primary) 40%, var(--info) 70%, transparent)' }}
        />
        <div className="sticky top-0 px-6 py-4 flex items-center justify-between z-10"
          style={{ background: 'var(--bg-card-solid)', borderBottom: '1px solid var(--border-primary)' }}
        >
          <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--accent-primary-soft)' }}>
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(15,23,42,0.05)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Basic */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="neo-label">Username</label>
              <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="neo-input" placeholder="usuario" disabled={isEdit} required />
            </div>
            <div>
              <label className="neo-label">{isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="neo-input pr-9"
                  placeholder={isEdit ? 'Dejar vacío para no cambiar' : '••••••'}
                  required={!isEdit}
                  minLength={isEdit ? 0 : 6}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--text-muted)' }}>
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="neo-label">Nombre completo</label>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="neo-input" placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="neo-label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="neo-input" placeholder="correo@empresa.com" />
            </div>
          </div>

          {/* Role & Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="neo-label">Rol</label>
              <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} className="neo-select" disabled={isTenantAdmin}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="neo-label">Empresa</label>
              {isTenantAdmin ? (
                /* Para tenant admins, empresa fija — no editable */
                <div className="neo-input flex items-center gap-2 opacity-60 cursor-not-allowed" style={{ color: 'var(--text-tertiary)' }}>
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs truncate">
                    {empresas.find(e => e.id === parseInt(form.company_id))?.nombre || `Empresa #${form.company_id}`}
                  </span>
                </div>
              ) : (
                <select value={form.company_id} onChange={e => setForm({...form, company_id: e.target.value})} className="neo-select">
                  <option value="">Todas</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="neo-label mb-2">Permisos del Portal Admin</label>
            <div className="grid grid-cols-2 gap-2">
              {PERMISOS_DISPONIBLES.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePermiso(p.key)}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-left text-xs transition-all"
                  style={form.permisos[p.key] ? {
                    border: '1px solid rgba(59,130,246,0.4)',
                    background: 'var(--accent-primary-soft)',
                    color: '#60A5FA'
                  } : {
                    border: '1px solid var(--border-input)',
                    background: 'transparent',
                    color: 'var(--text-muted)'
                  }}
                >
                  {form.permisos[p.key] ? (
                    <ToggleRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                  ) : (
                    <ToggleLeft className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  )}
                  <div>
                    <p className="font-semibold" style={{ color: form.permisos[p.key] ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{p.label}</p>
                    <p className="text-[10px] opacity-60">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tenant portal permissions — visible siempre para mostrar qué puede ver en el portal */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="neo-label mb-0">Permisos del Portal de Incapacidades</label>
              <span className="neo-badge text-[10px]" style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>
                Portal Empresa
              </span>
            </div>
            <p className="text-[11px] mb-2.5" style={{ color: 'var(--text-muted)' }}>
              Módulos visibles en el portal de gestión de incapacidades de la empresa.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TENANT_PERMISOS.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => toggleTenantPermiso(p.key)}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-left text-xs transition-all"
                  style={form.tenant_permisos[p.key] ? {
                    border: '1px solid rgba(99,102,241,0.4)',
                    background: 'rgba(99,102,241,0.08)',
                    color: '#818CF8'
                  } : {
                    border: '1px solid var(--border-input)',
                    background: 'transparent',
                    color: 'var(--text-muted)'
                  }}
                >
                  {form.tenant_permisos[p.key] ? (
                    <ToggleRight className="w-4 h-4 flex-shrink-0" style={{ color: '#818CF8' }} />
                  ) : (
                    <ToggleLeft className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  )}
                  <div>
                    <p className="font-semibold" style={{ color: form.tenant_permisos[p.key] ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{p.label}</p>
                    <p className="text-[10px] opacity-60">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          {isEdit && (
            <div className="flex items-center gap-3 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.activo} onChange={e => setForm({...form, activo: e.target.checked})} className="sr-only peer" />
                <div className="w-9 h-5 rounded-full peer peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
              </label>
              <span className="text-sm" style={{ color: form.activo ? 'var(--success)' : 'var(--text-muted)' }}>{form.activo ? 'Usuario activo' : 'Usuario inactivo'}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="neo-btn-outline flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="neo-btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? 'Guardar' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
