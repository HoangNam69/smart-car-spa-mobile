import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  HelperText,
  List,
  Modal,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { bookingService } from "../../src/services/booking.service";
import {
  bookingScheduleService,
  type TimeSlotDto,
} from "../../src/services/bookingSchedule.service";
import {
  branchService,
  type BranchDisplay,
} from "../../src/services/branch.service";
import {
  pricingService,
  type PriceBookItem,
} from "../../src/services/pricing.service";
import {
  serviceBayService,
  type ServiceBay,
} from "../../src/services/serviceBay.service";
import {
  vehicleProfileService,
  type VehicleProfileDto,
} from "../../src/services/vehicleProfile.service";

export default function BookingScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState<VehicleProfileDto[]>([]);
  const [branches, setBranches] = useState<BranchDisplay[]>([]);
  const [bays, setBays] = useState<ServiceBay[]>([]);
  const [slots, setSlots] = useState<TimeSlotDto[]>([]);
  const [services, setServices] = useState<PriceBookItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<PriceBookItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  const [vehicleId, setVehicleId] = useState<string | undefined>();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [bayId, setBayId] = useState<string | undefined>();
  const [bookingDate, setBookingDate] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  // Helpers for local date formatting and allowed range
  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const computeMinDate = () => {
    const now = new Date();
    const min = new Date(now);
    if (now.getHours() >= 17) {
      min.setDate(min.getDate() + 1);
      min.setHours(0, 0, 0, 0);
    } else {
      min.setHours(0, 0, 0, 0);
    }
    return min;
  };
  const computeMaxDate = () => {
    const now = new Date();
    // End of next month
    return new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
  };

  const [selectedSlot, setSelectedSlot] = useState<TimeSlotDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    error?: boolean;
  }>({ visible: false, message: "", error: false });
  const [vehicleModal, setVehicleModal] = useState(false);
  const [branchModal, setBranchModal] = useState(false);
  const [bayModal, setBayModal] = useState(false);

  const getSlotStatusMeta = (
    status: TimeSlotDto["status"],
    isAvailable: boolean
  ) => {
    if (status === "AVAILABLE" && isAvailable)
      return { label: "Trống", bg: "#DCFCE7", fg: "#16A34A" };
    if (status === "BOOKED")
      return { label: "Đã đặt", bg: "#FFE4E6", fg: "#E11D48" };
    if (status === "IN_PROGRESS")
      return { label: "Đang chăm sóc", bg: "#DBEAFE", fg: "#2563EB" };
    if (status === "COMPLETED")
      return { label: "Hoàn thành", bg: "#E5E7EB", fg: "#4B5563" };
    if (status === "CANCELLED")
      return { label: "Hủy", bg: "#FEE2E2", fg: "#DC2626" };
    if (status === "BLOCKED")
      return { label: "Chặn", bg: "#F3F4F6", fg: "#6B7280" };
    if (status === "MAINTENANCE")
      return { label: "Bảo trì", bg: "#FEF3C7", fg: "#B45309" };
    return { label: "Không khả dụng", bg: "#F3F4F6", fg: "#6B7280" };
  };

  const isSlotSuitable = useCallback(
    (slot: TimeSlotDto) => {
      if (totalDuration <= 60) {
        return slot.isAvailable && (slot.durationMinutes || 0) >= totalDuration;
      }
      const requiredSlots = Math.ceil(totalDuration / 60);
      const startIdx = slots.findIndex((s) => s.startTime === slot.startTime);
      if (startIdx === -1) return false;
      for (let i = 0; i < requiredSlots; i++) {
        const check = slots[startIdx + i];
        if (!check) return false;
        if (!check.isAvailable || check.status !== "AVAILABLE") return false;
      }
      return true;
    },
    [slots, totalDuration]
  );

  const canSelectSlot = useCallback(
    (slot: TimeSlotDto) =>
      slot.isAvailable && slot.status === "AVAILABLE" && isSlotSuitable(slot),
    [isSlotSuitable]
  );

  const loadInit = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      const [v, b, s] = await Promise.all([
        vehicleProfileService.getByOwner(user.user_id, { size: 100 }),
        branchService.getAll(),
        pricingService.getAllItems(),
      ]);
      setVehicles(v.content || []);
      setBranches(b);
      setServices(s);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadInit();
  }, [loadInit]);

  // Reload screen data whenever the tab/screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadInit();
      // reset transient selections for a fresh booking flow
      setSelectedItems([]);
      setTotalPrice(0);
      setTotalDuration(0);
      setVehicleId(undefined);
      setBranchId(undefined);
      setBayId(undefined);
      setSelectedSlot(null);
      return () => {};
    }, [loadInit])
  );

  useEffect(() => {
    (async () => {
      if (!branchId) {
        setBays([]);
        return;
      }
      const active = await serviceBayService.getActive(branchId);
      setBays(active.filter((x) => x.allow_booking !== false));
    })();
  }, [branchId]);

  const loadSlots = useCallback(async () => {
    if (!branchId || !bayId || !bookingDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const slotsResp = await bookingScheduleService.getAvailableSlots({
        branchId,
        date: formatLocalDate(bookingDate),
        serviceDurationMinutes: Math.max(totalDuration, 30),
        bayId,
      });
      setSlots(slotsResp);
    } finally {
      setLoadingSlots(false);
    }
  }, [branchId, bayId, bookingDate, totalDuration]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!vehicleId) errs.vehicle = "Vui lòng chọn xe";
    if (!branchId) errs.branch = "Vui lòng chọn chi nhánh";
    if (!bayId) errs.bay = "Vui lòng chọn khu vực";
    if (!selectedSlot) errs.slot = "Vui lòng chọn khung giờ";
    if (selectedItems.length === 0)
      errs.services = "Vui lòng chọn ít nhất 1 dịch vụ";
    return errs;
  }

  async function onSubmit() {
    if (!user?.user_id) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setSnackbar({
        visible: true,
        message: Object.values(errs)[0],
        error: true,
      });
      return;
    }
    setSubmitting(true);
    try {
      const vehicle = vehicles.find((v) => v.vehicle_id === vehicleId)!;
      const [startHour, startMinute] = selectedSlot!.startTime
        .split(":")
        .map(Number);
      const startLocal = new Date(
        bookingDate.getFullYear(),
        bookingDate.getMonth(),
        bookingDate.getDate(),
        startHour || 0,
        startMinute || 0,
        0,
        0
      );
      const durationMs = Math.max(totalDuration, 30) * 60 * 1000;
      const endLocal = new Date(startLocal.getTime() + durationMs);
      const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
      const startHHmm = `${pad(startLocal.getHours())}:${pad(
        startLocal.getMinutes()
      )}`;
      const computedEndHHmm = `${pad(endLocal.getHours())}:${pad(
        endLocal.getMinutes()
      )}`;
      const slotStartISO = startLocal.toISOString();
      const slotEndISO = endLocal.toISOString();
      // Validate booking date within allowed range before submitting
      const minDate = computeMinDate();
      const maxDate = computeMaxDate();
      if (bookingDate < minDate || bookingDate > maxDate) {
        setSnackbar({
          visible: true,
          message: `Ngày đặt phải trong khoảng ${formatLocalDate(
            minDate
          )} - ${formatLocalDate(maxDate)}`,
          error: true,
        });
        setShowDate(true);
        setSubmitting(false);
        return;
      }

      const payload = {
        customer_id: user.user_id,
        customer_name: user.full_name,
        customer_phone: user.phone_number,
        customer_email: user.email,
        vehicle_id: vehicle.vehicle_id,
        vehicle_license_plate: vehicle.license_plate,
        vehicle_brand_name: vehicle.brand_name || "",
        vehicle_model_name: vehicle.model_name || "",
        vehicle_type_name: vehicle.type_name || "",
        vehicle_year: (vehicle as any)?.model_year || new Date().getFullYear(),
        vehicle_color: (vehicle as any)?.color || "",
        branch_id: branchId,
        bay_id: bayId,
        selected_slot: {
          bay_id: bayId,
          date: formatLocalDate(bookingDate),
          start_time: startHHmm,
          service_duration_minutes: Math.max(totalDuration, 30),
        },
        booking_items: selectedItems.map((it) => ({
          service_id: it.service?.service_id || it.item_id,
          item_name: it.item_name,
          item_description: it.service?.description || "",
          discount_amount: 0,
          tax_amount: Math.round((it.fixed_price || 0) * 0.1),
        })),
        total_price: totalPrice,
        currency: "VND",
        deposit_amount: 0,
        coupon_code: undefined,
        notes: "",
        special_requests: [],
        estimated_duration_minutes: Math.max(totalDuration, 30),
        preferent_start_at: slotStartISO,
        schedule_start_at: slotStartISO,
        schedule_end_at: slotEndISO,
        slot_start_time: startHHmm,
        slot_end_time: computedEndHHmm,
      } as const;

      // Debug payload (only in development)
      try {
        console.log("[booking] payload:", JSON.stringify(payload));
      } catch {}

      await bookingService.createBooking(payload as any);
      setSnackbar({
        visible: true,
        message: "Đặt lịch thành công!",
        error: false,
      });
      setTimeout(() => router.replace("/(tabs)"), 1000);
    } catch (e: any) {
      const serverMsg = e?.response?.data?.message || e?.response?.data?.error;
      console.error("Create booking failed:", e?.response?.data || e);
      setSnackbar({
        visible: true,
        message: serverMsg || e?.message || "Đặt lịch thất bại",
        error: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}
      edges={["top", "bottom"]}
    >
      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          {/* Xe */}
          <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
            <List.Item
              title="Chọn xe"
              description={
                vehicles.find((v) => v.vehicle_id === vehicleId)
                  ?.license_plate || "Chạm để chọn"
              }
              left={(p) => <List.Icon {...p} icon="car" />}
              right={(p) => <List.Icon {...p} icon="chevron-right" />}
              onPress={() => setVehicleModal(true)}
              titleStyle={{ fontWeight: "bold" }}
            />
          </Card>

          {/* Dịch vụ */}
          <Card
            mode="elevated"
            style={{
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <List.Accordion
              title="Chọn dịch vụ"
              left={(p) => <List.Icon {...p} icon="clipboard-list" />}
              titleStyle={{ fontWeight: "bold" }}
              descriptionStyle={{ fontWeight: "bold" }}
            >
              <Card.Content>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  {services.map((item) => {
                    const selected = selectedItems.some(
                      (x) => x.item_id === item.item_id
                    );
                    return (
                      <Card
                        key={item.item_id}
                        onPress={() => {
                          setSelectedItems((prev) =>
                            selected
                              ? prev.filter((x) => x.item_id !== item.item_id)
                              : [...prev, item]
                          );
                          setTotalPrice((prev) =>
                            selected
                              ? prev - (item.fixed_price || 0)
                              : prev + (item.fixed_price || 0)
                          );
                          setTotalDuration((prev) =>
                            selected
                              ? prev - (item.service?.estimated_duration || 0)
                              : prev + (item.service?.estimated_duration || 0)
                          );
                        }}
                        style={{
                          width: "48%",
                          marginBottom: 10,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: selected ? "#22c55e" : "#E5E7EB",
                          backgroundColor: selected ? "#ECFDF5" : "white",
                        }}
                      >
                        <Card.Content
                          style={{
                            minHeight: 136,
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingVertical: 12,
                          }}
                        >
                          <View>
                            <Text
                              numberOfLines={2}
                              style={{ fontWeight: "600", textAlign: "center" }}
                            >
                              {item.item_name}
                            </Text>
                            <Text
                              style={{
                                color: "#6b7280",
                                marginTop: 6,
                                textAlign: "center",
                              }}
                            >
                              {item.service?.estimated_duration || 0} phút •{" "}
                              {(item.fixed_price || 0).toLocaleString()} VND
                            </Text>
                          </View>
                          <Text
                            style={{
                              color: selected ? "#16a34a" : "#64748b",
                              fontSize: 12,
                              textAlign: "center",
                            }}
                          >
                            {selected ? "Đã chọn" : "Chạm để chọn"}
                          </Text>
                        </Card.Content>
                      </Card>
                    );
                  })}
                </View>
                <Divider style={{ marginVertical: 8 }} />
                <View style={{ flex: 1, gap: 8, paddingBottom: 16 }}>
                  <Text>Tổng tiền: {totalPrice.toLocaleString()} VND</Text>
                  <Text>Thời gian dự kiến: {totalDuration} phút</Text>
                </View>
              </Card.Content>
            </List.Accordion>
          </Card>

          {/* Thời gian & Chi nhánh */}
          <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
            <Card.Title
              title="Thời gian & Chi nhánh"
              titleStyle={{ fontWeight: "bold" }}
            />
            <Divider />
            <Card.Content>
              <List.Item
                title="Ngày đặt"
                description={bookingDate.toLocaleDateString()}
                left={(p) => <List.Icon {...p} icon="calendar" />}
                right={(p) => <List.Icon {...p} icon="chevron-right" />}
                onPress={() => setShowDate(true)}
              />
              {showDate && (
                <DateTimePicker
                  value={bookingDate}
                  mode="date"
                  minimumDate={computeMinDate()}
                  maximumDate={computeMaxDate()}
                  onChange={(e, d) => {
                    setShowDate(false);
                    if (d) setBookingDate(d);
                  }}
                />
              )}
              <List.Item
                title="Chi nhánh"
                description={
                  branches.find((b) => b.branch_id === branchId)?.branch_name ||
                  "Chạm để chọn"
                }
                left={(p) => <List.Icon {...p} icon="home-map-marker" />}
                right={(p) => <List.Icon {...p} icon="chevron-right" />}
                onPress={() => setBranchModal(true)}
              />
            </Card.Content>
          </Card>

          {/* Khu vực & khung giờ */}
          <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
            <Card.Title
              title="Khu vực & khung giờ"
              titleStyle={{ fontWeight: "bold" }}
            />
            <Divider />
            <Card.Content>
              <List.Item
                title="Khu vực chăm sóc"
                description={
                  bays.find((b) => b.bay_id === bayId)?.bay_name ||
                  "Chạm để chọn"
                }
                left={(p) => <List.Icon {...p} icon="garage" />}
                right={(p) => <List.Icon {...p} icon="chevron-right" />}
                onPress={() => setBayModal(true)}
              />
              <Divider style={{ marginVertical: 8 }} />
              {loadingSlots ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator />
                </View>
              ) : slots.length === 0 ? (
                <HelperText type="info" visible>
                  Không có khung giờ khả dụng cho ngày này
                </HelperText>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}
                >
                  {slots.map((slot) => {
                    const isSelected =
                      selectedSlot?.startTime === slot.startTime &&
                      selectedSlot?.bayId === slot.bayId;
                    const selectable = canSelectSlot(slot);
                    const isDisabled = !selectable;
                    const meta = getSlotStatusMeta(
                      slot.status,
                      slot.isAvailable
                    );
                    return (
                      <Card
                        key={`${slot.bayId}-${slot.startTime}`}
                        onPress={() => !isDisabled && setSelectedSlot(slot)}
                        style={{
                          width: "48%",
                          marginBottom: 12,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : isDisabled
                            ? "#E5E7EB"
                            : "#D1D5DB",
                          backgroundColor: isSelected
                            ? theme.colors.primaryContainer
                            : isDisabled
                            ? "#F3F4F6"
                            : "white",
                          opacity: isDisabled ? 0.6 : 1,
                        }}
                        disabled={isDisabled}
                      >
                        <Card.Content style={{ padding: 12 }}>
                          <View style={{ alignItems: "flex-end" }}>
                            <Chip
                              compact
                              style={{ backgroundColor: meta.bg }}
                              textStyle={{ color: meta.fg }}
                            >
                              {meta.label}
                            </Chip>
                          </View>
                          <View style={{ alignItems: "center", marginTop: 6 }}>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "600",
                                color: isSelected
                                  ? theme.colors.primary
                                  : isDisabled
                                  ? "#9CA3AF"
                                  : "#1F2937",
                                textAlign: "center",
                              }}
                            >
                              {slot.startTime} - {slot.endTime}
                            </Text>
                            {slot.durationMinutes && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: isSelected
                                    ? theme.colors.primary
                                    : "#6B7280",
                                  marginTop: 4,
                                }}
                              >
                                {slot.durationMinutes} phút
                              </Text>
                            )}
                            {!selectable && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: "#dc2626",
                                  marginTop: 4,
                                }}
                              >
                                {totalDuration > 60
                                  ? "Không đủ slot liên tiếp"
                                  : "Không phù hợp thời lượng"}
                              </Text>
                            )}
                          </View>
                        </Card.Content>
                      </Card>
                    );
                  })}
                </View>
              )}
              {!selectedSlot ? (
                <HelperText type="info" visible>
                  Vui lòng chọn khung giờ khả dụng
                </HelperText>
              ) : null}
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={submitting}
            disabled={submitting}
          >
            Đặt lịch
          </Button>
        </ScrollView>
      )}

      {/* Modals chọn */}
      <Portal>
        <Modal
          visible={vehicleModal}
          onDismiss={() => setVehicleModal(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "white",
            borderRadius: 12,
          }}
        >
          <FlatList
            data={vehicles}
            keyExtractor={(v) => v.vehicle_id}
            renderItem={({ item }) => (
              <List.Item
                title={item.license_plate}
                description={`${item.brand_name || ""}${
                  item.brand_name ? " • " : ""
                }${item.model_name || ""}`}
                onPress={() => {
                  setVehicleId(item.vehicle_id);
                  setVehicleModal(false);
                }}
              />
            )}
          />
        </Modal>
        <Modal
          visible={branchModal}
          onDismiss={() => setBranchModal(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "white",
            borderRadius: 12,
          }}
        >
          <FlatList
            data={branches}
            keyExtractor={(b) => b.branch_id}
            renderItem={({ item }) => (
              <List.Item
                title={item.branch_name}
                description={item.address}
                onPress={() => {
                  setBranchId(item.branch_id);
                  setBranchModal(false);
                  setBayId(undefined);
                  setSelectedSlot(null);
                }}
              />
            )}
          />
        </Modal>
        <Modal
          visible={bayModal}
          onDismiss={() => setBayModal(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "white",
            borderRadius: 12,
          }}
        >
          <FlatList
            data={bays}
            keyExtractor={(b) => b.bay_id}
            renderItem={({ item }) => (
              <List.Item
                title={item.bay_name}
                onPress={() => {
                  setBayId(item.bay_id);
                  setBayModal(false);
                }}
              />
            )}
          />
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        duration={1500}
        style={{
          backgroundColor: snackbar.error
            ? theme.colors.error
            : theme.colors.primary,
        }}
      >
        {snackbar.message}
      </Snackbar>
    </SafeAreaView>
  );
}
