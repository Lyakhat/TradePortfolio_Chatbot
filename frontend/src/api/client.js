const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const BASE_URL = `${API_ORIGIN}/api/v1`;

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSchema(sessionId = 'default') {
  const res = await fetch(`${BASE_URL}/datasets/${sessionId}/schema`);
  if (!res.ok) throw new Error(`Failed to fetch schema: ${res.statusText}`);
  return res.json();
}

export async function fetchSamples(sessionId = 'default') {
  const res = await fetch(`${BASE_URL}/datasets/${sessionId}/samples`);
  if (!res.ok) throw new Error(`Failed to fetch samples: ${res.statusText}`);
  return res.json();
}

export async function uploadDatasets(files, sessionId = null) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  const res = await fetch(`${BASE_URL}/datasets/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
  }
  return res.json();
}

export async function askQuestion({ sessionId = 'default', question, temperature = 0.0, topK = 2 }) {
  const res = await fetch(`${BASE_URL}/chat/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      question,
      temperature,
      top_k_examples: topK,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Query failed with status ${res.status}`);
  }
  return res.json();
}

export async function executeRawSql({ sessionId = 'default', sql }) {
  const res = await fetch(`${BASE_URL}/chat/execute-raw-sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      sql,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `SQL execution failed`);
  }
  return res.json();
}
