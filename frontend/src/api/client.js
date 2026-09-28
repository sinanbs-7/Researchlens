// ResearchLens API Client

const API_BASE = 'https://researchlens-777q.onrender.com/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('researchlens_token');
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData vs JSON body
  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      body
    });

    // Check if attachment file download
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('attachment')) {
      const blob = await response.blob();
      return { isBlob: true, blob, response };
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = json?.error?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.code = json?.error?.code || 'API_ERROR';
      error.status = response.status;
      error.details = json?.error?.details;
      throw error;
    }

    return json?.data;
  } catch (err) {
    if (err.status === 401) {
      // Discard invalid token if unauthorized
      localStorage.removeItem('researchlens_token');
      localStorage.removeItem('researchlens_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/login?expired=true';
      }
    }
    throw err;
  }
}

// API methods
export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => apiRequest(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => apiRequest(endpoint, { method: 'PUT', body, ...options }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: 'DELETE', ...options }),

  // File download helper
  download: async (endpoint, defaultFilename = 'export.txt') => {
    const result = await apiRequest(endpoint);
    if (result.isBlob) {
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
  }
};
