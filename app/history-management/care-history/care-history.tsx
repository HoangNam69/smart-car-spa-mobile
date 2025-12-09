import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Badge, Card, Chip, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import ProtectedRoute from "../../../src/components/ProtectedRoute";
import { useAuth } from "../../../src/context/AuthContext";
import {
  useBookingEvents,
  useTrackingEvents,
} from "../../../src/hooks/useWebSocket";
import { bookingService } from "../../../src/services/booking.service";
import { BookingInfoDto } from "../../../src/types/booking.types";

export default function CareHistoryScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allBookings, setAllBookings] = useState<BookingInfoDto[]>([]);
  const [tab, setTab] = useState<
    "ALL" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED"
  >("ALL");

  const fetchData = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const data = await bookingService.getCustomerBookings(user.user_id);
      // Filter bookings with status CHECKED_IN, IN_PROGRESS, COMPLETED
      const careBookings = data.filter((b) =>
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

  // Subscribe to WebSocket booking events for real-time reload
  // QUAN TRỌNG: Care history cần subscribe booking events vì khi booking được
  // confirm/checkin/started/completed, status thay đổi và booking sẽ xuất hiện/ẩn trong care history
  useBookingEvents({
    onBookingConfirmed: (event) => {
      console.log("[CareHistory] WebSocket: Booking confirmed, reloading...");
      fetchData();
    },
    onBookingCheckedIn: (event) => {
      console.log("[CareHistory] WebSocket: Booking checked in, reloading...");
      fetchData();
    },
    onBookingStarted: (event) => {
      console.log("[CareHistory] WebSocket: Booking started, reloading...");
      fetchData();
    },
    onBookingCompleted: (event) => {
      console.log("[CareHistory] WebSocket: Booking completed, reloading...");
      fetchData();
    },
    onBookingUpdated: (event) => {
      console.log("[CareHistory] WebSocket: Booking updated, reloading...");
      fetchData();
    },
    onReload: () => {
      console.log(
        "[CareHistory] WebSocket: Booking reload signal received, reloading..."
      );
      fetchData();
    },
  });

  // Subscribe to WebSocket tracking updates for real-time reload
  useTrackingEvents({
    onTrackingUpdated: (event) => {
      console.log("[CareHistory] WebSocket: Tracking updated, reloading...");
      fetchData();
    },
    onTrackingCompleted: (event) => {
      console.log("[CareHistory] WebSocket: Tracking completed, reloading...");
      fetchData();
    },
    onTrackingStarted: (event) => {
      console.log("[CareHistory] WebSocket: Tracking started, reloading...");
      fetchData();
    },
    onReload: () => {
      console.log(
        "[CareHistory] WebSocket: Tracking reload signal received, reloading..."
      );
      fetchData();
    },
  });

  const onRefresh = useCallback(async () => {
    if (!user?.user_id) return;
    setRefreshing(true);
    try {
      const data = await bookingService.getCustomerBookings(user.user_id);
      const careBookings = data.filter((b) =>
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
      <Card
        style={{
          marginHorizontal: 8,
          marginBottom: 8,
          borderRadius: 4,
          backgroundColor: "#ffffff",
        }}
      >
        <Card.Title
          title={item.booking_code}
          subtitle={`${new Date(
            item.scheduled_start_at || ""
          ).toLocaleString()} • ${item.branch_name || "Chi nhánh"}`}
          right={() => (
            <Badge
              size={10}
              style={{
                backgroundColor: statusToColor(item.status),
                marginRight: 16,
              }}
            />
          )}
        />
        <Card.Content>
          <View style={{ flexDirection: "row", marginBottom: 6 }}>
            <Text style={{ color: "#6b7280" }}>Xe: </Text>
            <Text style={{ fontWeight: "600" }}>
              {item.vehicle_license_plate}
            </Text>
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <Chip compact style={{ backgroundColor: "#F3F4F6" }}>
              {item.bay_name || "Bay"}
            </Chip>
            <Chip compact style={{ backgroundColor: "#F3F4F6" }}>
              {item.total_price?.toLocaleString()} {item.currency || "VND"}
            </Chip>
          </View>
          <View style={{ marginTop: 12 }}>
            <Chip
              compact
              style={{ backgroundColor: statusToColor(item.status) + "20" }}
            >
              {item.status}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const filtered = (() => {
    if (tab === "ALL") return allBookings;
    return allBookings.filter((b) => (b.status || "").toUpperCase() === tab);
  })();

  const counts = (() => {
    const map: Record<string, number> = {
      ALL: allBookings.length,
      CHECKED_IN: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };
    allBookings.forEach((b) => {
      const s = (b.status || "").toUpperCase();
      if (s in map) map[s] += 1;
    });
    return map;
  })();

  return (
    <ProtectedRoute requiredRole="CUSTOMER">
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Đang tải lịch sử chăm sóc...</Text>
        </View>
      ) : allBookings.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <Text>Bạn chưa có lịch chăm sóc nào</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 8 }}>
            <FlatList
              data={[
                { key: "ALL", label: `Tất cả (${counts.ALL})` },
                { key: "CHECKED_IN", label: `Check-in (${counts.CHECKED_IN})` },
                {
                  key: "IN_PROGRESS",
                  label: `Đang chăm sóc (${counts.IN_PROGRESS})`,
                },
                { key: "COMPLETED", label: `Hoàn thành (${counts.COMPLETED})` },
              ]}
              keyExtractor={(i) => i.key}
              renderItem={({ item }) => {
                const isSelected = tab === (item.key as typeof tab);
                return (
                  <Chip
                    selected={isSelected}
                    onPress={() => setTab(item.key as typeof tab)}
                    style={{
                      marginRight: 8,
                      marginVertical: 6,
                      backgroundColor: isSelected ? "#E8F5E9" : undefined,
                    }}
                    selectedColor={isSelected ? "#2E7D32" : undefined}
                    compact
                  >
                    {item.label}
                  </Chip>
                );
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.booking_id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
          />
        </View>
      )}
    </SafeAreaView>
    </ProtectedRoute>
  );
}
