import { useEffect, ReactNode } from 'react';
import { websocketService } from '../lib/websocket/websocket.service';
import { useAuth } from '../context/AuthContext';

interface WebSocketProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
  isLoading?: boolean;
}

export function WebSocketProvider({
  children,
  isAuthenticated,
  isLoading = false,
}: WebSocketProviderProps) {
  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Connect nếu authenticated, disconnect nếu không
    if (isAuthenticated) {
      console.log('[WebSocketProvider] User authenticated, connecting...');
      websocketService.connect();
    } else {
      console.log('[WebSocketProvider] User not authenticated, disconnecting...');
      websocketService.disconnect();
    }
    return () => {
      if (!isAuthenticated) {
        websocketService.disconnect();
      }
    };
  }, [isAuthenticated, isLoading]); // Re-run khi auth status thay đổi

  return <>{children}</>;
}

export function WebSocketProviderWrapper({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  return (
    <WebSocketProvider isAuthenticated={isAuthenticated} isLoading={loading}>
      {children}
    </WebSocketProvider>
  );
}

