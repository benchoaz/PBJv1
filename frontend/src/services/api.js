const API_BASE = 'http://localhost:5000/api'

export const api = {
  projects: {
    list: () => fetch(`${API_BASE}/projects`).then(r => r.json()),
    get: (id) => fetch(`${API_BASE}/projects/${id}`).then(r => r.json()),
    create: (data) =>
      fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    update: (id, data) =>
      fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    delete: (id) =>
      fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' }).then(r => r.json()),
  },
  tickets: {
    list: (params) => {
      const query = new URLSearchParams(params).toString()
      return fetch(`${API_BASE}/tickets${query ? '?' + query : ''}`).then(r => r.json())
    },
    get: (id) => fetch(`${API_BASE}/tickets/${id}`).then(r => r.json()),
    create: (data) =>
      fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    update: (id, data) =>
      fetch(`${API_BASE}/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    delete: (id) =>
      fetch(`${API_BASE}/tickets/${id}`, { method: 'DELETE' }).then(r => r.json()),
  },
  auth: {
    login: (credentials) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }).then(r => r.json()),
    logout: () => fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).then(r => r.json()),
    me: () => fetch(`${API_BASE}/auth/me`).then(r => r.json()),
  },
}