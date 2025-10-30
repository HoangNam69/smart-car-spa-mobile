/**
 * Category API Types
 */

export interface CategoryBreadcrumb {
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_active: boolean;
  is_deleted: boolean;
  category_id: string;
  category_url: string;
  category_name: string;
  parent_category_id: string | null;
  level: number;
  path: string;
  url_path: string;
}

export interface Category {
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_active: boolean;
  is_deleted: boolean;
  category_id: string;
  category_code: string;
  category_name: string;
  category_url: string;
  parent_category_id: string | null;
  description: string;
  category_type: "PRODUCT" | "SERVICE" | "PROMOTION" | "OTHER";
  level: number;
  sort_order: number;
  subcategories: Category[];
  subcategory_count?: number;
  breadcrumb: CategoryBreadcrumb[];
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: Category[];
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

export interface CreateCategoryRequest {
  category_name: string;
  category_url: string;
  description: string;
  type: "PRODUCT" | "SERVICE" | "PRODUCT-SYSTEM" | "SERVICE-SYSTEM" | "PROMOTION-SYSTEM" | "OTHER";
  parent_category_id?: string | null;
  is_active?: boolean;
}

export interface UpdateCategoryRequest {
  category_id: string;
  category_name?: string;
  category_url?: string;
  description?: string;
  type?: "PRODUCT" | "SERVICE" | "OTHER";
  parent_category_id?: string | null;
  is_active?: boolean;
}

export interface UpdateCategoryStatusRequest {
  category_id: string;
  is_active: boolean;
}

export interface CategoryFormData {
  category_name: string;
  category_url: string;
  description: string;
  type: "PRODUCT" | "SERVICE" | "PRODUCT-SYSTEM" | "SERVICE-SYSTEM" | "PROMOTION-SYSTEM" | "OTHER";
  parent_category_id?: string | null;
  is_active: boolean;
}

// Tree structure for UI
export interface CategoryTreeNode extends Category {
  key: string;
  children?: CategoryTreeNode[];
  expanded?: boolean;
}
