const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function request(path, options = {}) {
  const token = localStorage.getItem('campussafe_token');
  const headers = new Headers(options.headers ?? {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const isForm = options.body instanceof FormData;
  if (options.body && !isForm && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json() : await response.blob();
  if (!response.ok) {
    const error = new Error(data?.error ?? `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  getBlob: (path) => request(path),
  post: (path, body, headers) => request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body ?? {}), headers }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  url: (path) => `${API_URL}${path}`,
};
