import { useState, useEffect, useCallback } from 'react'
import {
  Network, Plus, Pencil, Trash2, Search, Filter, Check, X,
  Building2, AtSign, MonitorDot, AlertCircle, RefreshCw, ChevronDown, Eye, EyeOff
} from 'lucide-react'
import { getEmpresas, getConexiones, createConexion, updateConexion, deleteConexion } from '../api'

// ─────────────────────────────────────────────────────────────
// CATÁLOGO DE EPS/ARL — Agregar aquí cada nuevo bot
// ─────────────────────────────────────────────────────────────
const EPS_CATALOG = [
  {
    id: 'sura_eps',
    nombre: 'EPS SURA',
    categoria: 'EPS',
    medio: 'portal',
    color: '#3B82F6',
    colorDim: 'rgba(59,130,246,0.12)',
    estado: 'activo',
    campos: [
      { key: 'usuario',    label: 'Número de documento',  tipo: 'text',     placeholder: '900123456',  requerido: true },
      { key: 'tipo_doc',   label: 'Tipo de documento',    tipo: 'select',   opciones: ['NIT','CEDULA'], requerido: true },
      { key: 'clave',      label: 'Clave del portal',     tipo: 'password', placeholder: '••••••',     requerido: true },
    ],
  },
  {
    id: 'famisanar',
    nombre: 'Famisanar',
    categoria: 'EPS',
    medio: 'email',
    color: '#10B981',
    colorDim: 'rgba(16,185,129,0.12)',
    estado: 'activo',
    campos: [
      { key: 'correo_destino', label: 'Correo destino Famisanar', tipo: 'email', placeholder: 'radicacion@famisanar.com', requerido: true },
    ],
  },
  {
    id: 'compensar',
    nombre: 'Compensar',
    categoria: 'EPS',
    medio: 'portal',
    color: '#F59E0B',
    colorDim: 'rgba(245,158,11,0.12)',
    estado: 'proximo',
    campos: [
      { key: 'usuario', label: 'Usuario portal', tipo: 'text',     placeholder: 'usuario',    requerido: true },
      { key: 'clave',   label: 'Contraseña',     tipo: 'password', placeholder: '••••••',     requerido: true },
    ],
  },
  {
    id: 'nueva_eps',
    nombre: 'Nueva EPS',
    categoria: 'EPS',
    medio: 'portal',
    color: '#8B5CF6',
    colorDim: 'rgba(139,92,246,0.12)',
    estado: 'proximo',
    campos: [],
  },
  {
    id: 'arl_sura',
    nombre: 'ARL SURA',
    categoria: 'ARL',
    medio: 'portal',
    color: '#06B6D4',
    colorDim: 'rgba(6,182,212,0.12)',
    estado: 'proximo',
    campos: [
      { key: 'usuario', label: 'Usuario portal ARL', tipo: 'text',     placeholder: 'usuario', requerido: true },
      { key: 'clave',   label: 'Contraseña',         tipo: 'password', placeholder: '••••••', requerido: true },
    ],
  },
]

const MEDIO_CONFIG = {
  portal: { label: 'Portal Web', icon: MonitorDot, color: '#60A5FA', bg: 'rgba(59,130,246,0.1)' },
  email:  { label: 'Email',      icon: AtSign,     color: '#34D399', bg: 'rgba(16,185,129,0.1)' },
}

