import { Dimensions, Image, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ServiceService, type Service } from "@/src/services/service.service";
import { useServiceImages } from "@/src/hooks/useServices";

const { width } = Dimensions.get("window");

interface CarouselItem {
  service: Service;
  imageUrl: string;
  serviceUrl: string;
}

export default function CarouselCustom() {
  const router = useRouter();
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCarouselData = async () => {
      try {
        setLoading(true);
        console.log("[Carousel] Loading featured services...");

        // Gọi API service với filter is_featured=true và is_active=true
        const services = await ServiceService.getAllServices({
          page: 0,
          size: 4,
          is_featured: true,
          is_active: true,
        });

        console.log("[Carousel] Services from API:", services.length, services);

        if (!services || services.length === 0) {
          console.log("[Carousel] No services found");
          setCarouselItems([]);
          setLoading(false);
          return;
        }

        // Lấy 4 dịch vụ đầu tiên
        const servicesToShow = services.slice(0, 4);
        console.log("[Carousel] Services to show:", servicesToShow.length);

        // Load images cho từng service
        const items: CarouselItem[] = [];
        for (const service of servicesToShow) {
          try {
            // Load images cho service
            const images = await ServiceService.getServiceImages(service.service_id);
            
            // Sort images: main image first, then by display_order
            const sortedImages = [...images].sort((a, b) => {
              if (a.is_main && !b.is_main) return -1;
              if (!a.is_main && b.is_main) return 1;
              return (a.display_order || 0) - (b.display_order || 0);
            });

            // Lấy main image hoặc hình đầu tiên
            const mainImage = sortedImages.length > 0 ? sortedImages[0] : null;
            const imageUrl = mainImage?.media_url || "";

            // Use service_url if available, otherwise use service_id
            const serviceUrl = service.service_url || service.service_id || "";

            items.push({
              service,
              imageUrl,
              serviceUrl,
            });

            console.log(`[Carousel] Service: ${service.service_name}, Image: ${imageUrl ? 'Yes' : 'No'}, URL: ${serviceUrl}`);
          } catch (err) {
            console.warn(`[Carousel] Failed to load images for service ${service.service_id}:`, err);
            // Vẫn thêm service vào carousel nhưng không có hình
            items.push({
              service,
              imageUrl: "",
              serviceUrl: service.service_url || service.service_id || "",
            });
          }
        }

        console.log("[Carousel] Final carousel items:", items.length);
        setCarouselItems(items);
      } catch (error) {
        console.error("[Carousel] Error loading carousel data:", error);
        setCarouselItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadCarouselData();
  }, []);

  const handleServicePress = (serviceUrl: string) => {
    if (serviceUrl) {
      router.push(`/services/${serviceUrl}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
      </View>
    );
  }

  if (carouselItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Carousel
        width={width - 20}
        height={200}
        autoPlay={true}
        data={carouselItems}
        scrollAnimationDuration={2000}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleServicePress(item.serviceUrl)}
            style={styles.carouselItem}
          >
            <Image
              source={
                item.imageUrl
                  ? { uri: item.imageUrl }
                  : require("../../assets/images/carousel/background01.jpg")
              }
              style={styles.carouselImage}
              resizeMode="cover"
            />
            {/* Overlay với gradient effect */}
            <View style={styles.overlay}>
              <Text style={styles.title}>{item.service.service_name || "Dịch vụ"}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.service.description || item.service.service_name || "Dịch vụ chăm sóc xe chuyên nghiệp"}
              </Text>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Xem chi tiết</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  button: {
    backgroundColor: "#1890ff",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12.5,
    shadowColor: "#1890ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
