import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import {
  ActivityIndicator,
  Badge,
  Button,
  Card,
  Chip,
  Dialog,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../src/context/AuthContext";
import { bookingService } from "../../../src/services/booking.service";
import { BookingInfoDto as BookingServiceDto, BookingType } from "../../../src/types/booking.types";

export default function BookingHistoryScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<BookingServiceDto[]>([]);
  const [tab, setTab] = useState<
    "ALL" | "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  >("ALL");
  
  // Cancel booking states
  const [cancelModal, setCancelModal] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<BookingServiceDto | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; error?: boolean }>({
    visible: false,
    message: "",
    error: false,
  });

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

  const isInitialMount = useRef(true);

  useEffect(() => {
    fetchData();
    isInitialMount.current = false;
  }, [fetchData]);

  // Reload data when screen comes into focus (e.g., after updating/cancelling booking)
  // Skip the first mount to avoid double fetch
  useFocusEffect(
    useCallback(() => {
      // Only reload if this is not the initial mount
      if (!isInitialMount.current) {
        fetchData();
      }
    }, [fetchData])
  );

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

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setCancelling(true);
    try {
      await bookingService.cancelBooking(cancellingBooking.booking_id);
      // Đóng modal trước
      setCancelModal(false);
      setCancellingBooking(null);
      // Hiển thị thông báo thành công
      setSnackbar({ visible: true, message: "Hủy booking thành công!", error: false });
      // Refresh bookings sau khi modal đóng để cập nhật danh sách
      // Sử dụng setTimeout nhỏ để đảm bảo modal đã đóng hoàn toàn trước khi reload
      setTimeout(async () => {
        await fetchData();
      }, 300);
    } catch (e: any) {
      // Đóng modal ngay cả khi có lỗi
      setCancelModal(false);
      setCancellingBooking(null);
      setSnackbar({ visible: true, message: e?.message || "Hủy booking thất bại", error: true });
      // Vẫn refresh để đảm bảo dữ liệu đồng bộ
      setTimeout(async () => {
        await fetchData();
      }, 300);
    } finally {
      setCancelling(false);
    }
  };

  const openCancelModal = (booking: BookingServiceDto) => {
    setCancellingBooking(booking);
    setCancelModal(true);
  };

  const closeCancelModal = () => {
    setCancelModal(false);
    setCancellingBooking(null);
  };

  const canCancelBooking = (booking: BookingServiceDto) => {
    // Only allow cancellation for SCHEDULED bookings
    // Fallback: Nếu booking_type không có, kiểm tra booking_code
    // Booking code bắt đầu bằng "BK-" là SCHEDULED, "WALK-IN-" là WALK_IN
    const bookingType = booking.booking_type as string | undefined;
    const isScheduledBooking = 
      bookingType === BookingType.SCHEDULED || 
      bookingType === "SCHEDULED" ||
      (!bookingType && booking.booking_code?.startsWith("BK-"));
    
    if (!isScheduledBooking) return false;

    // Only allow cancellation for PENDING or CONFIRMED status
    const statusUpper = (booking.status || "").toUpperCase();
    return statusUpper === "PENDING" || statusUpper === "CONFIRMED";
  };

  const canUpdateBooking = (booking: BookingServiceDto) => {
    // Only allow update for SCHEDULED bookings
    // Fallback: Nếu booking_type không có, kiểm tra booking_code
    // Booking code bắt đầu bằng "BK-" là SCHEDULED, "WALK-IN-" là WALK_IN
    const bookingType = booking.booking_type as string | undefined;
    const isScheduledBooking = 
      bookingType === BookingType.SCHEDULED || 
      bookingType === "SCHEDULED" ||
      (!bookingType && booking.booking_code?.startsWith("BK-"));
    
    if (!isScheduledBooking) return false;

    // Only allow update for PENDING or CONFIRMED status (giống web)
    const statusUpper = (booking.status || "").toUpperCase();
    return statusUpper === "PENDING" || statusUpper === "CONFIRMED";
  };

  const renderItem = ({ item }: { item: BookingServiceDto }) => (
    <Card
      style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 12 }}
      onPress={() => {
        router.push(`/history-management/booking-history/booking-detail/${item.booking_id}` as any);
      }}
      mode="elevated"
    >
      <Card.Title
        title={item.booking_code}
        subtitle={`${item.scheduled_start_at ? new Date(item.scheduled_start_at).toLocaleString() : "Chưa có lịch"} • ${item.branch_name || "Chi nhánh"}`}
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 12 }}>
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
        <View style={{ flexDirection: "row", gap: 8 }}>
          {canUpdateBooking(item) && (
            <Button
              mode="outlined"
              icon="pencil"
              onPress={() => {
                router.push(`/history-management/booking-history/update-booking/${item.booking_id}`);
              }}
              contentStyle={{ paddingVertical: 4 }}
              labelStyle={{ fontSize: 14 }}
              style={{ flex: 1 }}
            >
              Cập nhật
            </Button>
          )}
          {canCancelBooking(item) && (
            <Button
              mode="outlined"
              icon="close-circle"
              onPress={() => openCancelModal(item)}
              contentStyle={{ paddingVertical: 4 }}
              labelStyle={{ fontSize: 14, color: "#ff4d4f" }}
              style={{ flex: 1, borderColor: "#ff4d4f" }}
              textColor="#ff4d4f"
            >
              Hủy
            </Button>
          )}
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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
          />
        </View>
      )}

      {/* Cancel Booking Dialog */}
      <Portal>
        <Dialog 
          visible={cancelModal} 
          onDismiss={cancelling ? undefined : closeCancelModal}
          dismissable={!cancelling}
        >
          <Dialog.Title>Xác nhận hủy booking</Dialog.Title>
          <Dialog.Content>
            <Text>
              Bạn có chắc chắn muốn hủy booking{" "}
              <Text style={{ fontWeight: "600" }}>{cancellingBooking?.booking_code}</Text> không?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={closeCancelModal} 
              disabled={cancelling}
            >
              Đóng
            </Button>
            <Button
              mode="contained"
              onPress={handleCancelBooking}
              loading={cancelling}
              disabled={cancelling}
              buttonColor="#ff4d4f"
            >
              Xác nhận hủy
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        duration={3000}
        style={{ backgroundColor: snackbar.error ? theme.colors.error : theme.colors.primary }}
      >
        {snackbar.message}
      </Snackbar>
    </SafeAreaView>
  );
}
