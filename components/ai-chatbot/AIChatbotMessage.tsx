import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { AIChatbotMessage as MessageType } from "@/src/types/ai-assistant.types";

interface AIChatbotMessageProps {
  message: MessageType;
}

const AIChatbotMessage: React.FC<AIChatbotMessageProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUser = message.sender === "user";

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.messageWrapper,
          isUser ? styles.userWrapper : styles.assistantWrapper,
        ]}
      >
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            isUser ? styles.userAvatar : styles.assistantAvatar,
          ]}
        >
          <Text style={styles.avatarText}>
            {isUser ? "👤" : "🤖"}
          </Text>
        </View>

        {/* Message Content */}
        <View
          style={[
            styles.contentWrapper,
            isUser ? styles.userContentWrapper : styles.assistantContentWrapper,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            {message.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color={isUser ? "#fff" : "#1890ff"}
                />
                <Text
                  style={[
                    styles.loadingText,
                    isUser ? styles.userText : styles.assistantText,
                  ]}
                >
                  Đang soạn tin nhắn...
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.messageText,
                  isUser ? styles.userText : styles.assistantText,
                ]}
              >
                {message.content}
              </Text>
            )}
          </View>

          {/* Timestamp */}
          <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: "flex-end",
  },
  assistantContainer: {
    alignItems: "flex-start",
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "75%",
  },
  userWrapper: {
    flexDirection: "row-reverse",
  },
  assistantWrapper: {
    flexDirection: "row",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatar: {
    backgroundColor: "#1890ff",
  },
  assistantAvatar: {
    backgroundColor: "#52c41a",
  },
  avatarText: {
    fontSize: 16,
  },
  contentWrapper: {
    marginHorizontal: 8,
    alignItems: "flex-start",
  },
  userContentWrapper: {
    alignItems: "flex-end",
  },
  assistantContentWrapper: {
    alignItems: "flex-start",
  },
  messageBubble: {
    padding: 10,
    borderRadius: 18,
    maxWidth: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: "#1890ff",
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: "#fff",
  },
  assistantText: {
    color: "#000",
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
});

export default AIChatbotMessage;

