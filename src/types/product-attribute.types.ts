/**
 * Product Attribute Management Types
 * Type definitions for product attribute-related API requests and responses
 */

export interface ProductAttributeInfoDto {
  attribute_id: string;
  attribute_name: string;
  attribute_code: string;
  unit?: string | null;
  is_required: boolean;
  data_type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'DECIMAL' | 'INTEGER' | 'TEXT';
  is_active: boolean;
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_deleted?: boolean;
  version?: number;
}

export enum AttributeDataType {
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  DECIMAL = "DECIMAL",
  BOOLEAN = "BOOLEAN",
  DATE = "DATE",
  DATETIME = "DATETIME",
  TIME = "TIME",
  SELECT = "SELECT",
  MULTI_SELECT = "MULTI_SELECT",
  TEXTAREA = "TEXTAREA",
  URL = "URL",
  EMAIL = "EMAIL",
  PHONE = "PHONE",
  COLOR = "COLOR",
  FILE = "FILE",
  IMAGE = "IMAGE"
}

export interface ProductAttributeFilterParam {
  page?: number;
  size?: number;
  attributeName?: string;
  attributeCode?: string;
  dataType?: AttributeDataType;
  isRequired?: boolean;
  isActive?: boolean;
  search?: string;
  sort?: string;
  direction?: "ASC" | "DESC";
}

export interface CreateProductAttributeRequest {
  attributeName: string;
  attributeCode: string;
  description?: string;
  dataType: AttributeDataType;
  unit?: string;
  isRequired?: boolean;
  isActive?: boolean;
  defaultValue?: string;
  validationRules?: Record<string, any>;
  options?: string[];
  sortOrder?: number;
}

export interface UpdateProductAttributeRequest {
  attributeName?: string;
  attributeCode?: string;
  description?: string;
  dataType?: AttributeDataType;
  unit?: string;
  isRequired?: boolean;
  isActive?: boolean;
  defaultValue?: string;
  validationRules?: Record<string, any>;
  options?: string[];
  sortOrder?: number;
}

export interface UpdateProductAttributeStatusRequest {
  isActive: boolean;
}

export interface ProductAttributeStatsDto {
  totalAttributes: number;
  activeAttributes: number;
  inactiveAttributes: number;
  requiredAttributes: number;
  optionalAttributes: number;
  attributesByDataType: Record<AttributeDataType, number>;
  mostUsedAttributes: {
    attributeId: string;
    attributeName: string;
    usageCount: number;
  }[];
  recentAttributes: number;
}

export interface ProductAttributePaginationData {
  content: ProductAttributeInfoDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface ProductAttributeResponse {
  success: boolean;
  message: string;
  data: ProductAttributePaginationData;
}

export interface ProductAttributeStatsResponse {
  success: boolean;
  message: string;
  data: ProductAttributeStatsDto;
}

export interface ProductAttributeValidationResponse {
  success: boolean;
  message: string;
  data: boolean;
}
