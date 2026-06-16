import { useState, useEffect } from 'react'
import {
  Bot, Check, AlertCircle, Globe, Mail,
  ChevronDown, Eye, EyeOff, Save, Lock, Building2, Layers, Loader
} from 'lucide-react'
import { getEmpresas, getBotsEmpresa, createBotEmpresa, updateBotEmpresa } from '../api'

// ─────────────────────────────────────────────────────────────
// CATÁLOGO COMPLETO DE EPS / ARL
// ─────────────────────────────────────────────────────────────
const CATALOGO = {
  sura_eps: {
    nombre: 'EPS SURA', sigla: 'S', categoria: 'EPS', medio: 'portal', color: '#0EA5E9',
    logo: 'https://consultorsalud.com/wp-content/uploads/2023/12/0YRIVE5L7RBVBC3PQRL5T4BABY.jpg',
    descripcion: 'Plataforma de radicación SURA',
    campos: [
      { key: 'usuario',  label: 'Número de documento', tipo: 'text',     placeholder: '900123456', requerido: true },
      { key: 'tipo_doc', label: 'Tipo de documento',   tipo: 'select',   opciones: ['NIT','CEDULA','PASAPORTE'], requerido: true },
      { key: 'clave',    label: 'Clave del portal',    tipo: 'password', placeholder: '••••••••',  requerido: true },
    ],
  },
  sanitas: {
    nombre: 'EPS Sanitas', sigla: 'Sa', categoria: 'EPS', medio: 'portal', color: '#E11D48',
    logo: 'https://www.epssanitas.com/usuarios/documents/9441058/1054837201/EPS+Color+Horizontal.png/bfca0039-cfdd-4827-9ee8-a472eb5e2178?version=1.0&t=1754690845794&imagePreview=1',
    descripcion: 'Portal EPS Sanitas',
    campos: [
      { key: 'usuario', label: 'Usuario',    tipo: 'text',     placeholder: 'usuario',   requerido: true },
      { key: 'clave',   label: 'Contraseña', tipo: 'password', placeholder: '••••••••',  requerido: true },
    ],
  },
  salud_total: {
    nombre: 'Salud Total', sigla: 'ST', categoria: 'EPS', medio: 'email', color: '#6366F1',
    logo: 'https://infolocal.comfenalcoantioquia.com/media/com_jbusinessdirectory/pictures/companies/891/salud-total_1760556578.jpeg',
    descripcion: 'Radicación por correo a Salud Total',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'incapacidades@saludtotal.com', requerido: true },
    ],
  },
  famisanar: {
    nombre: 'Famisanar', sigla: 'F', categoria: 'EPS', medio: 'email', color: '#10B981',
    logo: 'https://cloudfront-us-east-1.images.arcpublishing.com/prisaradioco/EBBRB27NE5I3HCI335GMKGYXKA.jpg',
    descripcion: 'Radicación por correo a Famisanar',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'radicacion@famisanar.com', requerido: true },
    ],
  },
  compensar: {
    nombre: 'Compensar', sigla: 'Co', categoria: 'EPS', medio: 'portal', color: '#F59E0B',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwth7eASCnSPK5X-NAjrTCm7STiqojHM7qgg&s',
    descripcion: 'Portal de Compensar EPS',
    campos: [
      { key: 'usuario', label: 'Usuario',    tipo: 'text',     placeholder: 'empresa_user', requerido: true },
      { key: 'clave',   label: 'Contraseña', tipo: 'password', placeholder: '••••••••',     requerido: true },
    ],
  },
  colsanitas: {
    nombre: 'Colsanitas', sigla: 'CS', categoria: 'EPS', medio: 'portal', color: '#EC4899',
    logo: null,
    descripcion: 'Portal Colsanitas',
    campos: [
      { key: 'usuario', label: 'Usuario',    tipo: 'text',     placeholder: 'usuario',   requerido: true },
      { key: 'clave',   label: 'Contraseña', tipo: 'password', placeholder: '••••••••', requerido: true },
    ],
  },
  nueva_eps: {
    nombre: 'Nueva EPS', sigla: 'NE', categoria: 'EPS', medio: 'portal', color: '#8B5CF6',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Logo_nueva_eps.png/960px-Logo_nueva_eps.png',
    descripcion: 'Plataforma Nueva EPS',
    campos: [
      { key: 'usuario', label: 'Usuario',    tipo: 'text',     placeholder: 'usuario',  requerido: true },
      { key: 'clave',   label: 'Contraseña', tipo: 'password', placeholder: '••••••••', requerido: true },
    ],
  },
  medimas: {
    nombre: 'Medimás', sigla: 'M', categoria: 'EPS', medio: 'portal', color: '#14B8A6',
    logo: null,
    descripcion: 'Portal Medimás EPS',
    campos: [
      { key: 'usuario', label: 'Usuario',    tipo: 'text',     placeholder: 'usuario',   requerido: true },
      { key: 'clave',   label: 'Contraseña', tipo: 'password', placeholder: '••••••••', requerido: true },
    ],
  },
  coosalud: {
    nombre: 'Coosalud', sigla: 'Cs', categoria: 'EPS', medio: 'email', color: '#F97316',
    logo: null,
    descripcion: 'Radicación por correo a Coosalud',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'radicaciones@coosalud.com', requerido: true },
    ],
  },
  aliansalud: {
    nombre: 'Aliansalud', sigla: 'Al', categoria: 'EPS', medio: 'email', color: '#84CC16',
    logo: null,
    descripcion: 'Radicación por correo a Aliansalud',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'incapacidades@aliansalud.com.co', requerido: true },
    ],
  },
  cruz_blanca: {
    nombre: 'Cruz Blanca / Emssanar', sigla: 'CB', categoria: 'EPS', medio: 'email', color: '#EF4444',
    logo: null,
    descripcion: 'Radicación por correo',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'radicacion@cruzblanca.com.co', requerido: true },
    ],
  },
  mutual_ser: {
    nombre: 'Mutual Ser', sigla: 'MS', categoria: 'EPS', medio: 'email', color: '#A855F7',
    logo: null,
    descripcion: 'Radicación por correo a Mutual Ser',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'incapacidades@mutualser.com.co', requerido: true },
    ],
  },
  cafe_salud: {
    nombre: 'Café Salud', sigla: 'CaS', categoria: 'EPS', medio: 'email', color: '#92400E',
    logo: null,
    descripcion: 'Radicación por correo a Café Salud',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'incapacidades@cafesalud.com.co', requerido: true },
    ],
  },
  coomeva: {
    nombre: 'Coomeva EPS', sigla: 'Cm', categoria: 'EPS', medio: 'portal', color: '#059669',
    logo: null,
    descripcion: 'Portal Coomeva EPS',
    campos: [
      { key: 'usuario', label: 'Usuario',    tipo: 'text',     placeholder: 'usuario',   requerido: true },
      { key: 'clave',   label: 'Contraseña', tipo: 'password', placeholder: '••••••••', requerido: true },
    ],
  },
  // ── ARL ──────────────────────────────────────────────────────
  arl_sura: {
    nombre: 'ARL SURA', sigla: 'AS', categoria: 'ARL', medio: 'portal', color: '#06B6D4',
    logo: 'https://yt3.googleusercontent.com/vYWl0DFC1XUBhEQmT9HAsF08j1W90lX4SnNQzccOXASoe3e9aHVhKoszjjF9Pio3xK3kTyQXTw=s900-c-k-c0x00ffffff-no-rj',
    descripcion: 'Riesgos laborales — Sura',
    campos: [
      { key: 'usuario', label: 'Usuario portal', tipo: 'text',     placeholder: 'usuario',  requerido: true },
      { key: 'clave',   label: 'Contraseña',     tipo: 'password', placeholder: '••••••••', requerido: true },
    ],
  },
  positiva: {
    nombre: 'ARL Positiva', sigla: 'P', categoria: 'ARL', medio: 'portal', color: '#22C55E',
    logo: 'https://www.greatplacetowork.com.co/images/CompaniesCertification/Fotos/Positiva/Positiva_Logo.jpg',
    descripcion: 'Positiva Compañía de Seguros',
    campos: [
      { key: 'usuario', label: 'Usuario',    tipo: 'text',     placeholder: 'usuario',  requerido: true },
      { key: 'clave',   label: 'Contraseña', tipo: 'password', placeholder: '••••••••', requerido: true },
    ],
  },
  colmena: {
    nombre: 'Colmena Seguros ARL', sigla: 'Cl', categoria: 'ARL', medio: 'portal', color: '#F59E0B',
    logo: null,
    descripcion: 'Portal Colmena Seguros',
    campos: [
      { key: 'usuario', label: 'Usuario',    tipo: 'text',     placeholder: 'usuario',   requerido: true },
      { key: 'clave',   label: 'Contraseña', tipo: 'password', placeholder: '••••••••', requerido: true },
    ],
  },
  liberty: {
    nombre: 'Liberty Seguros ARL', sigla: 'Li', categoria: 'ARL', medio: 'email', color: '#10B981',
    logo: null,
    descripcion: 'Radicación por correo Liberty',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'arl@libertyseguros.com.co', requerido: true },
    ],
  },
  bolivar: {
    nombre: 'Seguros Bolívar ARL', sigla: 'B', categoria: 'ARL', medio: 'email', color: '#EF4444',
    logo: null,
    descripcion: 'Radicación por correo Bolívar',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'arl@segurosbolivar.com', requerido: true },
    ],
  },
  mapfre: {
    nombre: 'Mapfre ARL', sigla: 'Mp', categoria: 'ARL', medio: 'email', color: '#DC2626',
    logo: null,
    descripcion: 'Radicación por correo Mapfre',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'arl@mapfre.com.co', requerido: true },
    ],
  },
  equidad: {
    nombre: 'La Equidad Seguros ARL', sigla: 'Eq', categoria: 'ARL', medio: 'email', color: '#7C3AED',
    logo: null,
    descripcion: 'Radicación por correo La Equidad',
    campos: [
      { key: 'correo_destino', label: 'Correo destino', tipo: 'email', placeholder: 'arl@laequidad.com.co', requerido: true },
    ],
  },
  axa_colpatria: {
    nombre: 'AXA Colpatria ARL', sigla: 'AX', categoria: 'ARL', medio: 'portal', color: '#1D4ED8',
    logo: null,
    descripcion: 'Portal AXA Colpatria',
    campos: [
      { key: 'usuario', label: 'Usuario',    tipo: 'text',     placeholder: 'usuario',   requerido: true },
      { key: 'clave',   label: 'Contraseña', tipo: 'password', placeholder: '••••••••', requerido: true },
    ],
  },
}

