/**
 * useTenantTheme
 * ==============
 * Carga el tema visual del tenant autenticado y lo aplica como CSS custom properties.
 * Guarda en localStorage con TTL de 1 hora para evitar requests repetidos.
 *
 * CSS properties inyectadas:
 *   --tenant-primary    → color primario de la empresa
 *   --tenant-secondary  → color secundario
 *   --tenant-accent     → color de acento
 *   --tenant-logo       → URL del logo (vacío si no hay)
 *
 * Uso:
 *   const { theme, loading } = useTenantTheme()
 *   <img src={theme.logo_url} />
 */

import { useState, useEffect } from 'react'
import { getTenantTheme, getPublicBranding } from '../api'

const CACHE_KEY = 'tenant_theme_cache'
const TTL_MS = 60 * 60 * 1000  // 1 hora

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { theme, ts } = JSON.parse(raw)
    if (Date.now() - ts > TTL_MS) return null
    return theme
  } catch {
    return null
  }
}

function writeCache(theme) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ theme, ts: Date.now() }))
  } catch { /* storage full o privado */ }
}

function hexToRgba(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!m) return `rgba(14, 165, 233, ${alpha})`
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`
}

function applyCSSVars(paleta, logoUrl) {
  const root = document.documentElement
  if (!paleta || !paleta.primary) return
  root.style.setProperty('--tenant-primary',   paleta.primary   || '#3B82F6')
  root.style.setProperty('--tenant-secondary',  paleta.secondary || '#6366F1')
  root.style.setProperty('--tenant-accent',     paleta.accent    || '#EC4899')
  root.style.setProperty('--tenant-logo',       logoUrl ? `url(${logoUrl})` : '')

  // Sobrescribir las variables reales del design system para que TODO el
  // portal adopte la paleta del tenant (botones, focos, links, glows).
  root.style.setProperty('--accent-primary',       paleta.primary)
  root.style.setProperty('--accent-primary-hover', paleta.secondary || paleta.primary)
  root.style.setProperty('--accent-primary-dark',  paleta.accent    || paleta.primary)
  root.style.setProperty('--accent-primary-soft',  hexToRgba(paleta.primary, 0.12))
  root.style.setProperty('--accent-glow',          hexToRgba(paleta.primary, 0.35))
}

export function useTenantTheme(companyId = null, { enabled = true } = {}) {
  const [theme, setTheme] = useState(enabled ? readCache() : null)
  const [loading, setLoading] = useState(enabled && !readCache())
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) return

    const cached = readCache()
    if (cached) {
      applyCSSVars(cached.paleta_colores, cached.logo_url)
      setTheme(cached)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const load = async () => {
      try {
        const data = companyId
          ? await getTenantTheme(companyId, 'admin')
          : await getTenantTheme('me', 'admin')

        if (cancelled) return
        writeCache(data)
        applyCSSVars(data.paleta_colores, data.logo_url)
        setTheme(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [companyId, enabled])

  const invalidate = () => {
    localStorage.removeItem(CACHE_KEY)
    setTheme(null)
    setLoading(true)
  }

  return { theme, loading, error, invalidate }
}

/**
 * useSlugBranding — theming PRE-LOGIN por slug en la URL (?empresa=mi-empresa).
 * Pinta la pantalla de login con la paleta y logo de la empresa antes de autenticar.
 */
export function useSlugBranding(portal = 'admin') {
  const [branding, setBranding] = useState(null)

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('empresa')
    if (!slug) return
    let cancelled = false
    getPublicBranding(slug, portal)
      .then(data => {
        if (cancelled || !data?.ok) return
        applyCSSVars(data.paleta_colores, data.logo_url)
        setBranding(data)
      })
      .catch(() => { /* slug inválido → branding por defecto */ })
    return () => { cancelled = true }
  }, [portal])

  return branding
}

/**
 * clearTenantThemeCache — llamar tras logout o cambio de empresa
 */
export function clearTenantThemeCache() {
  localStorage.removeItem(CACHE_KEY)
  const root = document.documentElement
  for (const prop of [
    '--tenant-primary', '--tenant-secondary', '--tenant-accent', '--tenant-logo',
    '--accent-primary', '--accent-primary-hover', '--accent-primary-dark',
    '--accent-primary-soft', '--accent-glow',
  ]) {
    root.style.removeProperty(prop)
  }
}
