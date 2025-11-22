import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Badge, Card, Chip, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../src/context/AuthContext";
import { bookingService } from "../../../src/services/booking.service";
import { BookingInfoDto } from "../../../src/types/booking.types";

export default function CareHistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allBookings, setAllBookings] = useState<BookingInfoDto[]>([]);

  const fetchData = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const data = await bookingService.getCustomerBookings(user.user_id);
      // Filter bookings with status CHECKED_IN, IN_PROGRESS, COMPLETED
      const careBookings = data.filter(
        (b) =>
          ["CHECKED_IN", "IN_PROGRESS", "COMPLETED"].includes(
            (b.status || "").toUpperCase()
          )
      );
      setAllBookings(careBookings);
    } catch {
      setAllBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    if (!user?.user_id) return;
    setRefreshing(true);
    try {
      const data = await bookingService.getCustomerBookings(user.user_id);
      const careBookings = data.filter(
        (b) =>
          ["CHECKED_IN", "IN_PROGRESS", "COMPLETED"].includes(
            (b.status || "").toUpperCase()
          )
      );
      setAllBookings(careBookings);
    } finally {
      setRefreshing(false);
    }
  }, [user?.user_id]);

  const statusToColor = (status?: string) => {
    switch ((status || "").toUpperCase()) {
      case "CHECKED_IN":
        return "#722ed1";
      case "IN_PROGRESS":
        return "#1890ff";
      case "COMPLETED":
        return "#52c41a";
      default:
        return "#8c8c8c";
    }
  };

  const statusToLabel = (status?: string) => {
    switch ((status || "").toUpperCase()) {
      case "CHECKED_IN":
        return "Đã check-in";
      case "IN_PROGRESS":
        return "Đang chăm sóc";
      case "COMPLETED":
        return "Hoàn thành";
      default:
        return status || "";
    }
  };

  const renderItem = ({ item }: { item: BookingInfoDto }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/history-management/care-history/care-process/[id]",
          params: { id: item.booking_id },
        })
      }
    >
      <Card style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 12 }}>
        <Card.Title
          title={item.booking_code}
          subtitle={`${new Date(item.scheduled_start_at || "").toLocaleString()} • ${item.branch_name || "Chi nhánh"}`}
          right={() => (
            <Badge size={10} style={{ backgroundColor: statusToColor(item.status), marginRight: 16 }} />
          )}
        />
        <Card.Content>
          <View style={{ flexDirection: "row", marginBottom: 6 }}>
            <Text style={{ color: "#6b7280" }}>Xe: </Text>
            <Text style={{ fontWeight: "600" }}>{item.vehicle_license_plate}</Text>
          </View>
          {item.vehicle_brand_name || item.vehicle_model_name ? (
            <View style={{ flexDirection: "row", marginBottom: 6 }}>
              <Text style={{ color: "#6b7280" }}>Mẫu: </Text>
              <Text style={{ fontWeight: "600" }}>
                {(item.vehicle_brand_name || "") +
                  (item.vehicle_brand_name ? " • " : "") +
                  (item.vehicle_model_name || "")}
              </Text>
            </View>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            <Chip compact style={{ backgroundColor: "#F3F4F6" }}>
              {item.bay_name || "Bay"}
            </Chip>
            <Chip compact style={{ backgroundColor: "#F3F4F6" }}>
              {item.total_price?.toLocaleString()} {item.currency || "VND"}
            </Chip>
            <Chip compact style={{ backgroundColor: statusToColor(item.status) + "20" }}>
              <Text style={{ color: statusToColor(item.status), fontWeight: "600" }}>
                {statusToLabel(item.status)}
              </Text>
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Đang tải lịch sử chăm sóc...</Text>
        </View>
      ) : allBookings.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Text>Bạn chưa có lịch chăm sóc nào</Text>
        </View>
      ) : (
        <FlatList
          data={allBookings}
          keyExtractor={(item) => item.booking_id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
        />
      )}
    </SafeAreaView>
  );
}
