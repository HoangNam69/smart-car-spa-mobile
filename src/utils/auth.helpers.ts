/**
 * Authentication Helper Functions
 * Các hàm tiện ích để kiểm tra quyền truy cập và role
 */

import { UserInfo } from '../types/auth.types';

// Role codes
export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE', // Nhân viên (có thể có nhiều role_code khác nhau như MANAGER, TECHNICIAN, etc.)
} as const;

export type RoleCode = typeof ROLES[keyof typeof ROLES];

// Route groups
export const ROUTE_GROUPS = {
  PUBLIC: 'PUBLIC',
  CUSTOMER: 'CUSTOMER', 
  ADMIN: 'ADMIN',
} as const;

export type RouteGroup = typeof ROUTE_GROUPS[keyof typeof ROUTE_GROUPS];

/**
 * Kiểm tra xem user có role cụ thể không
 */
export function hasRole(user: UserInfo | null, role: RoleCode): boolean {
  if (!user || !user.role) return false;
  return user.role.role_code === role;
}

/**
 * Kiểm tra xem user có phải admin không
 */
export function isAdmin(user: UserInfo | null): boolean {
  return hasRole(user, ROLES.ADMIN);
}

/**
 * Kiểm tra xem user có phải customer không
 */
export function isCustomer(user: UserInfo | null): boolean {
  return hasRole(user, ROLES.CUSTOMER);
}

/**
 * Kiểm tra xem user có phải employee/staff không
 * Employee có thể có nhiều role_code khác nhau (MANAGER, TECHNICIAN, CASHIER, etc.)
 * nhưng user_type sẽ là "EMPLOYEE" hoặc "ADMIN"
 */
export function isEmployee(user: UserInfo | null): boolean {
  if (!user) return false;
  
  // Nếu user_type là EMPLOYEE hoặc ADMIN, coi như employee
  if (user.user_type === "EMPLOYEE" || user.user_type === "ADMIN") {
    return true;
  }
  
  return false;
}

/**
 * Kiểm tra xem user có quyền truy cập route group không
 */
export function hasRouteAccess(user: UserInfo | null, routeGroup: RouteGroup): boolean {
  if (!user) {
    return routeGroup === ROUTE_GROUPS.PUBLIC;
  }

  // ADMIN có quyền truy cập public routes, admin routes và customer routes
  // (vì Admin/Employee có thể làm tất cả những gì Guest & Member làm)
  if (isAdmin(user)) {
    return (
      routeGroup === ROUTE_GROUPS.PUBLIC ||
      routeGroup === ROUTE_GROUPS.ADMIN ||
      routeGroup === ROUTE_GROUPS.CUSTOMER
    );
  }

  // CUSTOMER có quyền truy cập public routes và customer routes
  if (isCustomer(user)) {
    return routeGroup === ROUTE_GROUPS.PUBLIC || routeGroup === ROUTE_GROUPS.CUSTOMER;
  }

  // Employee/Staff có quyền truy cập public routes và customer routes
  // (vì Employee có thể làm tất cả những gì Guest & Member làm)
  if (isEmployee(user)) {
    return (
      routeGroup === ROUTE_GROUPS.PUBLIC ||
      routeGroup === ROUTE_GROUPS.CUSTOMER
    );
  }

  return false;
}

/**
 * Lấy redirect path dựa trên role
 * Tất cả user (admin, employee, customer) đều về trang chủ (tabs) sau khi đăng nhập
 */
export function getRedirectPathByRole(role?: string, userType?: string): string {
  // Tất cả user đều về trang chủ (tabs)
  if (role || userType) {
    return '/(tabs)';
  }
  return '/auths/login';
}

/**
 * Kiểm tra xem path có thuộc route group nào không
 */
export function getRouteGroupFromPath(pathname: string): RouteGroup | null {
  // Public routes - Guest có thể xem: danh sách sản phẩm, danh sách dịch vụ, thông tin trung tâm & chi nhánh
  if (pathname.startsWith('/auths') || pathname.startsWith('/api') || 
      pathname === '/(tabs)' || pathname.startsWith('/services') ||
      pathname.startsWith('/products')) {
    return ROUTE_GROUPS.PUBLIC;
  }
  
  // Customer routes
  if (pathname.startsWith('/personal') || 
      pathname.startsWith('/vehicle-management') ||
      pathname.startsWith('/(tabs)/booking') ||
      pathname.startsWith('/history-management')) {
    return ROUTE_GROUPS.CUSTOMER;
  }
  
  // Admin routes (nếu có trong tương lai)
  if (pathname.startsWith('/dashboard')) {
    return ROUTE_GROUPS.ADMIN;
  }
  
  return null;
}

/**
 * Kiểm tra xem user có thể truy cập path không
 */
export function canAccessPath(user: UserInfo | null, pathname: string): boolean {
  const routeGroup = getRouteGroupFromPath(pathname);
  
  if (!routeGroup) {
    return true; // Cho phép truy cập nếu không xác định được route group
  }
  
  return hasRouteAccess(user, routeGroup);
}

/**
 * Lấy thông báo lỗi dựa trên quyền truy cập
 */
export function getAccessDeniedMessage(user: UserInfo | null, pathname: string): string {
  const routeGroup = getRouteGroupFromPath(pathname);
  
  if (!user) {
    return 'Bạn cần đăng nhập để truy cập trang này';
  }
  
  if (routeGroup === ROUTE_GROUPS.ADMIN && !isAdmin(user)) {
    return 'Bạn không có quyền truy cập trang quản trị';
  }
  
  // CUSTOMER routes: Cho phép CUSTOMER, ADMIN, và EMPLOYEE
  // (vì Admin/Employee có thể làm tất cả những gì Customer làm)
  if (routeGroup === ROUTE_GROUPS.CUSTOMER) {
    const hasAccess = isCustomer(user) || isAdmin(user) || isEmployee(user);
    if (!hasAccess) {
      return 'Bạn không có quyền truy cập trang khách hàng';
    }
  }
  
  return 'Bạn không có quyền truy cập trang này';
}
