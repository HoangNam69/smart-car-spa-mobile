// Promotion Management Types - Aligned with Backend

// === ENUMS ===
import { BaseAuditEntity } from "./common.types";

export enum LineType {
  ALL = "ALL",
  CATEGORY = "CATEGORY",
  PRODUCT = "PRODUCT",
  SERVICE = "SERVICE",
}

export enum DiscountType {
  PERCENT = "PERCENT",
  AMOUNT = "AMOUNT",
  FREE_PRODUCT = "FREE_PRODUCT",
  BUY_X_GET_Y = "BUY_X_GET_Y",
}

export const DiscountTypeArr = [
  DiscountType.PERCENT,
  DiscountType.AMOUNT,
  DiscountType.FREE_PRODUCT,
  DiscountType.BUY_X_GET_Y,
];

// === MAIN ENTITIES ===
export interface Promotion extends BaseAuditEntity {
  promotion_id: string;
  promotion_code?: string; // Mã coupon hoặc mã nội bộ
  name: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  usage_limit?: number; // Tổng số lần dùng (NULL = unlimited)
  per_customer_limit?: number; // Số lần cho mỗi khách hàng (NULL = unlimited)
  priority: number; // Ưu tiên (lower = ưu tiên cao)
  is_stackable: boolean; // Có cộng dồn với KM khác hay không
  coupon_redeem_once: boolean; // Dùng 1 lần mã coupon (nếu coupon)
  branch?: BranchFlat; // Nếu chỉ áp dụng cho 1 chi nhánh
  promotion_lines: PromotionLine[];
  usages?: PromotionUsage[];
  total_usage_count?: number;
  is_expired?: boolean;
  is_available?: boolean;
}

export interface PromotionLine {
  promotion_line_id?: string;
  promotion?: Promotion;
  line_type: LineType; // PRODUCT | CATEGORY | SERVICE | ALL
  target_id?: string; // product_id / category_id / service_id (NULL nếu line_type = ALL)
  branch?: BranchFlat; // override: chỉ áp dụng ở branch này
  discount_type: DiscountType; // PERCENT | AMOUNT | BUY_X_GET_Y | FREE_PRODUCT | FIXED_PRICE
  discount_value?: number; // % (10 = 10%) hoặc số tiền
  max_discount_amount?: number; // Giới hạn giảm tối đa (áp dụng cho %)
  min_order_value?: number; // Điều kiện cho order-level
  min_quantity?: number; // Điều kiện cho product qty
  buy_qty?: number; // Cho BUY_X_GET_Y
  get_qty?: number; // Cho BUY_X_GET_Y
  free_product?: ProductFlat; // Cho FREE_PRODUCT
  free_quantity?: number; // Số lượng sản phẩm tặng
  start_at?: string; // Optional override line-level thời gian
  end_at?: string;
  line_priority: number; // Để sắp xếp khi cùng áp dụng nhiều line
  is_active: boolean;
  created_at: string;
}

export interface PromotionUsage extends BaseAuditEntity {
  usage_id: string;
  promotion: Promotion;
  promotion_line?: PromotionLine;
  customer?: CustomerFlat; // Customer sử dụng KM (nếu có)
  order_id?: string; // Order tham chiếu
  coupon_code?: string;
  discount_amount: number; // Số tiền được giảm
  used_at: string; // Thời điểm sử dụng
}

// === NESTED ENTITIES ===
export interface BranchFlat {
  branch_id: string;
  branch_name: string;
  branch_url?: string;
}

export interface ProductFlat {
  product_id: string;
  product_name: string;
  product_url?: string;
}

export interface CategoryFlat {
  category_id: string;
  category_name: string;
  category_url?: string;
}

export interface ServiceFlat {
  service_id: string;
  service_name: string;
  service_url?: string;
}

export interface CustomerFlat {
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
}

// === REQUEST TYPES ===
export interface CreatePromotionRequest {
  promotion_code?: string;
  name: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  usage_limit?: number;
  per_customer_limit?: number;
  priority?: number;
  is_stackable?: boolean;
  coupon_redeem_once?: boolean;
  branch_id?: string;
  promotion_lines?: CreatePromotionLineRequest[];
  is_active: boolean;
}

export interface CreatePromotionLineRequest {
  line_type: LineType;
  target_id?: string;
  branch_id?: string;
  discount_type: DiscountType;
  discount_value?: number;
  max_discount_amount?: number;
  min_order_value?: number;
  min_quantity?: number;
  buy_qty?: number;
  get_qty?: number;
  free_product_id?: string;
  free_quantity?: number;
  start_at?: string;
  end_at?: string;
  line_priority?: number;
  is_active?: boolean;
}

export interface UpdatePromotionRequest {
  promotion_code?: string;
  name?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  usage_limit?: number;
  per_customer_limit?: number;
  priority?: number;
  is_stackable?: boolean;
  coupon_redeem_once?: boolean;
  branch_id?: string;
  promotion_lines?: UpdatePromotionLineRequest[];
  is_active?: boolean;
}

