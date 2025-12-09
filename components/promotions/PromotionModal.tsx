import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  Card,
  Chip,
  Divider,
  Checkbox,
} from "react-native-paper";
import { Promotion } from "@/src/services/promotionService";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface PromotionModalProps {
  visible: boolean;
  onDismiss: () => void;
  promotions: Promotion[];
  selectedPromotions: Promotion[];
  onTogglePromotion: (promotion: Promotion) => void;
  onApply: () => void;
}

export default function PromotionModal({
  visible,
  onDismiss,
  promotions,
  selectedPromotions,
  onTogglePromotion,
  onApply,
}: PromotionModalProps) {
  const isSelected = (promotion: Promotion) =>
    selectedPromotions.some((p) => p.promotion_id === promotion.promotion_id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="gift-outline"
              size={24}
              color="#6C7BEA"
            />
            <Text
              variant="titleLarge"
              style={styles.headerTitle}
            >
              Chọn khuyến mãi
            </Text>
            <TouchableOpacity onPress={onDismiss}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <Divider />

          {/* Promotion List */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {promotions.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="gift-off-outline"
                  size={64}
                  color="#ccc"
                />
                <Text
                  variant="bodyLarge"
                  style={styles.emptyText}
                >
                  Không có khuyến mãi nào
                </Text>
              </View>
            ) : (
              promotions.map((promotion) => (
                <TouchableOpacity
                  key={promotion.promotion_id}
                  onPress={() => onTogglePromotion(promotion)}
                  activeOpacity={0.7}
                >
                  <Card
                    style={styles.promotionCard}
                    mode="outlined"
                  >
                    <Card.Content>
                      <View style={styles.promotionHeader}>
                        <View style={styles.promotionTitleRow}>
                          <MaterialCommunityIcons
                            name="ticket-percent-outline"
                            size={20}
                            color="#6C7BEA"
                          />
                          <Text
                            variant="titleMedium"
                            style={styles.promotionName}
                          >
                            {promotion.name}
                          </Text>
                        </View>
                        <Checkbox
                          status={
                            isSelected(promotion) ? "checked" : "unchecked"
                          }
                          onPress={() => onTogglePromotion(promotion)}
                          color="#6C7BEA"
                        />
                      </View>

                      {promotion.description && (
                        <Text
                          variant="bodySmall"
                          style={styles.promotionDescription}
                        >
                          {promotion.description}
                        </Text>
                      )}

                      <View style={styles.promotionDetails}>
                        <Chip
                          icon="clock-outline"
                          style={styles.detailChip}
                          textStyle={styles.chipText}
                        >
                          {formatDate(promotion.start_at)} -{" "}
                          {formatDate(promotion.end_at)}
                        </Chip>

                        {promotion.promotion_code && (
                          <Chip
                            icon="barcode"
                            style={styles.detailChip}
                            textStyle={styles.chipText}
                          >
                            {promotion.promotion_code}
                          </Chip>
                        )}

                        {promotion.is_stackable && (
                          <Chip
                            icon="layers"
                            style={[styles.detailChip, styles.stackableChip]}
                            textStyle={styles.chipText}
                          >
                            Có thể chồng
                          </Chip>
                        )}
                      </View>

                      {/* Promotion Lines Info */}
                      {promotion.promotion_lines.length > 0 && (
                        <View style={styles.linesInfo}>
                          {promotion.promotion_lines.map((line, index) => (
                            <View key={line.promotion_line_id || index}>
                              {index > 0 && (
                                <Divider style={styles.lineDivider} />
                              )}
                              <View style={styles.lineItem}>
                                <MaterialCommunityIcons
                                  name="chevron-right"
                                  size={16}
                                  color="#666"
                                />
                                <Text
                                  variant="bodySmall"
                                  style={styles.lineText}
                                >
                                  {line.discount_type === "PERCENTAGE" &&
                                    `Giảm ${line.discount_value}%`}
                                  {line.discount_type === "FIXED_AMOUNT" &&
                                    `Giảm ${line.discount_value.toLocaleString(
                                      "vi-VN"
                                    )}đ`}
                                  {line.discount_type === "FREE_PRODUCT" &&
                                    `Tặng ${line.free_product?.product_name}`}
                                  {line.discount_type === "BUY_X_GET_Y" &&
                                    `Mua ${line.buy_qty} tặng ${line.get_qty}`}
                                </Text>
                              </View>
                              {line.min_order_value && (
                                <Text
                                  variant="bodySmall"
                                  style={styles.minOrderText}
                                >
                                  Đơn tối thiểu:{" "}
                                  {line.min_order_value.toLocaleString("vi-VN")}
                                  đ
                                </Text>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text
              variant="bodyMedium"
              style={styles.selectedCount}
            >
              Đã chọn: {selectedPromotions.length} khuyến mãi
            </Text>
            <Button
              mode="contained"
              onPress={() => {
                onApply();
                onDismiss();
              }}
              style={styles.applyButton}
              contentStyle={styles.applyButtonContent}
            >
              Áp dụng
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    maxHeight: "80%",
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    color: "#999",
    marginTop: 16,
  },
  promotionCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderColor: "#e0e0e0",
  },
  promotionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  promotionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  promotionName: {
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  promotionDescription: {
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  promotionDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  detailChip: {
    height: 28,
    backgroundColor: "#f5f5f5",
  },
  chipText: {
    fontSize: 12,
    lineHeight: 14,
  },
  stackableChip: {
    backgroundColor: "#e6f4ff",
  },
  linesInfo: {
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  lineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  lineText: {
    color: "#333",
    flex: 1,
  },
  lineDivider: {
    marginVertical: 8,
  },
  minOrderText: {
    color: "#666",
    fontSize: 11,
    marginLeft: 20,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  selectedCount: {
    color: "#666",
  },
  applyButton: {
    borderRadius: 12,
    backgroundColor: "#6C7BEA",
  },
  applyButtonContent: {
    paddingHorizontal: 16,
  },
});
