import axiosInstance from "../config/axiosConfig";

export interface CreateAndPayRequest {
  branch_id: string;
  warehouse_id: string;
  customer_id?: string;
  promotion_ids?: string[];
  lines: {
    product_id: string;
    qty: number;
    unit_price: number;
    is_free_item?: boolean;
  }[];
  payment_method: "BANK" | "CASH";
  return_url?: string;
  cancel_url?: string;
  // Customer info
  shipping_full_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_ward?: string;
  shipping_district?: string;
  shipping_city?: string;
  shipping_notes?: string;
  // Discount tracking
  original_amount?: number;
  total_discount_amount?: number;
  final_amount?: number;
  discount_percentage?: number;
  promotion_snapshot?: string;
  earned_points?: number;
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

export interface CreateAndPayResponse {
  order: {
    id: string;
    order_code: string;
    status: string;
    total_amount: number;
    created_at: string;
  };
  payment: PaymentResponse;
}

export const paymentService = {
  async createAndPay(
    request: CreateAndPayRequest
  ): Promise<CreateAndPayResponse> {
    const response = await axiosInstance.post("/so/create-and-pay", request);
    return response.data.data;
  },
};
