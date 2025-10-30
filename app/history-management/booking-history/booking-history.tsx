import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { ActivityIndicator, Badge, Card, Chip, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../src/context/AuthContext";
import { bookingService, type BookingInfoDto } from "../../../src/services/booking.service";

export default function BookingHistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<BookingInfoDto[]>([]);
  const [tab, setTab] = useState<
    "ALL" | "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  >("ALL");

  const fetchData = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const data = await bookingService.getCustomerBookings(user.user_id);
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
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
      setBookings(Array.isArray(data) ? data : []);
    } finally {
      setRefreshing(false);
    }
  }, [user?.user_id]);

  const statusToColor = (status?: string) => {
    switch ((status || "").toUpperCase()) {
      case "PENDING":
        return "#faad14";
      case "CONFIRMED":
        return "#1890ff";
      case "IN_PROGRESS":
        return "#722ed1";
      case "COMPLETED":
        return "#52c41a";
      case "CANCELLED":
        return "#ff4d4f";
      default:
        return "#8c8c8c";
    }
  };

  const renderItem = ({ item }: { item: BookingInfoDto }) => (
    <Card style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 12 }}>
      <Card.Title
        title={item.booking_code}
        subtitle={`${new Date(item.scheduled_start_at).toLocaleString()} • ${item.branch_name || "Chi nhánh"}`}
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
              {(item.vehicle_brand_name || "") + (item.vehicle_brand_name ? " • " : "") + (item.vehicle_model_name || "")}
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
          <Chip compact style={{ backgroundColor: "#F3F4F6" }}>
            {item.status}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const filtered = (() => {
    if (tab === "ALL") return bookings;
    return bookings.filter((b) => (b.status || "").toUpperCase() === tab);
  })();

  const counts = (() => {
    const map: Record<string, number> = {
      ALL: bookings.length,
      PENDING: 0,
      CONFIRMED: 0,
      CHECKED_IN: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    bookings.forEach((b) => {
      const s = (b.status || "").toUpperCase();
      if (s in map) map[s] += 1;
    });
    return map;
  })();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Đang tải lịch sử đặt lịch...</Text>
        </View>
      ) : bookings.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Text>Bạn chưa có lịch hẹn nào</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 12, paddingBottom: 4 }}>
            <FlatList
              data={[
                { key: "ALL", label: `Tất cả (${counts.ALL})` },
                { key: "PENDING", label: `Chờ xác nhận (${counts.PENDING})` },
                { key: "CONFIRMED", label: `Xác nhận (${counts.CONFIRMED})` },
                { key: "CHECKED_IN", label: `Check-in (${counts.CHECKED_IN})` },
                { key: "IN_PROGRESS", label: `Đang chăm sóc (${counts.IN_PROGRESS})` },
                { key: "COMPLETED", label: `Hoàn thành (${counts.COMPLETED})` },
                { key: "CANCELLED", label: `Hủy (${counts.CANCELLED})` },
              ]}
              keyExtractor={(i) => i.key}
              renderItem={({ item }) => (
                <Chip
                  selected={tab === (item.key as typeof tab)}
                  onPress={() => setTab(item.key as typeof tab)}
                  style={{ marginRight: 8, marginVertical: 6 }}
                  compact
                >
                  {item.label}
                </Chip>
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.booking_id}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
