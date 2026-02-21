import { useState, useEffect, useCallback } from 'react'
import {
  Mail, Plus, Pencil, Trash2, Search, Filter, Check, X,
  Building2, Globe, ChevronDown, RefreshCw, AlertCircle, UserCircle
} from 'lucide-react'
import {
  getCorreos, createCorreo, updateCorreo, deleteCorreo,
  getEmpresas
} from '../api'

const AREAS = [
  { value: 'talento_humano',   label: 'Talento Humano',   color: 'bg-blue-500',   light: 'bg-blue-50 text-blue-700' },
  { value: 'seguridad_salud',  label: 'Seguridad y Salud',color: 'bg-green-500',  light: 'bg-green-50 text-green-700' },
  { value: 'nomina',           label: 'Nómina',           color: 'bg-amber-500',  light: 'bg-amber-50 text-amber-700' },
  { value: 'incapacidades',    label: 'Incapacidades',    color: 'bg-purple-500', light: 'bg-purple-50 text-purple-700' },
  { value: 'presunto_fraude',  label: 'Presunto Fraude',  color: 'bg-red-500',    light: 'bg-red-50 text-red-700' },
]

function AreaBadge({ area }) {
  const cfg = AREAS.find(a => a.value === area) || { label: area, light: 'bg-gray-100 text-gray-600' }
  return <span className={`fluent-badge ${cfg.light}`}>{cfg.label}</span>
}

export default function EmailDirectory() {
  const [correos, setCorreos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterArea, setFilterArea] = useState('all')
  const [filterEmpresa, setFilterEmpresa] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [cData, eData] = await Promise.all([
        getCorreos(filterArea, filterEmpresa),
        getEmpresas()
      ])
      setCorreos(cData.correos || [])
      setEmpresas(eData.empresas || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filterArea, filterEmpresa])

  useEffect(() => { load() }, [load])

  const filtered = correos.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.email?.toLowerCase().includes(q) ||
      c.nombre_contacto?.toLowerCase().includes(q) ||
      c.empresa?.toLowerCase().includes(q)
    )
  })

  const grouped = AREAS.map(a => ({
    ...a,
    correos: filtered.filter(c => c.area === a.value),
  })).filter(g => filterArea === 'all' || g.value === filterArea)

  const handleDelete = async (id, email) => {
    if (!confirm(`¿Eliminar ${email}?`)) return
    try {
      await deleteCorreo(id)
      setSuccess(`${email} eliminado`)
      load()
    } catch (err) { setError(err.message) }
    setTimeout(() => setSuccess(''), 3000)
  }

  const openEdit = (correo) => {
    setEditing(correo)
    setShowModal(true)
  }

  const openNew = () => {
    setEditing(null)
    setShowModal(true)
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-fluent-500" />
            Directorio de Correos
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Gestión de correos de notificación por área y empresa</p>
        </div>
        <button onClick={openNew} className="fluent-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo correo
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

      {/* Filters */}
      <div className="fluent-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="fluent-input pl-9"
              placeholder="Buscar por nombre, email o empresa..."
            />
          </div>
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="fluent-select w-48">
            <option value="all">Todas las áreas</option>
            {AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <select value={filterEmpresa} onChange={e => setFilterEmpresa(e.target.value)} className="fluent-select w-56">
            <option value="all">Todas las empresas</option>
            {empresas.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
          </select>
          <button onClick={load} className="fluent-btn-ghost flex items-center gap-1.5" title="Recargar">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Recargar
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {AREAS.map(a => {
          const count = correos.filter(c => c.area === a.value && c.activo).length
          return (
            <button
              key={a.value}
              onClick={() => setFilterArea(filterArea === a.value ? 'all' : a.value)}
              className={`fluent-card p-4 text-left transition-all cursor-pointer ${
                filterArea === a.value ? 'ring-2 ring-fluent-500/40 shadow-fluent-4' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${a.color}`} />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{a.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-[11px] text-gray-400">correos activos</p>
            </button>
          )
        })}
      </div>

      {/* Tables by area group */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando directorio...
        </div>
      ) : (
        grouped.map(g => (
          g.correos.length > 0 && (
            <div key={g.value} className="fluent-card overflow-hidden animate-slide-in">
              <div className="px-4 py-3 border-b border-surface-border flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${g.color}`} />
                <h3 className="text-sm font-semibold text-gray-800">{g.label}</h3>
                <span className="fluent-badge bg-gray-100 text-gray-500 ml-1">{g.correos.length}</span>
              </div>
              <table className="fluent-table">
                <thead>
                  <tr>
                    <th>Contacto</th>
                    <th>Email</th>
                    <th>Empresa</th>
                    <th>Estado</th>
                    <th className="w-24 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {g.correos.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <UserCircle className="w-5 h-5 text-gray-300" />
                          <span className="font-medium text-gray-800">{c.nombre_contacto || '—'}</span>
                        </div>
                      </td>
                      <td className="text-gray-600">{c.email}</td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          {c.company_id ? <Building2 className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          {c.empresa}
                        </span>
                      </td>
                      <td>
                        <span className={`fluent-badge ${c.activo ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-fluent-50 text-gray-400 hover:text-fluent-500 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(c.id, c.email)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ))
      )}

      {!loading && filtered.length === 0 && (
        <div className="fluent-card p-12 text-center text-gray-400">
          <Mail className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No se encontraron correos</p>
          <p className="text-sm mt-1">Ajusta los filtros o agrega un nuevo correo</p>
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <CorreoModal
          correo={editing}
          empresas={empresas}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={(msg) => { setSuccess(msg); load(); setTimeout(() => setSuccess(''), 3000) }}
          onError={setError}
        />
      )}
    </div>
  )
}


function CorreoModal({ correo, empresas, onClose, onSaved, onError }) {
  const isEdit = !!correo
  const [form, setForm] = useState({
    area: correo?.area || 'talento_humano',
    nombre_contacto: correo?.nombre_contacto || '',
    email: correo?.email || '',
    company_id: correo?.company_id || '',
    activo: correo?.activo ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.email) return
    setSaving(true)
    try {
      if (isEdit) {
        await updateCorreo(correo.id, {
          area: form.area,
          nombre_contacto: form.nombre_contacto,
          email: form.email,
          activo: form.activo,
        })
        onSaved('Correo actualizado')
      } else {
        await createCorreo({
          area: form.area,
          nombre_contacto: form.nombre_contacto,
          email: form.email,
          company_id: form.company_id || null,
        })
        onSaved('Correo creado exitosamente')
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
      <div className="bg-white rounded-2xl shadow-fluent-16 w-full max-w-md mx-4 overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{isEdit ? 'Editar Correo' : 'Nuevo Correo'}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Área</label>
            <select value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="fluent-select">
              {AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Nombre del contacto</label>
            <input value={form.nombre_contacto} onChange={e => setForm({...form, nombre_contacto: e.target.value})} className="fluent-input" placeholder="Juan Pérez" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="fluent-input" placeholder="correo@empresa.com" />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Empresa</label>
              <select value={form.company_id} onChange={e => setForm({...form, company_id: e.target.value ? parseInt(e.target.value) : ''})} className="fluent-select">
                <option value="">Global (todas las empresas)</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          )}
          {isEdit && (
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form.activo} onChange={e => setForm({...form, activo: e.target.checked})} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-fluent-500/30 rounded-full peer peer-checked:bg-fluent-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
              <span className="text-sm text-gray-600">{form.activo ? 'Activo' : 'Inactivo'}</span>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="fluent-btn-outline flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="fluent-btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
