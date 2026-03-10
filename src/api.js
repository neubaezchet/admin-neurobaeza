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

export { getToken, getStoredUser };

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
