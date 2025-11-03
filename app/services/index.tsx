import React, { useState, useMemo } from "react";
import { View, FlatList, StyleSheet, RefreshControl } from "react-native";
import {
  Searchbar,
  ActivityIndicator,
  Text,
  Card,
  Chip,
  Button,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePublicServices } from "@/src/hooks";
import { useRouter, Stack } from "expo-router";

export default function ServicesPage() {
  const router = useRouter();
  const { services, loading, refetch } = usePublicServices();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Filter services by search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;

    const query = searchQuery.toLowerCase();
    return services.filter(
      (service) =>
        service.service_name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.short_description?.toLowerCase().includes(query)
    );
  }, [services, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text
        variant="headlineMedium"
        style={styles.title}
      >
        Dịch vụ
      </Text>
      <Text
        variant="bodyMedium"
        style={styles.subtitle}
      >
        Dịch vụ chăm sóc và bảo dưỡng xe chuyên nghiệp
      </Text>
      <Searchbar
        placeholder="Tìm kiếm dịch vụ..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#6C7BEA"
      />
      <View style={styles.resultInfo}>
        <Text variant="bodyMedium">
          Hiển thị{" "}
          <Text style={styles.resultCount}>{filteredServices.length}</Text> dịch
          vụ
        </Text>
      </View>
    </View>
  );

  const renderService = ({ item }: { item: any }) => (
    <Card
      style={styles.serviceCard}
      mode="elevated"
      onPress={() => router.push(`/services/${item.service_url}`)}
    >
      <Card.Content>
        <View style={styles.serviceHeader}>
          <Text
            variant="titleLarge"
            style={styles.serviceName}
          >
            {item.service_name}
          </Text>
          {item.is_featured && (
            <Chip
              icon="star"
              style={styles.featuredChip}
              compact
            >
              Nổi bật
            </Chip>
          )}
        </View>

        {item.short_description && (
          <Text
            variant="bodyMedium"
            style={styles.serviceDescription}
            numberOfLines={2}
          >
            {item.short_description}
          </Text>
        )}

        <View style={styles.serviceMeta}>
          {item.category_name && (
            <Chip
              icon="tag"
              compact
              style={styles.metaChip}
            >
              {item.category_name}
            </Chip>
          )}
          {item.service_type_name && (
            <Chip
              icon="cog"
              compact
              style={styles.metaChip}
            >
              {item.service_type_name}
            </Chip>
          )}
          {item.estimated_duration_minutes && (
            <Chip
              icon="clock-outline"
              compact
              style={styles.metaChip}
            >
              {item.estimated_duration_minutes} phút
            </Chip>
          )}
        </View>

        <Button
          mode="contained"
          onPress={() => router.push(`/services/${item.service_url}`)}
          style={styles.viewButton}
          contentStyle={styles.viewButtonContent}
        >
          Xem chi tiết
        </Button>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text
        variant="headlineSmall"
        style={styles.emptyTitle}
      >
        Không tìm thấy dịch vụ
      </Text>
      <Text
        variant="bodyMedium"
        style={styles.emptyText}
      >
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
          <ActivityIndicator
            size="large"
            color="#6C7BEA"
          />
          <Text
            variant="bodyMedium"
            style={styles.loadingText}
          >
            Đang tải dịch vụ...
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Dịch vụ",
          headerShown: true,
        }}
      />
      <SafeAreaView
        style={styles.container}
        edges={["top"]}
      >
        <FlatList
          data={filteredServices}
          renderItem={renderService}
          keyExtractor={(item) => item.service_id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#6C7BEA"]}
            />
          }
        />
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
  header: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  subtitle: {
    color: "#666",
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: "#f5f5f5",
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
    paddingBottom: 16,
  },
  serviceCard: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: "white",
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
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
  serviceDescription: {
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  metaChip: {
    backgroundColor: "#f5f5f5",
  },
  viewButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  viewButtonContent: {
    paddingVertical: 4,
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
});
