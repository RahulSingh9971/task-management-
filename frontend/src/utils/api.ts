export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const BACKEND_URL = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : API_BASE;

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Set Content-Type to application/json by default unless we are sending FormData (file upload)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errMsg = 'API Error';
    try {
      const errData = await res.json();
      errMsg = errData.error || errMsg;
    } catch {
      errMsg = res.statusText || errMsg;
    }
    throw new Error(errMsg);
  }

  // Handle empty or text responses (like downloads)
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export const api = {
  auth: {
    login: (credentials: { email: string; password?: string }) => 
      apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData: any) => 
      apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    googleLogin: (payload: any) => 
      apiFetch('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),
    me: () => apiFetch('/auth/me'),
    updateProfile: (profile: any) => 
      apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) })
  },
  projects: {
    getAll: (filters: any = {}) => {
      const query = new URLSearchParams(filters).toString();
      return apiFetch(`/projects?${query}`);
    },
    getById: (id: number) => apiFetch(`/projects/${id}`),
    create: (data: any) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/projects/${id}`, { method: 'DELETE' })
  },
  tasks: {
    getAll: (filters: any = {}) => {
      const query = new URLSearchParams(filters).toString();
      return apiFetch(`/tasks?${query}`);
    },
    getById: (id: number) => apiFetch(`/tasks/${id}`),
    create: (data: any) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
    addComment: (id: number, content: string, parentId?: number | null) => 
      apiFetch(`/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ content, parentId }) }),
    startTimer: (id: number) => apiFetch(`/tasks/${id}/timer/start`, { method: 'POST' }),
    stopTimer: (id: number) => apiFetch(`/tasks/${id}/timer/stop`, { method: 'POST' })
  },
  calendar: {
    getEvents: () => apiFetch('/calendar'),
    createEvent: (data: any) => apiFetch('/calendar', { method: 'POST', body: JSON.stringify(data) }),
    dragEvent: (id: string, start: string, end: string) => 
      apiFetch(`/calendar/${id}/drag`, { method: 'PUT', body: JSON.stringify({ start, end }) }),
    updateEvent: (id: number, data: any) => apiFetch(`/calendar/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteEvent: (id: number) => apiFetch(`/calendar/${id}`, { method: 'DELETE' })
  },
  clients: {
    getAll: () => apiFetch('/clients'),
    getById: (id: number) => apiFetch(`/clients/${id}`),
    create: (data: any) => apiFetch('/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/clients/${id}`, { method: 'DELETE' })
  },
  team: {
    getAll: () => apiFetch('/team'),
    create: (data: any) => apiFetch('/team', { method: 'POST', body: JSON.stringify(data) }),
    updateRole: (id: number, role: string) => apiFetch(`/team/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    delete: (id: number) => apiFetch(`/team/${id}`, { method: 'DELETE' })
  },
  notes: {
    getAll: (filters: any = {}) => {
      const query = new URLSearchParams(filters).toString();
      return apiFetch(`/notes?${query}`);
    },
    getById: (id: number) => apiFetch(`/notes/${id}`),
    create: (data: any) => apiFetch('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch(`/notes/${id}`, { method: 'DELETE' })
  },
  files: {
    getAll: (filters: any = {}) => {
      const query = new URLSearchParams(filters).toString();
      return apiFetch(`/files?${query}`);
    },
    upload: (formData: FormData) => apiFetch('/files/upload', { method: 'POST', body: formData }),
    delete: (id: number) => apiFetch(`/files/${id}`, { method: 'DELETE' })
  },
  notifications: {
    getAll: () => apiFetch('/notifications'),
    markRead: (id: number) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => apiFetch('/notifications/read-all', { method: 'PUT' }),
    delete: (id: number) => apiFetch(`/notifications/${id}`, { method: 'DELETE' })
  },
  widgets: {
    getAll: () => apiFetch('/widgets'),
    update: (widgets: any[]) => apiFetch('/widgets', { method: 'PUT', body: JSON.stringify({ widgets }) })
  },
  reports: {
    getProductivity: () => apiFetch('/reports/productivity'),
    getExportUrl: (format: 'csv' | 'excel' | 'pdf') => `${API_BASE}/reports/export?format=${format}&token=${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
  }
};
