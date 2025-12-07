import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { ActivityIndicator, Button, Card, FAB, Icon, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import ProtectedRoute from "../../src/components/ProtectedRoute";
import { useAuth } from "../../src/context/AuthContext";
import {
  vehicleProfileService,
  type VehicleProfileDto,
} from "../../src/services/vehicleProfile.service";
import { useVehicleProfileReload } from "../../src/hooks/useWebSocket";

export default function VehicleListScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleProfileDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    setError(null);
    try {
      const page = await vehicleProfileService.getByOwner(user.user_id, {
        size: 100,
      });
      setVehicles(page.content || []);
    } catch (e: any) {
      setError(e?.message || "Không thể tải danh sách xe");
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      // Refresh list when screen gains focus (e.g., returning from detail)
      fetchData();
    }, [fetchData])
  );

  // WebSocket: Subscribe to vehicle profile reload notifications for realtime updates
  // MỤC ĐÍCH: Tự động reload danh sách xe khi có thay đổi từ backend (tạo/cập nhật/xóa)
  // LÝ DO: Khi admin hoặc user khác tạo/cập nhật/xóa xe, screen này sẽ tự động cập nhật
  useVehicleProfileReload(() => {
    console.log('[VehicleListScreen] WebSocket: Reloading vehicle profiles due to notification...');
    fetchData();
  });

  const onRefresh = useCallback(async () => {
    if (!user?.user_id) return;
    setRefreshing(true);
    try {
      const page = await vehicleProfileService.getByOwner(user.user_id, {
        size: 100,
      });
      setVehicles(page.content || []);
    } finally {
      setRefreshing(false);
    }
  }, [user?.user_id]);

  const renderItem = ({ item }: { item: VehicleProfileDto }) => (
    <Card style={{ marginHorizontal: 8, marginBottom: 8, borderRadius: 4, backgroundColor: "#ffffff" }}>
      <Card.Title
        title={item.license_plate}
        subtitle={`${item.brand_name ?? ""}${item.brand_name ? " • " : ""}${
          item.model_name ?? ""
        }`}
        left={() => (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 4,
              backgroundColor: "#E8ECFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#6C7BEA", fontWeight: "bold" }}><Icon source="car" size={20} color="#6C7BEA" /></Text>
          </View>
        )}
      />
      <Card.Content>
        <View style={{ flexDirection: "row", marginBottom: 6 }}>
          <Text style={{ color: "#6b7280" }}>Hãng xe: </Text>
          <Text style={{ fontWeight: "600" }}>
            {item.brand_name || "Chưa cập nhật"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginBottom: 6 }}>
          <Text style={{ color: "#6b7280" }}>Dòng xe: </Text>
          <Text style={{ fontWeight: "600" }}>
            {item.model_name || "Chưa cập nhật"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginBottom: 6 }}>
          <Text style={{ color: "#6b7280" }}>Loại xe: </Text>
          <Text style={{ fontWeight: "600" }}>
            {item.type_name || "Chưa cập nhật"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", marginBottom: 6 }}>
          <Text style={{ color: "#6b7280" }}>Số km: </Text>
          <Text style={{ fontWeight: "600" }}>
            {(item.distance_traveled ?? 0).toLocaleString()} km
          </Text>
        </View>
      </Card.Content>
      {item.description ? (
        <Card.Content>
          <Text>{item.description}</Text>
        </Card.Content>
      ) : null}
      <Card.Actions>
        <Button
          onPress={() =>
            router.push({
              pathname: "/vehicle-management/vehicle-detail/[id]",
              params: { id: item.vehicle_id },
            })
          }
          mode="contained"
        >
          Chỉnh sửa
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F8F6" }} edges={["bottom"]}>
      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Đang tải danh sách xe...</Text>
        </View>
      ) : vehicles.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <Text style={{ marginBottom: 12 }}>Bạn chưa có xe nào</Text>
          <Button
            mode="contained"
            onPress={() => router.push("/vehicle-management/vehicle-addition")}
          >
            Thêm xe mới
          </Button>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.vehicle_id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 80 }}
        />
      )}
      <FAB
        icon="plus"
        onPress={() => router.push("/vehicle-management/vehicle-addition")}
        style={{
          position: "absolute",
          right: 16,
          bottom: 24,
          backgroundColor: "#6C7BEA",
        }}
        color="#fff"
      />
    </SafeAreaView>
    </ProtectedRoute>
  );
}
