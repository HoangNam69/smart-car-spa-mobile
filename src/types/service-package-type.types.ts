// Service Package Type API Types (snake_case from backend)
export interface ServicePackageType {
  service_package_type_id: string;
  code: string;
  name: string;
  description?: string;
  price_policy?: string;
  applicable_customer_type: string;
  is_default: boolean;
  is_active: boolean;
  display_name?: string;
  created_date?: string;
  modified_date?: string;
  created_by?: string;
  modified_by?: string;
  version?: number;
}

export interface ServicePackageTypeResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: ServicePackageType[];
    page: number;
    size: number;
    total_elements: number;
    total_pages: number;
    first: boolean;
    last: boolean;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface ServicePackageTypePaginatedResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: ServicePackageType[];
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
  };
}

// Create Service Package Type Request (snake_case for backend)
export interface CreateServicePackageTypeRequest {
  code: string;
  name: string;
  description?: string;
  price_policy?: string;
  applicable_customer_type: string;
  is_default?: boolean;
  is_active?: boolean;
}

// Update Service Package Type Request (snake_case for backend)
export interface UpdateServicePackageTypeRequest {
  code: string;
  name: string;
  description?: string;
  price_policy?: string;
  applicable_customer_type: string;
  is_default?: boolean;
  is_active?: boolean;
}

// Update Service Package Type Status Request
export interface UpdateServicePackageTypeStatusRequest {
  is_active: boolean;
}

// Service Package Type Filter Parameters
export interface ServicePackageTypeFilterParam {
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
  search?: string;
  status?: string;
  customerType?: string;
}

// Service Package Type Options
export const SERVICE_PACKAGE_TYPE_CUSTOMER_TYPE_OPTIONS = [
  { value: "ALL", label: "Tất cả", color: "cyan" },
  { value: "NEW", label: "Khách hàng mới", color: "green" },
  { value: "VIP", label: "Khách hàng VIP", color: "gold" },
  { value: "ENTERPRISE", label: "Doanh nghiệp", color: "purple" },
  { value: "REGULAR", label: "Khách hàng thường", color: "blue" },
];


