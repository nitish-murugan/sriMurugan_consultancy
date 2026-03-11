import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data)
};

// Cities API
export const citiesAPI = {
  getAll: (params) => api.get('/cities', { params }),
  getStates: () => api.get('/cities/states')
};

// Buses API
export const busesAPI = {
  getAll: (params) => api.get('/buses', { params }),
  getAvailable: (params) => api.get('/buses/available', { params }),
  getById: (id) => api.get(`/buses/${id}`),
  getTypes: () => api.get('/buses/types'),
  getAmenities: () => api.get('/buses/amenities'),
  create: (data) => api.post('/buses', data),
  update: (id, data) => api.put(`/buses/${id}`, data),
  delete: (id) => api.delete(`/buses/${id}`),
  getStats: () => api.get('/buses/admin/stats')
};

// Companies API
export const companiesAPI = {
  getAll: (params) => api.get('/companies', { params }),
  search: (data) => api.post('/companies/search', data),
  getById: (id) => api.get(`/companies/${id}`),
  getDomains: () => api.get('/companies/domains'),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`)
};

// Spots API
export const spotsAPI = {
  getAll: (params) => api.get('/spots', { params }),
  search: (data) => api.post('/spots/search', data),
  getById: (id) => api.get(`/spots/${id}`),
  getTypes: () => api.get('/spots/types'),
  create: (data) => api.post('/spots', data),
  update: (id, data) => api.put(`/spots/${id}`, data),
  delete: (id) => api.delete(`/spots/${id}`)
};

// Bookings API
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  getAll: (params) => api.get('/bookings', { params }),
  updateStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  uploadPermit: (id, data) => api.put(`/bookings/${id}/permit`, data),
  getStats: () => api.get('/bookings/admin/stats'),
  getInvoice: (id) => api.get(`/bookings/${id}/invoice`)
};

// Payments API
export const paymentsAPI = {
  getKey: () => api.get('/payments/key'),
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data)
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  searchRestaurants: (data) => api.post('/admin/restaurants/search', data)
};

export default api;
