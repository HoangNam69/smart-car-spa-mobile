/**
 * User Management related types
 */

import { BaseEntity } from "./common.types";

// User Type
export type UserType = "CUSTOMER" | "EMPLOYEE";

// Customer Rank
export type CustomerRank = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

// Extended User Info for User Management
export interface UserManagementInfo extends BaseEntity {
  user_id: string;
  email: string;
  full_name: string;
  phone_number: string;
  date_of_birth: string | null;
  gender: "MALE" | "FEMALE";
  address: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_deleted: boolean;
  role: {
    role_id: string;
    role_name: string;
    role_code: string;
    description: string;
  };
  user_type: UserType;
  customer_rank: CustomerRank | null;
  accumulated_points: number | null;
  total_orders: number | null;
  total_spent: number | null;
  hired_at: string | null;
  citizen_id: string | null;
}

// Pagination Info
export interface PaginationInfo {
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  first: boolean;
  last: boolean;
  has_next: boolean;
  has_previous: boolean;
}

// Get All Users Request
export interface GetAllUsersRequest {
  page?: number;
  size?: number;
  direction?: "ASC" | "DESC";
  sort?: string;
  userType?: UserType;
}

// Get All Users Response
export interface GetAllUsersResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: UserManagementInfo[];
  } & PaginationInfo;
}

// User Filter Options
export interface UserFilterOptions {
  userType?: UserType;
  isActive?: boolean;
  role?: string;
  customerRank?: CustomerRank;
  search?: string;
}

// User Sort Options
export interface UserSortOptions {
  field: string;
  direction: "ASC" | "DESC";
}

// User Management State
export interface UserManagementState {
  users: UserManagementInfo[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  filters: UserFilterOptions;
  sort: UserSortOptions;
}

// User Statistics
export interface UserStatistics {
  totalUsers: number;
  totalCustomers: number;
  totalEmployees: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
}

// Create User Request
export interface CreateUserRequest {
  email: string;
  password: string;
  googleId?: string | null;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string; // ISO date string
  gender: "MALE" | "FEMALE";
  address: string;
  avatarUrl?: string | null;
  roleCode: "CUSTOMER" | "ADMIN" | "STAFF";
  user_type: UserType;
  
  // Customer-specific fields
  customer_rank?: CustomerRank;
  accumulated_points?: number;
  total_orders?: number;
  total_spent?: number;
  
  // Employee-specific fields
  hired_at?: string; // ISO date string
  citizen_id?: string; // Required for employees
}

// Create User Response
export interface CreateUserResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: UserManagementInfo;
}

// Create User Error Response
export interface CreateUserErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  errorCode: string;
}

// Update User Request
export interface UpdateUserRequest {
  email: string;
  full_name: string;
  phone_number: string;
  date_of_birth: string; // ISO date string
  gender: "MALE" | "FEMALE";
  address: string;
  avatar_url?: string | null; // optional
  is_active?: boolean; // optional
  is_deleted?: boolean; // optional
  role_code?: string; // optional
  customer_rank?: CustomerRank; // optional
  accumulated_points?: number; // optional
  citizen_id?: string | null; // for employee only
}

// Update User Response
export interface UpdateUserResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    user_id: string;
    email: string;
    full_name: string;
    phone_number: string;
    date_of_birth: string;
    gender: "MALE" | "FEMALE";
    address: string;
    avatar_url: string | null;
    role: {
      role_id: string;
      role_name: string;
      role_code: string;
      description: string;
    };
    user_type: UserType;
    customer_rank: CustomerRank | null;
    accumulated_points: number;
    total_orders: number;
    total_spent: number;
    hired_at: string | null;
    citizen_id: string | null;
    created_date: string;
    modified_date: string;
    created_by: string;
    modified_by: string;
    is_active: boolean;
    is_deleted: boolean;
  };
}

// Update User Error Response
export interface UpdateUserErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  errorCode: string;
}