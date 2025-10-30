export interface VehicleProfileRequest {
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
  vehicle_brand_id?: string;
  vehicle_type_id?: string;
  vehicle_model_id?: string;
  owner_id?: string;
}

export interface CreateVehicleProfileRequest {
  license_plate: string;
  description?: string;
  vehicle_brand_id: string;
  vehicle_type_id: string;
  vehicle_model_id: string;
  owner_id: string;
  distance_traveled: number;
}

export interface UpdateVehicleProfileRequest {
  license_plate: string;
  description?: string;
  vehicle_brand_id: string;
  vehicle_type_id: string;
  vehicle_model_id: string;
  owner_id: string;
  distance_traveled: number;
}

export interface CreateVehicleProfileResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: VehicleProfile;
}

export interface VehicleProfile {
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_active: boolean;
  is_deleted: boolean;
  vehicle_id: string;
  license_plate: string;
  description?: string;
  vehicle_brand_id: string;
  vehicle_type_id: string;
  vehicle_model_id: string;
  owner_id: string;
  distance_traveled: number;
}

export interface VehicleProfileResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: VehicleProfile[];
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

// Extended types for UI display (will need to be populated from other APIs)
export interface VehicleProfileDisplay extends VehicleProfile {
  // Brand info (from vehicle_brand_id)
  brand_name?: string;
  brand_logo?: string;
  
  // Type info (from vehicle_type_id)
  type_name?: string;
  type_icon?: string;
  
  // Model info (from vehicle_model_id)
  model_name?: string;
  model_year?: number;
  
  // Owner info (from owner_id)
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  
  // Additional UI fields
  status?: 'active' | 'maintenance' | 'inactive';
  next_service_date?: string;
  insurance_expiry?: string;
  color?: string;
  engine_capacity?: string;
  transmission?: string;
}
