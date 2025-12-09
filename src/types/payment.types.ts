import { SalesOrder } from "@/src/types";

export interface InitiatePaymentRequest {
  sales_order_id: string;
  payment_method: "BANK" | "CASH";
  return_url?: string;
  cancel_url?: string;
}

export interface PaymentResponse {
  payment_id: string;
  sales_order_id: string;
  amount: number;
  payment_url?: string;
  order_code?: number;
  status: string;
  payment_method: "BANK" | "CASH";
  qr_code?: string;
  created_at: string;
}

export interface PaymentStatusResponse {
  payment_id: string;
  sales_order_id: string;
  status:
    | "PENDING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELED"
    | "EXPIRED"
    | "REFUNDED";
  amount: number;
  transaction_id?: string;
  paid_at?: string;
  message: string;
}

export interface CreateAndPayRequest {
  branch_id: string;
  warehouse_id: string;
  customer_id?: string;
  promotion_ids?: string[];
  lines: Array<{
    product_id: string;
    qty: number;
    unit_price: number;
    is_free_item?: boolean;
    // Service item support
    service_id?: string;
    original_booking_id?: string;
    original_booking_code?: string;
  }>;
  payment_method: "BANK" | "CASH";
  return_url?: string;
  cancel_url?: string;
  // Discount tracking fields
  original_amount?: number;
  total_discount_amount?: number;
  final_amount?: number;
  discount_percentage?: number;
  promotion_snapshot?: string; // JSON string of applied promotions
  // Loyalty points field
  earned_points?: number; // Points earned from this purchase (10,000 VNĐ = 1 point)
}

export interface CreateAndPayResponse {
  order: SalesOrder;
  payment: PaymentResponse;
}