export interface UpdatePromotionLineRequest {
  promotion_line_id?: string;
  line_type?: LineType;
  target_id?: string;
  branch_id?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  max_discount_amount?: number;
  min_order_value?: number;
  min_quantity?: number;
  buy_qty?: number;
  get_qty?: number;
  free_product_id?: string;
  free_quantity?: number;
  start_at?: string;
  end_at?: string;
  line_priority?: number;
  is_active?: boolean;
}

export interface ApplyPromotionRequest {
  customer_id?: string;
  order_amount: number;
  service_ids?: string[];
  product_ids?: string[];
  coupon_code?: string;
}

// === FILTER PARAMS ===
export interface PromotionFilterParam {
  // Pagination
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";

  // Basic filters
  promotion_code?: string;
  name?: string;
  branch_id?: string;
  is_stackable?: boolean;
  coupon_redeem_once?: boolean;
  is_active?: boolean;

  // Discount value range
  min_discount_value?: number;
  max_discount_value?: number;

  // Order amount range
  min_order_amount?: number;
  max_order_amount?: number;

  // Usage limits
  has_usage_limit?: boolean;
  usage_limit_exceeded?: boolean;
  min_usage_count?: number;
  max_usage_count?: number;

  // Date ranges
  start_at_from?: string;
  start_at_to?: string;
  end_at_from?: string;
  end_at_to?: string;

  // Status filters
  is_expired?: boolean;
  is_available?: boolean;
  is_starting_soon?: boolean;
  is_ending_soon?: boolean;

  // Target filters
  target_service_id?: string;
  target_product_id?: string;
  target_branch_id?: string;

  // Free item filters
  has_free_item?: boolean;
  free_product_id?: string;

  // Buy X Get Y filters
  has_buy_x_get_y?: boolean;

  // Priority filters
  min_priority?: number;
  max_priority?: number;

  // Search filters
  search?: string;
  description?: string;

  // Statistical filters
  most_used?: boolean;
  least_used?: boolean;
  never_used?: boolean;
}

// === ANALYTICS ===
export interface PromotionAnalytics {
  totalUsage: number;
  totalCustomers: number;
  totalDiscountGiven: number;
  averageDiscountPerOrder: number;
  conversionRate: number;
  topUsedPromotions: {
    promotionId: string;
    promotionName: string;
    usageCount: number;
  }[];
  usageByDay: {
    date: string;
    usageCount: number;
    discountAmount: number;
  }[];
}

// === VALIDATION RESPONSE ===
export interface PromotionValidationResult {
  is_valid: boolean;
  promotion_id?: string;
  promotion_name?: string;
  discount_amount?: number;
  errors?: string[];
  warnings?: string[];
}

// === OPTIONS FOR UI ===
export const LINE_TYPE_OPTIONS = [
  {
    value: LineType.ALL,
    label: "Tất cả",
    description: "Áp dụng cho tất cả sản phẩm/dịch vụ",
  },
  {
    value: LineType.CATEGORY,
    label: "Danh mục",
    description: "Áp dụng cho danh mục cụ thể",
  },
  {
    value: LineType.PRODUCT,
    label: "Sản phẩm",
    description: "Áp dụng cho sản phẩm cụ thể",
  },
  {
    value: LineType.SERVICE,
    label: "Dịch vụ",
    description: "Áp dụng cho dịch vụ cụ thể",
  },
];

export const DISCOUNT_TYPE_OPTIONS = [
  {
    value: DiscountType.PERCENT,
    label: "Giảm theo phần trăm",
    icon: "",
    description: "Giảm giá theo tỷ lệ phần trăm",
  },
  {
    value: DiscountType.AMOUNT,
    label: "Giảm số tiền cố định",
    icon: "💰",
    description: "Giảm một số tiền cố định",
  },
  {
    value: DiscountType.FREE_PRODUCT,
    label: "Tặng kèm sản phẩm",
    icon: "🎁",
    description: "Tặng kèm sản phẩm khi mua hàng",
  },
  {
    value: DiscountType.BUY_X_GET_Y,
    label: "Mua X tặng Y",
    icon: "🎯",
    description: "Mua một số lượng nhất định được tặng sản phẩm",
  },
];

// === HELPER FUNCTIONS ===
export const getLineTypeLabel = (type: LineType): string => {
  const option = LINE_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option ? option.label : type;
};

export const getDiscountTypeLabel = (type: DiscountType): string => {
  const option = DISCOUNT_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option ? option.label : type;
};

export const getDiscountTypeIcon = (type: DiscountType): string => {
  const option = DISCOUNT_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option ? option.icon : "❓";
};

export const isPromotionExpired = (endDate?: string): boolean => {
  if (!endDate) return false;
  const now = new Date();
  const end = new Date(endDate);
  return now > end;
};

export const isPromotionActive = (promotion: Promotion): boolean => {
  const now = new Date();
  const start = promotion.start_at ? new Date(promotion.start_at) : null;
  const end = promotion.end_at ? new Date(promotion.end_at) : null;

  const withinPeriod = (!start || now >= start) && (!end || now <= end);
  return withinPeriod;
};

