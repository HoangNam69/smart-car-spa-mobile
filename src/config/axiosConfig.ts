import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../storage/tokenStorage';
import { API_CONFIG } from './api.constant';

// Tạo axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Thêm token vào header
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor - Xử lý lỗi và refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Nếu lỗi 401 và chưa retry, thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        // Call API refresh token
        const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const data = response.data.data || response.data;
        const newAccessToken = data.access_token || data.accessToken;
        const newRefreshToken = data.refresh_token || data.refreshToken;
        const userInfo = data.user_info || data.user;

        if (newAccessToken && newRefreshToken) {
          // Lưu tokens mới
          await tokenStorage.setTokens(newAccessToken, newRefreshToken);
          if (userInfo) {
            await tokenStorage.setUserData(userInfo);
          }

          // Retry request với token mới
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        await tokenStorage.clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;