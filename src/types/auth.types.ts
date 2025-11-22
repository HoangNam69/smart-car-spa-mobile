export interface LoginRequest {
  email?: string;
  phone_number?: string;
  password: string;
  device_id?: string; // Optional: device identifier for multi-device support
  device_name?: string; // Optional: human-readable device name
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  phone_number: string;
  new_password: string;
}

export interface SignupRequest {
  email?: string | null;
  password: string;
  google_id?: string | null;
  full_name: string;
  phone_number: string;
  date_of_birth: string; // ISO date string
  gender: "MALE" | "FEMALE";
  address: string;
  avatar_url?: string | null;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  timestamp?: string;
  data: {
    access_token?: string;
    refresh_token?: string;
    user_info?: UserInfo;
  };
}

export interface LoginResponse {
  success: boolean;
  message: string;
  timestamp?: string;
  data: {
    access_token?: string;
    refresh_token?: string;
    user_info?: UserInfo;
  };
}

export interface UserInfo {
  user_id: string;
  email?: string;
  full_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  avatar_url?: string | null;
  is_active?: boolean;
  role?: {
    role_id?: string;
    role_name?: string;
    role_code?: string;
    description?: string;
  };
  user_type?: "CUSTOMER" | "EMPLOYEE";
  customer_rank?: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  accumulated_points?: number;
  total_orders?: number;
  total_spent?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  timestamp?: string;
  data: T;
}
