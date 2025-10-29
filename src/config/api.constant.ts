// API Configuration
export const API_CONFIG = {
  BASE_URL: "http://172.23.128.1:8081/api",
  TIMEOUT: 10000, // 10 seconds
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
  },
  USER: {
    GET_ALL: "/users/get-all",
    GET_BY_ID: "/users/{id}",
    CREATE: "/users/create",
    UPDATE: "/users/{id}/update",
    DELETE: "/users/{id}/delete",
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
