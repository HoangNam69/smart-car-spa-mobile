// Authentication API hook
export { useAuthApi } from "./useAuthApi";

// Product hooks
export {
  usePublicProducts,
  useProductByUrl,
  useProductById,
} from "./useProducts";
export { useProductMainImage } from "./useProductMainImage";

// Pricing hooks
export { usePricing } from "./usePricing";

// Service hooks
export {
  usePublicServices,
  useServiceByUrl,
  useServiceById,
  useServiceMainImage,
} from "./useServices";

// WebSocket hooks
export {
  useBookingReload,
  useVehicleProfileReload,
  useCustomerReload,
  useWebSocketStatus,
  useBookingEvents,
  useTrackingEvents,
} from "./useWebSocket";

// Re-export types
export type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  UserInfo,
} from "../types/auth.types";
