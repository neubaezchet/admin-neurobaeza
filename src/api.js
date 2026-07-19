/**
 * API client – Admin Incapacidades
 * Todas las llamadas apuntan al backend Railway.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-95ed.up.railway.app';

function getToken() {
  return localStorage.getItem('admin_token');
}

function setToken(token) {
  localStorage.setItem('admin_token', token);
}

function clearToken() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('admin_user'));
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  localStorage.setItem('admin_user', JSON.stringify(user));
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || `Error ${res.status}`);
  }
  return data;
}

// ─── Auth ───────────────────────────────────────────────
export async function login(username, password) {
  const data = await apiFetch('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (data.ok && data.token) {
    setToken(data.token);
    setStoredUser(data.user);
  }
  return data;
}

export async function setupSuperadmin(username, password) {
  return apiFetch('/admin/setup-superadmin', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getMe() {
  return apiFetch('/admin/me');
}

export function logout() {
  clearToken();
  window.location.href = '/login';
}

export { getToken, getStoredUser }

// Guarda sesión completa (usado después del registro para auto-login)
export function saveSession(token, user) {
  setToken(token)
  setStoredUser(user)
};

// ─── Correos Notificación ───────────────────────────────
export function getCorreos(area = 'all', empresa = 'all') {
  return apiFetch(`/admin/correos?area=${area}&empresa=${empresa}`);
}
export function createCorreo(data) {
  return apiFetch('/admin/correos', { method: 'POST', body: JSON.stringify(data) });
}
export function updateCorreo(id, data) {
  return apiFetch(`/admin/correos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export function deleteCorreo(id) {
  return apiFetch(`/admin/correos/${id}`, { method: 'DELETE' });
}

// ─── Alertas Email ──────────────────────────────────────
export function getAlertaEmails(empresa = 'all') {
  return apiFetch(`/alertas-180/emails?empresa=${empresa}`);
}
export function createAlertaEmail(data) {
  return apiFetch('/alertas-180/emails', { method: 'POST', body: JSON.stringify(data) });
}
export function updateAlertaEmail(id, data) {
  return apiFetch(`/alertas-180/emails/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export function deleteAlertaEmail(id) {
  return apiFetch(`/alertas-180/emails/${id}`, { method: 'DELETE' });
}

// ─── Usuarios ───────────────────────────────────────────
export function getUsers() {
  return apiFetch('/admin/users');
}
export function createUser(data) {
  return apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(data) });
}
export function updateUser(id, data) {
  return apiFetch(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export function deleteUser(id) {
  return apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
}

// ─── Empresas ───────────────────────────────────────────
export function getEmpresas() {
  return apiFetch('/admin/empresas');
}
export function updateEmpresa(id, data) {
  return apiFetch(`/admin/empresas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ─── Conexiones EPS/ARL ─────────────────────────────────
export function getConexiones(empresaId) {
  return apiFetch(`/admin/conexiones?empresa_id=${empresaId}`);
}
export function createConexion(data) {
  return apiFetch('/admin/conexiones', { method: 'POST', body: JSON.stringify(data) });
}
export function updateConexion(id, data) {
  return apiFetch(`/admin/conexiones/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export function deleteConexion(id) {
  return apiFetch(`/admin/conexiones/${id}`, { method: 'DELETE' });
}

// ─── Consola / Stats ────────────────────────────────────
export function getStats() {
  return apiFetch('/admin/stats');
}
export function getHealth() {
  return apiFetch('/admin/health');
}
export function getActivity(limit = 50) {
  return apiFetch(`/admin/activity?limit=${limit}`);
}

// ─── Bots Radicación ────────────────────────────────────
export function getBotsDisponibles() {
  return apiFetch('/admin/bots/disponibles');
}

export function getBotsEmpresa(nombreEmpresa) {
  return apiFetch(`/admin/empresas/${encodeURIComponent(nombreEmpresa)}/bots`);
}

export function createBotEmpresa(nombreEmpresa, data) {
  return apiFetch(`/admin/empresas/${encodeURIComponent(nombreEmpresa)}/bots`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateBotEmpresa(nombreEmpresa, botNombre, data) {
  return apiFetch(
    `/admin/empresas/${encodeURIComponent(nombreEmpresa)}/bots/${encodeURIComponent(botNombre)}`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
}

export function deleteBotEmpresa(nombreEmpresa, botNombre) {
  return apiFetch(
    `/admin/empresas/${encodeURIComponent(nombreEmpresa)}/bots/${encodeURIComponent(botNombre)}`,
    { method: 'DELETE' }
  );
}

export function syncRadicacionBots() {
  return apiFetch('/admin/bots/sync-radicacion', { method: 'POST' });
}

export async function subirSoporteEps(nombreEmpresa, botNombre, file) {
  const token = getToken();
  const fd = new FormData();
  fd.append('archivo', file);
  const res = await fetch(
    `${API_BASE}/admin/empresas/${encodeURIComponent(nombreEmpresa)}/bots/${encodeURIComponent(botNombre)}/soporte`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
  return data;
}

export function quitarSoporteEps(nombreEmpresa, botNombre) {
  return apiFetch(
    `/admin/empresas/${encodeURIComponent(nombreEmpresa)}/bots/${encodeURIComponent(botNombre)}/soporte`,
    { method: 'DELETE' }
  );
}

// ─── Radicación — Skills ─────────────────────────────────
export function getRadicacionSkills() {
  return apiFetch('/admin/radicacion/skills');
}

// ─── Browserbase — Bots cloud (navegador en la nube) ─────
export function getBrowserbaseRuns(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/api/browserbase/runs${q ? `?${q}` : ''}`);
}
export function getBrowserbaseRun(runId) {
  return apiFetch(`/api/browserbase/runs/${runId}`);
}
export function getBrowserbaseRunLive(runId) {
  return apiFetch(`/api/browserbase/runs/${runId}/live`);
}
export function getBrowserbaseRunMessages(runId, since = null) {
  const q = since ? `?since=${encodeURIComponent(since)}` : '';
  return apiFetch(`/api/browserbase/runs/${runId}/messages${q}`);
}
export function stopBrowserbaseRun(runId) {
  return apiFetch(`/api/browserbase/runs/${runId}/stop`, { method: 'POST' });
}
export function createBrowserbaseRun(data) {
  return apiFetch('/api/browserbase/runs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Multi-tenant ────────────────────────────────────────
export function getTenants(params = {}) {
  const q = new URLSearchParams(params).toString()
  return apiFetch(`/tenants/${q ? `?${q}` : ''}`)
}
export function getTenant(companyId) {
  return apiFetch(`/tenants/${companyId}`)
}
export function createTenant(data) {
  return apiFetch('/tenants/', { method: 'POST', body: JSON.stringify(data) })
}
export function updateTenant(companyId, data) {
  return apiFetch(`/tenants/${companyId}`, { method: 'PUT', body: JSON.stringify(data) })
}
export function deactivateTenant(companyId) {
  return apiFetch(`/tenants/${companyId}`, { method: 'DELETE' })
}

// Tema visual del tenant (portal: 'admin' | 'portal' | 'repogemin' — paleta específica de ese portal)
export function getTenantTheme(companyIdOrMe, portal = 'admin') {
  const q = portal ? `?portal=${portal}` : ''
  if (companyIdOrMe === 'me') return apiFetch(`/tenants/me/theme${q}`)
  return apiFetch(`/tenants/${companyIdOrMe}/theme${q}`)
}

// Branding público por slug (pre-login: NO requiere token)
export function getPublicBranding(slug, portal = 'admin') {
  return fetch(`${API_BASE}/public/portal/${encodeURIComponent(slug)}?portal=${portal}`)
    .then(r => { if (!r.ok) throw new Error('Empresa no encontrada'); return r.json() })
}

// Reintentar aprovisionamiento (Sheet/estructura Drive) cuando falló en background
export function reprovisionarTenant(companyId) {
  return apiFetch(`/tenants/${companyId}/reprovisionar`, { method: 'POST' })
}

// Invitación de onboarding (genera link de un solo uso)
export function generateTenantInvite(companyId) {
  return apiFetch(`/tenants/${companyId}/invite`, { method: 'POST' })
}

// Onboarding wizard
export function getOnboardingProgress(companyId) {
  return apiFetch(`/tenants/${companyId}/onboarding`)
}
export function saveTenantOnboardingStep(companyId, { step, data }) {
  return apiFetch(`/tenants/${companyId}/onboarding/step`, {
    method: 'POST',
    body: JSON.stringify({ step, data }),
  })
}
export function completeTenantOnboarding(companyId) {
  return apiFetch(`/tenants/${companyId}/onboarding/complete`, { method: 'POST' })
}

// Google Drive
export function verifyTenantDrive(companyId, data) {
  return apiFetch(`/tenants/${companyId}/drive/verify`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export function getTenantFiles(companyId, subfolder) {
  const q = subfolder ? `?subfolder=${subfolder}` : ''
  return apiFetch(`/tenants/${companyId}/files${q}`)
}

// Usuarios del tenant
export function getTenantUsers(companyId) {
  return apiFetch(`/tenants/${companyId}/users`)
}
export function addTenantUser(companyId, data) {
  return apiFetch(`/tenants/${companyId}/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
export function removeTenantUser(companyId, adminUserId) {
  return apiFetch(`/tenants/${companyId}/users/${adminUserId}`, { method: 'DELETE' })
}

// Audit log
export function getTenantAuditLog(companyId, { limit = 50, offset = 0 } = {}) {
  return apiFetch(`/tenants/${companyId}/audit?limit=${limit}&offset=${offset}`)
}

// ─── Demo / Solicitudes de acceso (públicos — sin token JWT) ─────────────────

export function solicitarDemo(data) {
  return apiFetch('/demo/solicitar', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function solicitarDemoAuto(data) {
  // Demo auto-servicio: crea Company + token + DemoSession sin intervención del admin
  return apiFetch('/demo/solicitar-auto', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function validarTokenRegistro(token) {
  // Valida que el token de invitación sea válido antes de cargar el wizard
  return apiFetch(`/tenants/registro/validar-token?token=${encodeURIComponent(token)}`)
}

export function completarRegistro(data) {
  // Endpoint público: la empresa completa su propio registro
  return apiFetch('/tenants/registro/completar', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── Leads (admin protegido) ─────────────────────────────────────────────────

export function getLeads(params = {}) {
  const q = new URLSearchParams(params).toString()
  return apiFetch(`/admin/leads/${q ? `?${q}` : ''}`)
}

export function getLeadDetalle(id) {
  return apiFetch(`/admin/leads/${id}`)
}

export function aprobarLead(id, data = {}) {
  return apiFetch(`/admin/leads/${id}/aprobar`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function rechazarLead(id, data = {}) {
  return apiFetch(`/admin/leads/${id}/rechazar`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function aprobarLeadComoDemo(id, data = {}) {
  return apiFetch(`/admin/leads/${id}/aprobar-demo`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function activarEmpresaDesdeDemo(leadId) {
  return apiFetch(`/admin/leads/${leadId}/activar-empresa`, { method: 'POST' })
}

export function limpiarDemosExpirados() {
  return apiFetch('/admin/leads/demos/limpiar', { method: 'DELETE' })
}

// ─── Demo público ─────────────────────────────────────────

export function checkDemoStatus(companyId) {
  return apiFetch(`/demo/status/${companyId}`)
}

export function enviarDemoFeedback(data) {
  return apiFetch('/demo/feedback', { method: 'POST', body: JSON.stringify(data) })
}

// Service account email (para mostrar al usuario qué correo usar al compartir Drive)
export function getServiceAccountEmail() {
  return apiFetch('/tenants/service-account-email')
}

// Crear empresa directamente + generar link de invitación
export function crearEmpresaDirecta(data) {
  return apiFetch('/admin/leads/crear-empresa', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Factory reset — borra toda la data operativa
export function factoryReset(adminToken) {
  return fetch(`${API_BASE}/admin/factory-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': adminToken,
    },
    body: JSON.stringify({ confirmacion: 'RESET' }),
  }).then(r => r.json())
}
