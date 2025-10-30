import { BaseAuditEntity } from "./common.types";

// Technician Types
export interface TechnicianInfo {
  technician_id: string;
  technician_name: string;
  technician_code: string;
  technician_phone: string;
  technician_email: string;
  is_active: boolean;
}

export enum TechnicianStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BUSY = "BUSY",
  ON_BREAK = "ON_BREAK",
}

// Service Bay Types
export interface ServiceBay extends BaseAuditEntity {
  bay_id: string;
  bay_name: string;
  bay_code: string;
  description: string;
  status: BayStatus;
  display_order: number;
  notes?: string;

  // Branch information
  branch_id: string;
  branch_name: string;
  branch_code: string;

  // Statistics
  total_bookings: number;
  active_bookings: number;
  is_available: boolean;
  is_maintenance: boolean;
  is_closed: boolean;
  allow_booking: boolean;
  // Technician fields
  technicians?: TechnicianInfo[];
  technician_count?: number;
  has_technicians?: boolean;
}

// Enums - BayType removed as per requirements

export enum BayStatus {
  ACTIVE = "ACTIVE",
  MAINTENANCE = "MAINTENANCE",
  CLOSED = "CLOSED",
  INACTIVE = "INACTIVE",
}

// API Request/Response Types
export interface ServiceBayResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: ServiceBay[];
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

export interface CreateServiceBayRequest {
  branch_id: string;
  bay_name: string;
  bay_code?: string;
  description?: string;
  display_order?: number;
  status: BayStatus;
  notes?: string;
}

export interface UpdateServiceBayRequest {
  bay_name: string;
  bay_code?: string;
  description?: string;
  display_order?: number;
  status: BayStatus;
  notes?: string;

  // Technician management fields
  technician_ids?: string[];
  default_technician_status?: TechnicianStatus;
  technician_notes?: string;
}

export interface ServiceBayFilterParam {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  branch_id?: string;
  status?: BayStatus;
  search?: string;
  isActive?: boolean;
}

export interface BayAvailabilityRequest {
  start_time: string;
  end_time: string;
}

// UI Helper Types
export interface ServiceBayDropdownItem {
  bay_id: string;
  bay_name: string;
  bay_code: string;
  branch_id: string;
  branch_name: string;
  is_available: boolean;
}

// Constants for UI - BAY_TYPE_OPTIONS removed as BayType enum is removed

export const BAY_STATUS_OPTIONS = [
  { value: BayStatus.ACTIVE, label: "Hoạt động", color: "success" },
  { value: BayStatus.MAINTENANCE, label: "Bảo trì", color: "warning" },
  { value: BayStatus.CLOSED, label: "Tạm đóng", color: "error" },
  { value: BayStatus.INACTIVE, label: "Không hoạt động", color: "default" },
];

// Technician Management Types
export interface AvailableTechnician {
  technician_id: string;
  technician_name: string;
  technician_code: string;
  technician_phone: string;
  technician_email: string;
  is_active: boolean;
}

export interface BulkAssignTechnicianRequest {
  technician_ids: string[];
  status: TechnicianStatus;
  notes?: string;
}

export interface TechnicianAssignmentRequest {
  technician_id: string;
  status: TechnicianStatus;
  notes?: string;
}

// Statistics Types
export interface ServiceBayStatistics {
  bay_id: string;
  bay_name: string;
  total_bookings: number;
  completed_bookings: number;
  active_bookings: number;
  utilization_rate: number;
  average_duration: number;
  revenue: number;
  last_booking_date?: string;
  next_booking_date?: string;
}

// Constants for Technician Status
export const TECHNICIAN_STATUS_OPTIONS = [
  { value: TechnicianStatus.ACTIVE, label: "Hoạt động", color: "success" },
  {
    value: TechnicianStatus.INACTIVE,
    label: "Không hoạt động",
    color: "default",
  },
  { value: TechnicianStatus.BUSY, label: "Bận", color: "processing" },
  {
    value: TechnicianStatus.ON_BREAK,
    label: "Nghỉ giải lao",
    color: "warning",
  },
];
