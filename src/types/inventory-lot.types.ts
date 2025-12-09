import { BaseAuditEntity } from "./common.types";

export interface InventoryLotDTO extends BaseAuditEntity {
  lot_id: string;
  lot_code: string | null;
  product_id: string;
  product_name: string;
  product_sku: string;
  supplier_id: string | null;
  supplier_name: string | null;
  branch_id: string;
  branch_name: string;
  received_at: string;
  expiry_date: string | null;
  unit_cost: number;
  qty_received: number;
  qty_current: number;
  qty_sold: number;
  qty_reserved: number;
  qty_available: number;
  status: "ACTIVE" | "DEPLETED" | "EXPIRED" | "EXPIRING_SOON";
}

export interface InventoryLotSummary {
  total_lots: number;
  active_lots: number;
  expiring_soon_lots: number;
  expired_lots: number;
  depleted_lots: number;
  total_qty_received: number;
  total_qty_current: number;
  total_qty_sold: number;
  total_qty_reserved: number;
  total_qty_available: number;
  lots: InventoryLotDTO[];
}
