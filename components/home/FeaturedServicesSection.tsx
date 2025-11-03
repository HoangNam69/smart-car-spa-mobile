import React, { useMemo } from "react";
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
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { usePublicServices, useServiceMainImage } from "@/src/hooks";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

// Service Card Component
const ServiceCard: React.FC<{ service: any }> = ({ service }) => {
  const router = useRouter();
  const { mainImageUrl, loading: imageLoading } = useServiceMainImage(
    service.service_id
  );

  return (
    <Card
      style={styles.card}
      mode="elevated"
    >
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

        <Card.Content style={styles.content}>
          <Text
            variant="titleSmall"
            numberOfLines={2}
            style={styles.title}
          >
            {service.service_name}
          </Text>

          <View style={styles.tagsContainer}>
            {service.category_name && (
              <Chip
                style={styles.categoryChip}
                textStyle={styles.chipText}
              >
                {service.category_name}
              </Chip>
            )}
            {service.is_featured && (
              <Chip
                style={styles.featuredChip}
                textStyle={styles.chipText}
              >
                Nổi Bật
              </Chip>
            )}
          </View>

          {service.estimated_duration_minutes && (
            <View style={styles.durationContainer}>
              <Chip
                icon="clock-outline"
                compact
                style={styles.durationChip}
                textStyle={styles.durationText}
              >
                {service.estimated_duration_minutes} phút
              </Chip>
            </View>
          )}
        </Card.Content>
      </TouchableOpacity>

      <Card.Actions style={styles.actions}>
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
      </Card.Actions>
    </Card>
  );
};

// Featured Services Section Component
export default function FeaturedServicesSection() {
  const router = useRouter();
  const { services: rawServices, loading } = usePublicServices();

  // Filter featured services
  const featuredServices = useMemo(() => {
    return rawServices.filter((s) => s.is_featured).slice(0, 6);
  }, [rawServices]);

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

  if (featuredServices.length === 0) {
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
          CÁC DỊCH VỤ NỔI BẬT
        </Text>
        <Text
          variant="headlineMedium"
          style={styles.mainTitle}
        >
          SMART CAR SPA
        </Text>
      </View>

      {/* Services Grid */}
      <FlatList
        data={featuredServices}
        renderItem={({ item }) => <ServiceCard service={item} />}
        keyExtractor={(item) => item.service_id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />

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
  categoryChip: {
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
  durationContainer: {
    marginTop: 4,
  },
  durationChip: {
    backgroundColor: "#f5f5f5",
    height: 28,
  },
  durationText: {
    fontSize: 11,
    lineHeight: 14,
  },
  actions: {
    padding: 8,
    paddingTop: 0,
  },
  viewButton: {
    flex: 1,
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
