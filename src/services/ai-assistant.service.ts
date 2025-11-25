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
}

export default AiAssistantService;

