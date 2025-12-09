import { useCallback } from "react";
import { authService } from "../services/auth.service";
import { LoginRequest, LoginResponse } from "../types/auth.types";

export function useAuthApi() {
  const login = useCallback(
    async (credentials: LoginRequest): Promise<LoginResponse["data"]> => {
      const response = await authService.login(credentials);
      return response.data;
    },
    []
  );

  // const refreshToken = useCallback(
  //   async (refreshToken: string): Promise<LoginResponse["data"]> => {
  //     const response = await authService.refreshToken(refreshToken);
  //     return response.data;
  //   },
  //   []
  // );

  // const verifyToken = useCallback(async (accessToken: string): Promise<boolean> => {
  //   return await authService.verifyToken(accessToken);
  // }, []);

  const logout = useCallback(async (refreshToken: string): Promise<void> => {
    return await authService.logout(refreshToken);
  }, []);

  return {
    login,
    // refreshToken,
    // verifyToken,
    logout,
  };
}
