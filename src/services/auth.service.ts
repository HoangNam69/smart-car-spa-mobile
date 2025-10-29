import axiosInstance from "../config/axiosConfig";
import { LoginRequest, LoginResponse } from "../types/auth.type";

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post("/auth/login", credentials);
      console.log("Login response:", response.data);
      const apiResponse = response.data;

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || "Đăng nhập thất bại");
      }

      // Transform server response (snake_case) to client format (camelCase)
      const serverData = apiResponse.data;

      // Get user_info (API always returns it as an object)
      const userInfo = serverData.user_info || null;

      // Validate tokens
      const accessToken = serverData.access_token || serverData.accessToken;
      const refreshToken = serverData.refresh_token || serverData.refreshToken;

      if (!accessToken || !refreshToken) {
        console.error("Missing tokens in response:", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          serverDataKeys: Object.keys(serverData || {}),
        });
        throw new Error("Server không trả về đầy đủ thông tin token");
      }

      const transformedData = {
        access_token: accessToken,
        refresh_token: refreshToken,
        user_info: userInfo,
      };

      return {
        success: true,
        message: apiResponse.message || "Đăng nhập thành công",
        timestamp: apiResponse.timestamp,
        data: transformedData,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Có lỗi xảy ra khi đăng nhập"
      );
    }
  }

  async refreshToken(refreshTokenParam: string): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post("/auth/refresh-token", {
        refreshToken: refreshTokenParam,
      });
      const apiResponse = response.data;

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || "Làm mới token thất bại");
      }

      // Transform server response (snake_case) to client format (camelCase)
      const serverData = apiResponse.data;

      // Get user_info (API always returns it as an object)
      const userInfo = serverData.user_info || null;

      // Validate tokens
      const accessToken = serverData.access_token || serverData.accessToken;
      const newRefreshToken = serverData.refresh_token || serverData.refreshToken;

      if (!accessToken || !newRefreshToken) {
        console.error("Missing tokens in refresh response:", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!newRefreshToken,
          serverDataKeys: Object.keys(serverData || {}),
        });
        throw new Error("Server không trả về đầy đủ thông tin token");
      }

      const transformedData = {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        user_info: userInfo,
      };

      return {
        success: true,
        message: apiResponse.message || "Làm mới token thành công",
        timestamp: apiResponse.timestamp,
        data: transformedData,
      };
    } catch (error) {
      console.error("Refresh token error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi làm mới token"
      );
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await axiosInstance.post("/auth/logout", {
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axiosInstance.post("/auth/verify-token", {
        accessToken,
      });
      const apiResponse = response.data;
      return apiResponse.success && apiResponse.data;
    } catch (error) {
      console.error("Verify token error:", error);
      return false;
    }
  }
}

export const authService = new AuthService();
export default authService;
