import { useState, useEffect, useCallback } from 'react'
import {
  Bot, Plus, Pencil, Trash2, X, Check, AlertCircle, Loader, RefreshCw, ChevronDown,
  Eye, EyeOff, Save, Info, Settings
} from 'lucide-react'
import { getEmpresas, getBotsDisponibles, getBotsEmpresa, createBotEmpresa, updateBotEmpresa, deleteBotEmpresa } from '../api'

// ─────────────────────────────────────────────────────────────
// CATÁLOGO DE BOTS CONOCIDOS - Con campos específicos
// ─────────────────────────────────────────────────────────────
const BOTS_CATÁLOGO = {
  sura_eps: {
    nombre: 'EPS SURA',
    categoria: 'EPS',
    medio: 'portal',
    color: '#3B82F6',
    descripcion: 'Plataforma de radicación SURA',
    campos: [
      { key: 'usuario', label: 'Número de documento', tipo: 'text', placeholder: '900123456', requerido: true },
      { key: 'tipo_doc', label: 'Tipo de documento', tipo: 'select', opciones: ['NIT', 'CEDULA', 'PASAPORTE'], requerido: true },
      { key: 'clave', label: 'Clave del portal', tipo: 'password', placeholder: '••••••', requerido: true },
    ],
  },
  famisanar: {
    nombre: 'Famisanar',
    categoria: 'EPS',
    medio: 'email',
    color: '#10B981',
    descripcion: 'Radicación por email a Famisanar',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'radicacion@famisanar.com', requerido: true },
    ],
  },
  compensar: {
    nombre: 'Compensar',
    categoria: 'EPS',
    medio: 'portal',
    color: '#F59E0B',
    descripcion: 'Portal de Compensar',
    campos: [
      { key: 'usuario', label: 'Usuario', tipo: 'text', requerido: true },
      { key: 'clave', label: 'Contraseña', tipo: 'password', requerido: true },
    ],
  },
  nueva_eps: {
    nombre: 'Nueva EPS',
    categoria: 'EPS',
    medio: 'portal',
    color: '#8B5CF6',
    descripcion: 'Plataforma Nueva EPS',
    campos: [
      { key: 'usuario', label: 'Usuario', tipo: 'text', requerido: true },
      { key: 'clave', label: 'Contraseña', tipo: 'password', requerido: true },
    ],
  },
  arl_sura: {
    nombre: 'ARL SURA',
    categoria: 'ARL',
    medio: 'portal',
    color: '#06B6D4',
    descripcion: 'ARL - Sura',
    campos: [
      { key: 'usuario', label: 'Usuario portal', tipo: 'text', requerido: true },
      { key: 'clave', label: 'Contraseña', tipo: 'password', requerido: true },
    ],
  },
}

