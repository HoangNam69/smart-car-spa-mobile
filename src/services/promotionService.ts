import axiosInstance from "../config/axiosConfig";

export interface PromotionLine {
  promotion_line_id: string;
  line_type: "ALL" | "PRODUCT" | "CATEGORY";
  target_id?: string;
  discount_type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_PRODUCT" | "BUY_X_GET_Y";
  discount_value: number;
  max_discount_amount?: number;
  min_order_value?: number;
  min_quantity?: number;
  buy_qty?: number;
  get_qty?: number;
  free_product?: {
    product_id: string;
    product_name: string;
  };
  free_quantity?: number;
  line_priority: number;
  is_active: boolean;
  start_at?: string;
  end_at?: string;
}

export interface Promotion {
  promotion_id: string;
  promotion_code: string;
  name: string;
  description?: string;
  start_at: string;
  end_at: string;
  usage_limit?: number;
  per_customer_limit?: number;
  priority: number;
  is_stackable: boolean;
  coupon_redeem_once?: boolean;
  is_active?: boolean;
  total_usage_count?: number;
  branch?: {
    branch_id: string;
    branch_name: string;
    branch_url: string;
  };
  promotion_lines: PromotionLine[];
}

export interface PromotionFilterParam {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  branchId?: string;
  keyword?: string;
}

export const promotionService = {
  async getActivePromotions(params: PromotionFilterParam = {}): Promise<{
    content: Promotion[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }> {
    const {
      page = 0,
      size = 100,
      sort = "createdDate",
      direction = "DESC",
      ...filters
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: sort,
      direction: direction,
    });

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          for (const v of value) {
            queryParams.append(key, v.toString());
          }
        } else {
          queryParams.append(key, value.toString());
        }
      }
    }

    const response = await axiosInstance.get(
      `/promotions/active?${queryParams.toString()}`
    );
    return response.data.data;
  },
};
