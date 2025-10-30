/**
 * TypeScript types cho Walk-in Booking
 * Định nghĩa cấu trúc dữ liệu cho walk-in booking system
 */

// ==================== REQUEST TYPES ====================

/**
 * Request để đề xuất bay
 */
export interface BayRecommendationRequest {
  branch_id: string;
  service_type?: string;
  service_duration_minutes: number;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  booking_date?: string;
}

/**
 * Request để tạo walk-in booking
 */
export interface WalkInBookingRequest {
  customer_type: 'EXISTING' | 'NEW';
  
  // Cho khách hàng có sẵn
  customer_id?: string;
  vehicle_id?: string;
  
  // Cho khách hàng mới
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_license_plate?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_type?: string;
  vehicle_color?: string;
  vehicle_year?: number;
  
  // Thông tin chung
  assigned_bay_id: string;
  branch_id: string;
  services: ServiceRequest[];
  total_price: number;
  currency: string;
  deposit_amount?: number;
  estimated_duration_minutes?: number;
  preferred_start_at?: string;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  slot_start_time?: string;
  slot_end_time?: string;
  notes?: string;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  special_requests?: string[];
  booking_date?: string; // YYYY-MM-DD format
}

/**
 * Request cho dịch vụ
 */
export interface ServiceRequest {
  service_id: string;
  service_name: string;
  duration_minutes: number;
  price: number;
}

/**
 * Request để chuyển booking
 */
export interface TransferBookingRequest {
  booking_id: string;
  from_bay_id: string;
  to_bay_id: string;
  reason?: string;
}

// ==================== RESPONSE TYPES ====================

/**
 * Response cho đề xuất bay
 */
export interface BayRecommendationResponse {
  recommended_bay: BayInfo;
  queue: BookingQueueItem[];
  estimated_wait_time: number;
  reason: string;
  alternative_bays: BayInfo[];
}

/**
 * Thông tin bay
 */
export interface BayInfo {
  bay_id: string;
  bay_name: string;
  bay_code: string;
  status: string;
  allow_booking: boolean;
}

/**
 * Item trong hàng chờ
 */
export interface BookingQueueItem {
  booking_id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  vehicle_license_plate: string;
  service_type: string;
  queue_position: number;
  estimated_start_time: string;
  estimated_completion_time: string;
  status: string;
}

/**
 * Response cho walk-in booking
 */
export interface WalkInBookingResponse {
  booking_id: string;
  booking_code: string;
  assigned_bay_id: string;
  queue_position: number;
  estimated_start_time: string;
  estimated_wait_time: number;
  status: string;
  message: string;
}

/**
 * Response cho chuyển booking
 */
export interface TransferBookingResponse {
  booking_id: string;
  from_bay_id: string;
  to_bay_id: string;
  success: boolean;
  message: string;
}

/**
 * Response cho thống kê hàng chờ bay
 */
export interface BayQueueStatsResponse {
  bay_id: string;
  bay_name: string;
  queue_length: number;
  estimated_wait_time: number;
  status: string;
}

// ==================== UI TYPES ====================

/**
 * Props cho Walk-in Booking Modal
 */
export interface WalkInBookingModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (response: WalkInBookingResponse) => void;
  branchId: string;
  services: ServiceRequest[];
  totalPrice: number;
  totalDuration: number;
}

/**
 * Props cho Bay Recommendation Component
 */
export interface BayRecommendationProps {
  branchId: string;
  serviceDuration: number;
  serviceType?: string;
  onBaySelected: (bayId: string) => void;
  onRecommendationReceived: (recommendation: BayRecommendationResponse) => void;
}

/**
 * Props cho Bay Queue Component
 */
export interface BayQueueProps {
  bayId: string;
  onBookingTransfer?: (bookingId: string, fromBayId: string, toBayId: string) => void;
  onBookingRemove?: (bookingId: string) => void;
}

/**
 * Props cho Queue Item Component
 */
export interface QueueItemProps {
  item: BookingQueueItem;
  onTransfer?: (bookingId: string, toBayId: string) => void;
  onRemove?: (bookingId: string) => void;
  canTransfer?: boolean;
  canRemove?: boolean;
}

