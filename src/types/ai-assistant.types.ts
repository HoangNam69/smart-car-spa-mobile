/**
 * AI Assistant API Types
 */

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  customer_phone?: string;
  customer_id?: string;
  session_id?: string;
  draft_id?: string;
  extracted_uuids?: ExtractedUuids; // Optional, để tối ưu
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ExtractedUuids {
  vehicle_id?: string;
  vehicle_license_plate?: string;
  branch_id?: string;
  branch_name?: string;
  bay_id?: string;
  bay_name?: string;
  service_type?: string;
}

export interface ChatResponse {
  message: string;
  functions_called?: string[];
  requires_action?: boolean;
  action_type?: string | null;
  draft_id?: string;
  draft_data?: DraftData; // Thông tin progress của draft
}

export interface DraftData {
  current_step: number; // 1-7
  has_vehicle: boolean;
  has_date: boolean;
  has_branch: boolean;
  has_service: boolean;
  has_bay: boolean;
  has_time: boolean;
  is_complete: boolean;
}

export interface AIChatbotMessage {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  isLoading?: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  action: string;
}

