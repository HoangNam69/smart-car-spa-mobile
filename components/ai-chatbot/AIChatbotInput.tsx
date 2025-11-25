import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AIChatbotInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const AIChatbotInput: React.FC<AIChatbotInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Nhập câu hỏi của bạn...",
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          editable={!disabled}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputValue.trim() || disabled}
          style={[
            styles.sendButton,
            (!inputValue.trim() || disabled) && styles.sendButtonDisabled,
          ]}
        >
          <Ionicons
            name="send"
            size={20}
            color={!inputValue.trim() || disabled ? "#ccc" : "#fff"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    maxHeight: 100,
    paddingVertical: 4,
    lineHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1890ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#d9d9d9",
  },
});

export default AIChatbotInput;

