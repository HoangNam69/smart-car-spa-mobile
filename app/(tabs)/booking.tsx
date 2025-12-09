import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
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
import ProtectedRoute from "../../src/components/ProtectedRoute";
import { useAuth } from "../../src/context/AuthContext";
import { bookingService } from "../../src/services/booking.service";
import {
  bookingScheduleService,
  type AvailableTimeRangesResponse,
  type SlotInfo,
} from "../../src/services/bookingSchedule.service";
import {
  branchService,
  type BranchDisplay,
} from "../../src/services/branch.service";
import {
  pricingService,
  type PriceBookItem,
} from "../../src/services/pricing.service";
import { enrichServicesWithInventory } from "../../src/services/service-inventory.service";
import {
  serviceBayService,
  type ServiceBay,
} from "../../src/services/serviceBay.service";
import {
  vehicleProfileService,
  type VehicleProfileDto,
} from "../../src/services/vehicleProfile.service";
import { Service, SkillLevel } from "../../src/types/service.types";
import { getErrorMessage } from "../../src/utils/error.helper";

export default function BookingScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState<VehicleProfileDto[]>([]);
  const [branches, setBranches] = useState<BranchDisplay[]>([]);
  const [bays, setBays] = useState<ServiceBay[]>([]);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [timeRangesData, setTimeRangesData] =
    useState<AvailableTimeRangesResponse | null>(null);
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

  const [selectedSlot, setSelectedSlot] = useState<{
    time: string;
    endTime: string;
  } | null>(null);
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
  const [currentStep, setCurrentStep] = useState(1);
  const [availableServices, setAvailableServices] = useState<PriceBookItem[]>(
    []
  );
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const isSlotSuitable = useCallback(
    (slot: SlotInfo) => {
      if (!slot.isAvailable) return false;

      // Calculate end time for this slot
      const slotStartMinutes = bookingScheduleService.parseTime(slot.time);
      const slotEndMinutes = slotStartMinutes + totalDuration;

      // Check if slot fits within any available time range
      if (!timeRangesData) return false;

      return timeRangesData.available_time_ranges.some((range) => {
        const rangeStart = bookingScheduleService.parseTime(range.start_time);
        const rangeEnd = bookingScheduleService.parseTime(range.end_time);
        // Slot is suitable if it starts within range and ends before or at range ends
        // Also handle edge case where range ends at 08:59:59 but slot needs to go to 09:00:00
        // Allow a small tolerance (1 minute) for rounding differences
        const TOLERANCE_MINUTES = 1;
        return (
          slotStartMinutes >= rangeStart &&
          slotEndMinutes <= rangeEnd + TOLERANCE_MINUTES
        );
      });
    },
    [timeRangesData, totalDuration]
  );

  const canSelectSlot = useCallback(
    (slot: SlotInfo) => slot.isAvailable && isSlotSuitable(slot),
    [isSlotSuitable]
  );

  const loadInit = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    try {
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        vehicleProfileService.getByOwner(user.user_id, { size: 100 }),
        branchService.getAll(),
        pricingService.getAllItems(),
      ]);

      // Handle vehicles
      if (results[0].status === "fulfilled") {
        setVehicles(results[0].value.content || []);
      } else {
        console.warn("Failed to load vehicles:", results[0].reason);
        setVehicles([]);
        // Only show error if it's not a 401 (handled by interceptor)
        const error = results[0].reason;
        if (
          error?.message &&
          !error?.message.includes("401") &&
          error?.response?.status !== 401
        ) {
          setSnackbar({
            visible: true,
            message: error.message || "Không thể tải danh sách xe",
            error: true,
          });
        }
      }

      // Handle branches
      if (results[1].status === "fulfilled") {
        setBranches(results[1].value);
      } else {
        console.warn("Failed to load branches:", results[1].reason);
        setBranches([]);
      }

      // Handle services
      if (results[2].status === "fulfilled") {
        setServices(results[2].value);
      } else {
        console.warn("Failed to load services:", results[2].reason);
        setServices([]);
      }
    } catch (error: any) {
      // Fallback error handling (shouldn't reach here with allSettled, but just in case)
      console.error("Unexpected error loading initial data:", error);
      setVehicles([]);
      setBranches([]);
      setServices([]);
      if (
        error?.message &&
        !error?.message.includes("401") &&
        error?.response?.status !== 401
      ) {
        setSnackbar({
          visible: true,
          message: error.message || "Không thể tải dữ liệu",
          error: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadInit();
  }, [loadInit]);

  // Reload screen data whenever the tab gains focus
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
      setCurrentStep(1);
      setAvailableServices([]);
      setTimeRangesData(null);
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

  // Check service availability when branch or services change
  useEffect(() => {
    const checkServiceAvailability = async () => {
      if (!branchId || services.length === 0) {
        setAvailableServices([]);
        return;
      }

      setCheckingAvailability(true);
      try {
        // Extract Service objects from PriceBookItems
        const servicesToCheck: Service[] = services
          .filter((item) => item.service?.service_id)
          .map((item) => ({
            service_id: item.service!.service_id!,
            service_name: item.item_name,
            service_url: "",
            required_skill_level: SkillLevel.BEGINNER,
            service_type_id: "",
            is_active: true,
            is_featured: false,
            audit: {
              created_by: "",
              created_date: new Date().toISOString(),
              modified_by: "",
              modified_date: new Date().toISOString(),
              is_active: true,
              is_deleted: false,
            },
          }));

        if (servicesToCheck.length === 0) {
          // No services with service_id, show all
          setAvailableServices(services);
          return;
        }

        // Use enrichServicesWithInventory to check inventory
        const servicesWithInventory = await enrichServicesWithInventory(
          servicesToCheck,
          branchId
        );

        // Create a Set of service IDs that passed inventory check
        const availableServiceIds = new Set(
          servicesWithInventory.map((s) => s.service_id)
        );

        // Filter PriceBookItems to only include services that passed inventory check
        const filteredServices = services.filter((item) => {
          const serviceId = item.service?.service_id;
          // If service doesn't have service_id, show it (assume it doesn't need inventory)
          if (!serviceId) {
            return true;
          }
          // Only show if service passed inventory check
          return availableServiceIds.has(serviceId);
        });

        setAvailableServices(filteredServices);

        // Clear selected items that are no longer available
        setSelectedItems((prev) => {
          const filtered = prev.filter((item) => {
            const serviceId = item.service?.service_id;
            if (!serviceId) return true;
            return availableServiceIds.has(serviceId);
          });

          // Recalculate totals if items were removed
          if (filtered.length !== prev.length) {
            const newTotalPrice = filtered.reduce(
              (sum, item) => sum + (item.fixed_price || 0),
              0
            );
            const newTotalDuration = filtered.reduce(
              (sum, item) => sum + (item.service?.estimated_duration || 0),
              0
            );
            setTotalPrice(newTotalPrice);
            setTotalDuration(newTotalDuration);
          }

          return filtered;
        });
      } catch (error) {
        console.error("Error checking service availability:", error);
        // On error, show all services to prevent blocking
        setAvailableServices(services);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkServiceAvailability();
  }, [branchId, services]);

  const loadSlots = useCallback(async () => {
    if (!branchId || !bayId || !bookingDate) {
      setSlots([]);
      setTimeRangesData(null);
      return;
    }
    setLoadingSlots(true);
    try {
      // Get available time ranges from backend
      const timeRangesResp =
        await bookingScheduleService.getAvailableTimeRanges({
          bay_id: bayId,
          date: formatLocalDate(bookingDate),
          duration_minutes: Math.max(totalDuration, 30),
        });

      setTimeRangesData(timeRangesResp);

      // Convert time ranges to slots for UI display
      const convertedSlots = bookingScheduleService.convertTimeRangesToSlots(
        timeRangesResp.available_time_ranges,
        timeRangesResp.working_hours,
        Math.max(totalDuration, 30),
        30 // 30-minute intervals
      );

      setSlots(convertedSlots);
    } catch (error: any) {
      console.error("Error loading slots:", error);
      console.error("Error response:", error?.response?.data);
      setSlots([]);
      setTimeRangesData(null);

      // Extract error message from backend response
      // Backend returns error in format: { message: "...", error: "...", status: 400 }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Không thể tải khung giờ";

      // Check if it's a branch closed error
      // Backend message: "Branch is closed on SUNDAY" or similar
      const errorMessageUpper = errorMessage.toUpperCase();
      if (
        errorMessageUpper.includes("CLOSED") ||
        errorMessageUpper.includes("ĐÓNG CỬA") ||
        errorMessageUpper.includes("BRANCH_CLOSED") ||
        errorMessageUpper.includes("IS CLOSED")
      ) {
        const dayNames = [
          "Chủ nhật",
          "Thứ hai",
          "Thứ ba",
          "Thứ tư",
          "Thứ năm",
          "Thứ sáu",
          "Thứ bảy",
        ];
        const selectedDay = dayNames[bookingDate.getDay()];
        setSnackbar({
          visible: true,
          message: `Chi nhánh đóng cửa vào ${selectedDay}. Vui lòng chọn ngày khác.`,
          error: true,
        });
      } else {
        // Other errors - show backend message or generic message
        setSnackbar({
          visible: true,
          message: errorMessage,
          error: true,
        });
      }
    } finally {
      setLoadingSlots(false);
    }
  }, [branchId, bayId, bookingDate, totalDuration]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  function validateStep(step: number) {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!vehicleId) errs.vehicle = "Vui lòng chọn xe";
      if (!branchId) errs.branch = "Vui lòng chọn chi nhánh";
    } else if (step === 2) {
      if (selectedItems.length === 0)
        errs.services = "Vui lòng chọn ít nhất 1 dịch vụ";
    } else if (step === 3) {
      if (!bayId) errs.bay = "Vui lòng chọn khu vực";
      if (!selectedSlot) errs.slot = "Vui lòng chọn khung giờ";
    }
    return errs;
  }

  const isStepValid = (step: number): boolean => {
    const errs = validateStep(step);
    return Object.keys(errs).length === 0;
  };

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

  const handleNextStep = () => {
    const errs = validateStep(currentStep);
    if (Object.keys(errs).length > 0) {
      setSnackbar({
        visible: true,
        message: Object.values(errs)[0],
        error: true,
      });
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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

      // Format start time as HH:mm (backend expects LocalTime format)
      const startHHmm = selectedSlot!.time; // Already in HH:mm format

      // Create payload according to CreateBookingWithScheduleRequest
      // Backend will automatically:
      // - Set bookingType = SCHEDULED
      // - Calculate scheduled_start_at and scheduled_end_at from selected_schedule
      const payload = {
        customer_id: user.user_id,
        customer_name: user.full_name || "",
        customer_phone: user.phone_number || "",
        customer_email: user.email,
        vehicle_id: vehicle.vehicle_id,
        vehicle_license_plate: vehicle.license_plate,
        vehicle_brand_name: vehicle.brand_name || "",
        vehicle_model_name: vehicle.model_name || "",
        vehicle_type_name: vehicle.type_name || "",
        vehicle_year: (vehicle as any)?.model_year || new Date().getFullYear(),
        vehicle_color: (vehicle as any)?.color || "",
        branch_id: branchId!,
        selected_schedule: {
          bay_id: bayId!,
          date: formatLocalDate(bookingDate), // YYYY-MM-DD format
          start_time: startHHmm, // HH:mm format
          service_duration_minutes: Math.max(totalDuration, 30),
        },
        booking_items: selectedItems.map((it) => ({
          service_id: it.service?.service_id || it.item_id, // Required
          service_name: it.item_name, // Required - use item_name from PriceBookItem
          service_description: it.service?.description || "", // Optional
        })),
        total_price: totalPrice,
        currency: "VND",
        estimated_duration_minutes: Math.max(totalDuration, 30),
        notes: "",
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
      console.error("Create booking failed:", e?.response?.data || e);

      // Extract error message from backend using helper
      const errorMessage = getErrorMessage(e);
      const errorDuration = 3; // Duration in seconds

      setSnackbar({
        visible: true,
        message: errorMessage,
        error: true,
      });

      // Reload available slots after error message disappears
      setTimeout(() => {
        if (branchId && bayId && bookingDate && totalDuration > 0) {
          console.log("Reloading available slots after error...");
          loadSlots();
        }
      }, errorDuration * 1000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute requiredRole="CUSTOMER">
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F9F8F6" }}
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
        <ScrollView contentContainerStyle={{ padding: 8, paddingBottom: 24 }}>
          {/* Step Indicator */}
          <Card
            mode="elevated"
            style={{
              borderRadius: 4,
              marginBottom: 8,
              padding: 8,
              backgroundColor: "#ffffff",
            }}
          >
            {/* Step Indicator Content */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                paddingVertical: 8,
              }}
            >
              {[1, 2, 3].map((step) => {
                const stepLabels = [
                  "Xe & Thời gian",
                  "Dịch vụ",
                  "Khu vực & Giờ",
                ];
                const isActive = currentStep === step;
                const isCompleted = currentStep > step;
                return (
                  <View
                    key={step}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      zIndex: 1,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor:
                          isCompleted || isActive
                            ? theme.colors.primary
                            : "#E5E7EB",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: isCompleted || isActive ? "white" : "#9CA3AF",
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        {step}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isActive ? theme.colors.primary : "#9CA3AF",
                        fontWeight: isActive ? "bold" : "normal",
                        textAlign: "center",
                      }}
                    >
                      {stepLabels[step - 1]}
                    </Text>
                  </View>
                );
              })}
              {/* Connection lines - positioned between circles */}
              <View
                style={{
                  position: "absolute",
                  top: 26,
                  left: "16.66%",
                  right: "16.66%",
                  height: 2,
                  flexDirection: "row",
                  zIndex: 0,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor:
                      currentStep > 1 ? theme.colors.primary : "#E5E7EB",
                  }}
                />
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor:
                      currentStep > 2 ? theme.colors.primary : "#E5E7EB",
                  }}
                />
              </View>
            </View>
          </Card>

          {/* Step 1: Chọn xe và Thời gian & Chi nhánh */}
          {currentStep === 1 && (
            <>
              {/* Xe */}
              <Card
                mode="elevated"
                style={{
                  borderRadius: 4,
                  marginBottom: 8,
                  backgroundColor: "#ffffff",
                }}
              >
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

              {/* Thời gian & Chi nhánh */}
              <Card
                mode="elevated"
                style={{
                  borderRadius: 4,
                  marginBottom: 8,
                  backgroundColor: "#ffffff",
                }}
              >
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
                  <List.Item
                    title="Chi nhánh"
                    description={
                      branches.find((b) => b.branch_id === branchId)
                        ?.branch_name || "Chạm để chọn"
                    }
                    left={(p) => <List.Icon {...p} icon="home-map-marker" />}
                    right={(p) => <List.Icon {...p} icon="chevron-right" />}
                    onPress={() => setBranchModal(true)}
                  />
                </Card.Content>
              </Card>

              <Button
                mode="contained"
                onPress={handleNextStep}
                style={{ marginTop: 8 }}
                disabled={!isStepValid(1)}
              >
                Tiếp theo
              </Button>
              {!isStepValid(1) && (
                <HelperText type="info" visible style={{ marginTop: 8 }}>
                  {!vehicleId && "Vui lòng chọn xe. "}
                  {!branchId && "Vui lòng chọn chi nhánh."}
                </HelperText>
              )}
            </>
          )}

          {/* Step 2: Chọn dịch vụ */}
          {currentStep === 2 && (
            <>
              <Card
                mode="elevated"
                style={{
                  borderRadius: 4,
                  overflow: "hidden",
                  marginBottom: 16,
                  backgroundColor: "#ffffff",
                }}
              >
                <List.Accordion
                  title="Chọn dịch vụ"
                  left={(p) => <List.Icon {...p} icon="clipboard-list" />}
                  titleStyle={{ fontWeight: "bold" }}
                  descriptionStyle={{ fontWeight: "bold" }}
                  style={{ borderRadius: 4, backgroundColor: "#ffffff" }}
                >
                  <Card.Content>
                    {checkingAvailability && (
                      <View
                        style={{ paddingVertical: 12, alignItems: "center" }}
                      >
                        <ActivityIndicator size="small" />
                        <Text style={{ marginTop: 8, color: "#6b7280" }}>
                          Đang kiểm tra tồn kho...
                        </Text>
                      </View>
                    )}
                    {!checkingAvailability &&
                      availableServices.length === 0 &&
                      services.length > 0 && (
                        <View
                          style={{ paddingVertical: 12, alignItems: "center" }}
                        >
                          <Text
                            style={{ color: "#dc2626", textAlign: "center" }}
                          >
                            Không có dịch vụ nào khả dụng trong chi nhánh này
                          </Text>
                        </View>
                      )}
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {availableServices.map((item) => {
                        const selected = selectedItems.some(
                          (x) => x.item_id === item.item_id
                        );
                        return (
                          <Card
                            mode="elevated"
                            key={item.item_id}
                            onPress={() => {
                              setSelectedItems((prev) =>
                                selected
                                  ? prev.filter(
                                      (x) => x.item_id !== item.item_id
                                    )
                                  : [...prev, item]
                              );
                              setTotalPrice((prev) =>
                                selected
                                  ? prev - (item.fixed_price || 0)
                                  : prev + (item.fixed_price || 0)
                              );
                              setTotalDuration((prev) =>
                                selected
                                  ? prev -
                                    (item.service?.estimated_duration || 0)
                                  : prev +
                                    (item.service?.estimated_duration || 0)
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
                                  style={{
                                    fontWeight: "600",
                                    textAlign: "center",
                                  }}
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

              <View style={{ flexDirection: "row", gap: 12 }}>
                <Button
                  mode="outlined"
                  onPress={handlePrevStep}
                  style={{ flex: 1 }}
                >
                  Quay lại
                </Button>
                <Button
                  mode="contained"
                  onPress={handleNextStep}
                  style={{ flex: 1 }}
                  disabled={!isStepValid(2)}
                >
                  Tiếp theo
                </Button>
              </View>
              {!isStepValid(2) && (
                <HelperText type="info" visible style={{ marginTop: 8 }}>
                  {selectedItems.length === 0 &&
                    "Vui lòng chọn ít nhất 1 dịch vụ."}
                </HelperText>
              )}
            </>
          )}

          {/* Step 3: Khu vực & khung giờ */}
          {currentStep === 3 && (
            <>
              <Card
                mode="elevated"
                style={{
                  borderRadius: 4,
                  marginBottom: 8,
                  backgroundColor: "#ffffff",
                }}
              >
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
                      <Text
                        style={{
                          marginTop: 8,
                          textAlign: "center",
                          color: "#6b7280",
                        }}
                      >
                        Đang tải khung giờ...
                      </Text>
                    </View>
                  ) : slots.length === 0 ? (
                    <HelperText type="info" visible>
                      {timeRangesData
                        ? "Không có khung giờ khả dụng cho ngày này"
                        : "Vui lòng chọn ngày và khu vực để xem khung giờ"}
                    </HelperText>
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                      }}
                    >
                      {slots.map((slot, index) => {
                        // Calculate end time for submission (not displayed)
                        const slotStartMinutes =
                          bookingScheduleService.parseTime(slot.time);
                        const slotEndMinutes =
                          slotStartMinutes + Math.max(totalDuration, 30);
                        const endTimeStr =
                          bookingScheduleService.formatTime(slotEndMinutes);

                        const isSelected = selectedSlot?.time === slot.time;
                        const selectable = canSelectSlot(slot);
                        const isDisabled = !selectable;

                        // Determine if slot is available but not suitable for duration
                        const isAvailableButNotSuitable =
                          slot.isAvailable && !selectable;

                        return (
                          <Card
                            key={`slot-${index}-${slot.time}`}
                            onPress={() => {
                              if (!isDisabled) {
                                setSelectedSlot({
                                  time: slot.time,
                                  endTime: endTimeStr,
                                });
                              }
                            }}
                            style={{
                              width: "auto",
                              marginBottom: 10,
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
                              <View
                                style={{ alignItems: "center", marginTop: 6 }}
                              >
                                <Text
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: isSelected
                                      ? theme.colors.primary
                                      : isDisabled
                                      ? "#9CA3AF"
                                      : "#1F2937",
                                    textAlign: "center",
                                  }}
                                >
                                  {slot.time}
                                </Text>
                                {isAvailableButNotSuitable && (
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      color: "#dc2626",
                                      marginTop: 4,
                                      textAlign: "center",
                                    }}
                                  >
                                    Không phù hợp thời lượng
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

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
                <Button
                  mode="outlined"
                  onPress={handlePrevStep}
                  style={{ flex: 1 }}
                >
                  Quay lại
                </Button>
              </View>

              <Button
                mode="contained"
                onPress={onSubmit}
                loading={submitting}
                disabled={submitting || !isStepValid(3)}
              >
                Đặt lịch
              </Button>
            </>
          )}
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
            borderRadius: 4,
          }}
        >
          <Card.Title title="Chọn xe" />
          <View style={{ padding: 8 }}>
            <ScrollView style={{ maxHeight: 360 }}>
              {vehicles.map((v) => (
                <Card
                  key={v.vehicle_id}
                  onPress={() => {
                    setVehicleId(v.vehicle_id);
                    setVehicleModal(false);
                  }}
                  style={{
                    margin: 8,
                    borderRadius: 4,
                    backgroundColor: "#ffffff",
                  }}
                >
                  <Card.Title title={v.license_plate} />
                </Card>
              ))}
            </ScrollView>
          </View>
        </Modal>
        <Modal
          visible={branchModal}
          onDismiss={() => setBranchModal(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "white",
            borderRadius: 4,
          }}
        >
          <Card.Title title="Chọn chi nhánh" />
          <View style={{ padding: 8 }}>
            <ScrollView style={{ maxHeight: 360 }}>
              {branches.map((b) => (
                <Card
                  key={b.branch_id}
                  onPress={() => {
                    setBranchId(b.branch_id);
                    setBranchModal(false);
                  }}
                  style={{
                    margin: 8,
                    borderRadius: 4,
                    backgroundColor: "#ffffff",
                  }}
                >
                  <Card.Title title={b.branch_name} />
                </Card>
              ))}
            </ScrollView>
          </View>
        </Modal>
        <Modal
          visible={bayModal}
          onDismiss={() => setBayModal(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "white",
            borderRadius: 4,
          }}
        >
          <Card.Title title="Chọn khu vực" />
          <View style={{ padding: 8 }}>
            <ScrollView style={{ maxHeight: 360 }}>
              {bays.map((b) => (
                <Card
                  key={b.bay_id}
                  onPress={() => {
                    setBayId(b.bay_id);
                    setBayModal(false);
                  }}
                  style={{
                    margin: 8,
                    borderRadius: 4,
                    backgroundColor: "#ffffff",
                  }}
                >
                  <Card.Title title={b.bay_name} />
                </Card>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </Portal>

      {/* DateTimePicker - render outside Card.Content for proper display on Android */}
      {showDate && (
        <DateTimePicker
          value={bookingDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={computeMinDate()}
          maximumDate={computeMaxDate()}
          onChange={(event, selectedDate) => {
            // On Android, close picker immediately (it shows as a dialog)
            if (Platform.OS === "android") {
              setShowDate(false);
              // Only update date if user selected a date (not cancelled)
              if (event.type === "set" && selectedDate) {
                setBookingDate(selectedDate);
              }
            } else {
              // On iOS, update date immediately as user scrolls
              if (selectedDate) {
                setBookingDate(selectedDate);
              }
              // Close picker when user dismisses (event.type === "dismissed" means cancelled)
              if (event.type === "dismissed") {
                setShowDate(false);
              }
            }
          }}
        />
      )}

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        duration={snackbar.error ? 3000 : 1500}
        style={{
          backgroundColor: snackbar.error
            ? theme.colors.error
            : theme.colors.primary,
        }}
      >
        {snackbar.message}
      </Snackbar>
    </SafeAreaView>
    </ProtectedRoute>
  );
}
