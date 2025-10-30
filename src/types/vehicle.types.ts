/**
 * Vehicle related types
 */

import { BaseEntity } from "./common.types";

// Vehicle Brand
export interface VehicleBrand extends BaseEntity {
  brand_id: string;
  brand_name: string;
  brand_code: string;
  description: string;
  brand_logo_url: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_by: string;
  modified_by: string;
}

// Pagination Info for Vehicle Brands
export interface VehicleBrandPaginationInfo {
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  first: boolean;
  last: boolean;
  has_next: boolean;
  has_previous: boolean;
}

// Get All Vehicle Brands Request
export interface GetAllVehicleBrandsRequest {
  page?: number;
  size?: number;
  direction?: "ASC" | "DESC";
  sort?: string;
}

// Get All Vehicle Brands Response
export interface GetAllVehicleBrandsResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: VehicleBrand[];
  } & VehicleBrandPaginationInfo;
}

// Vehicle Brand Filter Options
export interface VehicleBrandFilterOptions {
  search?: string;
  isActive?: boolean;
  brandCode?: string;
}

// Vehicle Brand Sort Options
export interface VehicleBrandSortOptions {
  field: string;
  direction: "ASC" | "DESC";
}

// Vehicle Brand Management State
export interface VehicleBrandManagementState {
  brands: VehicleBrand[];
  pagination: VehicleBrandPaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  filters: VehicleBrandFilterOptions;
  sort: VehicleBrandSortOptions;
}


// Vehicle Brand Dropdown Item
export interface VehicleBrandDropdownItem {
  brand_id: string;
  brand_name: string;
  brand_code: string;
}

// Vehicle Brand Dropdown Response
export interface VehicleBrandDropdownResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: VehicleBrandDropdownItem[];
}

// Single Vehicle Brand Response
export interface VehicleBrandResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: VehicleBrand;
}

// Create Vehicle Brand Request
export interface CreateVehicleBrandRequest {
  brand_name: string;
  brand_code: string;
  description: string;
  brand_logo_url?: string;
}

// Create Vehicle Brand Response
export interface CreateVehicleBrandResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: VehicleBrand;
}

// Update Vehicle Brand Request
export interface UpdateVehicleBrandRequest {
  brand_name: string;
  brand_code: string;
  description: string;
  brand_logo_url?: string;
}

// Update Vehicle Brand Response
export interface UpdateVehicleBrandResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: VehicleBrand;
}

// Delete Vehicle Brand Response
export interface DeleteVehicleBrandResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: null;
}

// Vehicle Type Entity
export interface VehicleType extends BaseEntity {
  type_id: string;
  type_name: string;
  type_code: string;
  description: string;
  is_active: boolean;
  is_deleted: boolean;
  created_by: string;
  modified_by: string;
}

// Vehicle Type Pagination Info
export interface VehicleTypePaginationInfo {
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  first: boolean;
  last: boolean;
  has_next: boolean;
  has_previous: boolean;
}

// Get All Vehicle Types Request
export interface GetAllVehicleTypesRequest {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  active?: boolean;
  deleted?: boolean;
  search?: string;
  created_date_from?: string;
  created_date_to?: string;
  modified_date_from?: string;
  modified_date_to?: string;
}

// Get All Vehicle Types Response
export interface GetAllVehicleTypesResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: VehicleType[];
  } & VehicleTypePaginationInfo;
}

// Create Vehicle Type Request
export interface CreateVehicleTypeRequest {
  type_name: string;
  type_code: string;
  description: string;
}

// Create Vehicle Type Response
export interface CreateVehicleTypeResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: VehicleType;
}

// Update Vehicle Type Request
export interface UpdateVehicleTypeRequest {
  type_name: string;
  type_code: string;
  description: string;
}

// Update Vehicle Type Response
export interface UpdateVehicleTypeResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: VehicleType;
}

// Delete Vehicle Type Response
export interface DeleteVehicleTypeResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: string;
}

// Vehicle Type Dropdown Item
export interface VehicleTypeDropdownItem {
  type_id: string;
  type_name: string;
  type_code: string;
}

// Vehicle Type Dropdown Response
export interface VehicleTypeDropdownResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: VehicleTypeDropdownItem[];
}

// Single Vehicle Type Response
export interface VehicleTypeResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: VehicleType;
}

// ==================== VEHICLE MODEL TYPES ====================

// Vehicle Model Entity
export interface VehicleModel extends BaseEntity {
  model_id: string;
  model_name: string;
  model_code: string;
  brand_id: string;
  brand_name?: string;
  type_id: string;
  type_name?: string;
  description: string;
  is_active: boolean;
  is_deleted: boolean;
  created_by: string;
  modified_by: string;
}

// Vehicle Model Pagination Info
export interface VehicleModelPaginationInfo {
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
  first: boolean;
  last: boolean;
  has_next: boolean;
  has_previous: boolean;
}

// Get All Vehicle Models Request
export interface GetAllVehicleModelsRequest {
  page?: number;
  size?: number;
  direction?: "ASC" | "DESC";
  sort?: string;
  search?: string;
  brand_id?: string;
  type_id?: string;
  year_from?: number;
  year_to?: number;
  fuel_type?: string;
  is_active?: boolean;
  is_deleted?: boolean;
}

// Get All Vehicle Models Response
export interface GetAllVehicleModelsResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: VehicleModel[];
  } & VehicleModelPaginationInfo;
}

// Create Vehicle Model Request
export interface CreateVehicleModelRequest {
  model_name: string;
  model_code: string;
  description: string;
  brand_id: string;
  type_id: string;
}

// Create Vehicle Model Response
export interface CreateVehicleModelResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    created_date: string;
    modified_date: string;
    created_by: string;
    modified_by: string;
    is_active: boolean;
    is_deleted: boolean;
    model_id: string;
    model_name: string;
    model_code: string;
    description: string;
    brand_id: string;
    type_id: string;
  };
}

// Update Vehicle Model Request
export interface UpdateVehicleModelRequest {
  model_name: string;
  model_code: string;
  description: string;
  brand_id: string;
  type_id: string;
}

// Update Vehicle Model Response
export interface UpdateVehicleModelResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    created_date: string;
    modified_date: string;
    created_by: string;
    modified_by: string;
    is_active: boolean;
    is_deleted: boolean;
    model_id: string;
    model_name: string;
    model_code: string;
    description: string;
    brand_id: string;
    type_id: string;
  };
}

// Delete Vehicle Model Response
export interface DeleteVehicleModelResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: string;
}

// Single Vehicle Model Response
export interface VehicleModelResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: VehicleModel;
}

// Vehicle Model Dropdown Item
export interface VehicleModelDropdownItem {
  model_id: string;
  model_name: string;
  model_code: string;
  brand_name: string;
  year: number;
}

// Vehicle Model Dropdown Response
export interface VehicleModelDropdownResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: VehicleModelDropdownItem[];
}