import { useAuth } from "@/src/context/AuthContext";
import { AiAssistantService } from "@/src/services/ai-assistant.service";
import { ChatMessage, AIChatbotMessage as MessageType, QuickAction } from "@/src/types/ai-assistant.types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AIChatbotInput from "./AIChatbotInput";
import AIChatbotMessage from "./AIChatbotMessage";
import QuickActions from "./QuickActions";

import {
  clearConversationHistory,
  loadConversationHistory,
  saveConversationHistory,
  getOrCreateSessionId,
  saveSessionId,
  clearSessionId,
  getDraftId,
  saveDraftId,
  clearDraftId,
  clearAllChatbotData,
} from "@/src/utils/conversationStorage";

interface AIChatbotWidgetProps {
  position?: "bottom-right" | "bottom-left";
}

const AIChatbotWidget: React.FC<AIChatbotWidgetProps> = ({
  position = "bottom-right",
}) => {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Quick actions
  const quickActions: QuickAction[] = [
    { id: "1", label: "Đặt lịch hẹn", action: "Tôi muốn đặt lịch hẹn" },
  ];

  /**
   * Get welcome message with user's name
   */
  const getWelcomeMessage = (): MessageType => {
    return {
      id: "1",
      content: user?.full_name
        ? `Xin chào ${user.full_name}! 👋\n\nTôi là trợ lý đặt lịch thông minh của Smart Car Spa. Tôi sẽ giúp bạn đặt lịch hẹn chăm sóc xe một cách nhanh chóng và thuận tiện.\n\nHãy để tôi bắt đầu quy trình đặt lịch cho bạn nhé! 🚗✨`
        : "Xin chào! 👋\n\nTôi là trợ lý đặt lịch thông minh của Smart Car Spa. Tôi sẽ giúp bạn đặt lịch hẹn chăm sóc xe một cách nhanh chóng và thuận tiện.\n\nHãy để tôi bắt đầu quy trình đặt lịch cho bạn nhé! 🚗✨",
      sender: "assistant",
      timestamp: new Date(),
    };
  };

  // Initialize session ID and draft ID on mount
  useEffect(() => {
    const initializeSession = async () => {
      const session = await getOrCreateSessionId();
      setSessionId(session);
      
      // Load draft ID if exists
      const savedDraftId = await getDraftId();
      if (savedDraftId) {
        setDraftId(savedDraftId);
      }
    };

    initializeSession();
  }, []);

  // Initialize messages
  useEffect(() => {
    const initializeMessages = async () => {
      const savedMessages = await loadConversationHistory();

      // If we have saved messages, use them
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        // Otherwise, return welcome message
        setMessages([getWelcomeMessage()]);
      }
    };

    initializeMessages();
  }, []);

  // Update welcome message when user changes (login/logout)
  // Only update if user's full_name changes and we have no conversation history
  useEffect(() => {
    const updateWelcomeMessage = async () => {
      if (!authLoading && isAuthenticated && user?.full_name) {
        const savedMessages = await loadConversationHistory();

        // Only update welcome message if:
        // 1. No saved messages (first time chat)
        // 2. Or first message is welcome message and user name might have changed
        if (savedMessages.length === 0) {
          const welcomeMsg: MessageType = {
            id: "1",
            content: `Xin chào ${user.full_name}! 👋\n\nTôi là trợ lý đặt lịch thông minh của Smart Car Spa. Tôi sẽ giúp bạn đặt lịch hẹn chăm sóc xe một cách nhanh chóng và thuận tiện.\n\nHãy để tôi bắt đầu quy trình đặt lịch cho bạn nhé! 🚗✨`,
            sender: "assistant",
            timestamp: new Date(),
          };
          setMessages([welcomeMsg]);
        } else {
          // Check if first message is welcome message and update it with user's name
          const firstMessage = savedMessages[0];
          if (firstMessage.id === "1" && firstMessage.sender === "assistant") {
            const welcomeMsg: MessageType = {
              id: "1",
              content: `Xin chào ${user.full_name}! 👋\n\nTôi là trợ lý đặt lịch thông minh của Smart Car Spa. Tôi sẽ giúp bạn đặt lịch hẹn chăm sóc xe một cách nhanh chóng và thuận tiện.\n\nHãy để tôi bắt đầu quy trình đặt lịch cho bạn nhé! 🚗✨`,
              sender: "assistant",
              timestamp: new Date(),
            };
            const updatedMessages = [welcomeMsg, ...savedMessages.slice(1)];
            setMessages(updatedMessages);
          }
        }
      }
    };

    updateWelcomeMessage();
  }, [user?.full_name, isAuthenticated, authLoading]);

  // Save conversation history to storage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveConversationHistory(messages);
    }
  }, [messages]);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    if (isOpen && messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading, isOpen]);

  // Handle keyboard show/hide to adjust scroll
  useEffect(() => {
    if (!isOpen) return;

    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        const height = event.endCoordinates.height;
        setKeyboardHeight(height);
        // Scroll to bottom when keyboard appears with a slight delay
        // to ensure the layout has adjusted
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === "ios" ? 250 : 100);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        // Small delay to ensure smooth transition
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [isOpen]);

  /**
   * Convert messages to conversation history format for API
   */
  const getConversationHistory = (): ChatMessage[] => {
    // Skip the first welcome message and convert to API format
    return messages
      .slice(1) // Skip welcome message
      .map((msg) => ({
        role: msg.sender as "user" | "assistant",
        content: msg.content,
      }));
  };

  const handleSendMessage = useCallback(async (content: string) => {
    // Check authentication before sending
    if (!isAuthenticated) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để sử dụng trợ lý AI");
      return;
    }

    // Ensure we have a session ID
    if (!sessionId) {
      const newSessionId = await getOrCreateSessionId();
      setSessionId(newSessionId);
    }

    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setIsLoading(true);

    try {
      // Build conversation history BEFORE adding current user message
      // This ensures we don't include the current message in history
      const conversationHistory = getConversationHistory();
      
      // Add user message to state after building history
      setMessages((prev) => [...prev, userMessage]);

      // Call AI Assistant API
      // Note: customer_phone and customer_id are automatically extracted from JWT token by backend
      // No need to send them explicitly
      const response = await AiAssistantService.chat({
        message: content,
        conversation_history: conversationHistory,
        session_id: sessionId || await getOrCreateSessionId(),
        draft_id: draftId || undefined,
      });

      // Save draft_id from response if present
      if (response.draft_id) {
        setDraftId(response.draft_id);
        await saveDraftId(response.draft_id);
      }

      // Add assistant response
      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.log("Error sending message to AI:", error);
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content:
          error?.message ||
          "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      Alert.alert(
        "Lỗi",
        "Không thể kết nối với trợ lý AI. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, draftId, isAuthenticated, messages]);

  // Auto-start booking process when chat is opened for the first time
  useEffect(() => {
    if (
      isOpen &&
      !hasAutoStarted &&
      isAuthenticated &&
      !authLoading &&
      messages.length === 1 &&
      messages[0].id === "1" &&
      messages[0].sender === "assistant"
    ) {
      // Only auto-start if we have welcome message only (no conversation history)
      setHasAutoStarted(true);
      
      // Send message immediately when chat is opened
      // This will trigger AI to call getCustomerVehicles() to load customer's vehicles
      // Use setTimeout with 0ms to ensure it runs after state updates
      setTimeout(() => {
        handleSendMessage("Tôi muốn đặt lịch hẹn");
      }, 0);
    }
  }, [isOpen, hasAutoStarted, isAuthenticated, authLoading, messages, handleSendMessage]);

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.action);
  };

  const handleToggle = async () => {
    // Check authentication when opening chat
    if (!isOpen) {
      // If auth is still loading, wait
      if (authLoading) {
        return;
      }

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập để sử dụng trợ lý AI", [
          {
            text: "Đăng nhập",
            onPress: () => router.push("/auths/login"),
          },
          { text: "Hủy", style: "cancel" },
        ]);
        return;
      }

      // Reset auto-start flag when opening chat
      const savedMessages = await loadConversationHistory();
      if (savedMessages.length === 0 || (savedMessages.length === 1 && savedMessages[0].id === "1" && savedMessages[0].sender === "assistant")) {
        setHasAutoStarted(false);
      }
    }

    setIsOpen(!isOpen);
  };

  /**
   * Refresh conversation - clear history and reset to welcome message
   * Also clears draft on backend by calling API
   * This keeps the chat open (unlike handleClose)
   */
  const handleRefresh = async () => {
    try {
      // Option 1: Clear bằng draft_id (khuyến nghị)
      if (draftId) {
        try {
          await AiAssistantService.clearDraft(draftId);
          console.log("Draft cleared successfully by draft_id");
        } catch (error) {
          console.log("Failed to clear draft by draft_id:", error);
          // Fallback to session_id if draft_id fails
          if (sessionId) {
            try {
              await AiAssistantService.clearDraftBySession(sessionId);
              console.log("Draft cleared successfully by session_id (fallback)");
            } catch (sessionError) {
              console.log("Failed to clear draft by session_id:", sessionError);
              // Continue anyway - backend might not have draft
            }
          }
        }
      } else if (sessionId) {
        // Option 2: Clear bằng session_id nếu không có draft_id
        try {
          await AiAssistantService.clearDraftBySession(sessionId);
          console.log("Draft cleared successfully by session_id");
        } catch (error) {
          console.log("Failed to clear draft by session_id:", error);
          // Continue anyway - backend might not have draft
        }
      }

      // Clear all chatbot data (conversation, session, draft)
      await clearAllChatbotData();
      
      // Reset state
      setMessages([getWelcomeMessage()]);
      setDraftId(null);
      setHasAutoStarted(false);
      
      // Create new session ID
      const newSessionId = await getOrCreateSessionId();
      setSessionId(newSessionId);
      
      Alert.alert("Thành công", "Đã làm mới cuộc trò chuyện");
    } catch (error) {
      console.log("Error refreshing chat:", error);
      // Still clear local state even if API call fails
      await clearAllChatbotData();
      setMessages([getWelcomeMessage()]);
      setDraftId(null);
      setHasAutoStarted(false);
      const newSessionId = await getOrCreateSessionId();
      setSessionId(newSessionId);
      Alert.alert("Thành công", "Đã làm mới cuộc trò chuyện");
    }
  };

  /**
   * Handle close chat with confirmation
   * Clears draft, conversation history, and closes chat
   */
  const handleClose = async () => {
    Alert.alert(
      "Xác nhận đóng chat",
      "Bạn có chắc chắn muốn đóng chat? Tất cả lịch sử hội thoại và booking draft sẽ bị xóa.",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đóng",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear draft on backend
              if (draftId) {
                try {
                  await AiAssistantService.clearDraft(draftId);
                  console.log("Draft cleared successfully by draft_id");
                } catch (error) {
                  console.log("Failed to clear draft by draft_id:", error);
                  // Fallback to session_id if draft_id fails
                  if (sessionId) {
                    try {
                      await AiAssistantService.clearDraftBySession(sessionId);
                      console.log("Draft cleared successfully by session_id (fallback)");
                    } catch (sessionError) {
                      console.log("Failed to clear draft by session_id:", sessionError);
                      // Continue anyway - backend might not have draft
                    }
                  }
                }
              } else if (sessionId) {
                // Clear bằng session_id nếu không có draft_id
                try {
                  await AiAssistantService.clearDraftBySession(sessionId);
                  console.log("Draft cleared successfully by session_id");
                } catch (error) {
                  console.log("Failed to clear draft by session_id:", error);
                  // Continue anyway - backend might not have draft
                }
              }

              // Clear all chatbot data (conversation, session, draft)
              await clearAllChatbotData();
              
              // Reset state
              setMessages([getWelcomeMessage()]);
              setDraftId(null);
              setHasAutoStarted(false);
              
              // Close chat
              setIsOpen(false);
              
              Alert.alert("Thành công", "Đã đóng chat và xóa lịch sử");
            } catch (error) {
              console.log("Error closing chat:", error);
              // Still clear local state and close even if API call fails
              await clearAllChatbotData();
              setMessages([getWelcomeMessage()]);
              setDraftId(null);
              setHasAutoStarted(false);
              setIsOpen(false);
              Alert.alert("Thành công", "Đã đóng chat");
            }
          },
        },
      ]
    );
  };

  const positionStyles =
    position === "bottom-right"
      ? { bottom: 20, right: 20 }
      : { bottom: 20, left: 20 };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <TouchableOpacity
          style={[styles.floatingButton, positionStyles]}
          onPress={handleToggle}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>Trợ Lý Thông Minh</Text>
                  <Text style={styles.headerSubtitle}>Sẵn sàng hỗ trợ</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                {messages.length > 1 && (
                  <TouchableOpacity
                    onPress={handleRefresh}
                    style={styles.headerButton}
                  >
                    <Ionicons name="reload" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.headerButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages Area */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={[
                styles.messagesContent,
                keyboardHeight > 0 && { 
                  paddingBottom: Math.min(keyboardHeight, 0

                  ) + 20 
                },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
              }}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
                </View>
              ) : (
                <>
                  {messages.map((message) => (
                    <AIChatbotMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <AIChatbotMessage
                      message={{
                        id: "loading",
                        content: "",
                        sender: "assistant",
                        timestamp: new Date(),
                        isLoading: true,
                      }}
                    />
                  )}
                </>
              )}
            </ScrollView>

            {/* Quick Actions - Only show if not auto-started yet */}
            {messages.length <= 1 && !hasAutoStarted && (
              <QuickActions
                actions={quickActions}
                onActionClick={handleQuickAction}
                disabled={isLoading}
              />
            )}

            {/* Input */}
            <AIChatbotInput
              onSendMessage={handleSendMessage}
              disabled={isLoading}
              placeholder="Nhập câu hỏi của bạn..."
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1890ff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1890ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerTextContainer: {
    gap: 2,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
  },
  headerRight: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  messagesContent: {
    paddingVertical: 16,
    paddingHorizontal: 0,
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
});

export default AIChatbotWidget;

