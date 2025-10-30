// Audit DTO interface to match backend AuditDto
import { AuditDto } from './common.types';
import { ProductAttributeValue } from './product.types';

// Service Product Types
export interface ServiceProduct {
  id: string;
  service_id: string;
  product_id: string;
  product_info: ProductInfo;
  quantity: number;
  unit: string;
  notes?: string;
  is_required: boolean;
  sort_order: number;
  audit: AuditDto;
}

export interface ProductInfo {
  product_id: string;
  product_url: string;
  product_name: string;
  product_type_id: string;
  product_type_name: string;
  description?: string;
  brand?: string;
  model?: string;
  sku?: string;
  barcode?: string;
  unit_of_measure: string;
  supplier_id?: string;
  is_featured: boolean;
  attribute_values: ProductAttributeValue[];
  audit: AuditDto;
}

// Service Process Types
export interface ServiceProcess {
  id: string;
  code: string;
  name: string;
  description?: string;
  estimated_duration: number;
  is_default: boolean;
  is_active: boolean;
  step_count: number;
  process_steps: ProcessStep[];
  audit: AuditDto;
}

export interface ProcessStep {
  id: string;
  name: string;
  description?: string;
  process_id: string;
  process_name: string;
  step_order: number;
  estimated_time: number;
  is_required: boolean;
  is_first_step: boolean;
  is_last_step: boolean;
  audit: AuditDto;
}

// Service API Types - Updated to match backend ServiceInfoDto with audit object
export interface Service {
  service_id: string;
  service_url: string;
  service_name: string;
  category_id?: string;
  category_name?: string;
  description?: string;
  required_skill_level: SkillLevel;
  service_type_id: string;
  service_type_name?: string;
  is_featured: boolean;
  is_active: boolean;
  service_process_id?: string;
  service_process_name?: string;
  service_process_code?: string;
  is_default_process?: boolean;
  estimated_duration?: number;
  branch_id?: string;
  branch_name?: string;
  service_products?: ServiceProduct[];
  service_process?: ServiceProcess;
  audit: AuditDto;
}

// Enums
export enum SkillLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE", 
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT"
}

// API Request/Response Types - Updated to match backend response structure
export interface ServiceResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: Service[] | ServicePageResponse;
}

// For paginated responses
export interface ServicePageResponse {
  content: Service[];
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

// Create Service Request - Updated to include service_products and service_process
export interface CreateServiceRequest {
  service_name: string;
  service_url: string;
  category_id?: string;
  description?: string;
  estimated_duration?: number; // ✅ Thêm estimated_duration
  required_skill_level: SkillLevel;
  service_type_id: string;
  is_featured?: boolean;
  service_products?: ServiceProductRequest[];
  service_process?: ServiceProcessRequest;
}

export interface ServiceProductRequest {
  product_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  is_required: boolean;
  sort_order: number;
  id?: string; // For tracking existing products in edit mode
}

export interface ServiceProcessRequest {
  code?: string; // Optional for update operations
  name: string;
  description?: string;
  is_default: boolean;
  process_steps: ProcessStepRequest[];
}

export interface ProcessStepRequest {
  step_order: number;
  name: string;
  description?: string;
  is_required: boolean;
  is_active: boolean;
  id?: string; // For tracking existing steps in edit mode
}

// Update Service Request - Updated to include service_products and service_process
export interface UpdateServiceRequest {
  service_name?: string;
  service_url?: string;
  category_id?: string;
  description?: string;
  estimated_duration?: number; // ✅ Thêm estimated_duration
  required_skill_level?: SkillLevel;
  service_type_id?: string;
  is_featured?: boolean;
  is_active?: boolean;
  service_products?: ServiceProductRequest[];
  service_process?: ServiceProcessRequest;
}

// Update Service Status Request
export interface UpdateServiceStatusRequest {
  is_active: boolean;
}

// Service Filter Parameters
export interface ServiceFilterParam {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  category_id?: string;
  service_type_id?: string;
  skill_level?: SkillLevel;
  is_featured?: boolean;
  is_active?: boolean;
  branch_id?: string;
  service_process_id?: string;
  is_default_process?: boolean;
  search?: string;
}

// Service Status Options
export const SERVICE_STATUS_OPTIONS = [
  { value: SkillLevel.BEGINNER, label: "Mới bắt đầu", color: "green" },
  { value: SkillLevel.INTERMEDIATE, label: "Trung bình", color: "blue" },
  { value: SkillLevel.ADVANCED, label: "Nâng cao", color: "orange" },
  { value: SkillLevel.EXPERT, label: "Chuyên gia", color: "red" },
];

// Service Type Options (for backward compatibility)
export const SERVICE_TYPE_OPTIONS = [
  { value: "MAINTENANCE", label: "Bảo dưỡng", color: "blue" },
  { value: "REPAIR", label: "Sửa chữa", color: "red" },
  { value: "INSPECTION", label: "Kiểm tra", color: "green" },
  { value: "CLEANING", label: "Vệ sinh", color: "cyan" },
  { value: "CUSTOM", label: "Tùy chỉnh", color: "purple" },
];

// Service Pricing Types - Updated to match backend DTOs
export interface ProcessStepPricingDto {
  step_id: string;
  step_name: string;
  step_order: number;
  estimated_time: number;
  product_cost: number;
  products: ProductPricingDto[];
}

export interface ProductPricingDto {
  product_id: string;
  product_name: string;
  sku: string;
  product_type: string;
  brand: string;
  model: string;
  quantity: number;
  unit: string;
  unit_price: number; // Giá đơn vị từ PriceBook
  total_price: number; // unitPrice * quantity
  policy_type: "FIXED" | "MARKUP_ON_PEAK";
  price_source: "PRICE_BOOK" | "DEFAULT" | "OVERRIDE";
  price_book_id?: string;
  price_book_item_id?: string;
  price_book_name?: string;
  price_calculated_at: string;
}

export interface ServicePricingDto {
  service_id: string;
  service_name: string;
  base_price: number;
  labor_cost: number;
  product_cost: number;
  total_cost: number;
  markup: number;
  final_price: number;
  price_book_id?: string;
  price_book_name?: string;
  process_steps: ProcessStepPricingDto[];
}

export interface ServicePricingInfoDto {
  service_id: string;
  service_name: string;
  base_price: number;
  labor_cost: number;
  product_cost: number;
  total_cost: number;
  markup: number;
  final_price: number;
  last_updated: string;
}

export interface UpdateLaborCostRequest {
  labor_cost: number;
}