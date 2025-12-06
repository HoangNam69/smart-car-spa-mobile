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
    try {
      // AI assistant calls can take 10-15 seconds due to OpenAI API processing
      // Use a longer timeout (60 seconds) to accommodate function calls and AI response generation
      const response = await axiosInstance.post<ApiResponse<ChatResponse>>(
        `${this.BASE_URL}/chat`,
        request,
        {
          timeout: 60000, // 60 seconds timeout for AI assistant requests
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to get AI response");
      }
    } catch (error: any) {
      console.error("AI Assistant chat error:", error);
      throw error;
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
        `${this.BASE_URL}/draft/${draftId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to clear draft");
      }
    } catch (error: any) {
      console.log("AI Assistant clear draft error:", error);
      // Don't throw error - if draft doesn't exist, it's okay
      // Backend will return success even if draft not found
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
        `${this.BASE_URL}/draft/session/${sessionId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to clear draft");
      }
    } catch (error: any) {
      console.log("AI Assistant clear draft by session error:", error);
      // Don't throw error - if draft doesn't exist, it's okay
      // Backend will return success even if draft not found
      throw error;
    }
  }
}

export default AiAssistantService;

