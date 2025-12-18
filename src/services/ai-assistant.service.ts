import axiosInstance from "../config/axiosConfig";
import { ApiResponse } from "../types/common.types";
import { ChatRequest, ChatResponse } from "../types/ai-assistant.types";

export class AiAssistantService {
  private static readonly BASE_URL = "/ai-assistant";

  /**
   * Chat with AI assistant
   * @param request Chat request with message and conversation history
   * @returns AI assistant response
   */
  static async chat(request: ChatRequest): Promise<ChatResponse> {
    // Log request details for debugging
    console.log("[AI Assistant] Sending chat request:", {
      url: `${this.BASE_URL}/chat`,
      hasMessage: !!request.message,
      messageLength: request.message?.length || 0,
      hasConversationHistory: !!request.conversation_history,
      historyLength: request.conversation_history?.length || 0,
      sessionId: request.session_id,
      draftId: request.draft_id,
    });

    try {
      // AI assistant calls can take 10-15 seconds due to OpenAI API processing
      // Use a longer timeout (60 seconds) to accommodate function calls and AI response generation
      const startTime = Date.now();
      const response = await axiosInstance.post<ApiResponse<ChatResponse>>(
        `${this.BASE_URL}/chat`,
        request,
        {
          timeout: 60000, // 60 seconds timeout for AI assistant requests
        }
      );
      const duration = Date.now() - startTime;

      console.log("[AI Assistant] Chat response received:", {
        duration: `${duration}ms`,
        success: response.data.success,
        hasData: !!response.data.data,
        hasMessage: !!response.data.data?.message,
        messageLength: response.data.data?.message?.length || 0,
        draftId: response.data.data?.draft_id,
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        const errorMessage = response.data.message || "Failed to get AI response";
        console.error("[AI Assistant] Chat failed:", {
          message: errorMessage,
          responseData: response.data,
        });
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      // Improved error handling - extract meaningful error message
      let errorMessage = "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.";
      
      if (error?.response?.data?.message) {
        // Backend returned error message
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.data?.message) {
        // Nested error message
        errorMessage = error.response.data.data.message;
      } else if (error?.message) {
        // Axios or other error message
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Log detailed error for debugging
      console.error("[AI Assistant] Chat error:", {
        message: errorMessage,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        code: error?.code,
        timeout: error?.code === 'ECONNABORTED' ? 'Request timeout' : undefined,
      });

      // Create a more informative error
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).status = error?.response?.status;
      (enhancedError as any).originalError = error;
      
      throw enhancedError;
    }
  }

  /**
   * Clear draft by draft_id
   * Mark draft as ABANDONED
   * @param draftId Draft ID to clear
   */
  static async clearDraft(draftId: string): Promise<void> {
    try {
      const response = await axiosInstance.post<ApiResponse<null>>(
        `${this.BASE_URL}/draft/${draftId}`,
        {},
        {
          timeout: 30000, // 30 seconds timeout
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to clear draft");
      }
    } catch (error: any) {
      // Log error but don't throw - if draft doesn't exist, it's okay
      // Backend will return success even if draft not found
      console.log("[AI Assistant] Clear draft error:", {
        draftId,
        message: error?.message,
        status: error?.response?.status,
      });
      // Re-throw to allow caller to handle if needed
      throw error;
    }
  }

  /**
   * Clear draft by session_id
   * Find draft by session_id and mark as ABANDONED
   * @param sessionId Session ID to clear draft for
   */
  static async clearDraftBySession(sessionId: string): Promise<void> {
    try {
      const response = await axiosInstance.post<ApiResponse<null>>(
        `${this.BASE_URL}/draft/session/${sessionId}`,
        {},
        {
          timeout: 30000, // 30 seconds timeout
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to clear draft");
      }
    } catch (error: any) {
      // Log error but don't throw - if draft doesn't exist, it's okay
      // Backend will return success even if draft not found
      console.log("[AI Assistant] Clear draft by session error:", {
        sessionId,
        message: error?.message,
        status: error?.response?.status,
      });
      // Re-throw to allow caller to handle if needed
      throw error;
    }
  }
}

export default AiAssistantService;

