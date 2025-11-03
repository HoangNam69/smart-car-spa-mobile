import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { Image } from "react-native";
import { useRouter } from "expo-router";
import {
  usePublicProducts,
  usePricing,
  useProductMainImage,
} from "@/src/hooks";
import { useCart } from "@/src/context/CartContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

// Product Card Component
const ProductCard: React.FC<{ product: any }> = ({ product }) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { mainImageUrl, loading: imageLoading } = useProductMainImage(
    product.product_id
  );
  const { preview: getPrice } = usePricing();
  const [price, setPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    const fetchPrice = async () => {
      setPriceLoading(true);
      try {
        const priceData = await getPrice({
          product_id: product.product_id,
          qty: 1,
        });
        setPrice(priceData?.total_price ?? null);
      } catch (error) {
        console.error("Error fetching price:", error);
        setPrice(null);
      } finally {
        setPriceLoading(false);
      }
    };
    fetchPrice();
  }, [product.product_id, getPrice]);

  const formatPrice = (value: number | null) => {
    if (value === null || value === undefined) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <Card
      style={styles.card}
      mode="elevated"
    >
      <TouchableOpacity
        onPress={() => router.push(`/products/${product.product_url}`)}
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
                uri: mainImageUrl || "https://via.placeholder.com/200",
              }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
        </View>

        <Card.Content style={styles.content}>
          <Text
            variant="titleSmall"
            numberOfLines={2}
            style={styles.title}
          >
            {product.product_name}
          </Text>

          <View style={styles.tagsContainer}>
            {product.brand && (
              <Chip
                style={styles.brandChip}
                textStyle={styles.chipText}
              >
                {product.brand}
              </Chip>
            )}
            {product.is_featured && (
              <Chip
                style={styles.featuredChip}
                textStyle={styles.chipText}
              >
                Nổi Bật
              </Chip>
            )}
          </View>

          <Text
            variant="titleMedium"
            style={styles.price}
          >
            {priceLoading ? "..." : formatPrice(price)}
          </Text>
        </Card.Content>
      </TouchableOpacity>

      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => addToCart(product, 1)}
          disabled={!product.isAvailable}
          style={styles.addButton}
          contentStyle={styles.addButtonContent}
          labelStyle={styles.addButtonLabel}
          icon="cart-plus"
        >
          Thêm Vào Giỏ
        </Button>
      </Card.Actions>
    </Card>
  );
};

// Featured Products Section Component
export default function FeaturedProductsSection() {
  const router = useRouter();
  const { products: rawProducts, loading } = usePublicProducts();

  // Filter featured products
  const featuredProducts = useMemo(() => {
    return rawProducts.filter((p) => p.is_featured).slice(0, 6);
  }, [rawProducts]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#6C7BEA"
        />
      </View>
    );
  }

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          variant="titleMedium"
          style={styles.subtitle}
        >
          CÁC SẢN PHẨM NỔI BẬT
        </Text>
        <Text
          variant="headlineMedium"
          style={styles.mainTitle}
        >
          SMART CAR SPA
        </Text>
      </View>

      {/* Products Grid */}
      <FlatList
        data={featuredProducts}
        renderItem={({ item }) => <ProductCard product={item} />}
        keyExtractor={(item) => item.product_id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />

      {/* View All Button */}
      <View style={styles.viewAllContainer}>
        <Button
          mode="outlined"
          onPress={() => router.push("/products")}
          style={styles.viewAllButton}
          contentStyle={styles.viewAllButtonContent}
          labelStyle={styles.viewAllButtonLabel}
        >
          Xem Tất Cả Sản Phẩm
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  subtitle: {
    color: "#333",
    fontWeight: "bold",
    marginBottom: 8,
  },
  mainTitle: {
    color: "#6C7BEA",
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 8,
  },
  row: {
    justifyContent: "flex-start",
  },
  card: {
    width: CARD_WIDTH,
    margin: 8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.75,
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  content: {
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 120,
  },
  title: {
    fontWeight: "600",
    marginBottom: 8,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  brandChip: {
    backgroundColor: "#E3F2FD",
    height: 28,
  },
  featuredChip: {
    backgroundColor: "#FFF9C4",
    height: 28,
  },
  chipText: {
    fontSize: 11,
    lineHeight: 14,
    paddingVertical: 2,
  },
  price: {
    color: "#333",
    fontWeight: "bold",
  },
  actions: {
    padding: 8,
    paddingTop: 0,
  },
  addButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "#6C7BEA",
  },
  addButtonContent: {
    height: 40,
  },
  addButtonLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  viewAllContainer: {
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 20,
  },
  viewAllButton: {
    borderWidth: 2,
    borderColor: "#6C7BEA",
    borderRadius: 8,
  },
  viewAllButtonContent: {
    height: 50,
    minWidth: 200,
  },
  viewAllButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6C7BEA",
  },
});
