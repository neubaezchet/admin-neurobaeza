import { useState, useEffect } from 'react'
import { LayoutList, Globe, Mail, CheckCircle, Clock, FileText, ScanLine, Pencil, Lock } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-95ed.up.railway.app'

function authHeaders() {
  const token = localStorage.getItem('admin_token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

// ─── Manifest de campos por EPS/ARL ───────────────────────
const MANIFESTS = [
  {
    key: 'compensar', nombre: 'Compensar', tipo: 'EPS', medio: 'portal', skill: 'activa',
    ocr: ['N° documento', 'Tipo doc', 'Fecha inicio', 'Días', 'Diagnóstico CIE-10', 'Tipo incapacidad'],
    manual: ['PDF adjunto'],
    cred: ['NIT empresa', 'Contraseña'],
  },
  {
    key: 'nueva_eps', nombre: 'Nueva EPS', tipo: 'EPS', medio: 'portal', skill: 'activa',
    ocr: ['N° documento', 'Tipo doc', 'Fecha inicio', 'Días', 'Diagnóstico CIE-10'],
    manual: ['PDF adjunto', 'Tipo incapacidad'],
    cred: ['Usuario', 'Contraseña'],
  },
  {
    key: 'salud_total', nombre: 'Salud Total', tipo: 'EPS', medio: 'email', skill: 'activa',
    ocr: ['N° documento', 'Nombre trabajador', 'Fecha inicio', 'Días', 'Diagnóstico CIE-10'],
    manual: ['PDF adjunto'],
    cred: ['Correo destino'],
  },
  {
    key: 'famisanar', nombre: 'Famisanar', tipo: 'EPS', medio: 'email', skill: 'activa',
    ocr: ['N° documento', 'Nombre trabajador', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto'],
    cred: ['Correo destino'],
  },
  {
    key: 'sura_eps', nombre: 'EPS SURA', tipo: 'EPS', medio: 'portal', skill: 'pendiente',
    ocr: ['N° documento', 'Tipo doc', 'Fecha inicio', 'Días', 'Diagnóstico CIE-10', 'Nombre trabajador'],
    manual: ['PDF adjunto'],
    cred: ['N° doc empresa', 'Tipo doc empresa', 'Clave'],
  },
  {
    key: 'sanitas', nombre: 'EPS Sanitas', tipo: 'EPS', medio: 'portal', skill: 'pendiente',
    ocr: ['N° documento', 'Tipo doc', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto', 'Diagnóstico CIE-10'],
    cred: ['Usuario', 'Contraseña'],
  },
  {
    key: 'medimas', nombre: 'Medimás', tipo: 'EPS', medio: 'portal', skill: 'pendiente',
    ocr: ['N° documento', 'Tipo doc', 'Fecha inicio', 'Días', 'Diagnóstico CIE-10', 'Tipo incapacidad'],
    manual: ['PDF adjunto', 'Municipio atención'],
    cred: ['Usuario', 'Contraseña'],
  },
  {
    key: 'coosalud', nombre: 'Coosalud', tipo: 'EPS', medio: 'email', skill: 'pendiente',
    ocr: ['N° documento', 'Nombre trabajador', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto'],
    cred: ['Correo destino'],
  },
  {
    key: 'colsanitas', nombre: 'Colsanitas', tipo: 'EPS', medio: 'portal', skill: 'pendiente',
    ocr: ['N° documento', 'Tipo doc', 'Fecha inicio', 'Días', 'Diagnóstico CIE-10'],
    manual: ['PDF adjunto'],
    cred: ['Usuario', 'Contraseña'],
  },
  {
    key: 'aliansalud', nombre: 'Aliansalud', tipo: 'EPS', medio: 'email', skill: 'pendiente',
    ocr: ['N° documento', 'Nombre trabajador', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto'],
    cred: ['Correo destino'],
  },
  {
    key: 'cruz_blanca', nombre: 'Cruz Blanca / Emssanar', tipo: 'EPS', medio: 'email', skill: 'pendiente',
    ocr: ['N° documento', 'Nombre trabajador', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto'],
    cred: ['Correo destino'],
  },
  {
    key: 'mutual_ser', nombre: 'Mutual Ser', tipo: 'EPS', medio: 'email', skill: 'pendiente',
    ocr: ['N° documento', 'Nombre trabajador', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto'],
    cred: ['Correo destino'],
  },
  {
    key: 'cafe_salud', nombre: 'Café Salud', tipo: 'EPS', medio: 'email', skill: 'pendiente',
    ocr: ['N° documento', 'Nombre trabajador', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto'],
    cred: ['Correo destino'],
  },
  {
    key: 'coomeva', nombre: 'Coomeva EPS', tipo: 'EPS', medio: 'portal', skill: 'pendiente',
    ocr: ['N° documento', 'Tipo doc', 'Fecha inicio', 'Días', 'Diagnóstico CIE-10'],
    manual: ['PDF adjunto'],
    cred: ['Usuario', 'Contraseña'],
  },
  // ── ARL ────────────────────────────────────────────────────
  {
    key: 'arl_sura', nombre: 'ARL SURA', tipo: 'ARL', medio: 'portal', skill: 'pendiente',
    ocr: ['N° documento', 'Tipo doc', 'Fecha inicio', 'Días', 'Diagnóstico CIE-10', 'Tipo accidente'],
    manual: ['PDF adjunto', 'N° caso ARL'],
    cred: ['Usuario', 'Contraseña'],
  },
  {
    key: 'positiva', nombre: 'ARL Positiva', tipo: 'ARL', medio: 'portal', skill: 'pendiente',
    ocr: ['N° documento', 'Tipo doc', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto'],
    cred: ['Usuario', 'Contraseña'],
  },
  {
    key: 'colmena', nombre: 'Colmena Seguros ARL', tipo: 'ARL', medio: 'portal', skill: 'pendiente',
    ocr: ['N° documento', 'Tipo doc', 'Fecha inicio', 'Días', 'Diagnóstico CIE-10'],
    manual: ['PDF adjunto'],
    cred: ['Usuario', 'Contraseña'],
  },
  {
    key: 'liberty', nombre: 'Liberty Seguros ARL', tipo: 'ARL', medio: 'email', skill: 'pendiente',
    ocr: ['N° documento', 'Nombre trabajador', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto'],
    cred: ['Correo destino'],
  },
  {
    key: 'bolivar', nombre: 'Seguros Bolívar ARL', tipo: 'ARL', medio: 'email', skill: 'pendiente',
    ocr: ['N° documento', 'Nombre trabajador', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto'],
    cred: ['Correo destino'],
  },
  {
    key: 'mapfre', nombre: 'Mapfre ARL', tipo: 'ARL', medio: 'email', skill: 'pendiente',
    ocr: ['N° documento', 'Nombre trabajador', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto'],
    cred: ['Correo destino'],
  },
  {
    key: 'equidad', nombre: 'La Equidad Seguros ARL', tipo: 'ARL', medio: 'email', skill: 'pendiente',
    ocr: ['N° documento', 'Nombre trabajador', 'Fecha inicio', 'Días'],
    manual: ['PDF adjunto'],
    cred: ['Correo destino'],
  },
  {
    key: 'axa_colpatria', nombre: 'AXA Colpatria ARL', tipo: 'ARL', medio: 'portal', skill: 'pendiente',
    ocr: ['N° documento', 'Tipo doc', 'Fecha inicio', 'Días', 'Diagnóstico CIE-10'],
    manual: ['PDF adjunto'],
    cred: ['Usuario', 'Contraseña'],
  },
]

// ─── Campos por tipo de incapacidad ───────────────────────
const TIPOS_INCAPACIDAD = {
  general: [
    { campo: 'N° documento', src: 'ocr', desc: 'Cédula del trabajador — extraído automáticamente del PDF', ejemplo: '30204961' },
    { campo: 'Tipo documento', src: 'ocr', desc: 'CC, CE, PA — extraído del PDF', ejemplo: 'CC' },
    { campo: 'Fecha inicio', src: 'ocr', desc: 'Primer día de incapacidad — extraído del PDF', ejemplo: '11/06/2026' },
    { campo: 'Días', src: 'ocr', desc: 'Total de días de incapacidad — extraído del PDF', ejemplo: '3' },
    { campo: 'Diagnóstico CIE-10', src: 'ocr', desc: 'Código de diagnóstico — extraído del PDF', ejemplo: 'J06.9' },
    { campo: 'Nombre trabajador', src: 'ocr', desc: 'Nombre completo — extraído del PDF cuando aplica', ejemplo: 'María Pérez' },
    { campo: 'Tipo incapacidad', src: 'manual', desc: 'Enfermedad general — definido por el sistema', ejemplo: 'Enfermedad general' },
    { campo: 'PDF soporte', src: 'manual', desc: 'Archivo PDF de la incapacidad médica', ejemplo: 'incapacidad_2026.pdf' },
  ],
  laboral: [
    { campo: 'N° documento', src: 'ocr', desc: 'Cédula del trabajador — extraído del PDF', ejemplo: '30204961' },
    { campo: 'Tipo documento', src: 'ocr', desc: 'CC, CE, PA — extraído del PDF', ejemplo: 'CC' },
    { campo: 'Fecha inicio', src: 'ocr', desc: 'Primer día de incapacidad — extraído del PDF', ejemplo: '11/06/2026' },
    { campo: 'Días', src: 'ocr', desc: 'Total de días — extraído del PDF', ejemplo: '15' },
    { campo: 'Diagnóstico CIE-10', src: 'ocr', desc: 'Código de diagnóstico — extraído del PDF', ejemplo: 'S50.0' },
    { campo: 'Tipo accidente', src: 'ocr', desc: 'Clasificación del accidente — extraído del PDF', ejemplo: 'Accidente de trabajo' },
    { campo: 'Fecha accidente', src: 'ocr', desc: 'Fecha del accidente laboral — extraído del PDF', ejemplo: '10/06/2026' },
    { campo: 'N° caso ARL', src: 'manual', desc: 'Número de caso asignado por la ARL — del sistema', ejemplo: 'ARL-2026-00123' },
    { campo: 'PDF soporte', src: 'manual', desc: 'Archivo PDF de la incapacidad por accidente', ejemplo: 'accidente_laboral.pdf' },
  ],
  maternidad: [
    { campo: 'N° documento', src: 'ocr', desc: 'Cédula del trabajador — extraído del PDF', ejemplo: '30204961' },
    { campo: 'Tipo documento', src: 'ocr', desc: 'CC, CE, PA — extraído del PDF', ejemplo: 'CC' },
    { campo: 'Fecha inicio', src: 'ocr', desc: 'Fecha inicio de la licencia — extraído del PDF', ejemplo: '01/06/2026' },
    { campo: 'Días', src: 'ocr', desc: '98 días maternidad / 8 días paternidad — extraído del PDF', ejemplo: '98' },
    { campo: 'Fecha probable parto', src: 'ocr', desc: 'Fecha del nacimiento — extraída del PDF', ejemplo: '01/06/2026' },
    { campo: 'Tipo licencia', src: 'manual', desc: 'Maternidad o Paternidad — definido por el sistema', ejemplo: 'Maternidad' },
    { campo: 'PDF soporte', src: 'manual', desc: 'Certificado médico de embarazo o nacimiento', ejemplo: 'licencia_maternidad.pdf' },
  ],
  prorroga: [
    { campo: 'N° documento', src: 'ocr', desc: 'Cédula del trabajador — extraído del PDF', ejemplo: '30204961' },
    { campo: 'Tipo documento', src: 'ocr', desc: 'CC, CE, PA — extraído del PDF', ejemplo: 'CC' },
    { campo: 'Fecha inicio prórroga', src: 'ocr', desc: 'Día siguiente al vencimiento anterior — extraído del PDF', ejemplo: '20/06/2026' },
    { campo: 'Días prórroga', src: 'ocr', desc: 'Días adicionales de prórroga — extraído del PDF', ejemplo: '7' },
    { campo: 'Diagnóstico CIE-10', src: 'ocr', desc: 'Mismo código que la incapacidad original — extraído del PDF', ejemplo: 'J06.9' },
    { campo: 'N° radicado anterior', src: 'manual', desc: 'Radicado de la incapacidad original — del sistema', ejemplo: 'INC-2026-001100' },
    { campo: 'PDF soporte', src: 'manual', desc: 'PDF de la prórroga médica', ejemplo: 'prorroga_2026.pdf' },
  ],
}

const FILTROS = [
  { key: 'todos', label: 'Todas' },
  { key: 'portal', label: 'Portal web' },
  { key: 'email', label: 'Por correo' },
  { key: 'eps', label: 'Solo EPS' },
  { key: 'arl', label: 'Solo ARL' },
]

const TIPOS_LABELS = {
  general: 'Enfermedad general',
  laboral: 'Accidente laboral',
  maternidad: 'Maternidad / Paternidad',
  prorroga: 'Prórroga',
}

function SkillBadge({ skill }) {
  if (skill === 'activa') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'rgba(16,185,129,0.10)', color: '#059669' }}>
      <CheckCircle size={10} /> Activa
    </span>
  )
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'rgba(15,23,42,0.05)', color: 'var(--text-muted)' }}>
      <Clock size={10} /> Pendiente
    </span>
  )
}

function Campo({ tipo, label }) {
  const styles = {
    ocr: { bg: 'rgba(16,185,129,0.08)', color: '#059669', border: 'rgba(16,185,129,0.2)' },
    manual: { bg: 'rgba(245,158,11,0.08)', color: '#B45309', border: 'rgba(245,158,11,0.2)' },
    cred: { bg: 'rgba(15,23,42,0.04)', color: 'var(--text-muted)', border: 'rgba(15,23,42,0.08)' },
  }
  const s = styles[tipo] || styles.cred
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 600,
      padding: '2px 7px', borderRadius: 5, margin: '2px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {label}
    </span>
  )
}

export default function RadicacionCampos() {
  const [filtro, setFiltro] = useState('todos')
  const [tipo, setTipo] = useState('general')
  const [skillsReal, setSkillsReal] = useState({})

  useEffect(() => {
    fetch(`${API_BASE}/admin/radicacion/skills`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.skills) return
        const map = {}
        data.skills.forEach(s => { map[s.key] = s.estado })
        setSkillsReal(map)
      })
      .catch(() => {})
  }, [])

  // Merge estado real del backend sobre los manifests estáticos
  const manifests = MANIFESTS.map(m => ({
    ...m,
    skill: skillsReal[m.key] ?? m.skill,
  }))

  const filtered = manifests.filter(m => {
    if (filtro === 'portal') return m.medio === 'portal'
    if (filtro === 'email') return m.medio === 'email'
    if (filtro === 'eps') return m.tipo === 'EPS'
    if (filtro === 'arl') return m.tipo === 'ARL'
    return true
  })

  const activas = filtered.filter(m => m.skill === 'activa').length
  const camposOcrUnicos = [...new Set(filtered.flatMap(m => m.ocr))].length

  const camposFields = TIPOS_INCAPACIDAD[tipo] || []

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 64px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.25)', color: '#4F46E5' }}>
          <LayoutList size={24} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Campos EPS / ARL
        </h2>
      </div>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 14, marginBottom: 32 }}>
        Manifests de campos OCR y manuales por entidad · Estado de skills de radicación.
      </p>

      {/* ── SECCIÓN 1: Tabla de campos por EPS ── */}
      <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)', borderRadius: 20, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 7 }}>
            <FileText size={14} /> Campos requeridos por EPS
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {filtered.length} entidades · {camposOcrUnicos} campos OCR únicos · {activas} skills activas
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          {FILTROS.map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)} style={{
              fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 999, cursor: 'pointer', transition: 'all .2s',
              background: filtro === f.key ? 'rgba(79,70,229,0.12)' : 'transparent',
              color: filtro === f.key ? '#4F46E5' : 'var(--text-muted)',
              border: `1px solid ${filtro === f.key ? 'rgba(79,70,229,0.3)' : 'var(--border-primary)'}`,
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 680 }}>
            <thead>
              <tr>
                {['EPS / ARL', 'Tipo', 'Medio', 'Campos OCR', 'Campos manuales', 'Credenciales', 'Skill'].map(col => (
                  <th key={col} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.key} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(15,23,42,0.03)' : 'none' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                    {m.nombre}
                  </td>
                  <td style={{ padding: '9px 12px', color: 'var(--text-muted)', fontSize: 11 }}>
                    {m.tipo}
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                      background: m.medio === 'email' ? 'rgba(16,185,129,0.10)' : 'rgba(124,58,237,0.10)',
                      color: m.medio === 'email' ? '#059669' : '#7C3AED',
                    }}>
                      {m.medio === 'email' ? <Mail size={10} /> : <Globe size={10} />}
                      {m.medio === 'email' ? 'Email' : 'Portal'}
                    </span>
                  </td>
                  <td style={{ padding: '9px 12px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {m.ocr.map(c => <Campo key={c} tipo="ocr" label={c} />)}
                    </div>
                  </td>
                  <td style={{ padding: '9px 12px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {m.manual.map(c => <Campo key={c} tipo="manual" label={c} />)}
                    </div>
                  </td>
                  <td style={{ padding: '9px 12px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {m.cred.map(c => <Campo key={c} tipo="cred" label={c} />)}
                    </div>
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <SkillBadge skill={m.skill} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { tipo: 'ocr', icon: <ScanLine size={10} />, label: 'OCR automático — el backend extrae del PDF' },
            { tipo: 'manual', icon: <Pencil size={10} />, label: 'Manual — el sistema lo ingresa' },
            { tipo: 'cred', icon: <Lock size={10} />, label: 'Credencial — viene del bot configurado' },
          ].map(({ tipo: t, icon, label }) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--text-muted)' }}>
              <Campo tipo={t} label={icon} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── SECCIÓN 2: Campos por tipo de incapacidad ── */}
      <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-primary)', borderRadius: 20, padding: '20px 24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
          <FileText size={14} /> Campos por tipo de incapacidad
        </h3>

        {/* Selector de tipo */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {Object.entries(TIPOS_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => setTipo(key)} style={{
              fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 10, cursor: 'pointer', transition: 'all .2s',
              background: tipo === key ? 'rgba(79,70,229,0.12)' : 'var(--bg-input)',
              color: tipo === key ? '#4F46E5' : 'var(--text-tertiary)',
              border: `1px solid ${tipo === key ? 'rgba(79,70,229,0.3)' : 'var(--border-input)'}`,
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Tabla de campos */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-primary)' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {TIPOS_LABELS[tipo]}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {camposFields.length} campos en total
            </span>
          </div>
          {camposFields.map((c, i) => (
            <div key={c.campo} style={{
              display: 'grid', gridTemplateColumns: '180px 90px 1fr 120px',
              padding: '10px 16px', alignItems: 'center', gap: 16,
              borderBottom: i < camposFields.length - 1 ? '1px solid rgba(15,23,42,0.03)' : 'none',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.campo}</span>
              <div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                  background: c.src === 'ocr' ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
                  color: c.src === 'ocr' ? '#059669' : '#B45309',
                }}>
                  {c.src === 'ocr' ? <ScanLine size={10} /> : <Pencil size={10} />}
                  {c.src === 'ocr' ? 'OCR' : 'Manual'}
                </span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{c.desc}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>{c.ejemplo}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
