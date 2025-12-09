// Service Package Service Item (snake_case from backend)
export interface ServicePackageServiceItem {
  service_package_service_id?: string;
  package_id?: string;
  service_id?: string | null;
  service_name?: string;
  service_url?: string;
  service_description?: string;
  service_standard_duration?: number;
  service_base_price?: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  is_required: boolean;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

// Service Package API Types (snake_case from backend)
export interface ServicePackage {
  package_id: string;
  package_url: string;
  package_name: string;
  category_id: string;
  category_name: string;
  description: string;
  total_duration: number;
  package_price: number;
  service_cost: number;
  service_package_type_id: string;
  service_package_type_name?: string | null;
  is_active: boolean;
  is_deleted?: boolean;
  package_services: ServicePackageServiceItem[];
  service_process_id?: string;
  service_process_name?: string;
  service_process_code?: string;
  is_default_process?: boolean;
  service_count?: number;
  audit?: {
    created_date?: string;
    modified_date?: string;
    created_by?: string;
    modified_by?: string;
  };
}


export interface ServicePackageResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: ServicePackage[];
}

// Paginated response interface matching backend structure
export interface ServicePackagePaginatedResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: ServicePackage[];
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


// Create Service Package Request (snake_case for backend)
export interface CreateServicePackageRequest {
  package_name: string;
  package_url: string;
  category_id: string;
  description: string;
  total_duration: number;
  service_package_type_id: string;
  package_services: CreateServicePackageServiceRequest[];
  service_process_id?: string;
  is_default_process?: boolean;
}

// Create Service Package Service Request (snake_case for backend)
export interface CreateServicePackageServiceRequest {
  service_id: string;
  quantity: number;
  unit_price?: number;
  notes?: string;
  is_required?: boolean;
}

// Update Service Package Request (snake_case for backend)
export interface UpdateServicePackageRequest {
  package_name: string;
  package_url: string;
  category_id: string;
  description: string;
  total_duration: number;
  service_package_type_id: string;
  is_active: boolean;
  package_services: UpdateServicePackageServiceRequest[];
  service_process_id?: string;
  is_default_process?: boolean;
}

// Update Service Package Service Request (snake_case for backend)
export interface UpdateServicePackageServiceRequest {
  service_id: string;
  service_package_service_id?: string; // For DELETE operations
  quantity: number;
  unit_price?: number;
  notes?: string;
  is_required?: boolean;
  operation?: "CREATE" | "UPDATE" | "DELETE";
}

// Update Service Package Status Request
export interface UpdateServicePackageStatusRequest {
  is_active: boolean;
}

