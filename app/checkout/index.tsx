import PromotionModal from "@/components/promotions/PromotionModal";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { useBranches } from "@/src/hooks/useBranches";
import { useCreateAndPay } from "@/src/hooks/usePayment";
import { useActivePromotions } from "@/src/hooks/usePromotions";
import { Branch } from "@/src/services/branchService";
import { catalogService } from "@/src/services/catalogService";
import { Promotion } from "@/src/services/promotionService";
import {
  calculateTotalDiscounts,
  isPromotionApplicable,
} from "@/src/utils/promotionCalculator";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  Divider,
  RadioButton,
  Text,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { createAndPay, loading: paymentLoading } = useCreateAndPay();
  const { data: promotionsData, loading: promotionsLoading } =
    useActivePromotions({});
  const { branches, loading: branchesLoading } = useBranches();

  // Form state
  const [customerName, setCustomerName] = useState(user?.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [email, setEmail] = useState(user?.email || "");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK">("CASH");

  // Promotion state
  const [selectedPromotions, setSelectedPromotions] = useState<Promotion[]>([]);
  const [isPromotionModalVisible, setIsPromotionModalVisible] = useState(false);

  // Branch state
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const loading = paymentLoading;

  // Available promotions (filter applicable ones)
  const availablePromotions = useMemo(() => {
    if (!promotionsData?.content) return [];
    return promotionsData.content.filter((promo) =>
      isPromotionApplicable(promo, cart)
    );
  }, [promotionsData, cart]);

  // Calculate cart summary with promotions
  const cartSummary = useMemo(() => {
    const summary = calculateTotalDiscounts(selectedPromotions, cart);
    return {
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Number(summary.subtotal) || 0,
      totalDiscount: Number(summary.totalDiscount) || 0,
      totalAmount: Number(summary.finalTotal) || 0,
      appliedPromotions: summary.appliedPromotions || [],
    };
  }, [selectedPromotions, cart]);

  // Check inventory for all branches and select the best one
  useEffect(() => {
    const checkInventoryAndSelectBranch = async () => {
      if (!branches || branches.length === 0 || cart.length === 0) return;

      // Reset selected branch when dependencies change
      if (selectedBranch) return; // Already selected, don't recheck

      console.log("Checking inventory across branches...");

      try {
        // Check each branch's catalog to find one with sufficient stock
        for (const branch of branches) {
          try {
            console.log(`Checking branch: ${branch.branch_name}`);
            const catalog = await catalogService.getForSaleCatalogs(
              branch.branch_id
            );

            if (!catalog?.items) {
              console.log(`No catalog items for branch ${branch.branch_name}`);
              continue;
            }

            // Build inventory map for this branch
            const inventoryMap = new Map<string, number>();
            for (const item of catalog.items) {
              inventoryMap.set(
                item.product.product_id,
                item.inventory?.available || 0
              );
            }

            console.log(`Inventory map:`, Object.fromEntries(inventoryMap));

            // Check if this branch has enough stock for all cart items
            let hasAllStock = true;
            for (const cartItem of cart) {
              const availableStock = inventoryMap.get(
                cartItem.product.product_id
              );
              const needed = cartItem.quantity;

              console.log(
                `   ${
                  cartItem.product.product_name
                }: need ${needed}, available ${availableStock || 0}`
              );

              if (availableStock === undefined || availableStock < needed) {
                hasAllStock = false;
                break;
              }
            }

            if (hasAllStock) {
              console.log(`   Branch ${branch.branch_name} has all items!`);
              setSelectedBranch(branch);
              return; // Found a suitable branch, stop searching
            } else {
              console.log(`   Branch ${branch.branch_name} missing some items`);
            }
          } catch (error) {
            console.error(` Error checking branch ${branch.branch_id}:`, error);
            continue;
          }
        }

        // No branch has all items in stock - select first branch as fallback
        console.log(" No branch has all items, using fallback");
        if (branches.length > 0) {
          setSelectedBranch(branches[0]);
        }
      } catch (error) {
        console.error(" Error checking inventory:", error);
        // Fallback to first branch
        if (branches.length > 0) {
          setSelectedBranch(branches[0]);
        }
      }
    };

    checkInventoryAndSelectBranch();
  }, [branches, cart, selectedBranch]);

  // Handle promotion toggle
  const handleTogglePromotion = useCallback(
    (promotion: Promotion) => {
      setSelectedPromotions((prev) => {
        const isSelected = prev.some(
          (p) => p.promotion_id === promotion.promotion_id
        );
        if (isSelected) {
          return prev.filter((p) => p.promotion_id !== promotion.promotion_id);
        } else {
          if (!isPromotionApplicable(promotion, cart)) {
            Alert.alert(
              "Thông báo",
              "Khuyến mãi này không áp dụng cho đơn hàng hiện tại"
            );
            return prev;
          }
          return [...prev, promotion];
        }
      });
    },
    [cart]
  );

  // Auto-remove non-applicable promotions when cart changes
  useEffect(() => {
    if (selectedPromotions.length === 0) return;
    const nonApplicablePromotions = selectedPromotions.filter(
      (promo) => !isPromotionApplicable(promo, cart)
    );
    if (nonApplicablePromotions.length > 0) {
      setSelectedPromotions((prev) =>
        prev.filter((promo) => isPromotionApplicable(promo, cart))
      );
      for (const promo of nonApplicablePromotions) {
        Alert.alert(
          "Thông báo",
          `Khuyến mãi "${promo.name}" không còn áp dụng và đã bị bỏ chọn`
        );
      }
    }
  }, [cart, selectedPromotions]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      router.replace("/products");
    }
  }, [cart.length, router]);

  const handleSubmit = async () => {
    // Validate form
    if (!customerName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ tên");
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập địa chỉ giao hàng");
      return;
    }
    if (!selectedBranch) {
      Alert.alert("Lỗi", "Không tìm thấy chi nhánh");
      return;
    }

    try {
      // Prepare promotion snapshot (matching webapp format)
      const promotionSnapshot = selectedPromotions.map((promo) => ({
        promotion_id: promo.promotion_id,
        code: promo.promotion_code,
        name: promo.name,
        description: promo.description,
        start_at: promo.start_at,
        end_at: promo.end_at,
        usage_limit: promo.usage_limit,
        per_customer_limit: promo.per_customer_limit,
        priority: promo.priority,
        is_stackable: promo.is_stackable,
        coupon_redeem_once: promo.coupon_redeem_once,
        branch: promo.branch
          ? {
              branch_id: promo.branch.branch_id,
              branch_name: promo.branch.branch_name,
              branch_url: promo.branch.branch_url,
            }
          : null,
        discount_lines: promo.promotion_lines.map((line) => ({
          promotion_line_id: line.promotion_line_id,
          line_type: line.line_type,
          target_id: line.target_id,
          discount_type: line.discount_type,
          discount_value: line.discount_value,
          max_discount_amount: line.max_discount_amount,
          min_order_value: line.min_order_value,
          min_quantity: line.min_quantity,
          buy_qty: line.buy_qty,
          get_qty: line.get_qty,
          free_product_name: line.free_product?.product_name,
          free_quantity: line.free_quantity,
          line_priority: line.line_priority,
          is_active: line.is_active,
        })),
      }));

      // Create payload matching webapp format 100%
      const orderPayload = {
        branch_id: selectedBranch.branch_id,
        warehouse_id: selectedBranch.branch_id,
        customer_id: user?.user_id,
        promotion_ids: selectedPromotions.map((p) => p.promotion_id),
        promotion_snapshot: JSON.stringify(promotionSnapshot),
        original_amount: cartSummary.subtotal,
        total_discount_amount: cartSummary.totalDiscount,
        final_amount: cartSummary.totalAmount,
        discount_percentage:
          cartSummary.subtotal > 0
            ? (cartSummary.totalDiscount / cartSummary.subtotal) * 100
            : 0,
        shipping_full_name: customerName,
        shipping_phone: phoneNumber,
        shipping_address: address,
        shipping_notes: note || "",
        lines: cart.map((item) => ({
          product_id: item.product.product_id,
          qty: item.quantity,
          unit_price: item.unitPrice,
          is_free_item: false,
        })),
        payment_method: paymentMethod,
      };

      console.log(" Order payload:", orderPayload);

      const result = await createAndPay(orderPayload);
      console.log(" Order created:", result);

      // Clear cart
      clearCart();

      // Navigate to success page
      router.push("/checkout/success" as any);
    } catch (error) {
      console.error(" Checkout error:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
    }
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Customer Info Section */}
          <Card style={styles.section} mode="elevated">
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Thông tin khách hàng
              </Text>

              <TextInput
                label="Họ và tên *"
                value={customerName}
                onChangeText={setCustomerName}
                mode="outlined"
                style={styles.input}
                placeholder="Nhập họ và tên"
              />

              <TextInput
                label="Số điện thoại *"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                mode="outlined"
                style={styles.input}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                placeholder="Nhập email (không bắt buộc)"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                label="Địa chỉ giao hàng *"
                value={address}
                onChangeText={setAddress}
                mode="outlined"
                style={styles.input}
                placeholder="Nhập địa chỉ giao hàng"
                multiline
                numberOfLines={3}
              />

              <TextInput
                label="Ghi chú"
                value={note}
                onChangeText={setNote}
                mode="outlined"
                style={styles.input}
                placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
                multiline
                numberOfLines={2}
              />
            </Card.Content>
          </Card>

          {/* Promotion Section */}
          <Card style={styles.section} mode="elevated">
            <Card.Content>
              <View style={styles.promotionHeader}>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                  Khuyến mãi
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setIsPromotionModalVisible(true)}
                  style={styles.selectPromotionButton}
                  disabled={
                    promotionsLoading || availablePromotions.length === 0
                  }
                  loading={promotionsLoading}
                >
                  Chọn KM
                </Button>
              </View>

              {selectedPromotions.length > 0 ? (
                <View style={styles.selectedPromotionsContainer}>
                  {selectedPromotions.map((promo) => (
                    <Chip
                      key={promo.promotion_id}
                      icon="ticket-percent"
                      onClose={() => handleTogglePromotion(promo)}
                      style={styles.selectedPromotionChip}
                      textStyle={styles.selectedPromotionText}
                    >
                      {promo.name}
                    </Chip>
                  ))}
                </View>
              ) : (
                <Text variant="bodySmall" style={styles.noPromotionText}>
                  Chưa áp dụng khuyến mãi nào
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* Payment Method Section */}
          <Card style={styles.section} mode="elevated">
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Phương thức thanh toán
              </Text>

              <RadioButton.Group
                onValueChange={(value) =>
                  setPaymentMethod(value as "CASH" | "BANK")
                }
                value={paymentMethod}
              >
                <View style={styles.radioItem}>
                  <RadioButton value="CASH" />
                  <View style={styles.radioLabel}>
                    <Text variant="bodyLarge">
                      Thanh toán khi nhận hàng (COD)
                    </Text>
                    <Text variant="bodySmall" style={styles.radioDescription}>
                      Thanh toán bằng tiền mặt khi nhận hàng
                    </Text>
                  </View>
                </View>

                <View style={styles.radioItem}>
                  <RadioButton value="BANK" />
                  <View style={styles.radioLabel}>
                    <Text variant="bodyLarge">Chuyển khoản ngân hàng</Text>
                    <Text variant="bodySmall" style={styles.radioDescription}>
                      Chuyển khoản trước khi nhận hàng
                    </Text>
                  </View>
                </View>
              </RadioButton.Group>
            </Card.Content>
          </Card>

          {/* Order Summary */}
          <Card style={styles.section} mode="elevated">
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Tổng quan đơn hàng
              </Text>

              <View style={styles.summaryRow}>
                <Text variant="bodyLarge">Số sản phẩm:</Text>
                <Text variant="bodyLarge" style={styles.summaryValue}>
                  {cartSummary.itemCount} sản phẩm
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="bodyLarge">Tạm tính:</Text>
                <Text variant="bodyLarge" style={styles.summaryValue}>
                  {cartSummary.subtotal.toLocaleString("vi-VN")}đ
                </Text>
              </View>

              {cartSummary.totalDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text variant="bodyLarge">Giảm giá:</Text>
                  <Text variant="bodyLarge" style={styles.discountValue}>
                    -{cartSummary.totalDiscount.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text variant="bodyLarge">Phí vận chuyển:</Text>
                <Text variant="bodyLarge" style={styles.freeShipping}>
                  Miễn phí
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text variant="titleLarge" style={styles.totalLabel}>
                  Tổng cộng:
                </Text>
                <Text variant="headlineSmall" style={styles.total}>
                  {cartSummary.totalAmount.toLocaleString("vi-VN")}đ
                </Text>
              </View>

              {cartSummary.totalDiscount > 0 && (
                <Text variant="bodySmall" style={styles.savingsText}>
                  Bạn đã tiết kiệm được{" "}
                  {cartSummary.totalDiscount.toLocaleString("vi-VN")}đ
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* Product List */}
          <Card style={styles.section} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Sản phẩm ({cart.length})
              </Text>

              {cart.map((item, index) => (
                <View key={item.product.product_id}>
                  {index > 0 && <Divider style={styles.itemDivider} />}
                  <View style={styles.productItem}>
                    <View style={styles.productInfo}>
                      <Text
                        variant="bodyMedium"
                        numberOfLines={2}
                        style={styles.productName}
                      >
                        {item.product.product_name}
                      </Text>
                      <Text variant="bodySmall" style={styles.productQuantity}>
                        Số lượng: {item.quantity}
                      </Text>
                    </View>
                    <Text variant="bodyLarge" style={styles.productPrice}>
                      {item.subtotal.toLocaleString("vi-VN")}đ
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer with Submit Button */}
        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            disabled={loading || branchesLoading}
            loading={loading}
          >
            {loading ? "Đang xử lý..." : "Đặt hàng"}
          </Button>
        </View>
      </KeyboardAvoidingView>

      {/* Promotion Modal */}
      <PromotionModal
        visible={isPromotionModalVisible}
        onDismiss={() => setIsPromotionModalVisible(false)}
        promotions={availablePromotions}
        selectedPromotions={selectedPromotions}
        onTogglePromotion={handleTogglePromotion}
        onApply={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: "white",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  promotionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectPromotionButton: {
    borderColor: "#6C7BEA",
    borderRadius: 8,
  },
  selectedPromotionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedPromotionChip: {
    backgroundColor: "#e6f4ff",
    borderColor: "#6C7BEA",
  },
  selectedPromotionText: {
    fontSize: 12,
    color: "#6C7BEA",
  },
  noPromotionText: {
    color: "#999",
    fontStyle: "italic",
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioLabel: {
    flex: 1,
    marginLeft: 8,
  },
  radioDescription: {
    color: "#666",
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  summaryValue: {
    fontWeight: "600",
    color: "#1a1a1a",
  },
  discountValue: {
    fontWeight: "600",
    color: "#f5222d",
  },
  freeShipping: {
    color: "#52c41a",
    fontWeight: "600",
  },
  divider: {
    marginVertical: 12,
  },
  totalLabel: {
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  total: {
    color: "#6C7BEA",
    fontWeight: "bold",
  },
  savingsText: {
    color: "#52c41a",
    textAlign: "right",
    marginTop: 4,
    fontStyle: "italic",
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  productQuantity: {
    color: "#666",
  },
  productPrice: {
    fontWeight: "600",
    color: "#6C7BEA",
  },
  itemDivider: {
    marginVertical: 0,
  },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButton: {
    borderRadius: 12,
    backgroundColor: "#6C7BEA",
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
