import React from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import {
  Card,
  Text,
  Button,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useCart } from "@/src/context/CartContext";
import { Image } from "react-native";
import { useProductMainImage } from "@/src/hooks";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { mainImageUrl, loading: imageLoading } = useProductMainImage(
    product.product_id
  );

  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  const handleViewDetail = () => {
    router.push(`/products/${product.product_url}`);
  };

  const price = product.pricing?.salePrice || product.pricing?.basePrice || 0;
  const hasDiscount =
    product.pricing?.salePrice &&
    product.pricing.salePrice < product.pricing.basePrice;

  return (
    <Card
      style={styles.card}
      mode="elevated"
    >
      <TouchableOpacity
        onPress={handleViewDetail}
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
                  product.mainImageUrl ||
                  "https://via.placeholder.com/200",
              }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          {hasDiscount && (
            <Chip
              style={styles.discountBadge}
              textStyle={styles.discountText}
              mode="flat"
            >
              -{product.pricing.discountPercentage}%
            </Chip>
          )}
          {!product.isAvailable && (
            <View style={styles.outOfStockOverlay}>
              <Chip
                mode="flat"
                textStyle={styles.outOfStockText}
                style={styles.outOfStockBadge}
              >
                Hết hàng
              </Chip>
            </View>
          )}
        </View>

        <Card.Content style={styles.content}>
          <Text
            variant="bodyMedium"
            numberOfLines={2}
            style={styles.title}
          >
            {product.product_name}
          </Text>

          <View style={styles.priceContainer}>
            {hasDiscount ? (
              <View>
                <Text
                  variant="bodySmall"
                  style={styles.originalPrice}
                >
                  {product.pricing.basePrice.toLocaleString("vi-VN")}đ
                </Text>
                <Text
                  variant="titleMedium"
                  style={styles.salePrice}
                >
                  {price.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            ) : (
              <Text
                variant="titleMedium"
                style={styles.price}
              >
                {price.toLocaleString("vi-VN")}đ
              </Text>
            )}
          </View>
        </Card.Content>
      </TouchableOpacity>

      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleAddToCart}
          disabled={!product.isAvailable}
          style={styles.addButton}
          contentStyle={styles.addButtonContent}
          labelStyle={styles.addButtonLabel}
        >
          Thêm
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    margin: 8,
    backgroundColor: "white",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: CARD_WIDTH,
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ff4d4f",
  },
  discountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockBadge: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  outOfStockText: {
    fontSize: 14,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 80,
  },
  title: {
    fontWeight: "600",
    marginBottom: 8,
    lineHeight: 20,
  },
  priceContainer: {
    marginTop: 4,
  },
  price: {
    color: "#6C7BEA",
    fontWeight: "bold",
  },
  originalPrice: {
    textDecorationLine: "line-through",
    color: "#999",
    marginBottom: 2,
  },
  salePrice: {
    color: "#ff4d4f",
    fontWeight: "bold",
  },
  actions: {
    padding: 8,
    paddingTop: 0,
  },
  addButton: {
    flex: 1,
    borderRadius: 8,
  },
  addButtonContent: {
    height: 36,
  },
  addButtonLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
