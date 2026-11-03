import axios from 'axios';

const getApiBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url) return '/api';
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

const BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res.data,   // unwrap: callers get { success, data } directly
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cc_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register:      (d) => api.post('/auth/register', d),
  login:         (d) => api.post('/auth/login', d),
  getProfile:    ()  => api.get('/auth/profile'),
  updateProfile: (d) => api.put('/auth/profile', d),
  changePassword:(d) => api.post('/auth/change-password', d),
};

// Resources
export const resourcesAPI = {
  list:           (p)  => api.get('/resources', { params: p }),
  get:            (id) => api.get(`/resources/${id}`),
  create:         (d)  => api.post('/resources', d),
  getUploadUrl:   (d)  => api.post('/resources/upload-url', d),
  getDownloadUrl: (id) => api.get(`/resources/${id}/download`),
  delete:         (id) => api.delete(`/resources/${id}`),
  createShareLink:(id) => api.post(`/resources/${id}/share`),
  myUploads:      ()   => api.get('/resources/my-uploads'),
};

// Shared (public)
export const sharedAPI = {
  get: (linkId) => api.get(`/shared/${linkId}`),
};

// Admin
export const adminAPI = {
  getStats:       ()   => api.get('/admin/stats'),
  getUsers:       ()   => api.get('/admin/users'),
  getResources:   ()   => api.get('/admin/resources'),
  deleteResource: (id) => api.delete(`/admin/resources/${id}`),
  deleteUser:     (id) => api.delete(`/admin/users/${id}`),
};

export default api;
