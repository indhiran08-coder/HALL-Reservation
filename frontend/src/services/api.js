import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ─── Request Interceptor: Attach JWT token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 (token expired) ──────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ──────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (email) => api.post(`/auth/resend-otp?email=${encodeURIComponent(email)}`),
};

// ─── Hall API ──────────────────────────────────────────────────────────────
export const hallAPI = {
  getAll: () => api.get('/halls'),
  getAllAdmin: () => api.get('/halls/admin/all'),
  getById: (id) => api.get(`/halls/${id}`),
  getAvailable: (date, startTime, endTime) =>
    api.get('/halls/available', { params: { date, startTime, endTime } }),
  create: (data) => api.post('/halls', data),
  update: (id, data) => api.put(`/halls/${id}`, data),
  delete: (id) => api.delete(`/halls/${id}`),
};

// ─── Booking API ───────────────────────────────────────────────────────────
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  cancel: (id) => api.delete(`/bookings/${id}`),
  getMyBookings: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),
  getToday: () => api.get('/bookings/today'),
  getByDate: (date) => api.get(`/bookings/date/${date}`),
  getCalendar: (startDate, endDate) =>
    api.get('/bookings/calendar', { params: { startDate, endDate } }),
  getAll: () => api.get('/bookings/all'),
};

export default api;
