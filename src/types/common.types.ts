/**
 * Common API types
 */

// Base API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  timestamp: string | null;
  data: T;
}

// Error Response
export interface ApiError {
  success: false;
  message: string;
  timestamp: string | null;
  errors?: Record<string, string[]>;
  error_code?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Common Entity
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  created_date: string;
  modified_date: string;
}

// Base Entity with audit fields
export interface BaseAuditEntity {
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_active: boolean;
  is_deleted: boolean;
}

// Audit DTO for backend response
export interface AuditDto {
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_active: boolean;
  is_deleted: boolean;
}

// Base pagination response
export interface BasePaginationResponse {
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  empty: boolean;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request Config
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
}

export interface BranchRef { id: string; }
export interface WarehouseRef { id: string; }
export interface ProductRef {
  id: string;
  product_id: string;
}
