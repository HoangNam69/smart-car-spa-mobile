import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { ServiceService } from "@/src/services/service.service";
import { pricingService } from "@/src/services/pricing.service";
import { useServiceMainImage } from "@/src/hooks";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

// Service Card Component
const ServiceCard: React.FC<{ service: any; price?: number }> = ({ service, price }) => {
  const router = useRouter();
  const { mainImageUrl, loading: imageLoading } = useServiceMainImage(
    service.service_id
  );

  const formatPrice = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return "Liên hệ";
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
      <View style={styles.cardInner}>
        {/* Image Section - Fixed height */}
        <TouchableOpacity
          onPress={() => router.push(`/services/${service.service_url}` as any)}
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
        </TouchableOpacity>

        {/* Content Section - Flexible, pushes button down */}
        <View style={styles.contentWrapper}>
          <Card.Content style={styles.content}>
            <Text
              variant="titleSmall"
              numberOfLines={2}
              style={styles.title}
            >
              {service.service_name}
            </Text>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{formatPrice(price)}</Text>
            </View>
          </Card.Content>

          {/* Button Section - Always at bottom, centered */}
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={() => router.push(`/services/${service.service_url}` as any)}
              style={styles.viewButton}
              contentStyle={styles.viewButtonContent}
              labelStyle={styles.viewButtonLabel}
              icon="arrow-right"
            >
              Xem Chi Tiết
            </Button>
          </View>
        </View>
      </View>
    </Card>
  );
};

// Featured Services Section Component
export default function FeaturedServicesSection() {
  const router = useRouter();
  const [featuredServices, setFeaturedServices] = useState<Array<any & { price?: number }>>([]);
  const [loading, setLoading] = useState(true);

  // Load featured services directly from API with filters (similar to web)
  useEffect(() => {
    const loadFeaturedServices = async () => {
      try {
        setLoading(true);
        
        // Load services
        const services = await ServiceService.getAllServices({
          page: 0,
          size: 6,
          is_featured: true,
          is_active: true,
        });

        // Load prices for all services in batch
        const serviceIds = services.map((s) => s.service_id).filter(Boolean);
        let pricesMap: Record<string, number> = {};
        
        if (serviceIds.length > 0) {
          try {
            pricesMap = await pricingService.getServicePricesBatch(serviceIds);
          } catch (error) {
            console.error("Error loading service prices:", error);
            // Continue without prices
          }
        }

        // Map services with prices
        const servicesWithData = services.map((service) => ({
          ...service,
          price: pricesMap[service.service_id] || 0,
        }));

        setFeaturedServices(servicesWithData);
      } catch (error) {
        console.error("Error loading featured services:", error);
        setFeaturedServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedServices();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          variant="titleMedium"
          style={styles.subtitle}
        >
          CÁC DỊCH VỤ CHĂM SÓC XE HƠI CAO CẤP TẠI
        </Text>
        <Text
          variant="headlineMedium"
          style={styles.mainTitle}
        >
          SMART CAR SPA
        </Text>
      </View>

      {/* Services Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#6C7BEA"
          />
        </View>
      ) : featuredServices.length > 0 ? (
        <FlatList
          data={featuredServices}
          renderItem={({ item }) => <ServiceCard service={item} price={item.price} />}
          keyExtractor={(item) => item.service_id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có dịch vụ nổi bật</Text>
        </View>
      )}

      {/* View All Button */}
      <View style={styles.viewAllContainer}>
        <Button
          mode="outlined"
          onPress={() => router.push("/services" as any)}
          style={styles.viewAllButton}
          contentStyle={styles.viewAllButtonContent}
          labelStyle={styles.viewAllButtonLabel}
        >
          Xem Tất Cả Dịch Vụ
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
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
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
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardInner: {
    flex: 1,
    flexDirection: "column",
    minHeight: 340,
  },
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.75,
    backgroundColor: "#f5f5f5",
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
  contentWrapper: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  content: {
    paddingTop: 14,
    paddingBottom: 0,
    paddingHorizontal: 12,
    flex: 1,
  },
  title: {
    fontWeight: "600",
    marginBottom: 10,
    lineHeight: 20,
    fontSize: 14,
    color: "#1a1a1a",
  },
  priceContainer: {
    marginTop: 8,
    marginBottom: 0,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6C7BEA",
  },
  actions: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  viewButton: {
    width: "100%",
    borderRadius: 8,
    backgroundColor: "#6C7BEA",
  },
  viewButtonContent: {
    height: 40,
  },
  viewButtonLabel: {
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
