const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let storedToken: string | null = localStorage.getItem('securelab_token');

export function setAuthToken(token: string | null) {
  storedToken = token;
  if (token) {
    localStorage.setItem('securelab_token', token);
  } else {
    localStorage.removeItem('securelab_token');
  }
}

export function getAuthToken(): string | null {
  return storedToken;
}

export async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new ApiError(res.status, errorMsg, data);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { username: string; email: string; password: string; displayName?: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: { usernameOrEmail: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () =>
    request('/auth/logout', { method: 'POST' }),
  getMe: () =>
    request('/auth/me'),
  updateProfile: (payload: { displayName: string; bio: string }) =>
    request('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request('/auth/change-password', { method: 'PUT', body: JSON.stringify(payload) }),

  // Posts
  getPosts: (params?: { search?: string; category?: string; tag?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.sort) query.set('sort', params.sort);
    const qs = query.toString();
    return request(`/posts${qs ? `?${qs}` : ''}`);
  },
  getPost: (id: number) =>
    request(`/posts/${id}`),
  createPost: (payload: { title: string; category: string; tags: string; content: string }) =>
    request('/posts', { method: 'POST', body: JSON.stringify(payload) }),
  likePost: (id: number) =>
    request(`/posts/${id}/like`, { method: 'POST' }),
  deletePost: (id: number) =>
    request(`/posts/${id}`, { method: 'DELETE' }),

  // Comments
  createComment: (payload: { postId: number; content: string }) =>
    request('/comments', { method: 'POST', body: JSON.stringify(payload) }),
  editComment: (id: number, content: string) =>
    request(`/comments/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),
  deleteComment: (id: number) =>
    request(`/comments/${id}`, { method: 'DELETE' }),

  // Lab
  getLabScenarios: () =>
    request('/lab/scenarios'),
  executeLabQuery: (payload: { scenarioId: string; mode: 'vulnerable' | 'secure'; payload: string; secondaryParam?: string }) =>
    request('/lab/execute', { method: 'POST', body: JSON.stringify(payload) }),
  getTestSuite: () =>
    request('/lab/test-suite'),

  // Admin
  getAdminStats: () =>
    request('/admin/stats'),
  getAdminUsers: () =>
    request('/admin/users'),
  toggleUserBan: (id: number, ban: boolean) =>
    request(`/admin/users/${id}/ban`, { method: 'POST', body: JSON.stringify({ ban }) }),
  getAdminLogs: (limit = 50, filter?: string) => {
    const qs = filter && filter !== 'ALL' ? `?limit=${limit}&filter=${filter}` : `?limit=${limit}`;
    return request(`/admin/logs${qs}`);
  },
  resetDatabase: () =>
    request('/admin/reset-database', { method: 'POST' }),
};
