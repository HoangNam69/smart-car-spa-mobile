/**
 * Protected Route Component
 * Component để bảo vệ routes ở client-side cho mobile app
 */

import React, { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { canAccessPath, getAccessDeniedMessage, isAdmin, isCustomer, isEmployee } from '../utils/auth.helpers';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'CUSTOMER';
  fallback?: ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  fallback 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Nếu đang loading, không làm gì
    if (loading) return;

    // Nếu chưa đăng nhập, redirect về login
    if (!isAuthenticated) {
      router.replace('/auths/login');
      return;
    }

    // Kiểm tra quyền truy cập path hiện tại
    if (!canAccessPath(user, pathname)) {
      // Redirect về trang chủ nếu không có quyền
      router.replace('/(tabs)');
      return;
    }

    // Kiểm tra required role nếu có
    // Nếu requiredRole là CUSTOMER, cho phép ADMIN và EMPLOYEE cũng truy cập
    // (vì Admin/Employee có thể làm tất cả những gì Customer làm)
    if (requiredRole) {
      const userRole = user?.role?.role_code;
      const userType = user?.user_type;
      
      if (requiredRole === 'CUSTOMER') {
        // Cho phép CUSTOMER, ADMIN, và EMPLOYEE (user_type là EMPLOYEE hoặc ADMIN)
        const isAllowed = 
          userRole === 'CUSTOMER' || 
          userRole === 'ADMIN' || 
          userType === 'EMPLOYEE' || 
          userType === 'ADMIN';
        
        if (!isAllowed) {
          router.replace('/(tabs)');
          return;
        }
      } else if (requiredRole === 'ADMIN') {
        // Chỉ cho phép ADMIN
        if (userRole !== 'ADMIN') {
          router.replace('/(tabs)');
          return;
        }
      }
    }
  }, [isAuthenticated, loading, user, pathname, router, requiredRole]);

  // Hiển thị loading
  if (loading) {
    return (
      <View style={{ 
        flex: 1,
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <ActivityIndicator size="large" color="#6C7BEA" />
        <Text style={{ marginTop: 16, color: '#666' }}>Đang tải...</Text>
      </View>
    );
  }

  // Nếu chưa đăng nhập
  if (!isAuthenticated) {
    return fallback || (
      <View style={{ 
        flex: 1,
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f5f5f5'
      }}>
        <Text variant="headlineSmall" style={{ marginBottom: 8, textAlign: 'center' }}>
          Yêu cầu đăng nhập
        </Text>
        <Text variant="bodyMedium" style={{ marginBottom: 24, textAlign: 'center', color: '#666' }}>
          Bạn cần đăng nhập để truy cập trang này
        </Text>
        <Button 
          mode="contained" 
          onPress={() => router.replace('/auths/login')}
        >
          Đăng nhập
        </Button>
      </View>
    );
  }

  // Nếu không có quyền truy cập
  if (!canAccessPath(user, pathname)) {
    return fallback || (
      <View style={{ 
        flex: 1,
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f5f5f5'
      }}>
        <Text variant="headlineSmall" style={{ marginBottom: 8, textAlign: 'center' }}>
          Không có quyền truy cập
        </Text>
        <Text variant="bodyMedium" style={{ marginBottom: 24, textAlign: 'center', color: '#666' }}>
          {getAccessDeniedMessage(user, pathname)}
        </Text>
        <Button 
          mode="contained" 
          onPress={() => router.replace('/(tabs)')}
        >
          Về trang chủ
        </Button>
      </View>
    );
  }

  // Nếu có required role nhưng không đúng role
  if (requiredRole) {
    const userRole = user?.role?.role_code;
    const userType = user?.user_type;
    
    let hasAccess = false;
    
    if (requiredRole === 'CUSTOMER') {
      // Cho phép CUSTOMER, ADMIN, và EMPLOYEE
      hasAccess = 
        userRole === 'CUSTOMER' || 
        userRole === 'ADMIN' || 
        userType === 'EMPLOYEE' || 
        userType === 'ADMIN';
    } else if (requiredRole === 'ADMIN') {
      // Chỉ cho phép ADMIN
      hasAccess = userRole === 'ADMIN';
    }
    
    if (!hasAccess) {
      return fallback || (
        <View style={{ 
          flex: 1,
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 24,
          backgroundColor: '#f5f5f5'
        }}>
          <Text variant="headlineSmall" style={{ marginBottom: 8, textAlign: 'center' }}>
            Không có quyền truy cập
          </Text>
          <Text variant="bodyMedium" style={{ marginBottom: 24, textAlign: 'center', color: '#666' }}>
            Trang này chỉ dành cho {requiredRole === 'ADMIN' ? 'quản trị viên' : 'khách hàng'}
          </Text>
          <Button 
            mode="contained" 
            onPress={() => router.replace('/(tabs)')}
          >
            Về trang chủ
          </Button>
        </View>
      );
    }
  }

  // Hiển thị children nếu có quyền truy cập
  return <>{children}</>;
}
