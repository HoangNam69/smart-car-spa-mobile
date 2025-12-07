import { usePublicServices, useServiceMainImage } from "@/src/hooks";
import { pricingService } from "@/src/services/pricing.service";
import {
  DropdownItem,
  serviceTypeService,
} from "@/src/services/service-type.service";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  FAB,
  Modal,
  Portal,
  Searchbar,
  Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

export default function ServicesPage() {
  const router = useRouter();
  const { services, loading, refetch } = usePublicServices();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<DropdownItem[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(
    null
  );
  const [sortByPrice, setSortByPrice] = useState<"ASC" | "DESC" | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Load service types and prices
  useEffect(() => {
    const loadData = async () => {
      try {
        const [typesData] = await Promise.all([
          serviceTypeService.getServiceTypesDropdown(),
        ]);
        setServiceTypes(typesData);
      } catch (error) {
        console.error("Error loading service types:", error);
      }
    };
    loadData();
  }, []);

  // Load prices when services change
  useEffect(() => {
    const loadPrices = async () => {
      if (services.length === 0) return;

      try {
        const serviceIds = services
          .map((s) => s.service_id)
          .filter((id): id is string => !!id);
        if (serviceIds.length > 0) {
          const pricesMap = await pricingService.getServicePricesBatch(
            serviceIds
          );
          setPrices(pricesMap);
        }
      } catch (error) {
        console.error("Error loading prices:", error);
      }
    };

    loadPrices();
  }, [services]);

  // Filter and sort services by search query, service type, and price
  const filteredServices = useMemo(() => {
    let filtered = [...services];

    // Filter by service type
    if (selectedServiceType) {
      filtered = filtered.filter(
        (service: any) => service.service_type_id === selectedServiceType
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.service_name.toLowerCase().includes(query) ||
          service.description?.toLowerCase().includes(query) ||
          service.short_description?.toLowerCase().includes(query)
      );
    }

    // Sort by price (client-side) after filtering
    if (sortByPrice && Object.keys(prices).length > 0) {
      filtered = filtered.sort((a, b) => {
        const priceA = prices[a.service_id] || 0;
        const priceB = prices[b.service_id] || 0;
        return sortByPrice === "ASC" ? priceA - priceB : priceB - priceA;
      });
    }

    return filtered;
  }, [services, searchQuery, selectedServiceType, sortByPrice, prices]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedServiceType(null);
    setSortByPrice(null);
    setFilterModalVisible(false);
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedServiceType) count++;
    if (sortByPrice) count++;
    return count;
  }, [selectedServiceType, sortByPrice]);

  const formatPrice = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Dịch vụ
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Dịch vụ chăm sóc và bảo dưỡng xe chuyên nghiệp
        </Text>
        <View style={styles.resultInfo}>
          <Text variant="bodyMedium">
            Hiển thị{" "}
            <Text style={styles.resultCount}>{filteredServices.length}</Text> dịch
            vụ
          </Text>
        </View>
      </View>
    ),
    [filteredServices.length]
  );

  // Service Card Component (similar to FeaturedServicesSection)
  const ServiceCard: React.FC<{ service: any; price?: number }> = ({
    service,
    price,
  }) => {
    const { mainImageUrl, loading: imageLoading } = useServiceMainImage(
      service.service_id
    );

    return (
      <Card style={styles.card} mode="elevated">
        <View style={styles.cardInner}>
          {/* Image Section */}
          <TouchableOpacity
            onPress={() => router.push(`/services/${service.service_url}`)}
            activeOpacity={0.7}
          >
            <View style={styles.imageContainer}>
              {imageLoading ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="small" color="#6C7BEA" />
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

          {/* Content Section */}
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
                <Text style={styles.priceText}>
                  {formatPrice(price)}
                </Text>
              </View>
            </Card.Content>

            {/* Button Section */}
            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={() => router.push(`/services/${service.service_url}`)}
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

  const renderService = ({ item }: { item: any }) => (
    <ServiceCard service={item} price={prices[item.service_id]} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        Không tìm thấy dịch vụ
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Thử tìm kiếm với từ khóa khác
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Dịch vụ",
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C7BEA" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Đang tải dịch vụ...
          </Text>
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Dịch vụ",
          headerShown: true,
        }}
      />
      {/* Searchbar - Fixed outside FlatList to prevent re-render and maintain focus */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Tìm kiếm dịch vụ..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#6C7BEA"
        />
      </View>
      <FlatList
        data={filteredServices}
        renderItem={renderService}
        keyExtractor={(item) => item.service_id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6C7BEA"]}
          />
        }
      />

      {/* Floating Filter Button */}
      <FAB
        icon="filter"
        style={styles.fab}
        onPress={() => setFilterModalVisible(true)}
        label={activeFiltersCount > 0 ? `${activeFiltersCount}` : undefined}
        size="medium"
      />

      {/* Filter Modal */}
      <Portal>
        <Modal
          visible={filterModalVisible}
          onDismiss={() => setFilterModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Bộ lọc
            </Text>
            <Button
              mode="text"
              onPress={() => setFilterModalVisible(false)}
              icon="close"
            >
              Đóng
            </Button>
          </View>

          <View style={styles.modalBody}>
            {/* Service Type Filter */}
            {serviceTypes.length > 0 && (
              <View style={styles.filterSection}>
                <Text variant="titleMedium" style={styles.filterSectionTitle}>
                  Loại dịch vụ
                </Text>
                <View style={styles.filterChips}>
                  <TouchableOpacity
                    onPress={() => setSelectedServiceType(null)}
                    style={[
                      styles.filterChip,
                      selectedServiceType === null && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedServiceType === null &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      Tất cả
                    </Text>
                  </TouchableOpacity>
                  {serviceTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => setSelectedServiceType(type.id)}
                      style={[
                        styles.filterChip,
                        selectedServiceType === type.id &&
                          styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedServiceType === type.id &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Sort By Price */}
            <View style={styles.filterSection}>
              <Text variant="titleMedium" style={styles.filterSectionTitle}>
                Sắp xếp theo giá
              </Text>
              <View style={styles.sortChips}>
                <TouchableOpacity
                  onPress={() => setSortByPrice(null)}
                  style={[
                    styles.filterChip,
                    sortByPrice === null && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortByPrice === null && styles.filterChipTextActive,
                    ]}
                  >
                    Bất kỳ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortByPrice("ASC")}
                  style={[
                    styles.filterChip,
                    sortByPrice === "ASC" && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortByPrice === "ASC" && styles.filterChipTextActive,
                    ]}
                  >
                    Tăng dần
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortByPrice("DESC")}
                  style={[
                    styles.filterChip,
                    sortByPrice === "DESC" && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortByPrice === "DESC" && styles.filterChipTextActive,
                    ]}
                  >
                    Giảm dần
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <Button
              mode="outlined"
              onPress={handleResetFilters}
              style={styles.modalResetButton}
            >
              Reset bộ lọc
            </Button>
            <Button
              mode="contained"
              onPress={() => setFilterModalVisible(false)}
              style={styles.modalApplyButton}
            >
              Áp dụng
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
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
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchBar: {
    elevation: 0,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  subtitle: {
    color: "#666",
    marginBottom: 16,
  },
  resultInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultCount: {
    fontWeight: "bold",
    color: "#6C7BEA",
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
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
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
    color: "#1a1a1a",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#6C7BEA",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  modalBody: {
    padding: 16,
    maxHeight: "70%",
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sortChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#d9d9d9",
  },
  filterChipActive: {
    backgroundColor: "#1890ff",
    borderColor: "#1890ff",
  },
  filterChipText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  modalResetButton: {
    flex: 1,
    borderRadius: 8,
  },
  modalApplyButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "#6C7BEA",
  },
});
