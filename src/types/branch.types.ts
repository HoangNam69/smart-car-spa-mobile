export interface Branch {
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_active: boolean;
  is_deleted: boolean;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  service_slots: number; // Số lượng khu vực dịch vụ cố định
  established_date: string;
  operating_status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  center_id: string;
  center_name: string;
  center_code: string;
  manager_id: string;
  manager_name: string;
  manager_email: string;
  manager_assigned_at: string;
  manager_assigned_by: string;
}

// Service Slot interface
export interface ServiceSlot {
  slot_id: string;
  slot_name: string;
  slot_code: string;
  slot_type: "WASH" | "REPAIR" | "LIFT" | "INSPECTION" | "PAINT" | "DETAILING" | "TIRE" | "GENERAL";
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "CLOSED";
  is_active: boolean;
  display_order: number;
  notes?: string;
}

export interface BranchListResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: Branch[];
    page: number;
    size: number;
    total_elements: number;
    total_pages: number;
    first: boolean;
    last: boolean;
    has_next: boolean | null;
    has_previous: boolean | null;
  };
}

export interface BranchResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: Branch;
}

export interface CreateBranchRequest {
  branch_name: string;
  branch_code: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  service_slots?: number; // Mặc định 8
  established_date?: string;
  center_id: string;
  manager_id?: string;
  operating_status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE"; // Mặc định ACTIVE
}

export interface UpdateBranchRequest {
  branch_name?: string;
  branch_code?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  service_slots?: number;
  established_date?: string;
  center_id?: string;
  manager_id?: string;
  operating_status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  is_active?: boolean;
}

export interface DeleteBranchResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: null;
}

// Parsed JSON types for better type safety
export interface OperatingHours {
  monday: { open: string; close: string };
  tuesday: { open: string; close: string };
  wednesday: { open: string; close: string };
  thursday: { open: string; close: string };
  friday: { open: string; close: string };
  saturday: { open: string; close: string };
  sunday: { open: string; close: string };
}

export interface BranchContactInfo {
  emergency_phone?: string;
  support_email?: string;
  manager_phone?: string;
  vip_line?: string;
}

export interface BranchDisplay extends Omit<Branch, 'operating_hours' | 'contact_info' | 'facilities' | 'services_offered'> {
  operating_hours: OperatingHours;
  contact_info: BranchContactInfo;
  facilities: string[];
  services_offered: string[];
}
