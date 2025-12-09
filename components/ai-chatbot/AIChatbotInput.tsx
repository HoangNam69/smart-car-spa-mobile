import React, { useState, useRef } from "react";
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
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue("");
      // Reset input height by blurring and focusing again
      // This ensures the input doesn't jump when clearing
      if (inputRef.current) {
        inputRef.current.blur();
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputValue.trim() || disabled}
          style={[
            styles.sendButton,
            (!inputValue.trim() || disabled) && styles.sendButtonDisabled,
          ]}
          activeOpacity={0.7}
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
    minHeight: 20,
    paddingVertical: 4,
    paddingHorizontal: 0,
    lineHeight: 20,
    textAlignVertical: "center",
  },
  sendButton: {
    width: 36,
    height: 36,
    minWidth: 36,
    minHeight: 36,
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