const ESTADO_CONFIG = {
  activo:  { label: 'Disponible', color: '#10B981', bg: 'rgba(16,185,129,0.08)', dot: '#10B981' },
  proximo: { label: 'Próximamente', color: '#6B7280', bg: 'rgba(107,114,128,0.08)', dot: '#6B7280' },
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getEPS(id) {
  return EPS_CATALOG.find(e => e.id === id) || null
}

function maskClave(val) {
  if (!val) return '••••••'
  return '•'.repeat(Math.min(val.length, 8))
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function ConnectionDirectory() {
  const [empresas, setEmpresas]         = useState([])
  const [conexiones, setConexiones]     = useState({})
  const [empresaActiva, setEmpresaActiva] = useState(null)
  const [loadingEmpresas, setLoadingEmpresas] = useState(true)
  const [loadingConex, setLoadingConex] = useState(false)
  const [search, setSearch]             = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [editando, setEditando]         = useState(null)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todos')

  // ── Cargar empresas desde la DB ──────────────────────────
  const cargarEmpresas = useCallback(async () => {
    try {
      setLoadingEmpresas(true)
      const data = await getEmpresas()
      setEmpresas(data.empresas || [])
      if (data.empresas?.[0]) {
        setEmpresaActiva(data.empresas[0].id)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingEmpresas(false)
    }
  }, [])

  // ── Cargar conexiones de una empresa ─────────────────────
  const cargarConexiones = useCallback(async (empresaId) => {
    if (!empresaId) return
    try {
      setLoadingConex(true)
      const data = await getConexiones(empresaId)
      setConexiones(prev => ({
        ...prev,
        [empresaId]: data.conexiones || []
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingConex(false)
    }
  }, [])

  useEffect(() => { cargarEmpresas() }, [cargarEmpresas])
  useEffect(() => { if (empresaActiva) cargarConexiones(empresaActiva) }, [empresaActiva, cargarConexiones])

  // ── Eliminar ─────────────────────────────────────────────
  const handleDelete = async (conexionId, nombreEPS) => {
    if (!confirm(`¿Eliminar conexión con ${nombreEPS}?`)) return
    try {
      await deleteConexion(conexionId)
      setSuccess(`Conexión con ${nombreEPS} eliminada`)
      cargarConexiones(empresaActiva)
    } catch (err) {
      setError(err.message)
    }
  }

  // ── Filtros ──────────────────────────────────────────────
  const empresasFiltradas = empresas.filter(e => {
    const txt = e.nombre.toLowerCase()
    return txt.includes(search.toLowerCase())
  })

  const empresaActual = empresas.find(e => e.id === empresaActiva)
  const conexionesActuales = (conexiones[empresaActiva] || [])

  // ── EPS disponibles (activos) para agregar ───────────────
  const epsDisponibles = EPS_CATALOG.filter(eps => eps.estado === 'activo')
  const epsYaConfiguradas = new Set((conexiones[empresaActiva] || []).map(c => c.eps_id))
  const epsParaAgregar = epsDisponibles.filter(e => !epsYaConfiguradas.has(e.id))

  // ── Stats ────────────────────────────────────────────────
  const totalConexiones = Object.values(conexiones).flat().length
  const empresasConConexion = Object.entries(conexiones).filter(([, v]) => v.length > 0).length

  return (
    <div className="space-y-6">
      {/* ════════════ HEADER ════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Network className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Directorio de Conexiones</h1>
              <p className="text-sm text-gray-400">Gestiona conexiones EPS/ARL por empresa</p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════ GRID PRINCIPAL ════════════ */}
      <div className="grid grid-cols-3 gap-6">
        {/* ── Sidebar: Empresas ── */}
        <div className="col-span-1 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Seleccionar Empresa
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {empresasFiltradas.map(empresa => (
              <button
                key={empresa.id}
                onClick={() => setEmpresaActiva(empresa.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  empresaActiva === empresa.id
                    ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                    : 'bg-gray-900 border border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{empresa.nombre}</p>
                    <p className="text-xs text-gray-500">{empresa.razon_social || '—'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Main: Conexiones & Catálogo ── */}
        <div className="col-span-2 space-y-6">
          {/* Mensajes */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {/* Conexiones Actuales */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Conexiones Configuradas</h2>
              <span className="px-3 py-1 bg-gray-800 rounded-full text-xs font-medium text-gray-300">
                {conexionesActuales.length}
              </span>
            </div>

            {loadingConex ? (
              <div className="text-center py-8">
                <RefreshCw className="w-5 h-5 inline-block animate-spin text-gray-400" />
              </div>
            ) : conexionesActuales.length === 0 ? (
              <EmptyConexiones onAgregar={() => setShowModal(true)} />
            ) : (
              <div className="space-y-3">
                {conexionesActuales.map(conexion => (
                  <ConexionCard
                    key={conexion.id}
                    conexion={conexion}
                    onEdit={() => {
                      setEditando(conexion)
                      setShowModal(true)
                    }}
                    onDelete={() => handleDelete(conexion.id, getEPS(conexion.eps_id)?.nombre)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Catálogo de EPS Disponibles */}
          {epsParaAgregar.length > 0 && (
            <CatalogoEPS
              catalog={epsParaAgregar}
              yaConfiguradas={epsYaConfiguradas}
              onAgregar={eps => {
                setEditando({ eps_id: eps.id })
                setShowModal(true)
              }}
            />
          )}

          {/* Stats Footer */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Total Conexiones</p>
              <p className="text-2xl font-bold text-blue-400">{totalConexiones}</p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Empresas en Cartera</p>
              <p className="text-2xl font-bold text-green-400">{empresas.length}</p>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Con Conexión</p>
              <p className="text-2xl font-bold text-amber-400">{empresasConConexion}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════ MODAL ════════════ */}
      {showModal && (
        <ConexionModal
          conexion={editando}
          empresaId={empresaActiva}
          empresaNombre={empresaActual?.nombre}
          onClose={() => {
            setShowModal(false)
            setEditando(null)
            setError('')
            setSuccess('')
          }}
          onSaved={() => {
            cargarConexiones(empresaActiva)
            setShowModal(false)
            setEditando(null)
            setSuccess('Conexión guardada exitosamente')
          }}
          onError={err => setError(err.message)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TARJETA DE CONEXIÓN
// ─────────────────────────────────────────────────────────────
function ConexionCard({ conexion, onEdit, onDelete }) {
  const eps = getEPS(conexion.eps_id)
  if (!eps) return null

  const medioConfig = MEDIO_CONFIG[eps.medio]
  const MedioIcon = medioConfig.icon

  return (
    <div
      className="p-4 rounded-lg border-l-4 transition-all hover:shadow-lg"
      style={{
        borderLeftColor: eps.color,
        backgroundColor: eps.colorDim,
        borderColor: eps.colorDim
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-white">{eps.nombre}</h3>
            <span
              className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
              style={{ backgroundColor: medioConfig.bg, color: medioConfig.color }}
            >
              <MedioIcon className="w-3 h-3" />
              {medioConfig.label}
            </span>
          </div>
          <div className="space-y-1">
            {eps.campos.map(campo => {
              const valor = conexion.credenciales?.[campo.key]
              return (
                <p key={campo.key} className="text-xs text-gray-300">
                  <span className="text-gray-500">{campo.label}:</span> {
                    campo.tipo === 'password' ? maskClave(valor) : (valor || '—')
                  }
                </p>
              )
            })}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-2">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4 text-blue-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CATÁLOGO DE EPS DISPONIBLES
// ─────────────────────────────────────────────────────────────
function CatalogoEPS({ catalog, yaConfiguradas, onAgregar }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Agregar Nueva Conexión</h3>
      <div className="grid grid-cols-2 gap-3">
        {catalog.map(eps => {
          const estado = ESTADO_CONFIG[eps.estado]
          const YaConfigurada = yaConfiguradas.has(eps.id)

          return (
            <button
              key={eps.id}
              onClick={() => !YaConfigurada && onAgregar(eps)}
              disabled={YaConfigurada}
              className="p-4 rounded-lg border-2 transition-all text-left"
              style={{
                borderColor: eps.color,
                backgroundColor: eps.colorDim,
                opacity: YaConfigurada ? 0.5 : 1,
                cursor: YaConfigurada ? 'default' : 'pointer',
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-white">{eps.nombre}</p>
                  <p className="text-xs text-gray-400 mt-1">{eps.categoria}</p>
                </div>
                <div
                  className="w-2 h-2 rounded-full mt-1"
                  style={{ backgroundColor: estado.dot }}
                />
              </div>
              <p className="text-xs mt-3" style={{ color: estado.color }}>
                {estado.label}
              </p>
              {YaConfigurada && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Configurada
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ESTADO VACÍO
// ─────────────────────────────────────────────────────────────
function EmptyConexiones({ onAgregar }) {
  return (
    <div className="p-8 rounded-lg border-2 border-dashed border-gray-700 text-center">
      <Network className="w-12 h-12 mx-auto text-gray-600 mb-3" />
      <p className="text-gray-400 mb-4">No hay conexiones configuradas</p>
      <button
        onClick={onAgregar}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Agregar Conexión
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MODAL CREAR / EDITAR CONEXIÓN
// ─────────────────────────────────────────────────────────────
function ConexionModal({ conexion, empresaId, empresaNombre, onClose, onSaved, onError }) {
  const [datos, setDatos] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({})

  const epsId = conexion?.eps_id
  const eps = getEPS(epsId)
  if (!eps) return null

  const esEdicion = !!conexion?.id
  const credencialesActuales = conexion?.credenciales || {}

  const handleChange = (key, value) => {
    setDatos(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      if (esEdicion) {
        await updateConexion(conexion.id, { credenciales: datos })
      } else {
        await createConexion({
          empresa_id: empresaId,
          eps_id: epsId,
          credenciales: datos
        })
      }
      onSaved()
    } catch (err) {
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  const camposRequeridos = eps.campos.filter(c => c.requerido)
  const estaCompleto = camposRequeridos.every(c => datos[c.key])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-950 rounded-lg border border-gray-800 max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold">{esEdicion ? 'Editar' : 'Configurar'} {eps.nombre}</h2>
            <p className="text-sm text-gray-400 mt-1">{empresaNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {eps.campos.map(campo => (
            <div key={campo.key}>
              <label className="text-sm font-medium text-gray-300 block mb-2">
                {campo.label}
                {campo.requerido && <span className="text-red-400 ml-1">*</span>}
              </label>
              {campo.tipo === 'select' ? (
                <select
                  value={datos[campo.key] || ''}
                  onChange={e => handleChange(campo.key, e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm"
                >
                  <option value="">Seleccionar...</option>
                  {campo.opciones.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    type={
                      campo.tipo === 'password'
                        ? showPasswords[campo.key]
                          ? 'text'
                          : 'password'
                        : campo.tipo
                    }
                    placeholder={campo.placeholder}
                    value={datos[campo.key] || credencialesActuales[campo.key] || ''}
                    onChange={e => handleChange(campo.key, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm pr-10"
                  />
                  {campo.tipo === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [campo.key]: !prev[campo.key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                    >
                      {showPasswords[campo.key] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-800 bg-gray-900/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!estaCompleto || loading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
