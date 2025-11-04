import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  Text,
  ActivityIndicator,
  Button,
  Chip,
  Divider,
  Surface,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useServiceByUrl } from "@/src/hooks";

export default function ServiceDetailPage() {
  const router = useRouter();
  const { serviceUrl } = useLocalSearchParams<{ serviceUrl: string }>();
  const { service, loading } = useServiceByUrl(serviceUrl || "");

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

              {/* Meta Information */}
              <View style={styles.metaContainer}>
                {service.category_name && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Danh mục:</Text>
                    <Chip
                      icon="tag"
                      compact
                      style={styles.metaChip}
                    >
                      {service.category_name}
                    </Chip>
                  </View>
                )}

                {service.service_type_name && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Loại dịch vụ:</Text>
                    <Chip
                      icon="cog"
                      compact
                      style={styles.metaChip}
                    >
                      {service.service_type_name}
                    </Chip>
                  </View>
                )}

                {service.skill_level && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Độ phức tạp:</Text>
                    <Chip
                      icon="meter"
                      compact
                      style={styles.metaChip}
                    >
                      {service.skill_level}
                    </Chip>
                  </View>
                )}

                {service.estimated_duration_minutes && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Thời gian ước tính:</Text>
                    <Chip
                      icon="clock-outline"
                      compact
                      style={styles.metaChip}
                    >
                      {service.estimated_duration_minutes} phút
                    </Chip>
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

          {/* Service Specifications */}
          {service.attribute_values && service.attribute_values.length > 0 && (
            <Surface style={styles.section}>
              <Text
                variant="titleLarge"
                style={styles.sectionTitle}
              >
                Chi tiết kỹ thuật
              </Text>
              <Divider style={styles.divider} />
              {service.attribute_values.map((attr, index) => (
                <View
                  key={index}
                  style={styles.specRow}
                >
                  <Text style={styles.specLabel}>{attr.attribute_name}:</Text>
                  <Text style={styles.specValue}>{attr.attribute_value}</Text>
                </View>
              ))}
            </Surface>
          )}

          {/* Action Button */}
          <View style={styles.actionContainer}>
            <Button
              mode="contained"
              onPress={() => {
                // TODO: Navigate to booking page or add to cart
                console.log("Đặt lịch dịch vụ:", service.service_id);
              }}
              style={styles.bookButton}
              contentStyle={styles.bookButtonContent}
              icon="calendar-check"
            >
              Đặt lịch dịch vụ
            </Button>
          </View>
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
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  specLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  actionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  bookButton: {
    borderRadius: 8,
  },
  bookButtonContent: {
    paddingVertical: 8,
  },
});
