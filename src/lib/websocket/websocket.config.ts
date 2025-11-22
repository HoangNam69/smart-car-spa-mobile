import { API_CONFIG } from '../../config/api.constant';

/**
 * Lấy API base URL từ config
 */
const getApiBaseUrl = (): string => {
  return API_CONFIG.BASE_URL; // http://192.168.1.16:8081/api
};

/**
 * Build WebSocket URL cho Mobile
 * 
 * LOGIC:
 * 1. Lấy API base URL: http://192.168.1.16:8081/api
 * 2. GIỮ NGUYÊN /api prefix (với context-path=/api, endpoint phải có /api)
 * 3. Convert http -> ws, https -> wss
 * 4. Append endpoint: /ws-native
 * 
 */
export const getWebSocketUrl = (): string => {
  const apiBaseUrl = getApiBaseUrl();
  
  const baseUrl = apiBaseUrl
    .replace('http://', 'ws://')   // Convert http -> ws
    .replace('https://', 'wss://'); // Convert https -> wss
  
  const wsUrl = `${baseUrl}/ws-native`;
  
  if (__DEV__) {
    console.log('[WebSocket Config] API Base URL:', apiBaseUrl);
    console.log('[WebSocket Config] WebSocket URL (Native, with /api prefix):', wsUrl);
  }
  
  return wsUrl;
};

/**
 * WebSocket Configuration Constants
 */
export const WS_CONFIG = {
  reconnectDelay: 5000,        // 5 seconds - delay ban đầu
  heartbeatIncoming: 10000,    // 10 seconds - server heartbeat
  heartbeatOutgoing: 10000,    // 10 seconds - client heartbeat
  debug: __DEV__,              // Debug mode trong development
} as const;