export default function BotConfiguration() {
  const [empresas, setEmpresas] = useState([])
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null)
  const [bots, setBots] = useState([])
  const [botsDisponibles, setBotsDisponibles] = useState([])
  
  const [cargando, setCargando] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [mostrando, setMostrando] = useState({})
  
  const [formulario, setFormulario] = useState({
    bot_nombre: '',
    bot_tipo_medio: 'portal',
    estado: 'configuracion',
    credenciales: {},
    observaciones: '',
  })
  
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState(null)

  // Cargar empresas al iniciar
  useEffect(() => {
    cargarEmpresas()
    cargarBotsDisponibles()
  }, [])

  // Cargar bots cuando se selecciona empresa
  useEffect(() => {
    if (empresaSeleccionada) {
      cargarBots()
    } else {
      setBots([])
    }
  }, [empresaSeleccionada])

  const cargarEmpresas = async () => {
    try {
      const data = await getEmpresas()
      setEmpresas(data.empresas || [])
      if (data.empresas?.length > 0 && !empresaSeleccionada) {
        setEmpresaSeleccionada(data.empresas[0].nombre)
      }
    } catch (err) {
      mostrarMensaje(`Error: ${err.message}`, 'error')
    }
  }

  const cargarBotsDisponibles = async () => {
    try {
      const data = await getBotsDisponibles()
      setBotsDisponibles(data.bots || [])
    } catch (err) {
      console.error('Error cargando bots disponibles:', err)
    }
  }

  const cargarBots = async () => {
    if (!empresaSeleccionada) return
    
    setCargando(true)
    try {
      const data = await getBotsEmpresa(empresaSeleccionada)
      setBots(data.bots || [])
    } catch (err) {
      mostrarMensaje(`Error: ${err.message}`, 'error')
      setBots([])
    } finally {
      setCargando(false)
    }
  }

  const abrirModal = (bot = null) => {
    if (bot) {
      setEditando(bot.id)
      setFormulario({
        bot_nombre: bot.bot_nombre,
        bot_tipo_medio: bot.bot_tipo_medio,
        estado: bot.estado,
        credenciales: bot.credenciales_guardadas ? { ...bot.credenciales } : {},
        observaciones: bot.observaciones || '',
      })
    } else {
      setEditando(null)
      setFormulario({
        bot_nombre: '',
        bot_tipo_medio: 'portal',
        estado: 'configuracion',
        credenciales: {},
        observaciones: '',
      })
    }
    setErrores({})
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
    setFormulario({
      bot_nombre: '',
      bot_tipo_medio: 'portal',
      estado: 'configuracion',
      credenciales: {},
      observaciones: '',
    })
  }

  const guardarBot = async () => {
    if (!formulario.bot_nombre) {
      setErrores({ bot_nombre: 'Selecciona un bot' })
      return
    }

    // Validar que tenga credenciales si es activo
    if (formulario.estado === 'activo' && Object.keys(formulario.credenciales).length === 0) {
      setErrores({ credenciales: 'Agrega credenciales para activar el bot' })
      return
    }

    setCargando(true)
    try {
      if (editando) {
        // Actualizar
        await updateBotEmpresa(empresaSeleccionada, formulario.bot_nombre, {
          estado: formulario.estado,
          credenciales: formulario.credenciales,
          observaciones: formulario.observaciones,
        })
        mostrarMensaje(`Bot '${formulario.bot_nombre}' actualizado`, 'success')
      } else {
        // Crear
        await createBotEmpresa(empresaSeleccionada, formulario)
        mostrarMensaje(`Bot '${formulario.bot_nombre}' asignado a '${empresaSeleccionada}'`, 'success')
      }
      cerrarModal()
      cargarBots()
    } catch (err) {
      mostrarMensaje(`Error: ${err.message}`, 'error')
    } finally {
      setCargando(false)
    }
  }

  const eliminarBot = async (botNombre) => {
    if (!window.confirm(`¿Eliminar bot '${botNombre}' de '${empresaSeleccionada}'?`)) return

    setCargando(true)
    try {
      await deleteBotEmpresa(empresaSeleccionada, botNombre)
      mostrarMensaje(`Bot '${botNombre}' removido`, 'success')
      cargarBots()
    } catch (err) {
      mostrarMensaje(`Error: ${err.message}`, 'error')
    } finally {
      setCargando(false)
    }
  }

  const actualizarCredencial = (key, value) => {
    setFormulario(prev => ({
      ...prev,
      credenciales: {
        ...prev.credenciales,
        [key]: value,
      },
    }))
  }

  const mostrarMensaje = (texto, tipo = 'info') => {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje(null), 4000)
  }

  const obtenerCampos = (botNombre) => {
    return BOTS_CATÁLOGO[botNombre]?.campos || []
  }

  const obtenerInfoBot = (botNombre) => {
    return BOTS_CATÁLOGO[botNombre] || { nombre: botNombre, color: '#6B7280' }
  }

  const botsNoAsignados = botsDisponibles.filter(
    b => !bots.find(eb => eb.bot_nombre === b.id)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">Configuración de Bots</h1>
        </div>
        <p className="text-slate-600">Asigna y gestiona bots de radicación por empresa</p>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          mensaje.tipo === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {mensaje.tipo === 'success' ? <Check className="w-5 h-5" /> :
           mensaje.tipo === 'error' ? <AlertCircle className="w-5 h-5" /> :
           <Info className="w-5 h-5" />}
          {mensaje.texto}
        </div>
      )}

      {/* Selector de empresa */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Selecciona una empresa</label>
        <div className="relative">
          <select
            value={empresaSeleccionada || ''}
            onChange={(e) => setEmpresaSeleccionada(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Selecciona una empresa --</option>
            {empresas.map(e => (
              <option key={e.id} value={e.nombre}>{e.nombre}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Contenido principal */}
      {empresaSeleccionada && (
        <div className="space-y-6">
          {/* Botón agregar */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Bots asignados: {bots.length}</h2>
            {botsNoAsignados.length > 0 && (
              <button
                onClick={() => abrirModal()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                <Plus className="w-5 h-5" />
                Asignar Bot
              </button>
            )}
          </div>

          {/* Lista de bots */}
          {cargando ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : bots.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border border-slate-200">
              <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No hay bots asignados a esta empresa</p>
              {botsNoAsignados.length > 0 && (
                <button
                  onClick={() => abrirModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Asignar primer bot
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {bots.map(bot => {
                const info = obtenerInfoBot(bot.bot_nombre)
                return (
                  <div key={bot.id} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: info.color || '#6B7280' }}
                        >
                          {info.nombre?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{info.nombre || bot.bot_nombre}</h3>
                          <p className="text-sm text-slate-600">
                            {info.categoria} • {bot.bot_tipo_medio}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModal(bot)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => eliminarBot(bot.bot_nombre)}
                          className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        bot.estado === 'activo' ? 'bg-green-100 text-green-800' :
                        bot.estado === 'configuracion' ? 'bg-yellow-100 text-yellow-800' :
                        bot.estado === 'suspendido' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {bot.estado}
                      </span>
                    </div>

                    {/* Credenciales guardadas */}
                    {bot.credenciales_guardadas && (
                      <div className="text-sm text-green-700 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Credenciales configuradas
                      </div>
                    )}

                    {bot.observaciones && (
                      <p className="text-sm text-slate-600 mt-2">
                        <span className="font-semibold">Notas:</span> {bot.observaciones}
                      </p>
                    )}

                    {bot.actualizado_en && (
                      <p className="text-xs text-slate-500 mt-2">
                        Actualizado: {new Date(bot.actualizado_en).toLocaleDateString()}
                        {bot.actualizado_por && ` por ${bot.actualizado_por}`}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal agregar/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editando ? 'Editar Bot' : 'Asignar Nuevo Bot'} - {empresaSeleccionada}
              </h2>
              <button onClick={cerrarModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Seleccionar bot */}
              {!editando && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Bot</label>
                  <select
                    value={formulario.bot_nombre}
                    onChange={(e) => {
                      const botName = e.target.value
                      const botInfo = BOTS_CATÁLOGO[botName] || {}
                      setFormulario(prev => ({
                        ...prev,
                        bot_nombre: botName,
                        bot_tipo_medio: botInfo.medio || 'portal',
                        credenciales: {},
                      }))
                      setErrores({})
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">-- Selecciona un bot --</option>
                    {botsNoAsignados.map(bot => (
                      <option key={bot.id} value={bot.id}>
                        {BOTS_CATÁLOGO[bot.id]?.nombre || bot.nombre} • {bot.categoria}
                      </option>
                    ))}
                  </select>
                  {errores.bot_nombre && <p className="text-red-600 text-sm mt-1">{errores.bot_nombre}</p>}
                </div>
              )}

              {/* Mostrar campos de credenciales según el bot seleccionado */}
              {formulario.bot_nombre && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Credenciales</label>
                  <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                    {obtenerCampos(formulario.bot_nombre).map(campo => (
                      <div key={campo.key}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {campo.label}
                          {campo.requerido && <span className="text-red-600">*</span>}
                        </label>
                        {campo.tipo === 'select' ? (
                          <select
                            value={formulario.credenciales[campo.key] || ''}
                            onChange={(e) => actualizarCredencial(campo.key, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          >
                            <option value="">-- Selecciona --</option>
                            {campo.opciones.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={campo.tipo}
                            placeholder={campo.placeholder}
                            value={formulario.credenciales[campo.key] || ''}
                            onChange={(e) => actualizarCredencial(campo.key, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {errores.credenciales && <p className="text-red-600 text-sm mt-1">{errores.credenciales}</p>}
                </div>
              )}

              {/* Estado */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Estado</label>
                <select
                  value={formulario.estado}
                  onChange={(e) => setFormulario(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="configuracion">En configuración</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Observaciones (opcional)</label>
                <textarea
                  value={formulario.observaciones}
                  onChange={(e) => setFormulario(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  rows={3}
                  placeholder="Notas sobre esta configuración..."
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <button
                  onClick={cerrarModal}
                  disabled={cargando}
                  className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarBot}
                  disabled={cargando}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {cargando && <Loader className="w-4 h-4 animate-spin" />}
                  {editando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
