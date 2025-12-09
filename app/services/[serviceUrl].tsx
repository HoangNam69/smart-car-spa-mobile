import { useServiceByUrl, useServiceImages } from "@/src/hooks";
import { pricingService } from "@/src/services/pricing.service";
import type { ServiceProcess, ServiceProduct } from "@/src/types/service.types";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  Icon,
  Surface,
  Text,
} from "react-native-paper";
import Carousel from "react-native-reanimated-carousel";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

// Extend Service type to include optional fields from API
type ExtendedService = ReturnType<typeof useServiceByUrl>["service"] & {
  service_products?: ServiceProduct[];
  service_process?: ServiceProcess;
};

export default function ServiceDetailPage() {
  const router = useRouter();
  const { serviceUrl } = useLocalSearchParams<{ serviceUrl: string }>();
  const { service, loading } = useServiceByUrl(serviceUrl || "");
  const extendedService = service as ExtendedService | null;
  const { images: serviceImages, loading: imagesLoading } = useServiceImages(
    service?.service_id
  );
  const [price, setPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Debug log for service images
  useEffect(() => {
    if (serviceImages) {
      console.log("Service Images:", serviceImages);
      console.log("Number of images:", serviceImages.length);
    }
  }, [serviceImages]);

  // Load price when service is loaded
  useEffect(() => {
    const loadPrice = async () => {
      if (!service?.service_id) {
        setPrice(null);
        return;
      }

      try {
        setPriceLoading(true);
        const pricesMap = await pricingService.getServicePricesBatch([service.service_id]);
        setPrice(pricesMap[service.service_id] || null);
      } catch (error) {
        console.error("Error loading service price:", error);
        setPrice(null);
      } finally {
        setPriceLoading(false);
      }
    };

    if (service) {
      loadPrice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service?.service_id]);

  const formatPrice = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Chi tiết dịch vụ",
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#6C7BEA"
          />
          <Text
            variant="bodyMedium"
            style={styles.loadingText}
          >
            Đang tải thông tin dịch vụ...
          </Text>
        </View>
      </>
    );
  }

  if (!service) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Chi tiết dịch vụ",
            headerShown: true,
          }}
        />
        <View style={styles.errorContainer}>
          <Text
            variant="headlineSmall"
            style={styles.errorTitle}
          >
            Không tìm thấy dịch vụ
          </Text>
          <Text
            variant="bodyMedium"
            style={styles.errorText}
          >
            Dịch vụ này không tồn tại hoặc đã bị xóa
          </Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Quay lại
          </Button>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: service.service_name || "Chi tiết dịch vụ",
          headerShown: true,
        }}
      />
      <SafeAreaView
        style={styles.container}
        edges={["bottom"]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Service Images Carousel */}
          {imagesLoading ? (
            <View style={styles.imageContainer}>
              <ActivityIndicator size="large" color="#6C7BEA" />
            </View>
          ) : serviceImages && Array.isArray(serviceImages) && serviceImages.length > 0 ? (
            serviceImages.length > 1 ? (
              // Multiple images: Display Carousel
              <View style={styles.imageContainer}>
                <Carousel
                  width={screenWidth}
                  height={screenWidth}
                  autoPlay
                  data={serviceImages}
                  scrollAnimationDuration={2000}
                  renderItem={({ item }) => (
                    <View style={styles.carouselItem}>
                      <Image
                        source={{ uri: item.media_url }}
                        style={styles.carouselImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                />
              </View>
            ) : (
              // Only 1 image: Display single image
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: serviceImages[0]?.media_url || "/images/placeholder.jpg" }}
                  style={styles.singleImage}
                  resizeMode="cover"
                />
              </View>
            )
          ) : (
            // No images: Display placeholder
            <View style={styles.imageContainer}>
              <View style={styles.placeholderImage}>
                <Icon source="image-off" size={64} color="#ccc" />
                <Text style={styles.placeholderText}>Không có hình ảnh</Text>
              </View>
            </View>
          )}

          {/* Service Header */}
          <Surface style={styles.headerSection}>
            <View style={styles.headerContent}>
              <View style={styles.titleRow}>
                <Text
                  variant="headlineMedium"
                  style={styles.serviceName}
                >
                  {service.service_name}
                </Text>
                {service.is_featured && (
                  <Chip
                    icon="star"
                    style={styles.featuredChip}
                    compact
                  >
                    Nổi bật
                  </Chip>
                )}
              </View>

              {service.short_description && (
                <Text
                  variant="bodyLarge"
                  style={styles.shortDescription}
                >
                  {service.short_description}
                </Text>
              )}

              {/* Price Display */}
              <View style={styles.priceContainer}>
                {priceLoading ? (
                  <ActivityIndicator size="small" color="#6C7BEA" />
                ) : (
                  <Text style={styles.priceText}>{formatPrice(price)}</Text>
                )}
              </View>

              {/* Simple Information Display (no labels, just icon + value) */}
              <View style={styles.infoContainer}>
                {service.category_name && (
                  <View style={styles.infoItem}>
                    <Icon source="tag" size={16} color="#666" />
                    <Text style={styles.infoText}>{service.category_name}</Text>
                  </View>
                )}

                {service.service_type_name && (
                  <View style={styles.infoItem}>
                    <Icon source="cog" size={16} color="#666" />
                    <Text style={styles.infoText}>{service.service_type_name}</Text>
                  </View>
                )}

                {service.estimated_duration_minutes && (
                  <View style={styles.infoItem}>
                    <Icon source="clock-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {service.estimated_duration_minutes} phút
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Surface>

          {/* Service Description */}
          {service.description && (
            <Surface style={styles.section}>
              <Text
                variant="titleLarge"
                style={styles.sectionTitle}
              >
                Mô tả dịch vụ
              </Text>
              <Divider style={styles.divider} />
              <Text
                variant="bodyMedium"
                style={styles.description}
              >
                {service.description}
              </Text>
            </Surface>
          )}

          {/* Service Specifications - Simple text display */}
          {service.attribute_values && service.attribute_values.length > 0 && (
            <Surface style={styles.section}>
              <Text
                variant="titleLarge"
                style={styles.sectionTitle}
              >
                Thông tin chi tiết
              </Text>
              <Divider style={styles.divider} />
              {service.attribute_values.map((attr, index) => (
                <View
                  key={index}
                  style={styles.specRow}
                >
                  <View style={styles.specIcon}>
                    <Icon source="circle-small" size={12} color="#666" />
                  </View>
                  <View style={styles.specContent}>
                    <Text style={styles.specLabel}>
                      {attr.attribute_name}
                    </Text>
                    <Text style={styles.specValue}>
                      {attr.attribute_value}
                    </Text>
                  </View>
                </View>
              ))}
            </Surface>
          )}

          {/* Service Products - Sản phẩm sử dụng */}
          <Surface style={styles.section}>
            <Text
              variant="titleLarge"
              style={styles.sectionTitle}
            >
              Sản phẩm sử dụng {extendedService?.service_products ? `(${extendedService.service_products.length})` : ""}
            </Text>
            <Divider style={styles.divider} />
            {extendedService?.service_products && extendedService.service_products.length > 0 ? (
              extendedService.service_products.map((product: ServiceProduct, index: number) => (
                <View key={product.id || index} style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <View style={styles.productNumber}>
                      <Text style={styles.productNumberText}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.productInfo}>
                      <View style={styles.productTitleRow}>
                        <Text style={styles.productName}>
                          {product.product_info?.product_name || "Sản phẩm"}
                        </Text>
                        {product.is_required && (
                          <Chip
                            style={styles.requiredChip}
                            textStyle={styles.requiredChipText}
                            compact
                          >
                            Bắt buộc
                          </Chip>
                        )}
                      </View>
                      
                      {product.product_info?.brand && (
                        <Text style={styles.productDetail}>
                          <Text style={styles.productDetailLabel}>Thương hiệu: </Text>
                          <Text style={styles.productDetailValue}>{product.product_info.brand}</Text>
                        </Text>
                      )}
                      
                      {product.product_info?.model && (
                        <Text style={styles.productDetail}>
                          <Text style={styles.productDetailLabel}>Model: </Text>
                          <Text style={styles.productDetailValue}>{product.product_info.model}</Text>
                        </Text>
                      )}
                      
                      {product.notes && (
                        <Text style={styles.productNotes}>
                          <Text style={styles.productDetailLabel}>Ghi chú: </Text>
                          <Text style={styles.productDetailValue}>{product.notes}</Text>
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.productQuantity}>
                    <Text style={styles.productQuantityLabel}>Số lượng sử dụng</Text>
                    <Text style={styles.productQuantityValue}>
                      {product.quantity} {product.unit || ""}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Dịch vụ này không sử dụng sản phẩm cụ thể</Text>
              </View>
            )}
          </Surface>

          {/* Service Process Steps - Separate section */}
          {extendedService?.service_process && extendedService.service_process.process_steps && extendedService.service_process.process_steps.length > 0 && (
            <Surface style={styles.processSection}>
              <Text
                variant="titleLarge"
                style={styles.sectionTitle}
              >
                Quy trình thực hiện
              </Text>
              <Divider style={styles.divider} />
              {extendedService.service_process.process_steps.map((step: any, index: number) => (
                <View key={step.id || index} style={styles.processStep}>
                  <View style={styles.processStepHeader}>
                    <View style={styles.processStepNumber}>
                      <Text style={styles.processStepNumberText}>
                        {step.step_order || index + 1}
                      </Text>
                    </View>
                    <Text style={styles.processStepName}>
                      {step.name}
                    </Text>
                  </View>
                  {step.description && (
                    <Text style={styles.processStepDescription}>
                      {step.description}
                    </Text>
                  )}
                  {step.estimated_time && (
                    <Text style={styles.processStepTime}>
                      ⏱ {step.estimated_time} phút
                    </Text>
                  )}
                  {index < extendedService.service_process!.process_steps.length - 1 && (
                    <Divider style={styles.processStepDivider} />
                  )}
                </View>
              ))}
            </Surface>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f5f5f5",
  },
  errorTitle: {
    marginBottom: 8,
    textAlign: "center",
    color: "#1a1a1a",
  },
  errorText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  backButton: {
    minWidth: 120,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerSection: {
    backgroundColor: "white",
    elevation: 2,
  },
  headerContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  serviceName: {
    flex: 1,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  featuredChip: {
    backgroundColor: "#fff7e6",
    marginLeft: 8,
  },
  shortDescription: {
    color: "#666",
    marginBottom: 16,
    lineHeight: 24,
  },
  priceContainer: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    alignItems: "center",
  },
  priceText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6C7BEA",
  },
  metaContainer: {
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  metaChip: {
    backgroundColor: "#f5f5f5",
  },
  section: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "white",
    elevation: 1,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
    backgroundColor: "#e0e0e0",
  },
  description: {
    color: "#666",
    lineHeight: 22,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  specContent: {
    flex: 1,
    flexDirection: "column",
    gap: 4,
  },
  specLabel: {
    fontSize: 13,
    color: "#8c8c8c",
    fontWeight: "500",
    marginBottom: 2,
  },
  specValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  imageContainer: {
    width: "100%",
    height: screenWidth,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  carouselItem: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  singleImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  placeholderText: {
    marginTop: 8,
    color: "#999",
    fontSize: 14,
  },
  infoContainer: {
    marginTop: 16,
    gap: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
  },
  specIcon: {
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  specText: {
    fontSize: 14,
    color: "#1a1a1a",
    flex: 1,
  },
  processSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "white",
    elevation: 1,
  },
  processStep: {
    marginBottom: 16,
  },
  processStepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  processStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6C7BEA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  processStepNumberText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  processStepName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  processStepDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginLeft: 44,
    marginBottom: 4,
  },
  processStepTime: {
    fontSize: 12,
    color: "#999",
    marginLeft: 44,
  },
  processStepDivider: {
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "#e0e0e0",
  },
  productCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  productHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  productNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#52c41a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  productNumberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  productInfo: {
    flex: 1,
  },
  productTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 8,
  },
  requiredChip: {
    backgroundColor: "#ff4d4f",
    minHeight: 32,
    paddingVertical: 6,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  requiredChipText: {
    fontSize: 12,
    color: "#fff",
    lineHeight: 18,
    fontWeight: "500",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  productDetail: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  productDetailLabel: {
    color: "#8c8c8c",
  },
  productDetailValue: {
    color: "#1a1a1a",
    fontWeight: "500",
  },
  productNotes: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  productQuantity: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  productQuantityLabel: {
    fontSize: 12,
    color: "#8c8c8c",
    marginBottom: 4,
  },
  productQuantityValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6C7BEA",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
