import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Portal,
  Modal,
  Text,
  Button,
  Divider,
  Chip,
  RadioButton,
} from "react-native-paper";
import Slider from "@react-native-community/slider";

interface FilterModalProps {
  visible: boolean;
  onDismiss: () => void;
  // Filter states
  selectedBrand: string | undefined;
  setSelectedBrand: (brand: string | undefined) => void;
  selectedCategory: string | undefined;
  setSelectedCategory: (category: string | undefined) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  showOnlyAvailable: boolean;
  setShowOnlyAvailable: (show: boolean) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  // Data
  brands: string[];
  categories: string[];
  // Actions
  onReset: () => void;
  onApply: () => void;
}

export default function FilterModal({
  visible,
  onDismiss,
  selectedBrand,
  setSelectedBrand,
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  showOnlyAvailable,
  setShowOnlyAvailable,
  sortBy,
  setSortBy,
  brands,
  categories,
  onReset,
  onApply,
}: FilterModalProps) {
  const formatPrice = (price: number) => {
    return `${(price / 1000).toFixed(0)}K`;
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.header}>
          <Text
            variant="titleLarge"
            style={styles.title}
          >
            Bộ lọc
          </Text>
        </View>

        <Divider />

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Filter */}
          <View style={styles.section}>
            <Text
              variant="titleMedium"
              style={styles.sectionTitle}
            >
              Thương hiệu
            </Text>
            <View style={styles.chipContainer}>
              <Chip
                selected={!selectedBrand}
                onPress={() => setSelectedBrand(undefined)}
                style={styles.chip}
                mode="outlined"
              >
                Tất cả
              </Chip>
              {brands.map((brand) => (
                <Chip
                  key={brand}
                  selected={selectedBrand === brand}
                  onPress={() => setSelectedBrand(brand)}
                  style={styles.chip}
                  mode="outlined"
                >
                  {brand}
                </Chip>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Category Filter */}
          <View style={styles.section}>
            <Text
              variant="titleMedium"
              style={styles.sectionTitle}
            >
              Danh mục
            </Text>
            <View style={styles.chipContainer}>
              <Chip
                selected={!selectedCategory}
                onPress={() => setSelectedCategory(undefined)}
                style={styles.chip}
                mode="outlined"
              >
                Tất cả
              </Chip>
              {categories.map((category) => (
                <Chip
                  key={category}
                  selected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                  style={styles.chip}
                  mode="outlined"
                >
                  {category}
                </Chip>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Price Range Filter */}
          <View style={styles.section}>
            <Text
              variant="titleMedium"
              style={styles.sectionTitle}
            >
              Khoảng giá
            </Text>
            <View style={styles.priceRangeContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10000000}
                step={100000}
                value={priceRange[0]}
                onValueChange={(value: number) =>
                  setPriceRange([value, priceRange[1]])
                }
                minimumTrackTintColor="#6C7BEA"
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor="#6C7BEA"
              />
              <View style={styles.priceLabels}>
                <Text variant="bodySmall">{formatPrice(priceRange[0])}</Text>
                <Text
                  variant="bodySmall"
                  style={styles.priceSeparator}
                >
                  -
                </Text>
                <Text variant="bodySmall">{formatPrice(priceRange[1])}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10000000}
                step={100000}
                value={priceRange[1]}
                onValueChange={(value: number) =>
                  setPriceRange([priceRange[0], value])
                }
                minimumTrackTintColor="#6C7BEA"
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor="#6C7BEA"
              />
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Availability Filter */}
          <View style={styles.section}>
            <Text
              variant="titleMedium"
              style={styles.sectionTitle}
            >
              Tình trạng
            </Text>
            <View style={styles.chipContainer}>
              <Chip
                selected={!showOnlyAvailable}
                onPress={() => setShowOnlyAvailable(false)}
                style={styles.chip}
                mode="outlined"
              >
                Tất cả sản phẩm
              </Chip>
              <Chip
                selected={showOnlyAvailable}
                onPress={() => setShowOnlyAvailable(true)}
                style={styles.chip}
                mode="outlined"
              >
                Chỉ còn hàng
              </Chip>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Sort */}
          <View style={styles.section}>
            <Text
              variant="titleMedium"
              style={styles.sectionTitle}
            >
              Sắp xếp
            </Text>
            <RadioButton.Group
              onValueChange={setSortBy}
              value={sortBy}
            >
              <View style={styles.radioItem}>
                <RadioButton value="name" />
                <Text>Tên A-Z</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="price-asc" />
                <Text>Giá thấp đến cao</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="price-desc" />
                <Text>Giá cao đến thấp</Text>
              </View>
            </RadioButton.Group>
          </View>
        </ScrollView>

        <Divider />

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={onReset}
            style={styles.resetButton}
          >
            Xóa bộ lọc
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              onApply();
              onDismiss();
            }}
            style={styles.applyButton}
          >
            Áp dụng
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 60,
    borderRadius: 16,
    maxHeight: "80%",
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontWeight: "bold",
  },
  content: {
    maxHeight: 500,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  divider: {
    marginVertical: 0,
  },
  priceRangeContainer: {
    paddingHorizontal: 8,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  priceLabels: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },
  priceSeparator: {
    marginHorizontal: 8,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#6C7BEA",
  },
});
