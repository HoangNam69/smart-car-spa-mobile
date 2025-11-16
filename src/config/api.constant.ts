export const API_CONFIG = {
  BASE_URL: "http://192.168.1.16:8081/api",
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH_TOKEN: "/auth/refresh-token",
    LOGOUT: "/auth/logout",
    VERIFY_TOKEN: "/auth/verify-token",
    CHANGE_PASSWORD: "/auth/change-password",
    FORGOT_PASSWORD: "/auth/forgot-password",
  },
  USER: {
    GET_ALL: "/users/get-all",
    GET_BY_ID: "/users/{id}",
    CREATE: "/users/create",
    UPDATE: "/users/{id}/update",
    DELETE: "/users/{id}/delete",
    UPLOAD_AVATAR: "/users/{userId}/avatar/upload",
  },
  BOOKING: {
    GET_ALL: "/bookings",
    GET_BY_ID: "/bookings/{id}",
    CREATE: "/bookings/create",
    UPDATE: "/bookings/{id}/update",
    CANCEL: "/bookings/{id}/cancel",
    CONFIRM: "/bookings/{id}/confirm",
    CHECK_IN: "/bookings/{id}/check-in",
    START: "/bookings/{id}/start",
    COMPLETE: "/bookings/{id}/complete",
  },
  SERVICE: {
    GET_ALL: "/services/get-all",
    GET_BY_ID: "/services/{id}",
    GET_BY_CATEGORY: "/services/category/{id}",
    SEARCH: "/services/search",
    CREATE: "/services/create",
    UPDATE: "/services/{id}/update",
    DELETE: "/services/{id}/delete",
  },
  BRANCH: {
    GET_ALL: "/branches/get-all",
    GET_BY_ID: "/branches/{id}",
    CREATE: "/branches/create",
    UPDATE: "/branches/{id}/update",
    DELETE: "/branches/{id}/delete",
  },
  PRODUCT: {
    GET_ALL_PUBLIC: "/products/get-all", // Backend endpoint for all products
    GET_FEATURED: "/products/featured", // Featured products
    GET_BY_URL: "/products/url/{url}", // Get product by URL slug
    GET_BY_ID: "/products/{id}",
    SEARCH: "/products/search",
  },
  PRICING: {
    PREVIEW: "/pricing/preview",
    PREVIEW_BATCH: "/pricing/preview/batch",
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
