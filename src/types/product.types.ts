/**
 * Product API Types
 */

import {
  BaseAuditEntity,
  BasePaginationResponse,
  ApiResponse,
} from "./common.types";

export interface ProductSpecifications {
  [key: string]: string;
}

export interface ProductDimensions {
  width?: string;
  height?: string;
  length?: string;
  weight?: string;
  diameter?: string;
  rim_size?: string;
  [key: string]: string | undefined;
}

export interface ProductImageUrls {
  main?: string;
  thumbnail?: string;
  detail?: string;
  label?: string;
  package?: string;
  tread?: string;
  sidewall?: string;
  installation?: string;
  [key: string]: string | undefined;
}

export interface ProductTags {
  [key: string]: string;
}

export interface ProductAttributeValue {
  id?: string; // ID của attribute value
  product_id: string;
  attribute_id: string;
  attribute_name: string;
  attribute_code: string;
  unit?: string | null;
  data_type:
    | "STRING"
    | "NUMBER"
    | "BOOLEAN"
    | "DATE"
    | "DECIMAL"
    | "INTEGER"
    | "TEXT";
  value_text?: string | null;
  value_number?: number | null;
  display_value?: string;
}

export interface Product extends BaseAuditEntity {
  product_id: string;
  product_url: string;
  product_name: string;
  product_type_id: string;
  product_type_name: string;
  description: string;
  unit_of_measure: string;
  brand: string;
  model: string;
  sku: string;
  barcode: string;
  supplier_id: string;
  is_featured: boolean;
  is_active: boolean;
  attribute_values?: ProductAttributeValue[];
}

export interface ProductPaginationData extends BasePaginationResponse {
  content: Product[];
}

export type ProductResponse = ApiResponse<ProductPaginationData>;

// Base product data for API requests (snake_case)
export interface BaseProductData {
  product_name: string;
  product_url: string;
  product_type_id?: string;
  description?: string;
  unit_of_measure: string;
  brand?: string;
  model?: string;
  sku?: string;
  barcode?: string;
  supplier_id?: string;
  is_featured?: boolean;
  attribute_values?: ProductAttributeValueRequest[];
}

export interface ProductAttributeValueRequest {
  attribute_id: string;
  value_text?: string | null;
  value_number?: number | null;
}

export interface CreateProductAttributeValueRequest {
  product_id: string;
  attribute_id: string;
  value_text?: string | null;
  value_number?: number | null;
  operation?: "DELETE"; // Chỉ sử dụng cho DELETE
  id?: string; // ID của attribute value hiện tại (nếu có)
}

export interface UpdateProductAttributeValueRequest {
  value_text?: string | null;
  value_number?: number | null;
}

export interface BulkUpdateProductAttributeValueRequest {
  product_ids: string[];
  attribute_id: string;
  value_text?: string | null;
  value_number?: number | null;
}

export interface ProductAttributeValueUpdateRequest {
  attribute_id: string;
  value_text?: string | null;
  value_number?: number | null;
  operation?: "DELETE"; // Chỉ hỗ trợ DELETE
}

export interface BulkUpdateProductAttributeValuesRequest {
  attribute_values: ProductAttributeValueUpdateRequest[];
}

export interface CreateProductRequest extends BaseProductData {
  is_active?: boolean;
}

export interface UpdateProductRequest extends BaseProductData {
  is_active?: boolean;
}

// Form data interface for UI (camelCase)
export interface ProductFormData {
  productName: string;
  productUrl: string;
  productTypeId?: string;
  description?: string;
  unitOfMeasure: string;
  brand?: string;
  model?: string;
  sku?: string;
  barcode?: string;
  supplierId?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  attributeValues?: ProductAttributeValue[];
}

// For UI components
export interface ProductTableItem extends Product {
  key: string;
}

// Filter and search types
export interface ProductFilters {
  productTypeId?: string;
  brand?: string;
  isFeatured?: boolean;
  is_active?: boolean | "deleted";
  searchText?: string;
}

