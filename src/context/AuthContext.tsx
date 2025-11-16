import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../storage/tokenStorage';
import { AuthState, LoginRequest, SignupRequest, UserInfo } from '../types/auth.types';
import { UpdateUserRequest } from '../types/user.types';
import { userService } from '../services/user.service';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (signupData: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: UpdateUserRequest) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);

  const login = async (credentials: LoginRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await authService.login(credentials);
      
      // Map từ snake_case (từ authService) sang camelCase
      const accessToken = response.data.access_token || '';
      const refreshToken = response.data.refresh_token || '';
      const user = response.data.user_info || null;
      
      // Lưu tokens và user data vào storage
      await tokenStorage.setTokens(accessToken, refreshToken);
      if (user) {
        await tokenStorage.setUserData(user);
      }
      
      setState({
        isAuthenticated: true,
        user,
        accessToken,
        refreshToken,
        loading: false,
      });
    } catch (error) {
      console.error('Login error:', error);
      setState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
      });
      throw error;
    }
  };

  const signup = async (signupData: SignupRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await authService.signup(signupData);
      
      // Map từ snake_case (từ authService) sang camelCase
      const accessToken = response.data.access_token || '';
      const refreshToken = response.data.refresh_token || '';
      const user = response.data.user_info || null;
      
      // Lưu tokens và user data vào storage
      await tokenStorage.setTokens(accessToken, refreshToken);
      if (user) {
        await tokenStorage.setUserData(user);
      }
      
      setState({
        isAuthenticated: true,
        user,
        accessToken,
        refreshToken,
        loading: false,
      });
    } catch (error) {
      console.error('Signup error:', error);
      setState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      // Gọi logout API (không quan trọng nếu fail - vẫn clear local state)
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error: any) {
      // Logout có thể fail nếu token đã hết hạn (401) - đây là trường hợp bình thường
      // Không throw error để đảm bảo user vẫn có thể logout
      if (error?.response?.status !== 401) {
        console.error('Logout error:', error);
      }
    } finally {
      // Luôn clear local state và tokens dù API call có thành công hay không
      // Điều này đảm bảo user luôn có thể logout
      await tokenStorage.clearTokens();
      setState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
      });
    }
  };

  // Thay đổi hàm updateUser cho chuẩn theo backend và services
  // Cập nhật thông tin user (khi user chỉnh sửa profile, đổi avatar, ...)
  const updateUser = async (update: UpdateUserRequest) => {
    try {
      const userId = state.user?.user_id;
      if (!userId) throw new Error('No user id');
      const response = await userService.updateUser(userId, update);
      const updatedUser = response.data;
      // Lưu vào storage và cập nhật state
      await tokenStorage.setUserData(updatedUser);
      setState(prev => ({ ...prev, user: updatedUser as UserInfo }));
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  // Upload avatar cho user
  const uploadAvatar = async (imageUri: string) => {
    try {
      const userId = state.user?.user_id;
      if (!userId) throw new Error('No user id');
      const response = await userService.uploadAvatar(userId, imageUri);
      
      // Backend trả về data với các field (có thể là camelCase hoặc snake_case)
      const responseData = response.data;
      
      // Lấy avatar_url mới (hỗ trợ cả camelCase và snake_case)
      const newAvatarUrl = responseData.avatarUrl || responseData.avatar_url || null;
      
      // Nếu backend trả về full user object (có user_id hoặc userId), map toàn bộ
      if (responseData.user_id || responseData.userId) {
        const mappedUser: UserInfo = {
          user_id: responseData.user_id || responseData.userId || state.user?.user_id || '',
          email: responseData.email || state.user?.email || '',
          full_name: responseData.full_name || responseData.fullName || state.user?.full_name || '',
          phone_number: responseData.phone_number || responseData.phoneNumber || state.user?.phone_number || '',
          date_of_birth: responseData.date_of_birth || responseData.dateOfBirth || state.user?.date_of_birth || null,
          gender: responseData.gender || state.user?.gender || 'MALE',
          address: responseData.address || state.user?.address || '',
          avatar_url: newAvatarUrl,
        };
        await tokenStorage.setUserData(mappedUser);
        setState(prev => ({ ...prev, user: mappedUser }));
      } else {
        // Chỉ cập nhật avatar_url nếu backend chỉ trả về một số field
        const updatedUser = {
          ...state.user,
          avatar_url: newAvatarUrl,
        } as UserInfo;
        await tokenStorage.setUserData(updatedUser);
        setState(prev => ({ ...prev, user: updatedUser }));
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  };

  // Làm mới thông tin user từ server (khi cần lấy dữ liệu mới nhất)
  const refreshUser = async () => {
    try {
      // Nếu có API endpoint để lấy user info mới nhất, gọi ở đây
      // Ví dụ: const response = await axiosInstance.get('/auth/profile');
      // Sau đó gọi updateUser(response.data);
      
      // Hoặc đơn giản là reload từ storage (nếu đã được cập nhật ở nơi khác)
      const userData = await tokenStorage.getUserData();
      if (userData) {
        setState(prev => ({
          ...prev,
          user: userData,
        }));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  // Kiểm tra authentication khi app khởi động
  // Chỉ cần load từ storage, không cần verify token
  // Vì axios interceptor sẽ tự động xử lý refresh token khi có lỗi 401
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔐 [AuthContext] Checking authentication...");
        const hasTokens = await tokenStorage.hasValidTokens();
        if (hasTokens) {
          const userData = await tokenStorage.getUserData();
          const accessToken = await tokenStorage.getAccessToken();
          const refreshToken = await tokenStorage.getRefreshToken();
          
          if (userData && accessToken && refreshToken) {
            console.log("✅ [AuthContext] User authenticated:", userData.email);
            // Nếu token không hợp lệ, axios interceptor sẽ tự động refresh khi gọi API
            setState({
              isAuthenticated: true,
              user: userData,
              accessToken,
              refreshToken,
              loading: false,
            });
          } else {
            console.log("⚠️ [AuthContext] Tokens found but data incomplete");
            setState({ ...initialState, loading: false });
          }
        } else {
          console.log("ℹ️ [AuthContext] No valid tokens found");
          setState({ ...initialState, loading: false });
        }
      } catch (error) {
        console.error('❌ [AuthContext] Check auth error:', error);
        setState({ ...initialState, loading: false });
      }
    };

    checkAuth();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    updateUser,
    uploadAvatar,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
