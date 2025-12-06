/**
 * Utility functions for managing conversation history in AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AIChatbotMessage } from "../types/ai-assistant.types";

const STORAGE_KEY = "ai_chatbot_conversation_history";
const SESSION_ID_KEY = "ai_chat_session_id";
const DRAFT_ID_KEY = "ai_chat_draft_id";
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

/**
 * Generate a new session ID (UUID)
 */
export const generateSessionId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Get or create session ID
 */
export const getOrCreateSessionId = async (): Promise<string> => {
  try {
    let sessionId = await AsyncStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = generateSessionId();
      await AsyncStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch (error) {
    console.log("Error getting/creating session ID:", error);
    return generateSessionId();
  }
};

/**
 * Save session ID
 */
export const saveSessionId = async (sessionId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSION_ID_KEY, sessionId);
  } catch (error) {
    console.log("Error saving session ID:", error);
  }
};

/**
 * Clear session ID
 */
export const clearSessionId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSION_ID_KEY);
  } catch (error) {
    console.log("Error clearing session ID:", error);
  }
};

/**
 * Get draft ID
 */
export const getDraftId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(DRAFT_ID_KEY);
  } catch (error) {
    console.log("Error getting draft ID:", error);
    return null;
  }
};

/**
 * Save draft ID
 */
export const saveDraftId = async (draftId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(DRAFT_ID_KEY, draftId);
  } catch (error) {
    console.log("Error saving draft ID:", error);
  }
};

/**
 * Clear draft ID
 */
export const clearDraftId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DRAFT_ID_KEY);
  } catch (error) {
    console.log("Error clearing draft ID:", error);
  }
};

/**
 * Clear all chatbot-related data (session, draft, conversation history)
 */
export const clearAllChatbotData = async (): Promise<void> => {
  await clearConversationHistory();
  await clearSessionId();
  await clearDraftId();
};

