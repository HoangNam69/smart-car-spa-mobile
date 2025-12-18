import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { router } from "expo-router";
import { tokenStorage } from "../storage/tokenStorage";
import { API_CONFIG } from "./api.constant";
import { authEventEmitter } from "../utils/authEventEmitter";

// Token refresh state management - match webapp pattern
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}[] = [];

// Tạo axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Process failed queue - match webapp pattern
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Refresh token function - match webapp pattern
const refreshTokenRequest = async (): Promise<string | null> => {
  try {
    const refreshTokenValue = await tokenStorage.getRefreshToken();

    if (!refreshTokenValue) {
      console.log("No refresh token available for refresh");
      throw new Error("No refresh token available");
    }

    console.log("Refreshing token...");

    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/auth/refresh-token`, // Match webapp: no /api prefix in endpoint
      {
        refreshToken: refreshTokenValue,
      },
      {
        timeout: API_CONFIG.TIMEOUT,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Refresh token response:", {
      status: response.status,
      success: response.data?.success,
      hasData: !!response.data?.data,
    });

    if (response.data.success && response.data.data) {
      const { access_token, refresh_token, user_info } = response.data.data;

      // Validate tokens before storing
      if (!access_token || !refresh_token) {
        console.log("Invalid token response: missing access_token or refresh_token");
        throw new Error("Server không trả về đầy đủ thông tin token");
      }

      // Update tokens in storage
      await tokenStorage.setTokens(access_token, refresh_token);
      if (user_info) {
        await tokenStorage.setUserData(user_info);
      }

      console.log("Token refreshed successfully");
      return access_token;
    } else {
      const errorMessage = response.data.message || "Failed to refresh token";
      console.log("Refresh token response indicates failure:", errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.log("Token refresh failed with details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });

    const status = error.response?.status;

    // Handle 401 or 500 errors - clear tokens and redirect
    // Note: Queue processing and isRefreshing reset are handled in response interceptor
    if (status === 401 || status === 500) {
      if (status === 401) {
        console.log("Refresh token is invalid or expired, clearing all tokens");
      } else {
        console.log("Refresh token endpoint returned 500, clearing tokens");
      }

      await tokenStorage.clearTokens();
      // Notify AuthContext to clear state
      authEventEmitter.emitLogout();
      router.replace("/auths/login");
    } else {
      console.log(
        "Non-401/500 error during token refresh, keeping tokens for retry"
      );
    }

    throw error;
  }
};

// Request Interceptor - match webapp pattern
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log AI Assistant requests for debugging
    if (config.url?.includes('/ai-assistant')) {
      console.log("[Axios] AI Assistant request:", {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        hasToken: !!token,
        tokenLength: token?.length || 0,
        timeout: config.timeout,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("[Axios] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor - match webapp pattern
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & {
      _retry?: boolean;
    }) | undefined;

    // If no original request config, reject immediately
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Log error details for debugging
    console.log("API Error Details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: originalRequest?.url,
      method: originalRequest?.method,
      baseURL: originalRequest?.baseURL,
      fullURL: originalRequest?.baseURL ? `${originalRequest.baseURL}${originalRequest.url}` : originalRequest?.url,
      data: error.response?.data,
      message: error.message,
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      syscall: (error as any)?.syscall,
      address: (error as any)?.address,
      port: (error as any)?.port,
      hasResponse: !!error.response,
      isNetworkError: !error.response && (error.message?.includes("Network Error") || (error as any)?.code === "ERR_NETWORK"),
      isTimeout: (error as any)?.code === "ECONNABORTED",
    });

    // Handle 401 - Unauthorized - match webapp pattern
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints
      if (originalRequest.url?.includes("/auth/")) {
        return Promise.reject(error);
      }

      // Check if we have refresh token before attempting refresh
      const refreshTokenValue = await tokenStorage.getRefreshToken();
      if (!refreshTokenValue) {
        console.log("No refresh token available, redirecting to login");
        await tokenStorage.clearTokens();
        // Notify AuthContext to clear state
        authEventEmitter.emitLogout();
        router.replace("/auths/login");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, add to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest && originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshTokenRequest();
        processQueue(null, newToken);

        // Retry original request with new token
        if (originalRequest.headers && newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log("Token refresh failed:", refreshError);
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 500 - Internal Server Error - match webapp pattern
    // Note: Refresh token requests use axios.post directly, so they won't reach here
    // They are handled in refreshTokenRequest() catch block
    if (error.response?.status === 500) {
      console.log("Server Error (500):", {
        url: originalRequest?.url,
        data: error.response?.data,
        message:
          (error.response?.data as any)?.message || "Internal server error",
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
