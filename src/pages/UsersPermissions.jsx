import { useState, useEffect, useCallback } from 'react'
import {
  Users, Plus, Pencil, Trash2, Search, Check, X,
  Shield, Building2, RefreshCw, AlertCircle, Eye, EyeOff,
  UserCircle, Key, ToggleLeft, ToggleRight
} from 'lucide-react'
import { getUsers, createUser, updateUser, deleteUser, getEmpresas } from '../api'

const ROLES = [
  { value: 'superadmin', label: 'Super Admin',    color: 'bg-red-50 text-red-700',    desc: 'Acceso total al sistema' },
  { value: 'admin',      label: 'Administrador',  color: 'bg-blue-50 text-blue-700',  desc: 'Gestión completa excepto superadmin' },
  { value: 'th',         label: 'Talento Humano', color: 'bg-emerald-50 text-emerald-700', desc: 'Solo tabla TH y reportes TH' },
  { value: 'sst',        label: 'SST',            color: 'bg-green-50 text-green-700', desc: 'Solo Power BI y reportes SST' },
  { value: 'nomina',     label: 'Nómina',         color: 'bg-amber-50 text-amber-700', desc: 'Solo reportes de nómina' },
  { value: 'viewer',     label: 'Visualizador',   color: 'bg-gray-100 text-gray-600',  desc: 'Solo lectura' },
]

const PERMISOS_DISPONIBLES = [
  { key: 'validador',  label: 'Validador',      desc: 'Acceso al validador de incapacidades' },
  { key: 'reportes',   label: 'Reportes',       desc: 'Dashboard de reportes y estadísticas' },
  { key: 'powerbi',    label: 'Power BI',       desc: 'Dashboard Power BI embebido' },
  { key: 'directorio', label: 'Dir. Correos',   desc: 'Gestión de directorio de correos' },
  { key: 'consola',    label: 'Consola Sistema', desc: 'Monitoreo y logs del sistema' },
]

function RoleBadge({ rol }) {
  const cfg = ROLES.find(r => r.value === rol) || ROLES[5]
  return <span className={`fluent-badge ${cfg.color}`}>{cfg.label}</span>
}

export default function UsersPermissions() {
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
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-fluent-500" />
            Usuarios y Permisos
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Control de acceso al portal de incapacidades</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true) }} className="fluent-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-fluent text-sm text-red-600 animate-fade-in">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-fluent text-sm text-green-700 animate-fade-in">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Widgets row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="fluent-card p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total usuarios</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="fluent-card p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Activos</p>
          <p className="text-2xl font-bold text-green-600">{totalActive}</p>
        </div>
        {byRole.filter(r => r.count > 0).slice(0, 2).map(r => (
          <div key={r.value} className="fluent-card p-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{r.label}</p>
            <p className="text-2xl font-bold text-gray-900">{r.count}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="fluent-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="fluent-input pl-9" placeholder="Buscar por usuario, nombre o email..." />
          </div>
          <button onClick={load} className="fluent-btn-ghost flex items-center gap-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Recargar
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando usuarios...
        </div>
      ) : (
        <div className="fluent-card overflow-hidden">
          <table className="fluent-table">
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
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-fluent-500/10 flex items-center justify-center text-fluent-500 font-bold text-[10px]">
                        {(u.nombre || u.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-xs">{u.nombre || u.username}</p>
                        <p className="text-[10px] text-gray-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600 text-xs">{u.email || '—'}</td>
                  <td><RoleBadge rol={u.rol} /></td>
                  <td className="text-xs text-gray-500">
                    {u.empresa ? (
                      <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> {u.empresa}</span>
                    ) : (
                      <span className="text-gray-300">Todas</span>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {u.permisos && Object.entries(u.permisos).filter(([,v]) => v).map(([k]) => (
                        <span key={k} className="fluent-badge bg-fluent-50 text-fluent-600 text-[10px]">{k}</span>
                      ))}
                      {(!u.permisos || Object.values(u.permisos).filter(v=>v).length === 0) && (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`fluent-badge ${u.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-xs text-gray-400">
                    {u.ultimo_login ? new Date(u.ultimo_login).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                  </td>
                  <td className="text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => { setEditing(u); setShowModal(true) }} className="p-1.5 rounded hover:bg-fluent-50 text-gray-400 hover:text-fluent-500 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.username)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium">No se encontraron usuarios</p>
            </div>
          )}
        </div>
      )}

      {/* Roles reference */}
      <div className="fluent-card p-5">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5" /> Referencia de Roles
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {ROLES.map(r => (
            <div key={r.value} className="flex items-start gap-2 p-2 rounded-fluent hover:bg-surface-hover transition-colors">
              <RoleBadge rol={r.value} />
              <span className="text-xs text-gray-400 mt-0.5">{r.desc}</span>
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
  const [form, setForm] = useState({
    username: user?.username || '',
    nombre: user?.nombre || '',
    email: user?.email || '',
    rol: user?.rol || 'viewer',
    company_id: user?.company_id || '',
    permisos: user?.permisos || {},
    activo: user?.activo ?? true,
    password: '',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)

  const togglePermiso = (key) => {
    setForm(f => ({ ...f, permisos: { ...f.permisos, [key]: !f.permisos[key] } }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.username || (!isEdit && !form.password)) return
    setSaving(true)
    try {
      if (isEdit) {
        const payload = {
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
          company_id: form.company_id ? parseInt(form.company_id) : 0,
          permisos: form.permisos,
          activo: form.activo,
        }
        if (form.password) payload.password = form.password
        await updateUser(user.id, payload)
        onSaved(`Usuario "${form.username}" actualizado`)
      } else {
        await createUser({
          username: form.username,
          password: form.password,
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
          company_id: form.company_id ? parseInt(form.company_id) : null,
          permisos: form.permisos,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-fluent-16 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-surface-border flex items-center justify-between z-10">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-fluent-500" />
            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Basic */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Username</label>
              <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="fluent-input" placeholder="usuario" disabled={isEdit} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                {isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="fluent-input pr-9"
                  placeholder={isEdit ? 'Dejar vacío para no cambiar' : '••••••'}
                  required={!isEdit}
                  minLength={isEdit ? 0 : 6}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400">
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Nombre completo</label>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="fluent-input" placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="fluent-input" placeholder="correo@empresa.com" />
            </div>
          </div>

          {/* Role & Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Rol</label>
              <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} className="fluent-select">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Empresa</label>
              <select value={form.company_id} onChange={e => setForm({...form, company_id: e.target.value})} className="fluent-select">
                <option value="">Todas</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Permisos del Portal</label>
            <div className="grid grid-cols-2 gap-2">
              {PERMISOS_DISPONIBLES.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePermiso(p.key)}
                  className={`flex items-center gap-2 p-2.5 rounded-fluent border text-left text-xs transition-all ${
                    form.permisos[p.key]
                      ? 'border-fluent-500 bg-fluent-50 text-fluent-700'
                      : 'border-surface-border text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {form.permisos[p.key] ? (
                    <ToggleRight className="w-4 h-4 text-fluent-500 flex-shrink-0" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{p.label}</p>
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
                <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-fluent-500/30 rounded-full peer peer-checked:bg-fluent-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
              <span className={`text-sm ${form.activo ? 'text-green-600' : 'text-gray-400'}`}>{form.activo ? 'Usuario activo' : 'Usuario inactivo'}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="fluent-btn-outline flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="fluent-btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? 'Guardar' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
