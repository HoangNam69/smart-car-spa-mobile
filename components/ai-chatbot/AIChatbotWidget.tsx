import { useAuth } from "@/src/context/AuthContext";
import { AiAssistantService } from "@/src/services/ai-assistant.service";
import { ChatMessage, AIChatbotMessage as MessageType, QuickAction } from "@/src/types/ai-assistant.types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
        ? `Xin chào ${user.full_name}! Tôi là trợ lý thông minh của trung tâm chăm sóc xe. Tôi có thể giúp bạn đặt lịch hẹn, tìm hiểu về dịch vụ, và trả lời các câu hỏi của bạn. Bạn cần hỗ trợ gì hôm nay?`
        : "Xin chào! Tôi là trợ lý thông minh của trung tâm chăm sóc xe. Tôi có thể giúp bạn đặt lịch hẹn, tìm hiểu về dịch vụ, và trả lời các câu hỏi của bạn. Bạn cần hỗ trợ gì hôm nay?",
      sender: "assistant",
      timestamp: new Date(),
    };
  };

  // Initialize messages
  useEffect(() => {
    const initializeMessages = async () => {
      const savedMessages = await loadConversationHistory();

      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        const welcomeMsg: MessageType = {
          id: "1",
          content: user?.full_name
            ? `Xin chào ${user.full_name}! Tôi là trợ lý thông minh của trung tâm chăm sóc xe. Tôi có thể giúp bạn đặt lịch hẹn, tìm hiểu về dịch vụ, và trả lời các câu hỏi của bạn. Bạn cần hỗ trợ gì hôm nay?`
            : "Xin chào! Tôi là trợ lý thông minh của trung tâm chăm sóc xe. Tôi có thể giúp bạn đặt lịch hẹn, tìm hiểu về dịch vụ, và trả lời các câu hỏi của bạn. Bạn cần hỗ trợ gì hôm nay?",
          sender: "assistant",
          timestamp: new Date(),
        };
        setMessages([welcomeMsg]);
      }
    };

    initializeMessages();
  }, [user?.full_name]);

  // Update welcome message when user changes
  useEffect(() => {
    const updateWelcomeMessage = async () => {
      if (!authLoading && isAuthenticated && user?.full_name) {
        const savedMessages = await loadConversationHistory();

        const welcomeMsg: MessageType = {
          id: "1",
          content: user?.full_name
            ? `Xin chào ${user.full_name}! Tôi là trợ lý thông minh của trung tâm chăm sóc xe. Tôi có thể giúp bạn đặt lịch hẹn, tìm hiểu về dịch vụ, và trả lời các câu hỏi của bạn. Bạn cần hỗ trợ gì hôm nay?`
            : "Xin chào! Tôi là trợ lý thông minh của trung tâm chăm sóc xe. Tôi có thể giúp bạn đặt lịch hẹn, tìm hiểu về dịch vụ, và trả lời các câu hỏi của bạn. Bạn cần hỗ trợ gì hôm nay?",
          sender: "assistant",
          timestamp: new Date(),
        };

        if (savedMessages.length === 0) {
          setMessages([welcomeMsg]);
        } else {
          const firstMessage = savedMessages[0];
          if (firstMessage.id === "1" && firstMessage.sender === "assistant") {
            const updatedMessages = [welcomeMsg, ...savedMessages.slice(1)];
            setMessages(updatedMessages);
          }
        }
      }
    };

    updateWelcomeMessage();
  }, [user?.full_name, isAuthenticated, authLoading]);

  // Save conversation history whenever messages change (only when chat is open)
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      saveConversationHistory(messages);
    }
  }, [messages, isOpen]);

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
        setKeyboardHeight(event.endCoordinates.height);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
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

  const handleSendMessage = async (content: string) => {
    // Check authentication before sending
    if (!isAuthenticated) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để sử dụng trợ lý AI");
      return;
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
      const response = await AiAssistantService.chat({
        message: content,
        conversation_history: conversationHistory,
      });

      // Add assistant response
      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending message to AI:", error);
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
  };

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
    } else {
      // When closing chat, clear conversation history
      await clearConversationHistory();
      setMessages([getWelcomeMessage()]);
    }

    setIsOpen(!isOpen);
  };

  /**
   * Clear conversation history and reset to welcome message
   */
  const handleClearHistory = () => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa lịch sử hội thoại?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await clearConversationHistory();
          setMessages([getWelcomeMessage()]);
          Alert.alert("Thành công", "Đã xóa lịch sử hội thoại");
        },
      },
    ]);
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
        onRequestClose={async () => {
          // Clear conversation when closing via back button
          await clearConversationHistory();
          setMessages([getWelcomeMessage()]);
          setIsOpen(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                    onPress={handleClearHistory}
                    style={styles.headerButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleToggle}
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
                keyboardHeight > 0 && { paddingBottom: keyboardHeight + 20 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
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

            {/* Quick Actions */}
            {messages.length <= 1 && (
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

