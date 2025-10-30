export interface SupplierRequest {
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
  supplier_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  bank_name?: string;
  has_contact_person?: boolean;
  has_phone?: boolean;
  has_email?: boolean;
  has_address?: boolean;
  has_bank_info?: boolean;
}

export interface Supplier {
  created_date: string;
  modified_date: string;
  created_by: string;
  modified_by: string;
  is_active: boolean;
  is_deleted: boolean;
  supplier_id: string;
  supplier_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  bank_name: string;
  bank_account: string;
}

export interface SupplierResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: Supplier;
}

export interface SupplierListResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    content: Supplier[];
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

export interface CreateSupplierRequest {
  supplier_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  bank_name?: string;
  bank_account?: string;
}

export interface UpdateSupplierRequest {
  supplier_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  bank_name?: string;
  bank_account?: string;
  is_active?: boolean;
}

