/**
 * Utility functions for managing conversation history in AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AIChatbotMessage } from "../types/ai-assistant.types";

const STORAGE_KEY = "ai_chatbot_conversation_history";
const MAX_MESSAGES = 50; // Giới hạn số lượng messages để tránh storage quá lớn

/**
 * Load conversation history from AsyncStorage
 */
export const loadConversationHistory = async (): Promise<AIChatbotMessage[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const messages = JSON.parse(stored) as AIChatbotMessage[];
    
    // Convert timestamp strings back to Date objects
    return messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.error("Error loading conversation history from AsyncStorage:", error);
    return [];
  }
};

/**
 * Save conversation history to AsyncStorage
 */
export const saveConversationHistory = async (messages: AIChatbotMessage[]): Promise<void> => {
  try {
    // Limit number of messages to prevent storage from getting too large
    const messagesToSave = messages.slice(-MAX_MESSAGES);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave));
  } catch (error) {
    console.error("Error saving conversation history to AsyncStorage:", error);
    
    // If storage is full, try to save fewer messages
    if (error instanceof Error && error.message.includes("quota")) {
      try {
        // Try saving only the last 20 messages
        const messagesToSave = messages.slice(-20);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave));
        console.warn("Storage quota exceeded. Saved only last 20 messages.");
      } catch (retryError) {
        console.error("Failed to save conversation history even with reduced size:", retryError);
      }
    }
  }
};

/**
 * Clear conversation history from AsyncStorage
 */
export const clearConversationHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing conversation history from AsyncStorage:", error);
  }
};

/**
 * Get conversation history size (number of messages)
 */
export const getConversationHistorySize = async (): Promise<number> => {
  const messages = await loadConversationHistory();
  return messages.length;
};

