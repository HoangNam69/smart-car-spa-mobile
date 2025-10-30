/**
 * Service Process Types
 * Type definitions for service process management
 */

export interface ServiceProcessInfoDto {
  id: string;
  name: string;
  description?: string;
  code: string;
  is_default?: boolean;
  estimated_duration?: number;
  branch_id?: string;
  branch_name?: string;
  processSteps?: ServiceProcessStepInfoDto[]; // Backend might return process_steps
  process_steps?: ServiceProcessStepInfoDto[]; // Backend snake_case
  created_date?: string;
  modified_date?: string;
  created_by?: string;
  modified_by?: string;
  is_active?: boolean;
  is_deleted?: boolean;
}

export interface ServiceProcessStepInfoDto {
  id: string;
  process_id: string;
  step_order: number;
  name: string;
  description?: string;
  estimated_time: number;
  is_required: boolean;
  step_products: ServiceProcessStepProductInfoDto[];
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_active: boolean;
  is_deleted: boolean;
}

export interface ServiceProcessStepProductInfoDto {
  id: string;
  service_process_step_id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_of_measure: string;
  notes?: string;
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_active: boolean;
  is_deleted: boolean;
}

export interface ServiceProcessFilterParam {
  page?: number;
  size?: number;
  search?: string;
  branch_id?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface CreateServiceProcessRequest {
  name: string;
  description?: string;
  code: string;
  is_default?: boolean;
  estimated_duration: number;
  branch_id?: string;
  process_steps: CreateServiceProcessStepRequest[];
}

export interface CreateServiceProcessStepRequest {
  step_order: number;
  name: string;
  description?: string;
  estimated_time: number;
  is_required?: boolean;
  step_products?: CreateServiceProcessStepProductRequest[];
}

export interface CreateServiceProcessStepProductRequest {
  product_id: string;
  quantity: number;
  notes?: string;
}

export interface UpdateServiceProcessRequest {
  name?: string;
  description?: string;
  code?: string;
  is_default?: boolean;
  estimated_duration?: number;
  branch_id?: string;
  process_steps?: UpdateServiceProcessStepRequest[];
}

export interface UpdateServiceProcessStepRequest {
  id?: string;
  step_order?: number;
  name?: string;
  description?: string;
  estimated_time?: number;
  is_required?: boolean;
  step_products?: UpdateServiceProcessStepProductRequest[];
}

export interface UpdateServiceProcessStepProductRequest {
  id?: string;
  product_id?: string;
  quantity?: number;
  notes?: string;
}