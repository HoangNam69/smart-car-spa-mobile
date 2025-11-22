import { usePricing, usePublicProducts } from "@/src/hooks";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Chip,
  FAB,
  Searchbar,
  Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import FilterModal from "@/components/products/FilterModal";
import ProductCard from "@/components/products/ProductCard";
import { Stack, useRouter } from "expo-router";

export default function ProductsPage() {
  const router = useRouter();
  const { products: rawProducts, loading, refetch } = usePublicProducts();
  const { previewBatch } = usePricing();

  const [searchQuery, setSearchQuery] = useState("");
  const [pricingMap, setPricingMap] = useState<Record<string, number>>({});
  const [pricingLoading, setPricingLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states - match webapp
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Fetch pricing for all products
  useEffect(() => {
    const fetchPricing = async () => {
      if (!rawProducts.length || pricingLoading) return;

      setPricingLoading(true);
      try {
        const items = rawProducts.map((p) => ({
          product_id: p.product_id,
          qty: 1,
        }));

        const result = await previewBatch({ items });

        const newPricingMap: Record<string, number> = {};
        result.items?.forEach((item: any) => {
          newPricingMap[item.product_id] = item.total_price / item.qty;
        });

        setPricingMap(newPricingMap);
      } catch (error) {
        console.error("Failed to fetch pricing:", error);
      } finally {
        setPricingLoading(false);
      }
    };

    fetchPricing();
  }, [rawProducts.length]);

  // Merge pricing into products
  const products = useMemo(() => {
    return rawProducts.map((product) => ({
      ...product,
      pricing: {
        basePrice: pricingMap[product.product_id] || 0,
        salePrice: undefined,
        discountPercentage: undefined,
      },
    }));
  }, [rawProducts, pricingMap]);

  // Extract unique brands and categories - match webapp
  const brands = useMemo(() => {
    const uniqueBrands = [
      ...new Set(products.map((p) => p.brand).filter(Boolean)),
    ];
    return uniqueBrands as string[];
  }, [products]);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((p) => p.product_type_name).filter(Boolean)),
    ];
    return uniqueCategories as string[];
  }, [products]);

  // Filter and sort products - match webapp implementation
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.product_name.toLowerCase().includes(search) ||
          p.brand?.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search)
      );
    }

    // Brand filter
    if (selectedBrand) {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((p) => p.product_type_name === selectedCategory);
    }

    // Price range filter
    result = result.filter((p) => {
      const price = p.pricing.salePrice || p.pricing.basePrice;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Availability filter
    if (showOnlyAvailable) {
      result = result.filter((p) => p.isAvailable);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return (
            (a.pricing.salePrice || a.pricing.basePrice) -
            (b.pricing.salePrice || b.pricing.basePrice)
          );
        case "price-desc":
          return (
            (b.pricing.salePrice || b.pricing.basePrice) -
            (a.pricing.salePrice || a.pricing.basePrice)
          );
        case "name":
        default:
          return a.product_name.localeCompare(b.product_name);
      }
    });

    return result;
  }, [
    products,
    searchQuery,
    selectedBrand,
    selectedCategory,
    priceRange,
    showOnlyAvailable,
    sortBy,
  ]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedBrand) count++;
    if (selectedCategory) count++;
    if (priceRange[0] !== 0 || priceRange[1] !== 10000000) count++;
    if (showOnlyAvailable) count++;
    if (sortBy !== "name") count++;
    return count;
  }, [selectedBrand, selectedCategory, priceRange, showOnlyAvailable, sortBy]);

  const handleResetFilters = () => {
    setSelectedBrand(undefined);
    setSelectedCategory(undefined);
    setPriceRange([0, 10000000]);
    setShowOnlyAvailable(false);
    setSortBy("name");
  };

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
        Sản phẩm
      </Text>
      <Text
        variant="bodyMedium"
        style={styles.subtitle}
      >
        Khám phá các sản phẩm chăm sóc ô tô chất lượng cao
      </Text>
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Tìm kiếm sản phẩm..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#6C7BEA"
        />
        <Chip
          icon="filter-variant"
          onPress={() => setFilterModalVisible(true)}
          style={styles.filterChip}
          mode="outlined"
        >
          Lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Chip>
      </View>
      <View style={styles.resultInfo}>
        <Text variant="bodyMedium">
          Hiển thị{" "}
          <Text style={styles.resultCount}>{filteredProducts.length}</Text> sản
          phẩm
        </Text>
        {activeFiltersCount > 0 && (
          <Chip
            compact
            onPress={handleResetFilters}
            style={styles.resetChip}
          >
            Xóa bộ lọc
          </Chip>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text
        variant="headlineSmall"
        style={styles.emptyTitle}
      >
        Không tìm thấy sản phẩm
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
            title: "Sản phẩm",
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#6C7BEA"
          />
          {pricingLoading && (
            <Text
              variant="bodyMedium"
              style={styles.loadingText}
            >
              Đang tải giá sản phẩm...
            </Text>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Sản phẩm",
          headerShown: true,
        }}
      />
      <SafeAreaView
        style={styles.container}
        edges={["top"]}
      >
        <FlatList
          ListHeaderComponent={renderHeader}
          data={filteredProducts}
          renderItem={({ item }) => <ProductCard product={item} />}
          keyExtractor={(item) => item.product_id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#6C7BEA"]}
            />
          }
        />

        <FAB
          icon="cart"
          style={styles.fab}
          onPress={() => router.push("/(tabs)/cart")}
          color="white"
        />

        <FilterModal
          visible={filterModalVisible}
          onDismiss={() => setFilterModalVisible(false)}
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          showOnlyAvailable={showOnlyAvailable}
          setShowOnlyAvailable={setShowOnlyAvailable}
          sortBy={sortBy}
          setSortBy={setSortBy}
          brands={brands}
          categories={categories}
          onReset={handleResetFilters}
          onApply={() => {
            // Filters are already applied via state
          }}
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
    paddingBottom: 8,
    backgroundColor: "white",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#1a1a1a",
  },
  subtitle: {
    color: "#666",
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  filterChip: {
    borderColor: "#6C7BEA",
    borderWidth: 1.5,
  },
  resultInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resetChip: {
    backgroundColor: "#f5f5f5",
  },
  resultCount: {
    fontWeight: "bold",
    color: "#6C7BEA",
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  row: {
    justifyContent: "flex-start",
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
  },
  emptyTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#6C7BEA",
  },
});
