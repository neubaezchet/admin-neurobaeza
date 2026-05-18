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
import { getTenantTheme } from '../api'

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

function applyCSSVars(paleta, logoUrl) {
  const root = document.documentElement
  if (!paleta) return
  root.style.setProperty('--tenant-primary',   paleta.primary   || '#3B82F6')
  root.style.setProperty('--tenant-secondary',  paleta.secondary || '#6366F1')
  root.style.setProperty('--tenant-accent',     paleta.accent    || '#EC4899')
  root.style.setProperty('--tenant-logo',       logoUrl ? `url(${logoUrl})` : '')
}

export function useTenantTheme(companyId = null) {
  const [theme, setTheme] = useState(readCache())
  const [loading, setLoading] = useState(!readCache())
  const [error, setError] = useState(null)

  useEffect(() => {
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
          ? await getTenantTheme(companyId)
          : await getTenantTheme('me')

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
  }, [companyId])

  const invalidate = () => {
    localStorage.removeItem(CACHE_KEY)
    setTheme(null)
    setLoading(true)
  }

  return { theme, loading, error, invalidate }
}

/**
 * clearTenantThemeCache — llamar tras logout o cambio de empresa
 */
export function clearTenantThemeCache() {
  localStorage.removeItem(CACHE_KEY)
  const root = document.documentElement
  for (const prop of ['--tenant-primary', '--tenant-secondary', '--tenant-accent', '--tenant-logo']) {
    root.style.removeProperty(prop)
  }
}
