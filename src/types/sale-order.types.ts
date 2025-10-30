import { UUID } from "node:crypto";
import { BookingInfoDto } from "./booking.types";
import { Branch } from "./branch.types";
import {
  BaseAuditEntity,
  BranchRef,
  ProductRef,
  WarehouseRef
} from "./common.types";
import { Product } from "./product.types";
import { UserManagementInfo } from "./user.types";

export interface SalesOrderLineInput extends BaseAuditEntity {
  product: ProductRef;
  qty: number;
  unitPrice?: number;
}

export interface SalesOrderInput extends BaseAuditEntity {
  branch: BranchRef;
  warehouse: WarehouseRef;
  lines: SalesOrderLineInput[];
}

export interface SalesOrderLine {
  id: UUID;
  product: ProductRef;
  quantity: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: UUID;
  status: "DRAFT" | "CONFIRMED" | "FULFILLED" | string;
  branch: BranchRef;
  warehouse: WarehouseRef;
  lines: SalesOrderLine[];
}

export interface CreateSORequest {
  branch_id: string;
  warehouse_id: string;
  customer_id?: string;
  lines: CreateSOLine[];
}

export interface CreateSOLine {
  product_id: string;
  qty: number;
  unit_price?: number;
}

export interface CreateReturnRequest {
  items: ReturnItem[];
  reason: string; // Required field with default "Hoàn trả hàng"
}

export interface ReturnItem {
  product_id: string;
  qty: number;
  unit_cost: number;
}

export interface SaleOrderResponse extends BaseAuditEntity {
  id: UUID;
  customer?: UserManagementInfo;
  branch: Branch;
  status:
    | "DRAFT"
    | "CONFIRMED"
    | "FULFILLED"
    | "PARTIALLY_RETURNED"
    | "RETURNED"
    | "CANCELLED";
  lines: SaleOrderLineResponse[];

  // Discount tracking fields
  original_amount?: number;
  total_discount_amount?: number;
  final_amount?: number; // Final amount after discount (amount to pay)
  discount_percentage?: number;
  promotion_snapshot?: string; // JSON array of applied promotions

  // Cancellation reason if status is CANCELLED
  cancellation_reason?: string;

  // Booking information if this is a booking invoice
  booking_info?: BookingInfoDto;
}

export interface SaleOrderLineResponse extends BaseAuditEntity {
  id: UUID;
  product: Product;
  quantity: number;
  unit_price: number;
  is_free_item?: boolean;
  // Service item fields
  service_id?: string;
  is_service_item?: boolean;
  // Booking context fields
  original_booking_id?: string;
  original_booking_code?: string;
}

export interface SaleReturnResponse extends BaseAuditEntity {
  id: string;
  reason: string;
  sales_order: SaleOrderResponse;
  branch: Branch;
  lines: SaleReturnItemResponse[];
}

export interface SaleReturnItemResponse extends BaseAuditEntity {
  id: string;
  product: Product;
  quantity: number;
}

export interface PagedSaleOrderResponse {
  content: SaleOrderResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
