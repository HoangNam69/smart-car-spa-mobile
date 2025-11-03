import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Button,
  ActivityIndicator,
  Chip,
  Divider,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useProductByUrl, usePricing } from "@/src/hooks";
import { useCart } from "@/src/context/CartContext";
import {
  ProductService,
  ProductMedia,
  ProductAttributeValue,
} from "@/src/services/product.service";

const { width } = Dimensions.get("window");

export default function ProductDetailPage() {
  const router = useRouter();
  const { productUrl } = useLocalSearchParams<{ productUrl: string }>();
  const { product, loading: productLoading } = useProductByUrl(
    productUrl || ""
  );
  const { preview } = usePricing();
  const { addToCart } = useCart();

  const [displayPrice, setDisplayPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [images, setImages] = useState<ProductMedia[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imagesLoading, setImagesLoading] = useState(false);

  // Fetch price
  useEffect(() => {
    const fetchPrice = async () => {
      if (product?.product_id) {
        try {
          setPriceLoading(true);
          const priceResponse = await preview({
            product_id: product.product_id,
            qty: 1,
          });
          setDisplayPrice(priceResponse.total_price || 0);
        } catch (error) {
          console.error("Error fetching price:", error);
          setDisplayPrice(0);
        } finally {
          setPriceLoading(false);
        }
      }
    };
    fetchPrice();
  }, [product?.product_id, preview]);

  // Fetch images
  useEffect(() => {
    const fetchImages = async () => {
      if (product?.product_id) {
        try {
          setImagesLoading(true);
          const productImages = await ProductService.getProductImages(
            product.product_id
          );
          // Sort by display_order and is_main
          const sortedImages = productImages.sort((a, b) => {
            if (a.is_main && !b.is_main) return -1;
            if (!a.is_main && b.is_main) return 1;
            return a.display_order - b.display_order;
          });
          setImages(sortedImages);
        } catch (error) {
          console.error("Error fetching images:", error);
          setImages([]);
        } finally {
          setImagesLoading(false);
        }
      }
    };
    fetchImages();
  }, [product?.product_id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(
        {
          ...product,
          pricing: {
            basePrice: displayPrice,
            salePrice: displayPrice,
          },
        },
        quantity
      );
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 999) {
      setQuantity(newQuantity);
    }
  };

  if (productLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#6C7BEA"
        />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["top", "bottom"]}
      >
        <View style={styles.errorContainer}>
          <Text
            variant="headlineSmall"
            style={styles.errorTitle}
          >
            Không tìm thấy sản phẩm
          </Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Quay lại
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Get current display image
  const displayImage =
    images.length > 0
      ? images[selectedImageIndex]?.media_url
      : product.mainImageUrl || "https://via.placeholder.com/400";

  return (
    <>
      <Stack.Screen
        options={{
          title: product?.product_name || "Chi tiết sản phẩm",
          headerShown: true,
        }}
      />
      <SafeAreaView
        style={styles.container}
        edges={["bottom"]}
      >
        <ScrollView>
          {/* Main Image */}
          <View>
            {imagesLoading ? (
              <View style={[styles.image, styles.imageLoading]}>
                <ActivityIndicator
                  size="large"
                  color="#6C7BEA"
                />
              </View>
            ) : (
              <Image
                source={{ uri: displayImage }}
                style={styles.image}
                resizeMode="cover"
              />
            )}

            {/* Image Thumbnails */}
            {images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailScroll}
                contentContainerStyle={styles.thumbnailContainer}
              >
                {images.map((img, index) => (
                  <TouchableOpacity
                    key={img.media_id}
                    onPress={() => setSelectedImageIndex(index)}
                    style={[
                      styles.thumbnail,
                      selectedImageIndex === index && styles.thumbnailActive,
                    ]}
                  >
                    <Image
                      source={{ uri: img.media_url }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.content}>
            <Text
              variant="headlineSmall"
              style={styles.title}
            >
              {product.product_name}
            </Text>

            {product.brand && (
              <Text
                variant="bodyLarge"
                style={styles.brand}
              >
                {product.brand}
              </Text>
            )}

            <View style={styles.priceContainer}>
              {priceLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#6C7BEA"
                />
              ) : (
                <Text
                  variant="headlineMedium"
                  style={styles.price}
                >
                  {displayPrice.toLocaleString("vi-VN")}đ
                </Text>
              )}
            </View>

            <View style={styles.tags}>
              {product.is_featured && (
                <Chip
                  icon="star"
                  style={styles.chip}
                  mode="flat"
                >
                  Nổi bật
                </Chip>
              )}
              {product.brand && (
                <Chip
                  style={styles.chip}
                  mode="flat"
                >
                  {product.brand}
                </Chip>
              )}
              {product.isAvailable && (
                <Chip
                  icon="check-circle"
                  style={[styles.chip, styles.availableChip]}
                  textStyle={styles.availableText}
                  mode="flat"
                >
                  Còn hàng
                </Chip>
              )}
            </View>

            <Divider style={styles.divider} />

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text
                variant="titleMedium"
                style={styles.sectionTitle}
              >
                Số lượng:
              </Text>
              <View style={styles.quantitySelector}>
                <IconButton
                  icon="minus"
                  size={24}
                  onPress={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  mode="contained"
                />
                <Text
                  variant="titleLarge"
                  style={styles.quantityText}
                >
                  {quantity}
                </Text>
                <IconButton
                  icon="plus"
                  size={24}
                  onPress={() => handleQuantityChange(1)}
                  mode="contained"
                />
              </View>
            </View>

            <Divider style={styles.divider} />

            <Text
              variant="titleMedium"
              style={styles.sectionTitle}
            >
              Mô tả sản phẩm
            </Text>
            <Text
              variant="bodyMedium"
              style={styles.description}
            >
              {product.description || "Chưa có mô tả"}
            </Text>

            <Divider style={styles.divider} />

            <Text
              variant="titleMedium"
              style={styles.sectionTitle}
            >
              Chi tiết sản phẩm
            </Text>

            {product.sku && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>SKU:</Text>
                <Text style={styles.detailValue}>{product.sku}</Text>
              </View>
            )}

            {product.brand && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Thương hiệu:</Text>
                <Text style={styles.detailValue}>{product.brand}</Text>
              </View>
            )}

            {product.model && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Model:</Text>
                <Text style={styles.detailValue}>{product.model}</Text>
              </View>
            )}

            {product.unit_of_measure && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Đơn vị:</Text>
                <Text style={styles.detailValue}>
                  {product.unit_of_measure}
                </Text>
              </View>
            )}

            {/* Product Attributes/Specifications */}
            {product.attribute_values &&
              product.attribute_values.length > 0 && (
                <>
                  <Divider style={styles.divider} />
                  <Text
                    variant="titleMedium"
                    style={styles.sectionTitle}
                  >
                    Thông số kỹ thuật
                  </Text>
                  {product.attribute_values.map(
                    (attr: ProductAttributeValue, index: number) => (
                      <View
                        key={`${attr.attribute_id}-${index}`}
                        style={styles.detailRow}
                      >
                        <Text style={styles.detailLabel}>
                          {attr.attribute_name}:
                        </Text>
                        <Text style={styles.detailValue}>
                          {attr.attribute_value}
                        </Text>
                      </View>
                    )
                  )}
                </>
              )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerPriceInfo}>
            <Text
              variant="bodySmall"
              style={styles.footerLabel}
            >
              Tổng tiền:
            </Text>
            <Text
              variant="titleLarge"
              style={styles.footerPrice}
            >
              {(displayPrice * quantity).toLocaleString("vi-VN")}đ
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={handleAddToCart}
            disabled={!product.isAvailable}
            style={styles.addButton}
            contentStyle={styles.addButtonContent}
            icon="cart-plus"
          >
            Thêm vào giỏ hàng
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    marginBottom: 16,
    textAlign: "center",
  },
  backButton: {
    marginTop: 16,
  },
  image: {
    width: width,
    height: width,
    backgroundColor: "#f5f5f5",
  },
  imageLoading: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailScroll: {
    backgroundColor: "white",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  thumbnailActive: {
    borderWidth: 3,
    borderColor: "#6C7BEA",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  brand: {
    color: "#666",
    marginBottom: 12,
  },
  priceContainer: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 64,
    justifyContent: "center",
  },
  price: {
    color: "#6C7BEA",
    fontWeight: "bold",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  availableChip: {
    backgroundColor: "#f0f9ff",
  },
  availableText: {
    color: "#52c41a",
  },
  divider: {
    marginVertical: 16,
  },
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 4,
  },
  quantityText: {
    paddingHorizontal: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  description: {
    lineHeight: 24,
    color: "#333",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontWeight: "bold",
    width: 120,
    color: "#666",
  },
  detailValue: {
    flex: 1,
    color: "#1a1a1a",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  footerPriceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  footerLabel: {
    color: "#666",
  },
  footerPrice: {
    color: "#ff4d4f",
    fontWeight: "bold",
  },
  addButton: {
    borderRadius: 12,
  },
  addButtonContent: {
    paddingVertical: 8,
  },
});
