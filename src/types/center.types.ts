export interface Center {
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_active: boolean;
  is_deleted: boolean;
  center_id: string;
  center_name: string;
  center_code: string;
  description: string;
  headquarters_address: string;
  headquarters_phone: string;
  headquarters_email: string;
  website: string;
  tax_code: string;
  business_license: string;
  logo_url: string;
  established_date: string;
  total_branches: number;
  total_employees: number;
  total_customers: number;
  operating_status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  business_hours: string; // JSON string
  contact_info: string; // JSON string
  social_media: string; // JSON string
  service_areas: string; // JSON string
  manager_id: string;
  manager_name: string;
  manager_email: string;
  manager_assigned_at: string;
  manager_assigned_by: string;
}

export interface CenterListResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: Center[];
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

export interface CenterResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: Center;
}

export interface CreateCenterRequest {
  center_name: string;
  center_code: string;
  description: string;
  headquarters_address: string;
  headquarters_phone: string;
  headquarters_email: string;
  website: string;
  tax_code: string;
  business_license: string;
  logo_url: string;
  established_date: string;
  operating_status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  manager_id: string;
  business_hours: string;
  contact_info: string;
  social_media: string;
  service_areas: string;
}

export interface UpdateCenterRequest {
  center_name: string;
  center_code: string;
  description: string;
  headquarters_address: string;
  headquarters_phone: string;
  headquarters_email: string;
  website: string;
  tax_code: string;
  business_license: string;
  logo_url: string;
  established_date: string;
  operating_status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  business_hours: string;
  contact_info: string;
  social_media: string;
  service_areas: string;
  is_active: boolean;
  manager_id: string;
}

export interface DeleteCenterResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: null;
}

// Parsed JSON types for better type safety
export interface BusinessHours {
  monday: { open: string; close: string };
  tuesday: { open: string; close: string };
  wednesday: { open: string; close: string };
  thursday: { open: string; close: string };
  friday: { open: string; close: string };
  saturday: { open: string; close: string };
  sunday: { open: string; close: string };
}

export interface ContactInfo {
  emergency_phone?: string;
  support_email?: string;
  marketing_email?: string;
  vip_line?: string;
}

export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
}

export interface CenterDisplay extends Omit<Center, 'business_hours' | 'contact_info' | 'social_media' | 'service_areas'> {
  business_hours: BusinessHours;
  contact_info: ContactInfo;
  social_media: SocialMedia;
  service_areas: string[];
}

// Interfaces for creating/updating centers with parsed JSON data
export interface CreateCenterFormData {
  center_name: string;
  center_code: string;
  description: string;
  headquarters_address: string;
  headquarters_phone: string;
  headquarters_email: string;
  website: string;
  tax_code: string;
  business_license: string;
  logo_url: string;
  established_date: string;
  operating_status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  manager_id: string;
  business_hours: BusinessHours;
  contact_info: ContactInfo;
  social_media: SocialMedia;
  service_areas: string[];
}

export interface UpdateCenterFormData {
  center_name: string;
  center_code: string;
  description: string;
  headquarters_address: string;
  headquarters_phone: string;
  headquarters_email: string;
  website: string;
  tax_code: string;
  business_license: string;
  logo_url: string;
  established_date: string;
  operating_status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  business_hours: BusinessHours;
  contact_info: ContactInfo;
  social_media: SocialMedia;
  service_areas: string[];
  is_active: boolean;
  manager_id: string;
}
