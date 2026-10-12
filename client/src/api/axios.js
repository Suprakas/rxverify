import axios from 'axios';
import { store } from '../features/store.js';
import { updateAccessToken, logout } from '../features/auth/authSlice.js';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach current access token from Redux store
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: refresh token on 401 once, then log out
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid intercepting refresh or login endpoints themselves
    const isAuthUrl =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthUrl) {
      originalRequest._retry = true;

      try {
        // Attempt token refresh via httpOnly cookie
        const refreshResponse = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.accessToken;
        if (newAccessToken) {
          // Update Redux state
          store.dispatch(updateAccessToken(newAccessToken));

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed or expired -> log out
        store.dispatch(logout());
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
