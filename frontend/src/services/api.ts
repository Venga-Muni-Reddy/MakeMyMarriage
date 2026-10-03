import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token fallback for cross-domain requests
api.interceptors.request.use((reqConfig) => {
  const token = localStorage.getItem('mmm_token');
  if (token && reqConfig.headers) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
