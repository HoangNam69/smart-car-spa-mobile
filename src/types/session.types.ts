/**
 * Session management types for multi-device support
 */

export interface SessionInfo {
  device_id: string;
  device_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_activity: string;
  is_current_device: boolean;
}

export interface GetActiveSessionsResponse {
  success: boolean;
  message: string;
  timestamp?: string;
  data: SessionInfo[];
}

