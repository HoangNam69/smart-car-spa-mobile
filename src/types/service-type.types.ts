import { BaseAuditEntity } from "./common.types";

// Service Type API Types - Updated to match backend ServiceTypeInfoDto
export interface ServiceType extends BaseAuditEntity {
  service_type_id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  display_name?: string;
}

// API Request/Response Types
export interface ServiceTypeResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: ServiceType[];
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

// Create Service Type Request
export interface CreateServiceTypeRequest {
  code: string;
  name: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

// Update Service Type Request
export interface UpdateServiceTypeRequest {
  code?: string;
  name?: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

// Service Type Filter Parameters
export interface ServiceTypeFilterParam {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  code?: string;
  name?: string;
  is_active?: boolean;
  search?: string;
}

// Service Type Statistics
export interface ServiceTypeStatistics {
  totalServiceTypes: number;
  activeServiceTypes: number;
  inactiveServiceTypes: number;
  deletedServiceTypes: number;
  averageDuration: number;
  mostUsedServiceType?: string;
  leastUsedServiceType?: string;
}

// Service Type Status Options
export const SERVICE_TYPE_STATUS_OPTIONS = [
  { value: true, label: "Hoạt động", color: "success" },
  { value: false, label: "Không hoạt động", color: "default" },
];
