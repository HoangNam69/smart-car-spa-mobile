import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  List,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../../src/context/AuthContext";
import { bookingService } from "../../../../src/services/booking.service";
import { BookingInfoDto, BookingType } from "../../../../src/types/booking.types";

export default function BookingDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = params?.id ? String(params.id) : "";
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingInfoDto | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    customer: true,
    vehicle: true,
    services: true,
    bookingDetails: true,
    pricing: true,
    cancellation: true,
    notes: true,
    timestamps: true,
  });

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const loadBooking = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const data = await bookingService.getBookingById(bookingId);
      if (data) {
        setBooking(data as any as BookingInfoDto);
      }
    } catch (e: any) {
      console.log("Error loading booking:", e);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const safeString = (value: any): string => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleString("vi-VN");
    } catch {
      return "";
    }
  };

  const getStatusColor = (status?: string) => {
    switch ((status || "").toUpperCase()) {
      case "PENDING":
        return "#faad14";
      case "CONFIRMED":
        return "#1890ff";
      case "CHECKED_IN":
        return "#0ea5e9";
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

  const getStatusLabel = (status?: string) => {
    switch ((status || "").toUpperCase()) {
      case "PENDING":
        return "Chờ xác nhận";
      case "CONFIRMED":
        return "Đã xác nhận";
      case "CHECKED_IN":
        return "Đã check-in";
      case "IN_PROGRESS":
        return "Đang chăm sóc";
      case "COMPLETED":
        return "Hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status || "Unknown";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Đang tải thông tin booking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
          <Text>Không tìm thấy booking</Text>
          <Button style={{ marginTop: 12 }} onPress={() => router.back()}>
            Quay lại
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(booking.status);
  
  // Only allow update for SCHEDULED bookings
  // Fallback: Nếu booking_type không có, kiểm tra booking_code
  // Booking code bắt đầu bằng "BK-" là SCHEDULED, "WALK-IN-" là WALK_IN
  const bookingType = booking.booking_type as string | undefined;
  const isScheduledBooking = 
    bookingType === BookingType.SCHEDULED || 
    bookingType === "SCHEDULED" ||
    (!bookingType && booking.booking_code?.startsWith("BK-"));
  
  // Only allow update for PENDING or CONFIRMED status (giống web)
  const statusUpper = (booking.status || "").toUpperCase();
  const canUpdate = isScheduledBooking && (statusUpper === "PENDING" || statusUpper === "CONFIRMED");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Booking Header */}
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
          <Card.Content style={{ alignItems: "center", paddingVertical: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 8 }}>
              {safeString(booking.booking_code)}
            </Text>
            <Chip
              style={{ backgroundColor: statusColor + "20", marginTop: 8 }}
              textStyle={{ color: statusColor, fontSize: 14, fontWeight: "600" }}
            >
              {getStatusLabel(booking.status)}
            </Chip>
          </Card.Content>
        </Card>

        {/* Customer Info */}
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
          <List.Accordion
            title="Thông tin khách hàng"
            expanded={expandedCards.customer}
            onPress={() => toggleCard("customer")}
            titleStyle={{ fontWeight: "600" }}
            left={(props) => <List.Icon {...props} icon="account" />}
            style={{ borderRadius: 12 }}
          >
            <Card.Content style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>Tên khách hàng</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                  {safeString(user?.full_name || booking.customer_name)}
                </Text>
              </View>
              <View style={{ marginTop: 16 }}>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>Số điện thoại</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                  {safeString(user?.phone_number || booking.customer_phone)}
                </Text>
              </View>
              {user?.email || booking.customer_email ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Email</Text>
                  <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                    {safeString(user?.email || booking.customer_email)}
                  </Text>
                </View>
              ) : null}
            </Card.Content>
          </List.Accordion>
        </Card>

        {/* Vehicle Info */}
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
          <List.Accordion
            title="Thông tin xe"
            expanded={expandedCards.vehicle}
            onPress={() => toggleCard("vehicle")}
            titleStyle={{ fontWeight: "600" }}
            left={(props) => <List.Icon {...props} icon="car" />}
            style={{ borderRadius: 12 }}
          >
            <Card.Content style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>Biển số xe</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                  {safeString(booking.vehicle_license_plate)}
                </Text>
              </View>
              {(booking.vehicle_brand_name || booking.vehicle_model_name) ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Hãng & Dòng xe</Text>
                  <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                    {safeString([booking.vehicle_brand_name, booking.vehicle_model_name].filter(Boolean).join(" • "))}
                  </Text>
                </View>
              ) : null}
              {booking.vehicle_type_name ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Loại xe</Text>
                  <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                    {safeString(booking.vehicle_type_name)}
                  </Text>
                </View>
              ) : null}
            </Card.Content>
          </List.Accordion>
        </Card>

        {/* Services Info */}
        {booking.booking_items && booking.booking_items.length > 0 && (
          <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
            <List.Accordion
              title="Dịch vụ đã đặt"
              expanded={expandedCards.services}
              onPress={() => toggleCard("services")}
              titleStyle={{ fontWeight: "600" }}
              left={(props) => <List.Icon {...props} icon="clipboard-list" />}
              style={{ borderRadius: 12 }}
            >
              <Card.Content style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                {booking.booking_items.map((item, index) => (
                  <View key={index} style={{ marginTop: index > 0 ? 16 : 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600" }}>{safeString(item.item_name)}</Text>
                    {item.item_description ? (
                      <Text style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                        {safeString(item.item_description)}
                      </Text>
                    ) : null}
                    {item.unit_price ? (
                      <Text style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                        {safeString(`Giá: ${(item.unit_price || 0).toLocaleString()} VNĐ${item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ""}`)}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </Card.Content>
            </List.Accordion>
          </Card>
        )}

        {/* Booking Details */}
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
          <List.Accordion
            title="Chi tiết đặt lịch"
            expanded={expandedCards.bookingDetails}
            onPress={() => toggleCard("bookingDetails")}
            titleStyle={{ fontWeight: "600" }}
            left={(props) => <List.Icon {...props} icon="calendar-clock" />}
            style={{ borderRadius: 12 }}
          >
            <Card.Content style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>Chi nhánh</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                  {safeString(booking.branch_name || booking.branch_code || "N/A")}
                </Text>
              </View>
              {booking.bay_name ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Service Bay</Text>
                  <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                    {safeString(booking.bay_name)}
                  </Text>
                </View>
              ) : null}
              {booking.preferred_start_at ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Thời gian bắt đầu dự kiến</Text>
                  <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                    {formatDate(booking.preferred_start_at)}
                  </Text>
                </View>
              ) : null}
              {booking.scheduled_end_at ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Thời gian kết thúc dự kiến</Text>
                  <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                    {formatDate(booking.scheduled_end_at)}
                  </Text>
                </View>
              ) : null}
              {booking.estimated_duration_minutes ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Thời gian ước tính</Text>
                  <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                    {safeString(`${booking.estimated_duration_minutes || 0} phút`)}
                  </Text>
                </View>
              ) : null}
            </Card.Content>
          </List.Accordion>
        </Card>

        {/* Pricing Info */}
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
          <List.Accordion
            title="Thông tin thanh toán"
            expanded={expandedCards.pricing}
            onPress={() => toggleCard("pricing")}
            titleStyle={{ fontWeight: "600" }}
            left={(props) => <List.Icon {...props} icon="cash-multiple" />}
            style={{ borderRadius: 12 }}
          >
            <Card.Content style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>Tổng giá</Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#52c41a", marginTop: 4 }}>
                  {safeString(`${(booking.total_price || 0).toLocaleString()} ${booking.currency || "VND"}`)}
                </Text>
              </View>
              {booking.payment_status ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Trạng thái thanh toán</Text>
                  <Chip
                    style={{
                      backgroundColor:
                        booking.payment_status === "PAID"
                          ? "#52c41a20"
                          : booking.payment_status === "PARTIAL"
                          ? "#faad1420"
                          : "#ff4d4f20",
                      marginTop: 8,
                      alignSelf: "flex-start",
                    }}
                    textStyle={{
                      color:
                        booking.payment_status === "PAID"
                          ? "#52c41a"
                          : booking.payment_status === "PARTIAL"
                          ? "#faad14"
                          : "#ff4d4f",
                      fontSize: 12,
                    }}
                  >
                    {safeString(
                      booking.payment_status === "PAID"
                        ? "Đã thanh toán"
                        : booking.payment_status === "PARTIAL"
                        ? "Thanh toán một phần"
                        : booking.payment_status === "PENDING"
                        ? "Chờ thanh toán"
                        : booking.payment_status || ""
                    )}
                  </Chip>
                </View>
              ) : null}
              {booking.deposit_amount ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Tiền đặt cọc</Text>
                  <Text style={{ fontSize: 15, fontWeight: "600", marginTop: 4 }}>
                    {safeString(`${(booking.deposit_amount || 0).toLocaleString()} ${booking.currency || "VND"}`)}
                  </Text>
                </View>
              ) : null}
            </Card.Content>
          </List.Accordion>
        </Card>

        {/* Cancellation Info */}
        {booking.status === "CANCELLED" && booking.cancellation_reason ? (
          <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
            <List.Accordion
              title="Lý do hủy"
              expanded={expandedCards.cancellation}
              onPress={() => toggleCard("cancellation")}
              titleStyle={{ fontWeight: "600" }}
              left={(props) => <List.Icon {...props} icon="cancel" />}
              style={{ borderRadius: 12 }}
            >
              <Card.Content style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <View style={{ marginTop: 8, padding: 12, backgroundColor: "#FFF3E0", borderRadius: 8, borderLeftWidth: 3, borderLeftColor: "#ff4d4f" }}>
                  <Text style={{ fontSize: 14, lineHeight: 20, color: "#666" }}>
                    {safeString(booking.cancellation_reason)}
                  </Text>
                  {booking.cancelled_at ? (
                    <Text style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
                      {safeString(`Hủy vào: ${formatDate(booking.cancelled_at)}`)}
                    </Text>
                  ) : null}
                </View>
              </Card.Content>
            </List.Accordion>
          </Card>
        ) : null}

        {/* Additional Info */}
        {booking.notes ? (
          <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
            <List.Accordion
              title="Ghi chú"
              expanded={expandedCards.notes}
              onPress={() => toggleCard("notes")}
              titleStyle={{ fontWeight: "600" }}
              left={(props) => <List.Icon {...props} icon="note-text" />}
              style={{ borderRadius: 12 }}
            >
              <Card.Content style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <Text style={{ fontSize: 14, lineHeight: 20, marginTop: 8 }}>{safeString(booking.notes)}</Text>
              </Card.Content>
            </List.Accordion>
          </Card>
        ) : null}

        {/* Timestamps */}
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
          <List.Accordion
            title="Thông tin khác"
            expanded={expandedCards.timestamps}
            onPress={() => toggleCard("timestamps")}
            titleStyle={{ fontWeight: "600" }}
            left={(props) => <List.Icon {...props} icon="information" />}
            style={{ borderRadius: 12 }}
          >
            <Card.Content style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
              {booking.created_at ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Ngày tạo</Text>
                  <Text style={{ fontSize: 13, marginTop: 4 }}>
                    {formatDate(booking.created_at)}
                  </Text>
                </View>
              ) : null}
              {booking.updated_at ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Cập nhật lần cuối</Text>
                  <Text style={{ fontSize: 13, marginTop: 4 }}>
                    {formatDate(booking.updated_at)}
                  </Text>
                </View>
              ) : null}
              {booking.actual_check_in_at ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Thời gian check-in thực tế</Text>
                  <Text style={{ fontSize: 13, marginTop: 4 }}>
                    {formatDate(booking.actual_check_in_at)}
                  </Text>
                </View>
              ) : null}
              {booking.actual_start_at ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Thời gian bắt đầu thực tế</Text>
                  <Text style={{ fontSize: 13, marginTop: 4 }}>
                    {formatDate(booking.actual_start_at)}
                  </Text>
                </View>
              ) : null}
              {booking.actual_end_at ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>Thời gian kết thúc thực tế</Text>
                  <Text style={{ fontSize: 13, marginTop: 4 }}>
                    {formatDate(booking.actual_end_at)}
                  </Text>
                </View>
              ) : null}
            </Card.Content>
          </List.Accordion>
        </Card>

        {/* Action Buttons */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
          {canUpdate ? (
            <Button
              mode="contained"
              icon="pencil"
              onPress={() => {
                router.push(`/history-management/booking-history/update-booking/${booking.booking_id}` as any);
              }}
              style={{ flex: 1 }}
              contentStyle={{ paddingVertical: 6 }}
            >
              Cập nhật
            </Button>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