const ESTADOS = {
  activo:          { label: 'Activo',           dot: '#10B981', bg: 'rgba(16,185,129,0.10)',  color: '#34D399' },
  configuracion:   { label: 'En configuración', dot: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  color: '#FBBF24' },
  inactivo:        { label: 'Inactivo',         dot: '#4A5568', bg: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)' },
  suspendido:      { label: 'Suspendido',       dot: '#EF4444', bg: 'rgba(239,68,68,0.10)',   color: '#F87171' },
  sin_configurar:  { label: 'Sin configurar',   dot: '#374151', bg: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' },
}

const EMPRESA_COLORS = ['#0EA5E9','#10B981','#F59E0B','#8B5CF6','#06B6D4','#E11D48','#22C55E','#F97316']

function shade(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, (n >> 16) - 40)
  const g = Math.max(0, ((n >> 8) & 255) - 40)
  const b = Math.max(0, (n & 255) - 40)
  return `rgb(${r},${g},${b})`
}

function EpsLogo({ cat, dot }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
      {cat.logo && !err ? (
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <img src={cat.logo} alt={cat.nombre} onError={() => setErr(true)} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
        </div>
      ) : (
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `linear-gradient(135deg, ${cat.color}, ${shade(cat.color)})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13, color: '#fff',
        }}>
          {cat.sigla}
        </div>
      )}
      <span style={{
        position: 'absolute', bottom: -1, right: -1,
        width: 13, height: 13, borderRadius: '50%',
        background: dot, border: '2.5px solid #12121A',
      }} />
    </div>
  )
}

function EpsRow({ catKey, cat, apiBot, open, onToggle, onSave }) {
  const estadoKey = apiBot?.estado || 'sin_configurar'
  const est = ESTADOS[estadoKey] || ESTADOS.sin_configurar
  const [medio, setMedio] = useState(apiBot?.bot_tipo_medio || cat.medio || 'portal')
  const [cred, setCred] = useState({ ...(apiBot?.credenciales || {}) })
  const [show, setShow] = useState({})
  const [guardando, setGuardando] = useState(false)

  // Sync when apiBot changes (company switch)
  useEffect(() => {
    setMedio(apiBot?.bot_tipo_medio || cat.medio || 'portal')
    setCred({ ...(apiBot?.credenciales || {}) })
    setShow({})
  }, [apiBot, catKey])

  const campos = cat.campos || []

  const handleSave = async () => {
    setGuardando(true)
    await onSave(catKey, { estado: apiBot?.estado || 'configuracion', credenciales: cred, bot_tipo_medio: medio }, !!apiBot)
    setGuardando(false)
  }

  return (
    <div style={{
      borderRadius: 13, background: 'var(--bg-card-solid)',
      border: `1px solid ${open ? 'rgba(14,165,233,0.35)' : 'var(--border-primary)'}`,
      boxShadow: open ? '0 8px 28px rgba(0,0,0,0.4)' : 'none',
      transition: 'all .2s', overflow: 'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '10px 16px', cursor: 'pointer' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <EpsLogo cat={cat} dot={est.dot} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
            {cat.nombre}
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', letterSpacing: '0.06em', flexShrink: 0 }}>
              {cat.categoria}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {cat.descripcion}
          </div>
        </div>

        {/* Badge medio */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, flexShrink: 0,
          background: medio === 'email' ? 'rgba(16,185,129,0.10)' : 'rgba(99,102,241,0.10)',
          color: medio === 'email' ? '#34D399' : '#818CF8',
        }}>
          {medio === 'email' ? <Mail size={12} /> : <Globe size={12} />}
          {medio === 'email' ? 'Email' : 'Portal'}
        </span>

        {/* Status chip */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999, flexShrink: 0,
          background: est.bg, color: est.color,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: est.dot }} />
          {est.label}
        </span>

        <ChevronDown size={17} style={{
          color: open ? '#38BDF8' : 'var(--text-muted)',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform .25s', flexShrink: 0,
        }} />
      </div>

      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border-primary)' }}>
          {/* Toggle medio */}
          <div style={{ paddingTop: 18 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 7 }}>
              Medio de radicación
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['portal', 'email'].map(m => (
                <button key={m} onClick={() => setMedio(m)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: 11, borderRadius: 12, fontSize: 13, fontWeight: 600, transition: 'all .2s', cursor: 'pointer',
                  color: medio === m ? '#38BDF8' : 'var(--text-tertiary)',
                  background: medio === m ? 'rgba(14,165,233,0.12)' : 'var(--bg-input)',
                  border: `1px solid ${medio === m ? 'rgba(14,165,233,0.3)' : 'var(--border-input)'}`,
                }}>
                  {m === 'portal' ? <Globe size={15} /> : <Mail size={15} />}
                  {m === 'portal' ? 'Portal web' : 'Correo'}
                </button>
              ))}
            </div>
          </div>

          {/* Campos credenciales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: campos.length === 1 ? '1fr' : '1fr 1fr',
            gap: 16, paddingTop: 18,
          }}>
            {campos.map(c => (
              <div key={c.key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 7 }}>
                  {c.label}{c.requerido && <span style={{ color: '#F87171', marginLeft: 2 }}>*</span>}
                </label>
                {c.tipo === 'select' ? (
                  <select
                    value={cred[c.key] || ''}
                    onChange={e => setCred({ ...cred, [c.key]: e.target.value })}
                    style={{ width: '100%', padding: '11px 13px', borderRadius: 12, fontSize: 13.5, color: 'var(--text-primary)', background: 'var(--bg-input)', border: '1px solid var(--border-input)', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="">— Selecciona —</option>
                    {c.opciones.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : c.tipo === 'password' ? (
                  <div style={{ position: 'relative' }}>
                    <input
                      type={show[c.key] ? 'text' : 'password'}
                      placeholder={c.placeholder}
                      value={cred[c.key] || ''}
                      onChange={e => setCred({ ...cred, [c.key]: e.target.value })}
                      style={{ width: '100%', padding: '11px 40px 11px 13px', borderRadius: 12, fontSize: 13.5, color: 'var(--text-primary)', background: 'var(--bg-input)', border: '1px solid var(--border-input)', outline: 'none' }}
                    />
                    <button
                      onClick={() => setShow({ ...show, [c.key]: !show[c.key] })}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      {show[c.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                ) : (
                  <input
                    type={c.tipo}
                    placeholder={c.placeholder}
                    value={cred[c.key] || ''}
                    onChange={e => setCred({ ...cred, [c.key]: e.target.value })}
                    style={{ width: '100%', padding: '11px 13px', borderRadius: 12, fontSize: 13.5, color: 'var(--text-primary)', background: 'var(--bg-input)', border: '1px solid var(--border-input)', outline: 'none' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Lock size={13} /> Credenciales cifradas — solo visibles para administradores
            </span>
            <button
              onClick={handleSave}
              disabled={guardando}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 17px', borderRadius: 11, fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #0EA5E9, #0284C7)', boxShadow: '0 2px 12px rgba(14,165,233,0.35)', border: 'none', cursor: 'pointer', transition: 'all .2s', opacity: guardando ? 0.6 : 1 }}
            >
              {guardando ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
              Guardar credenciales
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BotConfiguration() {
  const [empresas, setEmpresas] = useState([])
  const [selId, setSelId] = useState(null)
  const [apiBotsMap, setApiBotsMap] = useState({})
  const [cargando, setCargando] = useState(false)
  const [openBot, setOpenBot] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { cargarEmpresas() }, [])

  useEffect(() => {
    if (selId) cargarBots()
    else setApiBotsMap({})
  }, [selId])

  const cargarEmpresas = async () => {
    try {
      const data = await getEmpresas()
      const lista = data.empresas || []
      setEmpresas(lista)
      if (lista.length > 0) setSelId(lista[0].id ?? lista[0].nombre)
    } catch (err) { showToast(`Error: ${err.message}`, 'error') }
  }

  const cargarBots = async () => {
    const emp = empresas.find(e => (e.id ?? e.nombre) === selId)
    if (!emp) return
    setCargando(true)
    try {
      const data = await getBotsEmpresa(emp.nombre)
      const map = {}
      for (const b of (data.bots || [])) map[b.bot_nombre] = b
      setApiBotsMap(map)
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
      setApiBotsMap({})
    } finally { setCargando(false) }
  }

  const handleSave = async (botKey, payload, exists) => {
    const emp = empresas.find(e => (e.id ?? e.nombre) === selId)
    try {
      if (exists) {
        await updateBotEmpresa(emp.nombre, botKey, payload)
      } else {
        await createBotEmpresa(emp.nombre, { bot_nombre: botKey, ...payload })
      }
      showToast(`Credenciales de ${CATALOGO[botKey]?.nombre || botKey} guardadas`)
      setOpenBot(null)
      cargarBots()
    } catch (err) { showToast(`Error: ${err.message}`, 'error') }
  }

  const showToast = (msg, tipo = 'success') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3200)
  }

  const empActual = empresas.find(e => (e.id ?? e.nombre) === selId)
  const configurados = Object.keys(apiBotsMap).length
  const activos = Object.values(apiBotsMap).filter(b => b.estado === 'activo').length

  // Separate EPS and ARL entries from catalog for grouped display
  const epsEntries = Object.entries(CATALOGO).filter(([, c]) => c.categoria === 'EPS')
  const arlEntries = Object.entries(CATALOGO).filter(([, c]) => c.categoria === 'ARL')

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 40px 64px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)', color: '#38BDF8' }}>
          <Bot size={24} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Configuración de Bots
        </h2>
      </div>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginBottom: 28 }}>
        Asigna y gestiona los bots de radicación EPS / ARL de cada empresa.
      </p>

      {/* Rail de empresas */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={13} /> Empresas · selecciona para ver sus bots
        </div>
        <div style={{ display: 'flex', gap: 22, overflowX: 'auto', padding: '4px 2px 14px' }}>
          {empresas.map((e, i) => {
            const color = e.color || EMPRESA_COLORS[i % EMPRESA_COLORS.length]
            const sigla = (e.sigla || e.nombre.split(' ').map(w => w[0]).join('').slice(0, 2)).toUpperCase()
            const isSel = (e.id ?? e.nombre) === selId
            return (
              <button key={e.id ?? e.nombre}
                onClick={() => { setSelId(e.id ?? e.nombre); setOpenBot(null) }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0, width: 76, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div style={{
                  width: 68, height: 68, borderRadius: '50%', padding: 3, transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                  background: isSel ? 'linear-gradient(135deg, #38BDF8, #0EA5E9, #7DD3FC)' : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                  boxShadow: isSel ? '0 4px 20px rgba(14,165,233,0.45)' : 'none',
                  transform: isSel ? 'translateY(-2px)' : 'none',
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: '#fff', background: `linear-gradient(135deg, ${color}, ${shade(color)})`, border: '3px solid var(--bg-primary)' }}>
                    {sigla}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isSel ? 'var(--text-primary)' : 'var(--text-tertiary)', display: 'block', lineHeight: 1.2 }}>
                    {e.nombre.split(' ')[0]}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Profile header empresa */}
      {empActual && (
        <div className="animate-fade-in" key={selId} style={{
          display: 'flex', alignItems: 'center', gap: 22, padding: '24px 26px', borderRadius: 20,
          background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', marginBottom: 22, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--accent-primary), transparent)', opacity: 0.6 }} />
          {(() => {
            const i = empresas.findIndex(e => (e.id ?? e.nombre) === selId)
            const color = empActual.color || EMPRESA_COLORS[i % EMPRESA_COLORS.length]
            const sigla = (empActual.sigla || empActual.nombre.split(' ').map(w => w[0]).join('').slice(0, 2)).toUpperCase()
            return (
              <div style={{ width: 84, height: 84, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 30, color: '#fff', background: `linear-gradient(135deg, ${color}, ${shade(color)})`, boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}>
                {sigla}
              </div>
            )
          })()}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {empActual.nombre}
            </h3>
            <div style={{ display: 'flex', gap: 18, marginTop: 6, flexWrap: 'wrap' }}>
              {empActual.sector && (
                <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={13} /> {empActual.sector}
                </span>
              )}
              {empActual.nit && (
                <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  NIT {empActual.nit}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>{configurados}</div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginTop: 6 }}>Bots</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: '#34D399' }}>{activos}</div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginTop: 6 }}>Activos</div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de bots */}
      {empActual && (
        <>
          {cargando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Loader size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            </div>
          ) : (
            <div className="animate-fade-in" key={selId}>
              {/* Sección EPS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '26px 2px 14px', color: 'var(--text-primary)' }}>
                <Layers size={16} />
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>EPS</h4>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: 'rgba(14,165,233,0.15)', color: '#38BDF8' }}>
                  {epsEntries.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {epsEntries.map(([key, cat]) => (
                  <EpsRow
                    key={key}
                    catKey={key}
                    cat={cat}
                    apiBot={apiBotsMap[key] || null}
                    open={openBot === key}
                    onToggle={() => setOpenBot(openBot === key ? null : key)}
                    onSave={handleSave}
                  />
                ))}
              </div>

              {/* Sección ARL */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '32px 2px 14px', color: 'var(--text-primary)' }}>
                <Layers size={16} />
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>ARL</h4>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: 'rgba(14,165,233,0.15)', color: '#38BDF8' }}>
                  {arlEntries.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {arlEntries.map(([key, cat]) => (
                  <EpsRow
                    key={key}
                    catKey={key}
                    cat={cat}
                    apiBot={apiBotsMap[key] || null}
                    open={openBot === key}
                    onToggle={() => setOpenBot(openBot === key ? null : key)}
                    onSave={handleSave}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderRadius: 14,
          fontSize: 13.5, fontWeight: 600,
          background: 'var(--bg-card-elevated)', border: '1px solid var(--border-primary)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          color: toast.tipo === 'error' ? '#F87171' : '#34D399',
        }}>
          {toast.tipo === 'error' ? <AlertCircle size={17} /> : <Check size={17} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