export interface ProductSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  filters?: ProductFilters;
}

// ProductType Types
export interface ProductType {
  product_type_id: string;
  product_type_name: string;
  product_type_code: string;
  description?: string;
  category_id: string;
  category_name: string;
  is_active: boolean;
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_deleted?: boolean;
  version?: number;
}

export interface ProductTypePaginationData extends BasePaginationResponse {
  content: ProductType[];
}

export type ProductTypeResponse = ApiResponse<ProductTypePaginationData>;

export interface CreateProductTypeRequest {
  product_type_name: string;
  product_type_code: string;
  description?: string;
  category_id: string;
  is_active?: boolean;
}

export interface UpdateProductTypeRequest {
  product_type_name?: string;
  product_type_code?: string;
  description?: string;
  category_id?: string;
  is_active?: boolean;
}

export interface UpdateProductTypeStatusRequest {
  is_active: boolean;
}

export interface ProductTypeFilters {
  categoryId?: string;
  is_active?: boolean | "deleted";
  searchText?: string;
}

export interface ProductTypeSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  filters?: ProductTypeFilters;
}

// ProductAttribute Types
export interface ProductAttribute {
  attribute_id: string;
  attribute_name: string;
  attribute_code: string;
  unit?: string | null;
  is_required: boolean;
  data_type:
    | "STRING"
    | "NUMBER"
    | "BOOLEAN"
    | "DATE"
    | "DECIMAL"
    | "INTEGER"
    | "TEXT";
  display_name?: string;
  is_active: boolean;
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_deleted?: boolean;
  version?: number;
}

export interface ProductAttributePaginationData extends BasePaginationResponse {
  content: ProductAttribute[];
}

export type ProductAttributeResponse =
  ApiResponse<ProductAttributePaginationData>;

export interface CreateProductAttributeRequest {
  attribute_name: string;
  attribute_code: string;
  unit?: string;
  is_required?: boolean;
  data_type?:
    | "STRING"
    | "NUMBER"
    | "BOOLEAN"
    | "DATE"
    | "DECIMAL"
    | "INTEGER"
    | "TEXT";
  is_active?: boolean;
}

export interface UpdateProductAttributeRequest {
  attribute_name?: string;
  attribute_code?: string;
  unit?: string;
  is_required?: boolean;
  data_type?:
    | "STRING"
    | "NUMBER"
    | "BOOLEAN"
    | "DATE"
    | "DECIMAL"
    | "INTEGER"
    | "TEXT";
  is_active?: boolean;
}

export interface UpdateProductAttributeStatusRequest {
  is_active: boolean;
}

export interface ProductAttributeFilters {
  dataType?: string;
  isRequired?: boolean;
  is_active?: boolean | "deleted";
  searchText?: string;
}

export interface ProductAttributeSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  filters?: ProductAttributeFilters;
}

// Product Media/Image Types
export interface ProductMedia {
  media_id: string;
  entity_type:
    | "PRODUCT"
    | "SERVICE"
    | "PACKAGE"
    | "BRANCH"
    | "PROMOTION"
    | "CATEGORY";
  entity_id: string;
  media_url: string;
  media_type: "IMAGE" | "VIDEO" | "FILE" | "DOCUMENT" | "AUDIO";
  is_main: boolean;
  sort_order: number;
  alt_text?: string;
  created_date: string;
  modified_date: string;
}

export interface AddProductImageRequest {
  media_url: string;
  alt_text?: string;
  is_main?: boolean;
  sort_order?: number;
}

export interface UpdateProductImageRequest {
  media_url?: string;
  alt_text?: string;
  is_main?: boolean;
  sort_order?: number;
}

export interface ReorderProductImagesRequest {
  media_orders: MediaOrderDto[];
}

export interface MediaOrderDto {
  media_id: string;
  sort_order: number;
}