export const isPromotionAvailable = (promotion: Promotion): boolean => {
  // Kiểm tra thời gian
  if (!isPromotionActive(promotion)) return false;

  // Kiểm tra usage limit
  if (promotion.usage_limit && promotion.total_usage_count) {
    if (promotion.total_usage_count >= promotion.usage_limit) return false;
  }

  return true;
};

export const canPromotionsStack = (
  promo1: Promotion,
  promo2: Promotion
): boolean => {
  return promo1.is_stackable && promo2.is_stackable;
};

export const formatDiscountValue = (
  type: DiscountType,
  value?: number
): string => {
  if (value === undefined || value === null) return "-";

  switch (type) {
    case DiscountType.PERCENT:
      return `${value}%`;
    case DiscountType.AMOUNT:
      return `${value.toLocaleString()} ₫`;
    case DiscountType.FREE_PRODUCT:
      return `${value} sản phẩm`;
    case DiscountType.BUY_X_GET_Y:
      return `Mua ${value} tặng 1`;
    default:
      return value?.toString();
  }
};

export const getUsagePercentage = (used?: number, limit?: number): number => {
  if (!limit || !used) return 0;
  return Math.round((used / limit) * 100);
};

export const calculateDiscount = (
  line: PromotionLine,
  originalAmount: number,
  quantity: number
): number => {
  let discount = 0;

  switch (line.discount_type) {
    case DiscountType.PERCENT:
      discount = (originalAmount * (line.discount_value || 0)) / 100;
      if (line.max_discount_amount && discount > line.max_discount_amount) {
        discount = line.max_discount_amount;
      }
      break;

    case DiscountType.AMOUNT:
      discount = Math.min(line.discount_value || 0, originalAmount);
      break;

    case DiscountType.BUY_X_GET_Y:
      if (
        line.buy_qty &&
        line.get_qty &&
        line.buy_qty > 0 &&
        line.get_qty > 0
      ) {
        const eligibleSets = Math.floor(
          quantity / (line.buy_qty + line.get_qty)
        );
        const freeItems = eligibleSets * line.get_qty;
        if (freeItems > 0 && line.discount_value) {
          discount = line.discount_value * freeItems;
        }
      }
      break;

    case DiscountType.FREE_PRODUCT:
      if (
        line.free_product &&
        line.free_quantity &&
        line.free_quantity > 0 &&
        line.discount_value
      ) {
        discount = line.discount_value * line.free_quantity;
      }
      break;

    default:
      break;
  }

  return Math.max(discount, 0);
};

export const isPromotionLineApplicable = (
  line: PromotionLine,
  itemId?: string,
  quantity?: number,
  itemAmount?: number
): boolean => {
  if (!line.is_active) return false;

  // Check time override
  const now = new Date();
  if (line.start_at && now < new Date(line.start_at)) return false;
  if (line.end_at && now > new Date(line.end_at)) return false;

  // Check target
  if (line.line_type !== LineType.ALL && itemId) {
    if (line.target_id && line.target_id !== itemId) return false;
  }

  // Check min quantity
  if (line.min_quantity && quantity && quantity < line.min_quantity)
    return false;

  // Check min order value
  if (line.min_order_value && itemAmount && itemAmount < line.min_order_value)
    return false;

  return true;
};

export const getPromotionStatus = (
  promotion: Promotion
): {
  status: "active" | "expired" | "upcoming" | "inactive";
  label: string;
  color: string;
} => {
  const now = new Date();
  const start = promotion.start_at ? new Date(promotion.start_at) : null;
  const end = promotion.end_at ? new Date(promotion.end_at) : null;

  if (end && now > end) {
    return { status: "expired", label: "Đã hết hạn", color: "text-red-600" };
  }

  if (start && now < start) {
    return { status: "upcoming", label: "Sắp diễn ra", color: "text-blue-600" };
  }

  if (isPromotionActive(promotion)) {
    return {
      status: "active",
      label: "Đang hoạt động",
      color: "text-green-600",
    };
  }

  return {
    status: "inactive",
    label: "Không hoạt động",
    color: "text-gray-600",
  };
};

// === PROMOTION USAGE HISTORY ===
export interface PromotionUsageHistory {
  promotion_name: string;
  promotion_code: string;
  customer_name: string;
  customer_phone: string;
  order_id: string;
  order_amount: number;
  discount_amount: number;
  final_amount: number;
  used_date: string;
  branch_name: string;
  status: "FULFILLED" | "RETURNED" | "CANCELLED";
  notes?: string;
}

export interface PromotionUsageHistoryFilterParam {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  promotion_code?: string;
  promotion_name?: string;
  customer_name?: string;
  customer_phone?: string;
  order_id?: string;
  branch_id?: string;
  branch_name?: string;
  status?: "FULFILLED" | "RETURNED" | "CANCELLED";
  from_date?: string;
  to_date?: string;
}