// ==================== STATE TYPES ====================

/**
 * State cho Walk-in Booking
 */
export interface WalkInBookingState {
  step: 'customer' | 'services' | 'bay-selection' | 'confirmation';
  customerType: 'EXISTING' | 'NEW';
  selectedCustomer?: any;
  selectedVehicle?: any;
  newCustomerInfo?: {
    name: string;
    phone: string;
    email?: string;
  };
  newVehicleInfo?: {
    licensePlate: string;
    brand: string;
    model: string;
    type: string;
    color: string;
    year: number;
  };
  selectedServices: ServiceRequest[];
  selectedBay?: string;
  bayRecommendation?: BayRecommendationResponse;
  queueItems: BookingQueueItem[];
  loading: boolean;
  error?: string;
}

/**
 * State cho Bay Recommendation
 */
export interface BayRecommendationState {
  recommendation?: BayRecommendationResponse;
  loading: boolean;
  error?: string;
  selectedBay?: string;
}

/**
 * State cho Bay Queue
 */
export interface BayQueueState {
  queueItems: BookingQueueItem[];
  loading: boolean;
  error?: string;
  selectedItem?: string;
}

// ==================== UTILITY TYPES ====================

/**
 * Priority levels
 */
export type Priority = 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Customer types
 */
export type CustomerType = 'EXISTING' | 'NEW';

/**
 * Booking status
 */
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/**
 * Bay status
 */
export type BayStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'UNAVAILABLE';

// ==================== FORM TYPES ====================

/**
 * Form data cho khách hàng mới
 */
export interface NewCustomerFormData {
  name: string;
  phone: string;
  email?: string;
}

/**
 * Form data cho xe mới
 */
export interface NewVehicleFormData {
  licensePlate: string;
  brand: string;
  model: string;
  type: string;
  color: string;
  year: number;
}

/**
 * Form data cho walk-in booking
 */
export interface WalkInBookingFormData {
  customerType: CustomerType;
  customerId?: string;
  vehicleId?: string;
  newCustomer?: NewCustomerFormData;
  newVehicle?: NewVehicleFormData;
  // For existing customer vehicle info
  existingVehicle?: {
    license_plate: string;
    brand_name: string;
    model_name: string;
    type_name: string;
    color: string;
    year: number;
  };
  services: ServiceRequest[];
  assignedBayId: string;
  notes?: string;
  priority: Priority;
  specialRequests?: string[];
  // Additional fields for complete booking data
  deposit_amount?: number;
  estimated_duration_minutes?: number;
  preferred_start_at?: string;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  slot_start_time?: string;
  slot_end_time?: string;
  booking_date?: string; // YYYY-MM-DD format
}

// ==================== API RESPONSE TYPES ====================

/**
 * Generic API response
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ==================== ERROR TYPES ====================

/**
 * API Error
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ==================== CONSTANTS ====================

/**
 * Priority levels với label và icon
 */
export const PRIORITY_LEVELS = [
  { value: 'NORMAL', label: 'Bình thường', icon: '⚪', color: '#52c41a' },
  { value: 'HIGH', label: 'Cao', icon: '🟡', color: '#faad14' },
  { value: 'URGENT', label: 'Khẩn cấp', icon: '🔴', color: '#ff4d4f' },
] as const;

/**
 * Customer types với label
 */
export const CUSTOMER_TYPES = [
  { value: 'EXISTING', label: 'Khách hàng có sẵn', icon: '👤' },
  { value: 'NEW', label: 'Khách hàng mới', icon: '➕' },
] as const;

/**
 * Booking status với label và color
 */
export const BOOKING_STATUS = [
  { value: 'PENDING', label: 'Chờ xử lý', color: '#faad14' },
  { value: 'CONFIRMED', label: 'Đã xác nhận', color: '#1890ff' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý', color: '#722ed1' },
  { value: 'COMPLETED', label: 'Hoàn thành', color: '#52c41a' },
  { value: 'CANCELLED', label: 'Đã hủy', color: '#ff4d4f' },
] as const;
