/**
 * Booking Management Types
 * Type definitions for booking-related API requests and responses
 * Updated to match backend BookingInfoDto
 */

export interface BookingInfoDto {
  // Core booking info
  booking_id: string;
  booking_code: string;
  
  // Customer information
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  
  // Vehicle information
  vehicle_id?: string;
  vehicle_license_plate: string;
  vehicle_brand_name?: string;
  vehicle_model_name?: string;
  vehicle_type_name?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  
  // Branch and bay information
  branch_id: string;
  branch_name?: string;
  branch_code?: string;
  bay_id?: string;
  bay_name?: string;
  bay_type?: string;
  
  // Slot information
  slot_id?: string;
  slot_start_time?: string;
  slot_end_time?: string;
  slot_duration_minutes?: number;
  slot_status?: string;
  
  // Scheduling information
  preferred_start_at?: string;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  actual_check_in_at?: string;
  actual_start_at?: string;
  actual_end_at?: string;
  
  // Duration information
  estimated_duration_minutes?: number;
  buffer_minutes?: number;
  actual_duration_minutes?: number;
  
  // Pricing information
  total_price?: number;
  currency?: string;
  deposit_amount?: number;
  
  // Status information
  payment_status?: PaymentStatus;
  status: BookingStatus;
  priority?: Priority;
  
  // Additional information
  coupon_code?: string;
  notes?: string;
  special_requests?: string[];
  
  // Cancellation information
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  
  // Audit information
  created_at: string;
  updated_at: string;
  created_by?: string;
  modified_by?: string;
  
  // Related data
  booking_items?: BookingItemInfoDto[];
  assignments?: BookingAssignmentInfoDto[];
  payments?: BookingPaymentInfoDto[];
  
  // Computed fields
  is_active?: boolean;
  is_cancelled?: boolean;
  is_completed?: boolean;
  needs_payment?: boolean;
  is_fully_paid?: boolean;
  total_estimated_duration?: number;
}

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED", 
  CHECKED_IN = "CHECKED_IN",
  IN_PROGRESS = "IN_PROGRESS",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PARTIAL = "PARTIAL",
  REFUNDED = "REFUNDED"
}

export enum Priority {
  NORMAL = "NORMAL",
  HIGH = "HIGH", 
  URGENT = "URGENT"
}

export interface BookingFilterParam {
  page?: number;
  size?: number;
  status?: BookingStatus;
  branchId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sort?: string;
  direction?: "ASC" | "DESC";
}

// Related DTOs
export interface BookingItemInfoDto {
  service_id?: string;
  item_name: string;
  item_description?: string;
  discount_amount?: number;
  tax_amount?: number;
  unit_price?: number;
  quantity?: number;
}

export interface BookingAssignmentInfoDto {
  assignmentId: string;
  technicianId: string;
  technicianName: string;
  technicianCode: string;
  role: string;
  assignedAt: string;
}

export interface BookingPaymentInfoDto {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paidAt?: string;
  notes?: string;
}

export interface CreateBookingRequest {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  vehicle_id: string;
  vehicle_license_plate: string;
  vehicle_brand_id: string;
  vehicle_brand_name?: string;
  vehicle_model_name?: string;
  vehicle_type_name?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  branch_id: string;
  bay_id?: string;
  preferred_start_at: string;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  estimated_duration_minutes?: number;
  buffer_minutes?: number;
  total_price?: number;
  currency?: string;
  deposit_amount?: number;
  priority?: Priority;
  coupon_code?: string;
  notes?: string;
  special_requests?: string[];
  booking_items: {
    item_type: string;
    item_id: string;
    item_name: string;
    item_url?: string;
    item_description?: string;
    unit_price: number;
    quantity: number;
    duration_minutes?: number;
    discount_amount?: number;
    tax_amount?: number;
    notes?: string;
    display_order?: number;
  }[];
  assignments: {
    technician_id: string;
    role: string;
  }[];
  payments?: unknown[];
}

// New integrated booking request type based on BookingInfoDto
export interface CreateBookingWithSlotRequest {
  // Customer information
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  
  // Vehicle information
  vehicle_id?: string;
  vehicle_license_plate: string;
  vehicle_brand_name?: string;
  vehicle_model_name?: string;
  vehicle_type_name?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  
  // Branch and slot information
  branch_id: string;
  
  // Selected slot information
  selected_slot: {
    bay_id: string;
    date: string; // YYYY-MM-DD format
    start_time: string; // HH:mm format
    service_duration_minutes: number;
  };
  
  // Booking items
  booking_items: {
    service_id: string;
    item_name?: string;
    item_description?: string;
    discount_amount?: number;
    tax_amount?: number;
  }[];
  
  // Pricing information
  total_price: number;
  currency?: string;
  deposit_amount?: number;
  
  // Additional information
  coupon_code?: string;
  notes?: string;
  special_requests?: string[];
}

export interface UpdateBookingRequest {
  // Customer information
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  
  // Vehicle information
  vehicle_license_plate?: string;
  vehicle_brand_name?: string;
  vehicle_model_name?: string;
  vehicle_type_name?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  
  // Branch and Service Bay information
  branch_id?: string;
  service_bay_id?: string;
  
  // Scheduling information
  preferred_start_at?: string;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  
  // Slot information
  slot_date?: string;
  slot_start_time?: string;
  
  // Duration information
  estimated_duration_minutes?: number;
  buffer_minutes?: number;
  
  // Pricing information
  total_price?: number;
  currency?: string;
  deposit_amount?: number;
  
  // Status information
  payment_status?: PaymentStatus;
  status?: BookingStatus;
  priority?: Priority;
  
  // Additional information
  coupon_code?: string;
  notes?: string;
  special_requests?: string[];
}

export interface BookingStatisticsDto {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  totalRevenue: number;
  averageServiceTime: number;
  customerSatisfactionScore?: number;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data: BookingInfoDto;
}

export interface BookingListResponse {
  success: boolean;
  message: string;
  data: BookingInfoDto[];
}

export interface BookingStatisticsResponse {
  success: boolean;
  message: string;
  data: BookingStatisticsDto;
}
