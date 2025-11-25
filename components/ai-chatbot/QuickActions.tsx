import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { QuickAction } from "@/src/types/ai-assistant.types";

interface QuickActionsProps {
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
  disabled?: boolean;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  onActionClick,
  disabled = false,
}) => {
  if (actions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Gợi ý câu hỏi:</Text>
      <View style={styles.actionsContainer}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => onActionClick(action)}
            disabled={disabled}
            style={[
              styles.actionButton,
              disabled && styles.actionButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.actionText,
                disabled && styles.actionTextDisabled,
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    backgroundColor: "#fafafa",
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    backgroundColor: "#fff",
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 13,
    color: "#333",
  },
  actionTextDisabled: {
    color: "#999",
  },
});

export default QuickActions;

