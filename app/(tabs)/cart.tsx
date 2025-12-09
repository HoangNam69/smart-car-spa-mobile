import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Button,
  Card,
  IconButton,
  Divider,
  Badge,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCart } from "@/src/context/CartContext";
import { useProductMainImage } from "@/src/hooks";

// Cart Item Component with image loading
const CartItemCard = ({
  item,
  updateQuantity,
  removeFromCart,
  router,
}: any) => {
  const { mainImageUrl, loading: imageLoading } = useProductMainImage(
    item.product.product_id
  );

  return (
    <Card
      style={styles.cartItem}
      mode="elevated"
    >
      <View style={styles.itemContent}>
        <TouchableOpacity
          onPress={() =>
            router.push(`/products/${item.product.product_url}` as any)
          }
          activeOpacity={0.7}
        >
          <View style={styles.imageContainer}>
            {imageLoading ? (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator
                  size="small"
                  color="#6C7BEA"
                />
              </View>
            ) : (
              <Image
                source={{
                  uri:
                    mainImageUrl ||
                    item.product.mainImageUrl ||
                    "https://via.placeholder.com/100",
                }}
                style={styles.itemImage}
              />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text
            variant="bodyLarge"
            numberOfLines={2}
            style={styles.itemName}
          >
            {item.product.product_name}
          </Text>

          {item.product.brand && (
            <Text
              variant="bodySmall"
              style={styles.itemBrand}
            >
              {item.product.brand}
            </Text>
          )}

          <Text
            variant="titleMedium"
            style={styles.itemPrice}
          >
            {item.unitPrice > 0
              ? `${item.unitPrice.toLocaleString("vi-VN")}đ`
              : "Đang tải..."}
          </Text>

          <View style={styles.quantityContainer}>
            <IconButton
              icon="minus-circle"
              size={28}
              iconColor="#6C7BEA"
              onPress={() =>
                updateQuantity(item.product.product_id, item.quantity - 1)
              }
              disabled={item.quantity <= 1}
              style={styles.quantityButton}
            />
            <View style={styles.quantityBadge}>
              <Text
                variant="titleMedium"
                style={styles.quantityText}
              >
                {item.quantity}
              </Text>
            </View>
            <IconButton
              icon="plus-circle"
              size={28}
              iconColor="#6C7BEA"
              onPress={() =>
                updateQuantity(item.product.product_id, item.quantity + 1)
              }
              style={styles.quantityButton}
            />
          </View>
        </View>

        <View style={styles.itemActions}>
          <Text
            variant="titleLarge"
            style={styles.subtotal}
          >
            {item.subtotal > 0
              ? `${item.subtotal.toLocaleString("vi-VN")}đ`
              : "0đ"}
          </Text>
          <IconButton
            icon="delete"
            iconColor="#ff4d4f"
            size={24}
            onPress={() => removeFromCart(item.product.product_id)}
          />
        </View>
      </View>
    </Card>
  );
};

export default function CartScreen() {
  const router = useRouter();
  const { cart, cartSummary, updateQuantity, removeFromCart } = useCart();

  if (cart.length === 0) {
    return (
      <SafeAreaView
        style={styles.emptyContainer}
        edges={["top", "bottom"]}
      >
        <View style={styles.emptyContent}>
          <IconButton
            icon="cart-outline"
            size={80}
            iconColor="#ccc"
          />
          <Text
            variant="headlineSmall"
            style={styles.emptyTitle}
          >
            Giỏ hàng trống
          </Text>
          <Text
            variant="bodyMedium"
            style={styles.emptyText}
          >
            Hãy thêm sản phẩm vào giỏ hàng
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push("/products")}
            style={styles.emptyButton}
            icon="shopping"
          >
            Xem sản phẩm
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const renderCartItem = ({ item }: any) => (
    <CartItemCard
      item={item}
      updateQuantity={updateQuantity}
      removeFromCart={removeFromCart}
      router={router}
    />
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      <View style={styles.header}>
        <Text
          variant="headlineMedium"
          style={styles.headerTitle}
        >
          Giỏ hàng
        </Text>
        <Badge
          size={24}
          style={styles.badge}
        >
          {cartSummary.itemCount}
        </Badge>
      </View>

      <FlatList
        data={cart}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.product.product_id}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={{ height: 200 }} />}
      />

      <View style={styles.footer}>
        <Card
          style={styles.summaryCard}
          mode="elevated"
        >
          <Card.Content>
            <View style={styles.summaryRow}>
              <Text variant="bodyLarge">Tạm tính:</Text>
              <Text
                variant="bodyLarge"
                style={styles.summaryValue}
              >
                {cartSummary.subtotal.toLocaleString("vi-VN")}đ
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text variant="bodyLarge">Phí vận chuyển:</Text>
              <Text
                variant="bodyLarge"
                style={styles.freeShipping}
              >
                Miễn phí
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text
                variant="titleLarge"
                style={styles.totalLabel}
              >
                Tổng cộng:
              </Text>
              <Text
                variant="headlineSmall"
                style={styles.total}
              >
                {cartSummary.totalAmount.toLocaleString("vi-VN")}đ
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={() => router.push("/checkout" as any)}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
          icon="cart-arrow-right"
        >
          Thanh toán
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.push("/products")}
          style={styles.continueButton}
          icon="shopping"
        >
          Tiếp tục mua sắm
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  emptyText: {
    marginBottom: 24,
    color: "#666",
    textAlign: "center",
  },
  emptyButton: {
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  badge: {
    backgroundColor: "#6C7BEA",
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    marginBottom: 12,
    backgroundColor: "white",
  },
  itemContent: {
    flexDirection: "row",
    padding: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#1a1a1a",
  },
  itemBrand: {
    color: "#666",
    marginBottom: 8,
  },
  itemPrice: {
    color: "#6C7BEA",
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  quantityButton: {
    margin: 0,
  },
  quantityBadge: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  quantityText: {
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  itemActions: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginLeft: 8,
  },
  subtotal: {
    color: "#ff4d4f",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryCard: {
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  summaryValue: {
    fontWeight: "600",
    color: "#1a1a1a",
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
    color: "#ff4d4f",
    fontWeight: "bold",
  },
  checkoutButton: {
    marginBottom: 8,
    borderRadius: 12,
  },
  checkoutButtonContent: {
    paddingVertical: 8,
  },
  continueButton: {
    borderRadius: 12,
    borderColor: "#6C7BEA",
  },
});
