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
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  functions_called?: string[];
  requires_action?: boolean;
  action_type?: string | null;
  draft_id?: string;
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

