import { BaseAuditEntity } from "./common.types";

export interface StockTransactionDTO extends BaseAuditEntity {
  id: string;
  type:
    | "PURCHASE_RECEIPT"
    | "SALE"
    | "RETURN"
    | "RESERVATION"
    | "RELEASE"
    | "ADJUSTMENT";
  quantity: number;
  unit_cost: number | null;
  lot_code: string | null;
  lot_id: string | null;
  ref_type:
    | "SALE_ORDER"
    | "PURCHASE_ORDER"
    | "SALE_RETURN"
    | "PURCHASE_RETURN"
    | "ADJUSTMENT"
    | "BOOKING" // QUAN TRỌNG: Booking phải dùng BOOKING, không dùng SALE_ORDER
    | null;
  ref_id: string | null;
  branch_id: string;
  branch_name: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  supplier_name: string | null;
}
