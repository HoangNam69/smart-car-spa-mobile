import {BaseAuditEntity} from './common.types';
import {Branch, Product} from "@/lib/api";

export interface InventoryView extends BaseAuditEntity {
  on_hand: number;
  reserved: number;
  available: number;
}

export interface InventoryLevel extends BaseAuditEntity {
  product: Product,
  branch: Branch,
  on_hand: number,
  reserved: number,
  available: number,
}

export interface StockRequest {
  branch_id: string;
  product_id: string;
  qty: number;
  unit_cost: number;
  lot_code: string;
  refId: string;
  ref_type: "SALE_ORDER" | "SALE_RETURN" | "PURCHASE_ORDER" | "PURCHASE_RETURN" | "ADJUSTMENT";
}

// New types for booking inventory operations
export interface BookingInventoryRequest {
  branch_id: string;
  product_id: string;
  qty: number;
  ref_id: string;
  ref_type: "SALE_ORDER";
}

export interface BookingInventoryResponse {
  success: boolean;
  message?: string;
}

export interface InventoryLevelsBatchRequest {
  branch_id: string;
  product_ids: string[];
}


export interface InventoryLevelsBatchResponse {
  items: { [productId: string]: InventoryView };
}
