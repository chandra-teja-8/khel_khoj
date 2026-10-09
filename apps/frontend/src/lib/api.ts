const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api/v1';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('khelkhoj_token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}
