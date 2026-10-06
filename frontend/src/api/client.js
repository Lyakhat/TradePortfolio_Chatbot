const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const BASE_URL = `${API_ORIGIN}/api/v1`;

const TOKEN_STORAGE_KEY = 'tradepulse_auth_token';
const USER_STORAGE_KEY = 'tradepulse_user_info';

// -------------------------------------------------------------
// Auth Token & Storage Helpers
// -------------------------------------------------------------
export function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getStoredUser() {
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getAuthToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------
// Authentication & Blacklist API Calls
// -------------------------------------------------------------
export async function registerUser({ name, email, password }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(typeof data.detail === 'string' ? data.detail : (data.detail?.message || 'Registration failed'));
    error.status = res.status;
    error.data = data;
    error.isRegistered = data.detail?.is_registered ?? (res.status === 409);
    throw error;
  }

  if (data.access_token) {
    setAuthToken(data.access_token);
    setStoredUser(data.user);
  }
  return data;
}

export async function loginUser({ email, password, name }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(typeof data.detail === 'string' ? data.detail : (data.detail?.message || 'Login failed'));
    error.status = res.status;
    error.data = data;
    error.isRegistered = data.detail?.is_registered ?? (res.status !== 404);
    throw error;
  }

  if (data.access_token) {
    setAuthToken(data.access_token);
    setStoredUser(data.user);
  }
  return data;
}

export async function checkEmailExists(email) {
  const res = await fetch(`${BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error('Email check failed');
  return res.json();
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) throw new Error('No token found');

  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthSession();
    }
    throw new Error('Session expired or invalid');
  }

  const user = await res.json();
  setStoredUser(user);
  return user;
}

export async function logoutUser() {
  const token = getAuthToken();
  try {
    if (token) {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    }
  } catch (err) {
    console.warn('Backend logout notification error:', err);
  } finally {
    clearAuthSession();
  }
  return { success: true };
}

export async function fetchBlacklist(limit = 50) {
  const res = await fetch(`${BASE_URL}/auth/blacklisted-tokens?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch blacklisted tokens');
  return res.json();
}

// -------------------------------------------------------------
// Core Analytics API Calls
// -------------------------------------------------------------
export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSchema(sessionId = 'default') {
  const res = await fetch(`${BASE_URL}/datasets/${sessionId}/schema`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) clearAuthSession();
    throw new Error(`Failed to fetch schema: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSamples(sessionId = 'default') {
  const res = await fetch(`${BASE_URL}/datasets/${sessionId}/samples`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) clearAuthSession();
    throw new Error(`Failed to fetch samples: ${res.statusText}`);
  }
  return res.json();
}

export async function askQuestion({ sessionId = 'default', question, temperature = 0.0, topK = 2 }) {
  const res = await fetch(`${BASE_URL}/chat/query`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      session_id: sessionId,
      question,
      temperature,
      top_k_examples: topK,
    }),
  });
  if (!res.ok) {
    if (res.status === 401) clearAuthSession();
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Query failed with status ${res.status}`);
  }
  return res.json();
}

export async function executeRawSql({ sessionId = 'default', sql }) {
  const res = await fetch(`${BASE_URL}/chat/execute-raw-sql`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      session_id: sessionId,
      sql,
    }),
  });
  if (!res.ok) {
    if (res.status === 401) clearAuthSession();
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `SQL execution failed`);
  }
  return res.json();
}
