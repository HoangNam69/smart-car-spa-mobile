import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  List,
  Modal,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../../src/context/AuthContext";
import { bookingService } from "../../../../src/services/booking.service";
import {
  AvailableTimeRangesResponse,
  bookingScheduleService,
  SlotInfo,
} from "../../../../src/services/bookingSchedule.service";
import {
  BranchDisplay,
  branchService,
} from "../../../../src/services/branch.service";
import {
  PriceBookItem,
  pricingService,
} from "../../../../src/services/pricing.service";
import { enrichServicesWithInventory } from "../../../../src/services/service-inventory.service";
import {
  ServiceBay,
  serviceBayService,
} from "../../../../src/services/serviceBay.service";
import {
  VehicleProfileDto,
  vehicleProfileService,
} from "../../../../src/services/vehicleProfile.service";
import {
  BookingInfoDto,
  BookingType,
  CreateBookingItemRequest,
  UpdateBookingRequest,
} from "../../../../src/types/booking.types";
import { Service, SkillLevel } from "../../../../src/types/service.types";

interface SelectedSlot {
  time: string; // HH:mm format
  endTime: string; // HH:mm format (calculated)
  serviceDurationMinutes: number;
  bayId?: string; // Optional: bay ID
  date?: string; // Optional: date in YYYY-MM-DD format
}

// Helper function to detect booking type with fallback to booking_code
// Similar to web app's detectBookingType function
const detectBookingType = (
  booking: BookingInfoDto
): {
  isWalkIn: boolean;
  isSlot: boolean;
  bookingType: BookingType | null;
} => {
  // First, try to use booking_type from backend
  if (booking.booking_type === BookingType.WALK_IN) {
    return { isWalkIn: true, isSlot: false, bookingType: BookingType.WALK_IN };
  }
  if (booking.booking_type === BookingType.SCHEDULED) {
    return {
      isWalkIn: false,
      isSlot: true,
      bookingType: BookingType.SCHEDULED,
    };
  }

  // Fallback: detect from booking_code if booking_type is undefined
  if (booking.booking_code) {
    if (booking.booking_code.startsWith("WALK-IN-")) {
      return {
        isWalkIn: true,
        isSlot: false,
        bookingType: BookingType.WALK_IN,
      };
    }
    if (booking.booking_code.startsWith("BK-")) {
      return {
        isWalkIn: false,
        isSlot: true,
        bookingType: BookingType.SCHEDULED,
      };
    }
  }

  // Default: unknown type
  return { isWalkIn: false, isSlot: false, bookingType: null };
};

export default function UpdateBookingScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const bookingId = params?.id ? String(params.id) : "";
  const { user } = useAuth();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Booking data
  const [booking, setBooking] = useState<BookingInfoDto | null>(null);

  // Selection states
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleProfileDto | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<BranchDisplay | null>(
    null
  );
  const [selectedItems, setSelectedItems] = useState<PriceBookItem[]>([]);
  const [originalItems, setOriginalItems] = useState<PriceBookItem[]>([]); // Store original services from initialData
  const [originalTotalDuration, setOriginalTotalDuration] = useState<number>(0);
  const [selectedBay, setSelectedBay] = useState<ServiceBay | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [isSlotChanged, setIsSlotChanged] = useState(false);
  const [originalSlot, setOriginalSlot] = useState<SelectedSlot | null>(null);

  // Data states
  const [bookingDate, setBookingDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [timeRangesData, setTimeRangesData] =
    useState<AvailableTimeRangesResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [notes, setNotes] = useState("");
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    error?: boolean;
  }>({ visible: false, message: "", error: false });

  // Dropdown data
  const [userVehicles, setUserVehicles] = useState<VehicleProfileDto[]>([]);
  const [branches, setBranches] = useState<BranchDisplay[]>([]);
  const [allPriceBookServices, setAllPriceBookServices] = useState<
    PriceBookItem[]
  >([]); // Store all services from pricing
  const [availableServices, setAvailableServices] = useState<PriceBookItem[]>(
    []
  ); // Filtered services based on inventory
  const [serviceBays, setServiceBays] = useState<ServiceBay[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Modal states
  const [vehicleModal, setVehicleModal] = useState(false);
  const [branchModal, setBranchModal] = useState(false);
  const [serviceModal, setServiceModal] = useState(false);

  // Refs
  const isInitialized = useRef(false);

  // Calculate totals
  const { totalPrice, totalDuration } = useMemo(() => {
    const price = selectedItems.reduce(
      (sum, item) => sum + (item.fixed_price || 0),
      0
    );
    const duration = selectedItems.reduce((sum, item) => {
      if (item.service) {
        return sum + (item.service.estimated_duration || 60);
      }
      return sum;
    }, 0);
    return { totalPrice: price, totalDuration: duration };
  }, [selectedItems]);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!bookingId || !user?.user_id) return;
    setLoading(true);
    try {
      // Load booking
      const bookingDataRaw = await bookingService.getBookingById(bookingId);
      if (!bookingDataRaw) {
        setSnackbar({
          visible: true,
          message: "Không tìm thấy booking",
          error: true,
        });
        setLoading(false);
        return;
      }
      // Cast to full BookingInfoDto type
      const bookingData = bookingDataRaw as any as BookingInfoDto;
      setBooking(bookingData);
      setNotes(bookingData.notes || "");

      // Load dropdown data
      const [vehicles, branchesData, servicesData] = await Promise.all([
        vehicleProfileService
          .getByOwner(user.user_id, { size: 1000 })
          .then((r) => r.content || []),
        branchService.getAll(),
        pricingService.getAllItems(),
      ]);

      setUserVehicles(vehicles);
      setBranches(branchesData);
      setAllPriceBookServices(servicesData); // Store all services
      setAvailableServices(servicesData); // Initially set to all services, will be filtered by inventory

      // Set selected vehicle - try multiple ways to find vehicle
      if (bookingData.vehicle_id) {
        const vehicle = vehicles.find(
          (v) => v.vehicle_id === bookingData.vehicle_id
        );
        if (vehicle) {
          setSelectedVehicle(vehicle);
        }
      } else if (bookingData.vehicle_license_plate) {
        // Fallback: try to find by license plate
        const vehicle = vehicles.find(
          (v) => v.license_plate === bookingData.vehicle_license_plate
        );
        if (vehicle) {
          setSelectedVehicle(vehicle);
        }
      }

      // Set selected branch
      let selectedBranchData: BranchDisplay | null = null;
      if (bookingData.branch_id) {
        const branch = branchesData.find(
          (b) => b.branch_id === bookingData.branch_id
        );
        if (branch) {
          selectedBranchData = branch;
          setSelectedBranch(branch);
        }
      }

      // Set booking date - handle multiple date fields
      // Normalize date to local timezone at midnight to avoid display issues
      const parsedDate = bookingData.scheduled_start_at
        ? parseAndNormalizeDate(bookingData.scheduled_start_at)
        : bookingData.preferred_start_at
        ? parseAndNormalizeDate(bookingData.preferred_start_at)
        : null;

      if (parsedDate) {
        setBookingDate(parsedDate);
      }

      // Initialize services from booking items
      if (bookingData.booking_items && bookingData.booking_items.length > 0) {
        const services: PriceBookItem[] = [];
        const seenServiceIds = new Set<string>();

        bookingData.booking_items.forEach((item) => {
          // Primary: Try to match by service_id
          if (item.service_id && !seenServiceIds.has(item.service_id)) {
            const priceBookItem = servicesData.find(
              (s) => s.service?.service_id === item.service_id
            );
            if (priceBookItem && !seenServiceIds.has(priceBookItem.item_id)) {
              services.push(priceBookItem);
              seenServiceIds.add(item.service_id);
              seenServiceIds.add(priceBookItem.item_id);
            } else {
              console.warn(
                " Service not found by service_id:",
                item.service_id
              );
            }
          } else if (!item.service_id && item.service_name) {
            // Fallback: Try to match by service_name if service_id is null
            console.log(
              " service_id is null, trying to match by service_name:",
              item.service_name
            );
            const priceBookItem = servicesData.find(
              (s) =>
                s.item_name === item.service_name &&
                s.service &&
                !seenServiceIds.has(s.item_id)
            );
            if (priceBookItem) {
              services.push(priceBookItem);
              if (priceBookItem.service?.service_id) {
                seenServiceIds.add(priceBookItem.service.service_id);
              }
              seenServiceIds.add(priceBookItem.item_id);
            } else {
              console.warn(
                " Service not found by service_name:",
                item.service_name
              );
            }
          }
        });

        const uniqueServices = services.filter(
          (s, i, self) => i === self.findIndex((sv) => sv.item_id === s.item_id)
        );

        if (uniqueServices.length > 0) {
          setSelectedItems(uniqueServices);
          setOriginalItems([...uniqueServices]); // Store original services
          const originalDuration = uniqueServices.reduce((sum, item) => {
            if (item.service) {
              return sum + (item.service.estimated_duration || 60);
            }
            return sum;
          }, 0);
          setOriginalTotalDuration(originalDuration);
        } else {
          // No services found, but we still need to set originalTotalDuration
          setOriginalItems([]);
          if (bookingData.estimated_duration_minutes) {
            setOriginalTotalDuration(bookingData.estimated_duration_minutes);
          }
        }
      } else if (bookingData.estimated_duration_minutes) {
        setOriginalItems([]);
        setOriginalTotalDuration(bookingData.estimated_duration_minutes);
      } else {
        setOriginalItems([]);
        setOriginalTotalDuration(0);
      }

      // Load service bays for selected branch and set bay/slot
      if (selectedBranchData) {
        try {
          const bays = await serviceBayService.getActive(
            selectedBranchData.branch_id
          );
          const filteredBays = bays.filter(
            (bay) => bay.allow_booking !== false
          );
          setServiceBays(filteredBays);

          // Set bay for both slot and walk-in bookings
          if (bookingData.bay_id) {
            const bay =
              filteredBays.find((b) => b.bay_id === bookingData.bay_id) ||
              bays.find((b) => b.bay_id === bookingData.bay_id);
            if (bay) {
              setSelectedBay(bay);
              console.log(" Set selected bay:", bay.bay_name);
            }
          }

          // Set slot for slot bookings (SCHEDULED bookings with scheduled_start_at)
          // Use detectBookingType helper function for consistency
          const { isSlot: isSlotBooking } = detectBookingType(bookingData);
          if (
            isSlotBooking &&
            bookingData.bay_id &&
            bookingData.scheduled_start_at
          ) {
            const bay =
              filteredBays.find((b) => b.bay_id === bookingData.bay_id) ||
              bays.find((b) => b.bay_id === bookingData.bay_id);
            if (bay) {
              const slotDate = parseAndNormalizeDate(
                bookingData.scheduled_start_at
              );
              if (slotDate) {
                // Extract time from scheduled_start_at (format: YYYY-MM-DDTHH:mm:ss or ISO string)
                const scheduledStart = new Date(bookingData.scheduled_start_at);
                const hours = scheduledStart.getHours();
                const minutes = scheduledStart.getMinutes();
                const startTime = `${String(hours).padStart(2, "0")}:${String(
                  minutes
                ).padStart(2, "0")}`;

                const serviceDuration =
                  bookingData.estimated_duration_minutes || 60;
                // Calculate end time
                const startMinutes = hours * 60 + minutes;
                const endMinutes = startMinutes + serviceDuration;
                const endHours = Math.floor(endMinutes / 60);
                const endMins = endMinutes % 60;
                const endTime = `${String(endHours).padStart(2, "0")}:${String(
                  endMins
                ).padStart(2, "0")}`;

                const slot: SelectedSlot = {
                  time: startTime,
                  endTime: endTime,
                  serviceDurationMinutes: serviceDuration,
                  bayId: bay.bay_id,
                  date: formatDateString(slotDate),
                };
                setSelectedSlot(slot);
                setOriginalSlot(slot);
                console.log(" Set selected slot:", slot);
              }
            }
          }
        } catch (error) {
          console.log("Error loading service bays:", error);
        }
      }

      isInitialized.current = true;
    } catch (e: any) {
      console.error("Error loading booking data:", e);
      setSnackbar({
        visible: true,
        message: e?.message || "Không thể tải dữ liệu",
        error: true,
      });
    } finally {
      setLoading(false);
    }
  }, [bookingId, user?.user_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset state when component unmounts or booking changes
  useEffect(() => {
    return () => {
      // Reset state when component unmounts
      setSelectedItems([]);
      setOriginalItems([]);
      setOriginalTotalDuration(0);
      setSelectedSlot(null);
      setOriginalSlot(null);
      setIsSlotChanged(false);
      isInitialized.current = false;
    };
  }, [bookingId]);

  // Helper function to format date to YYYY-MM-DD without timezone conversion
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to parse date from ISO string and normalize to local timezone at midnight
  const parseAndNormalizeDate = (
    dateString: string | undefined | null
  ): Date | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      // Normalize to local timezone at midnight to avoid timezone shift issues
      const normalizedDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      return normalizedDate;
    } catch {
      return null;
    }
  };

  // Check service availability when branch or services change
  useEffect(() => {
    const checkServiceAvailability = async () => {
      if (!selectedBranch || allPriceBookServices.length === 0) {
        setAvailableServices(allPriceBookServices);
        return;
      }

      setCheckingAvailability(true);
      try {
        // Extract Service objects from PriceBookItems
        const servicesToCheck: Service[] = allPriceBookServices
          .filter((item) => item.service?.service_id)
          .map((item) => ({
            service_id: item.service!.service_id!,
            service_name: item.item_name,
            service_url: "", // PriceBookItemService doesn't have service_url
            required_skill_level: SkillLevel.BEGINNER, // Default skill level
            service_type_id: "", // PriceBookItemService doesn't have service_type_id, use empty string
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
          setAvailableServices(allPriceBookServices);
          return;
        }

        // Use enrichServicesWithInventory to check inventory
        const servicesWithInventory = await enrichServicesWithInventory(
          servicesToCheck,
          selectedBranch.branch_id
        );

        // Create a Set of service IDs that passed inventory check
        const availableServiceIds = new Set(
          servicesWithInventory.map((s) => s.service_id)
        );

        // Filter PriceBookItems to only include services that passed inventory check
        const filteredServices = allPriceBookServices.filter((item) => {
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
            // Note: totalPrice and totalDuration are calculated via useMemo, so they will update automatically
            // But we can show a snackbar to inform user
            setSnackbar({
              visible: true,
              message: "Một số dịch vụ đã được loại bỏ do không đủ tồn kho",
              error: false,
            });
          }

          return filtered;
        });
      } catch (error) {
        console.error("Error checking service availability:", error);
        // On error, show all services to prevent blocking
        setAvailableServices(allPriceBookServices);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkServiceAvailability();
  }, [selectedBranch, allPriceBookServices]);

  // Load service bays when branch changes manually by user (after initialization)
  useEffect(() => {
    if (selectedBranch && isInitialized.current && !selectedBay) {
      serviceBayService.getActive(selectedBranch.branch_id).then((bays) => {
        const filteredBays = bays.filter((bay) => bay.allow_booking !== false);
        setServiceBays(filteredBays);

        // If bay was not set during initialization, try to set it now
        if (booking?.bay_id) {
          const bay =
            filteredBays.find((b) => b.bay_id === booking.bay_id) ||
            bays.find((b) => b.bay_id === booking.bay_id);
          if (bay) {
            setSelectedBay(bay);
            // Original slot will be restored in the useEffect that watches availableSlots
          }
        }
      });
    }
  }, [selectedBranch, booking, selectedBay, originalSlot]);

  // Load available slots when dependencies change
  const loadAvailableSlots = useCallback(
    async (duration: number) => {
      if (!selectedBranch || !selectedBay || !bookingDate || duration <= 0) {
        setAvailableSlots([]);
        setTimeRangesData(null);
        return;
      }

      setLoadingSlots(true);
      try {
        const dateStr = formatDateString(bookingDate);

        // Get available time ranges from backend
        const timeRangesResp =
          await bookingScheduleService.getAvailableTimeRanges({
            bay_id: selectedBay.bay_id,
            date: dateStr,
            duration_minutes: Math.max(duration, 30),
          });

        setTimeRangesData(timeRangesResp);

        // Convert time ranges to slots for UI display
        const convertedSlots = bookingScheduleService.convertTimeRangesToSlots(
          timeRangesResp.available_time_ranges,
          timeRangesResp.working_hours,
          Math.max(duration, 30),
          30 // 30-minute intervals
        );

        setAvailableSlots(convertedSlots);
      } catch (error: any) {
        console.error("Error loading slots:", error);
        console.error("Error response:", error?.response?.data);
        setAvailableSlots([]);
        setTimeRangesData(null);

        // Extract error message from backend response
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Không thể tải khung giờ";

        // Check if it's a branch closed error
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
          // Other errors
          setSnackbar({
            visible: true,
            message: errorMessage,
            error: true,
          });
        }
      } finally {
        setLoadingSlots(false);
      }
    },
    [selectedBranch, selectedBay, bookingDate]
  );

  useEffect(() => {
    if (totalDuration > 0 && selectedBranch && selectedBay && bookingDate) {
      const timeoutId = setTimeout(() => {
        loadAvailableSlots(totalDuration);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      // Clear slots if dependencies are not met
      setAvailableSlots([]);
    }
  }, [
    loadAvailableSlots,
    totalDuration,
    selectedBranch,
    selectedBay,
    bookingDate,
  ]);

  // Validate selected slot after available slots are loaded
  // Also restore original slot if we're back on the original bay and date
  useEffect(() => {
    if (selectedBay && availableSlots.length > 0 && originalSlot) {
      // Check if we should restore the original slot
      // We restore if:
      // 1. We're on the original bay (check by comparing with booking.bay_id)
      // 2. We're on the original date (check by comparing slot time with scheduled_start_at)
      // 3. No slot is currently selected
      const isOriginalBay = booking?.bay_id === selectedBay.bay_id;
      // Extract time from scheduled_start_at (format: "2024-01-01T08:00:00" -> "08:00")
      const bookingStartTime = booking?.scheduled_start_at
        ? new Date(booking.scheduled_start_at).toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          })
        : null;
      const isOriginalDate = bookingStartTime === originalSlot.time;

      if (isOriginalBay && isOriginalDate && !selectedSlot) {
        // Restore original slot if on original bay and date
        setSelectedSlot(originalSlot);
        setIsSlotChanged(false);
      } else if (selectedSlot) {
        // Verify the selected slot is still available in the new slot list
        const slotStillValid = availableSlots.some(
          (slot) => slot.time === selectedSlot.time && slot.isAvailable
        );

        // Check if this is the original slot
        const isOriginalSlot = originalSlot.time === selectedSlot.time;

        // If slot is no longer valid and it's not the original slot, reset it
        if (!slotStillValid && !isOriginalSlot) {
          setSelectedSlot(null);
          setIsSlotChanged(false);
        } else if (slotStillValid && isOriginalSlot) {
          // If original slot is still valid, ensure isSlotChanged is false
          setIsSlotChanged(false);
        }
      }
    }
  }, [
    availableSlots,
    selectedSlot,
    selectedBay,
    originalSlot,
    bookingDate,
    booking,
  ]);

  // Calculate original slot time from scheduled_start_at and scheduled_end_at (actual time range)
  const calculateOriginalSlotTime = useCallback(() => {
    if (!booking) return null;

    const { isSlot: isSlotBooking } = detectBookingType(booking);

    if (!isSlotBooking) {
      return null;
    }

    // Use actual time range from scheduled_start_at and scheduled_end_at
    if (booking.scheduled_start_at && booking.scheduled_end_at) {
      const startTime = new Date(booking.scheduled_start_at);
      const endTime = new Date(booking.scheduled_end_at);
      const diffMinutes = Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      );

      if (diffMinutes > 0) {
        return diffMinutes;
      }
    }

    // Fallback: use estimated_duration_minutes if available
    if (booking.estimated_duration_minutes) {
      return booking.estimated_duration_minutes;
    }

    // Last fallback: use originalTotalDuration
    return originalTotalDuration || null;
  }, [booking, originalTotalDuration]);

  // Check if duration exceeds original duration (similar to web app)
  // For slot booking: Compare with actual time range from scheduled_start_at and scheduled_end_at
  // For walk-in booking: Compare with total duration of original services
  const isDurationExceedsOriginal = useMemo(() => {
    if (!booking) return false;

    // Use detectBookingType helper function for consistency
    const { isSlot: isSlotBooking, isWalkIn: isWalkInBooking } =
      detectBookingType(booking);

    if (isSlotBooking) {
      // For slot booking: Compare with actual time range from scheduled_start_at and scheduled_end_at
      const totalOriginalSlotTime = calculateOriginalSlotTime();

      if (totalOriginalSlotTime && totalOriginalSlotTime > 0) {
        return totalDuration > totalOriginalSlotTime;
      }
    } else if (isWalkInBooking) {
      // For walk-in booking: Compare with total duration of original services
      return totalDuration > originalTotalDuration;
    }

    return false;
  }, [
    totalDuration,
    originalTotalDuration,
    booking,
    calculateOriginalSlotTime,
  ]);

  // Check if slot is suitable
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
        // We allow a small tolerance (1 minute) for rounding differences
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
    (slot: SlotInfo) => {
      // Note: Không còn disable slot selection khi duration exceeds - backend sẽ kiểm tra và đề xuất slot mới
      return slot.isAvailable && isSlotSuitable(slot);
    },
    [isSlotSuitable]
  );

  // Handle slot selection
  const handleSlotSelect = useCallback(
    (slot: SlotInfo) => {
      // Note: Không còn block slot selection khi duration exceeds - backend sẽ kiểm tra và đề xuất slot mới
      if (canSelectSlot(slot)) {
        // Calculate end time
        const slotStartMinutes = bookingScheduleService.parseTime(slot.time);
        const slotEndMinutes = slotStartMinutes + Math.max(totalDuration, 30);
        const endTime = bookingScheduleService.formatTime(slotEndMinutes);

        const newSlot: SelectedSlot = {
          time: slot.time,
          endTime: endTime,
          serviceDurationMinutes: Math.max(totalDuration, 30),
          bayId: selectedBay?.bay_id,
          date: formatDateString(bookingDate),
        };
        setSelectedSlot(newSlot);
        setIsSlotChanged(true);
      }
    },
    [canSelectSlot, totalDuration, selectedBay?.bay_id, bookingDate]
  );

  // Helper function to build booking_items array for API
  const buildBookingItemsArray = useCallback((): CreateBookingItemRequest[] => {
    const bookingItems: CreateBookingItemRequest[] = [];

    // Get service IDs from original and selected items
    const originalServiceIds = new Set(
      originalItems
        .map((item) => item.service?.service_id)
        .filter((id): id is string => !!id)
    );
    const selectedServiceIds = new Set(
      selectedItems
        .map((item) => item.service?.service_id)
        .filter((id): id is string => !!id)
    );

    console.log(" Building booking_items array:", {
      originalServiceIds: Array.from(originalServiceIds),
      selectedServiceIds: Array.from(selectedServiceIds),
      originalItemsCount: originalItems.length,
      selectedItemsCount: selectedItems.length,
    });

    // Step 1: Handle DELETE operations (items in original but not in selected)
    // Backend processes DELETE first, so we add them first
    // Use service_id only for deletion (not booking_item_id)
    originalServiceIds.forEach((serviceId) => {
      if (!selectedServiceIds.has(serviceId) && serviceId) {
        // Item needs to be deleted - use service_id only
        const originalItem = originalItems.find(
          (item) => item.service?.service_id === serviceId
        );
        bookingItems.push({
          service_id: serviceId,
          operation: "DELETE",
        });
        console.log(" Adding DELETE item (by service_id):", {
          service_id: serviceId,
          item_name: originalItem?.item_name,
        });
      }
    });

    // Step 2: Handle ADD operations (items in selected but not in original)
    // Only send items that are new (not in original)
    selectedItems.forEach((item) => {
      const serviceId = item.service?.service_id;
      if (!serviceId) {
        console.warn(" Skipping item without service_id:", item);
        return;
      }

      const isNew = !originalServiceIds.has(serviceId);
      if (isNew) {
        // ADD: New item - send service_id and service_name
        const bookingItem: CreateBookingItemRequest = {
          service_id: serviceId,
          service_name: item.item_name, // Use item_name from PriceBookItem as service_name
          service_description: item.service?.description || "",
        };
        bookingItems.push(bookingItem);
        console.log(" Adding NEW item:", {
          service_id: serviceId,
          service_name: item.item_name,
        });
      }
    });

    console.log(" Final booking_items array:", bookingItems);
    return bookingItems;
  }, [originalItems, selectedItems]);

  // Handle submit
  const handleSubmit = async () => {
    if (!booking || !selectedBranch || !selectedVehicle) {
      setSnackbar({
        visible: true,
        message: "Vui lòng điền đầy đủ thông tin",
        error: true,
      });
      return;
    }

    // Determine booking type with fallback to booking_code (similar to web app)
    const { isWalkIn: isWalkInBooking, isSlot: isSlotBooking } =
      detectBookingType(booking);

    if (isSlotBooking && !selectedSlot) {
      setSnackbar({
        visible: true,
        message: "Vui lòng chọn slot cho lịch đặt slot booking",
        error: true,
      });
      return;
    }

    if (selectedBranch && selectedItems.length > 0) {
      try {
        // Extract Service objects from selectedItems
        const servicesToCheck: Service[] = selectedItems
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

        if (servicesToCheck.length > 0) {
          const servicesWithInventory = await enrichServicesWithInventory(
            servicesToCheck,
            selectedBranch.branch_id
          );

          const availableServiceIds = new Set(
            servicesWithInventory.map((s) => s.service_id)
          );

          // Check if any selected service doesn't have enough inventory
          const servicesWithoutInventory = selectedItems.filter((item) => {
            const serviceId = item.service?.service_id;
            if (!serviceId) return false;

            // Check if this is a new service (not in originalItems)
            const isNewService = !originalItems.some(
              (orig) => orig.service?.service_id === serviceId
            );

            // Only validate new services
            if (isNewService && !availableServiceIds.has(serviceId)) {
              return true;
            }
            return false;
          });

          if (servicesWithoutInventory.length > 0) {
            const serviceNames = servicesWithoutInventory
              .map((item) => item.item_name)
              .join(", ");
            setSnackbar({
              visible: true,
              message: `Các dịch vụ sau không đủ tồn kho trong chi nhánh ${selectedBranch.branch_name}: ${serviceNames}. Vui lòng chọn dịch vụ khác.`,
              error: true,
            });
            return;
          }
        }
      } catch (error) {
        console.error("Error validating inventory before submit:", error);
        // Continue with submission if validation fails (backend will handle it)
      }
    }

    setSubmitting(true);
    try {
      // Format date string directly from date components to avoid timezone issues
      // toISOString() can cause date shift when converting to UTC
      const dateStr = formatDateString(bookingDate);

      // Build booking_items array for API
      const bookingItems = buildBookingItemsArray();

      const updateRequest: UpdateBookingRequest = {
        vehicle_license_plate: selectedVehicle.license_plate,
        vehicle_brand_name: selectedVehicle.brand_name || "",
        vehicle_model_name: selectedVehicle.model_name || "",
        vehicle_type_name: selectedVehicle.type_name || "",
        estimated_duration_minutes: totalDuration,
        total_price: totalPrice,
        currency: "VND",
        notes: notes || "",
      };

      if (!isWalkInBooking) {
        updateRequest.branch_id = selectedBranch.branch_id;
      }

      // Handle service_bay_id based on booking type (similar to web app)
      if (isSlotBooking && selectedSlot && selectedBay) {
        // For slot booking, always send service_bay_id if slot is selected
        updateRequest.service_bay_id = selectedBay.bay_id;
      }

      // Add booking_items array if it has items
      if (bookingItems.length > 0) {
        updateRequest.booking_items = bookingItems;
      }

      // Handle schedule information based on booking type (similar to web app)
      if (isSlotBooking && selectedSlot) {
        // For slot booking, send schedule_date and schedule_start_time - backend will calculate dates correctly
        updateRequest.schedule_date = dateStr; // YYYY-MM-DD format
        updateRequest.schedule_start_time = selectedSlot.time; // HH:mm format
        // DO NOT send scheduled_start_at and scheduled_end_at - backend will calculate from schedule_date and schedule_start_time
      }

      await bookingService.updateBooking(bookingId, updateRequest);
      setSnackbar({
        visible: true,
        message: "Cập nhật booking thành công!",
        error: false,
      });
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (e: any) {
      // Extract error message from backend response
      const errorMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Cập nhật booking thất bại";

      setSnackbar({ visible: true, message: errorMessage, error: true });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}
        edges={["bottom"]}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Đang tải thông tin booking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}
        edges={["bottom"]}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <Text>Không tìm thấy booking</Text>
          <Button style={{ marginTop: 12 }} onPress={() => router.back()}>
            Quay lại
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Use detectBookingType helper function for consistency
  const { isSlot: isSlotBooking } = detectBookingType(booking);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F9F8F6" }}
      edges={["bottom"]}
    >
      <ScrollView contentContainerStyle={{ padding: 8, paddingBottom: 32 }}>
        {/* Booking Info */}
        <Card
          mode="elevated"
          style={{
            borderRadius: 4,
            marginBottom: 8,
            backgroundColor: "#ffffff",
          }}
        >
          <Card.Title title="Thông tin booking" />
          <Divider />
          <Card.Content>
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>Mã booking</Text>
              <Text
                style={{
                  fontFamily: "monospace",
                  fontSize: 16,
                  fontWeight: "600",
                  marginTop: 4,
                }}
              >
                {booking.booking_code}
              </Text>
            </View>
            <View
              style={{
                marginTop: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#6b7280", fontSize: 12, marginRight: 8 }}>
                Trạng thái:
              </Text>
              <Chip
                style={{
                  backgroundColor: getStatusColor(booking.status) + "20",
                }}
                textStyle={{
                  color: getStatusColor(booking.status),
                  fontSize: 12,
                }}
              >
                {booking.status}
              </Chip>
            </View>
            {booking.branch_name && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>
                  Chi nhánh hiện tại
                </Text>
                <Text style={{ fontSize: 14, marginTop: 4 }}>
                  {booking.branch_name}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Customer Info (Read-only) */}
        <Card
          mode="elevated"
          style={{
            borderRadius: 4,
            marginBottom: 8,
            backgroundColor: "#ffffff",
          }}
        >
          <Card.Title title="Thông tin khách hàng" />
          <Divider />
          <Card.Content>
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>Tên</Text>
              <Text style={{ fontSize: 14, marginTop: 4 }}>
                {user?.full_name || booking.customer_name}
              </Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>SĐT</Text>
              <Text style={{ fontSize: 14, marginTop: 4 }}>
                {user?.phone_number || booking.customer_phone}
              </Text>
            </View>
            {user?.email && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>Email</Text>
                <Text style={{ fontSize: 14, marginTop: 4 }}>{user.email}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Vehicle Selection */}
        <Card
          mode="elevated"
          style={{
            borderRadius: 4,
            marginBottom: 8,
            backgroundColor: "#ffffff",
          }}
        >
          <Card.Title title="Thông tin xe" />
          <Divider />
          <Card.Content>
            <List.Item
              title="Chọn xe"
              description={
                selectedVehicle
                  ? selectedVehicle.license_plate
                  : "Chọn xe của bạn"
              }
              left={(props) => <List.Icon {...props} icon="car" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setVehicleModal(true)}
              style={{ paddingHorizontal: 0 }}
            />
            {selectedVehicle && (
              <View
                style={{
                  marginTop: 8,
                  padding: 12,
                  backgroundColor: "#E3F2FD",
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontWeight: "600" }}>
                  {selectedVehicle.license_plate}
                </Text>
                <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  {selectedVehicle.brand_name} {selectedVehicle.model_name} •{" "}
                  {selectedVehicle.type_name}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Branch and Slot Selection */}
        <Card
          mode="elevated"
          style={{
            borderRadius: 4,
            marginBottom: 8,
            backgroundColor: "#ffffff",
          }}
        >
          <Card.Title title="Thời gian và địa điểm" />
          <Divider />
          <Card.Content>
            {/* Booking Date */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>
                Ngày đặt lịch
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  borderRadius: 4,
                  padding: 12,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <Text>
                  {formatDateString(bookingDate).split("-").reverse().join("/")}
                </Text>
              </TouchableOpacity>
              {Platform.OS !== "web" && showDatePicker && (
                <DateTimePicker
                  value={bookingDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      // Normalize selected date to local timezone at midnight
                      const normalizedDate = new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        selectedDate.getDate()
                      );
                      if (normalizedDate >= today) {
                        setBookingDate(normalizedDate);
                        // Reset slot when date changes since slots are date-specific
                        setSelectedSlot(null);
                        setIsSlotChanged(false);
                        // Also clear available slots to force reload
                        setAvailableSlots([]);
                      }
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Branch Selection */}
            <View style={{ marginTop: 16 }}>
              <List.Item
                title="Chọn chi nhánh"
                description={
                  selectedBranch ? selectedBranch.branch_name : "Chọn chi nhánh"
                }
                left={(props) => <List.Icon {...props} icon="map-marker" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setBranchModal(true)}
                style={{ paddingHorizontal: 0 }}
              />
            </View>

            {/* Time Display (for walk-in bookings) */}
            {!isSlotBooking && booking?.scheduled_start_at && (
              <View style={{ marginTop: 16 }}>
                <Text
                  style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}
                >
                  Thời gian dự kiến
                </Text>
                <View
                  style={{
                    padding: 12,
                    backgroundColor: "#FFF7E6",
                    borderRadius: 8,
                  }}
                >
                  {(() => {
                    const scheduledStart = new Date(booking.scheduled_start_at);
                    const hours = scheduledStart.getHours();
                    const minutes = scheduledStart.getMinutes();
                    const startTime = `${String(hours).padStart(
                      2,
                      "0"
                    )}:${String(minutes).padStart(2, "0")}`;
                    const duration = booking.estimated_duration_minutes || 60;
                    const endMinutes = hours * 60 + minutes + duration;
                    const endHours = Math.floor(endMinutes / 60);
                    const endMins = endMinutes % 60;
                    const endTime = `${String(endHours).padStart(
                      2,
                      "0"
                    )}:${String(endMins).padStart(2, "0")}`;
                    return (
                      <>
                        <Text style={{ fontWeight: "600" }}>
                          {startTime} - {endTime}
                        </Text>
                        <Text
                          style={{ fontSize: 12, color: "#666", marginTop: 4 }}
                        >
                          {duration} phút
                        </Text>
                      </>
                    );
                  })()}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Service Selection */}
        <Card
          mode="elevated"
          style={{
            borderRadius: 4,
            marginBottom: 8,
            backgroundColor: "#ffffff",
          }}
        >
          <Card.Title title="Dịch vụ" />
          <Divider />
          <Card.Content>
            <List.Item
              title="Dịch vụ chăm sóc xe"
              description={`Đã chọn: ${selectedItems.length} dịch vụ`}
              left={(props) => <List.Icon {...props} icon="wrench" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setServiceModal(true)}
              style={{ paddingHorizontal: 0 }}
            />
            {selectedItems.length > 0 && (
              <View
                style={{
                  marginTop: 12,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {selectedItems.map((item) => (
                  <Chip
                    key={item.item_id}
                    onClose={() => {
                      // Prevent event propagation to avoid circular reference
                      // Filter out the removed item
                      const newItems = selectedItems.filter(
                        (i) => i.item_id !== item.item_id
                      );
                      setSelectedItems(newItems);
                      console.log(" Service removed from selection:", {
                        removedItem: item.item_name,
                        service_id: item.service?.service_id,
                        remainingItems: newItems.length,
                      });
                    }}
                    style={{ marginBottom: 4 }}
                  >
                    {item.item_name} - {item.fixed_price?.toLocaleString()} VNĐ
                  </Chip>
                ))}
              </View>
            )}
            <View style={{ marginTop: 16, flexDirection: "row", gap: 16 }}>
              <View
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#52c41a", fontSize: 18, fontWeight: "600" }}
                >
                  {totalPrice.toLocaleString()} VNĐ
                </Text>
                <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  Tổng giá
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#1890ff", fontSize: 18, fontWeight: "600" }}
                >
                  {totalDuration} phút
                </Text>
                <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  Tổng thời gian
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Bay and Slot Selection */}
        {isSlotBooking && selectedBranch && bookingDate && (
          <Card
            mode="elevated"
            style={{
              borderRadius: 4,
              marginBottom: 8,
              backgroundColor: "#ffffff",
            }}
          >
            <Card.Title title="Khu vực và giờ chăm sóc" />
            <Divider />
            <Card.Content>
              {/* Bay Selection */}
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}
                >
                  Khu vực dịch vụ
                </Text>
                {totalDuration <= 0 && (
                  <View
                    style={{
                      marginBottom: 8,
                      padding: 12,
                      backgroundColor: "#FFF7E6",
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: "#faad14" }}>
                      Vui lòng chọn dịch vụ để xem các mốc thời gian khả dụng
                    </Text>
                  </View>
                )}

                <View
                  style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}
                >
                  {serviceBays.slice(0, 8).map((bay) => (
                    <TouchableOpacity
                      key={bay.bay_id}
                      onPress={() => {
                        setSelectedBay(bay);
                        // Clear available slots to force reload for new bay
                        setAvailableSlots([]);
                        // Check if this is the original bay and date
                        const currentDateStr = formatDateString(bookingDate);
                        const isOriginalBay =
                          originalSlot && originalSlot.bayId === bay.bay_id;
                        const isOriginalDate =
                          originalSlot && originalSlot.date === currentDateStr;

                        if (isOriginalBay && isOriginalDate) {
                          // Will restore original slot in the validation effect after slots load
                          // For now, just clear selected slot to let the effect handle restoration
                          setSelectedSlot(null);
                          setIsSlotChanged(false);
                        } else {
                          // Reset slot when selecting a different bay or date
                          setSelectedSlot(null);
                          setIsSlotChanged(false);
                        }
                      }}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor:
                          selectedBay?.bay_id === bay.bay_id
                            ? "#1890ff"
                            : "#d9d9d9",
                        backgroundColor:
                          selectedBay?.bay_id === bay.bay_id
                            ? "#E6F7FF"
                            : "#fff",
                        minWidth: 100,
                        alignItems: "center",
                        width: "48%",
                      }}
                    >
                      <Text style={{ fontWeight: "600" }}>{bay.bay_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Slot Selection */}
              {selectedBay && totalDuration > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text
                    style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}
                  >
                    Chọn thời gian
                  </Text>
                  {loadingSlots ? (
                    <View style={{ padding: 20, alignItems: "center" }}>
                      <ActivityIndicator />
                      <Text style={{ marginTop: 8, fontSize: 12 }}>
                        Đang tải danh sách slot...
                      </Text>
                    </View>
                  ) : availableSlots.length > 0 ? (
                    <View
                      style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}
                    >
                      {availableSlots.map((slot, index) => {
                        const canSelect = canSelectSlot(slot);
                        const isSelected =
                          selectedSlot && selectedSlot.time === slot.time;

                        // Get status color and label based on availability
                        const getSlotStatusInfo = (isAvailable: boolean) => {
                          if (isAvailable) {
                            return {
                              color: "#52c41a",
                              bgColor: "#F6FFED",
                              borderColor: "#52c41a",
                              label: "Trống",
                              textColor: "#52c41a",
                            };
                          } else {
                            return {
                              color: "#ff4d4f",
                              bgColor: "#FFF2F0",
                              borderColor: "#ff4d4f",
                              label: "Không khả dụng",
                              textColor: "#ff4d4f",
                            };
                          }
                        };

                        const statusInfo = getSlotStatusInfo(slot.isAvailable);

                        return (
                          <TouchableOpacity
                            key={`${slot.time}-${index}`}
                            onPress={() => canSelect && handleSlotSelect(slot)}
                            disabled={!canSelect}
                            style={{
                              padding: 12,
                              borderRadius: 8,
                              borderWidth: 2,
                              borderColor: isSelected
                                ? "#52c41a"
                                : canSelect
                                ? "#d9d9d9"
                                : statusInfo.borderColor,
                              backgroundColor: isSelected
                                ? "#F6FFED"
                                : canSelect
                                ? "#fff"
                                : statusInfo.bgColor,
                              minWidth: 80,
                              alignItems: "center",
                              opacity: canSelect ? 1 : 0.7,
                            }}
                          >
                            <Text style={{ fontSize: 14, fontWeight: "600" }}>
                              {slot.time}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <View
                      style={{
                        padding: 12,
                        backgroundColor: "#FFF7E6",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>
                        Không có thời gian khả dụng
                      </Text>
                    </View>
                  )}

                  {selectedSlot && (
                    <View
                      style={{
                        marginTop: 12,
                        padding: 12,
                        backgroundColor: isSlotChanged ? "#E6F7FF" : "#F3F4F6",
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontWeight: "600" }}>
                        Thời gian đã chọn: {selectedSlot.time} -{" "}
                        {selectedSlot.endTime}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: "#666", marginTop: 4 }}
                      >
                        : {selectedBay?.bay_name} • Ngày:{" "}
                        {formatDateString(bookingDate)}
                      </Text>
                      {isSlotChanged && (
                        <Button
                          mode="text"
                          compact
                          onPress={() => {
                            if (originalSlot) {
                              setSelectedSlot(originalSlot);
                            } else {
                              setSelectedSlot(null);
                            }
                            setIsSlotChanged(false);
                          }}
                          style={{ marginTop: 8 }}
                        >
                          Hủy chọn thời gian
                        </Button>
                      )}
                    </View>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Notes */}
        <Card
          mode="elevated"
          style={{
            borderRadius: 4,
            marginBottom: 8,
            backgroundColor: "#ffffff",
          }}
        >
          <Card.Title title="Ghi chú" />
          <Divider />
          <Card.Content>
            <TextInput
              label="Ghi chú"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={{ marginTop: 12 }}
              placeholder="Nhập ghi chú cho lịch đặt..."
            />
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={
            submitting ||
            !selectedBranch ||
            selectedItems.length === 0 ||
            !selectedVehicle ||
            (isSlotBooking && !selectedSlot)
            // Note: Không disable khi duration exceeds original - backend sẽ kiểm tra và đề xuất slot mới
          }
          contentStyle={{ paddingVertical: 8 }}
          style={{ marginTop: 8 }}
        >
          Cập nhật booking
        </Button>
      </ScrollView>

      {/* Vehicle Modal */}
      <Portal>
        <Modal
          visible={vehicleModal}
          onDismiss={() => setVehicleModal(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "white",
            borderRadius: 12,
            maxHeight: "80%",
          }}
        >
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#e0e0e0",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Chọn xe</Text>
          </View>
          <FlatList
            data={userVehicles}
            keyExtractor={(item) => item.vehicle_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedVehicle(item);
                  setVehicleModal(false);
                }}
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f0f0f0",
                }}
              >
                <Text style={{ fontWeight: "600" }}>{item.license_plate}</Text>
                <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  {item.brand_name} {item.model_name} • {item.type_name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </Modal>

        {/* Branch Modal */}
        <Modal
          visible={branchModal}
          onDismiss={() => setBranchModal(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "white",
            borderRadius: 12,
            maxHeight: "80%",
          }}
        >
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#e0e0e0",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              Chọn chi nhánh
            </Text>
          </View>
          <FlatList
            data={branches}
            keyExtractor={(item) => item.branch_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedBranch(item);
                  // Reset bay and slot when branch changes
                  setSelectedBay(null);
                  setSelectedSlot(null);
                  setIsSlotChanged(false);
                  setAvailableSlots([]);
                  setBranchModal(false);
                }}
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f0f0f0",
                }}
              >
                <Text style={{ fontWeight: "600" }}>{item.branch_name}</Text>
                {item.address && (
                  <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                    {item.address}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        </Modal>

        {/* Service Modal */}
        <Modal
          visible={serviceModal}
          onDismiss={() => setServiceModal(false)}
          contentContainerStyle={{
            margin: 16,
            backgroundColor: "white",
            borderRadius: 12,
            maxHeight: "80%",
          }}
        >
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#e0e0e0",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>
              Chọn dịch vụ
            </Text>
            {checkingAvailability && selectedBranch && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <ActivityIndicator size="small" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 12, color: "#666" }}>
                  Đang kiểm tra tồn kho...
                </Text>
              </View>
            )}
            {!checkingAvailability &&
              selectedBranch &&
              availableServices.length === 0 &&
              allPriceBookServices.length > 0 && (
                <View
                  style={{
                    marginTop: 8,
                    padding: 12,
                    backgroundColor: "#FFF7E6",
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#D46B08" }}>
                    Không có dịch vụ nào khả dụng trong chi nhánh này. Tất cả
                    dịch vụ đều không đủ tồn kho.
                  </Text>
                </View>
              )}
          </View>
          {checkingAvailability ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 12, fontSize: 14, color: "#666" }}>
                Đang kiểm tra tồn kho...
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableServices}
              keyExtractor={(item) => item.item_id}
              renderItem={({ item }) => {
                const isSelected = selectedItems.some(
                  (i) => i.item_id === item.item_id
                );
                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (isSelected) {
                        setSelectedItems(
                          selectedItems.filter(
                            (i) => i.item_id !== item.item_id
                          )
                        );
                      } else {
                        setSelectedItems([...selectedItems, item]);
                      }
                    }}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f0f0f0",
                      backgroundColor: isSelected ? "#E3F2FD" : "white",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "600" }}>
                          {item.item_name}
                        </Text>
                        {item.service && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#666",
                              marginTop: 4,
                            }}
                          >
                            {item.service.estimated_duration || 60} phút
                          </Text>
                        )}
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontWeight: "600", color: "#52c41a" }}>
                          {item.fixed_price?.toLocaleString()} VNĐ
                        </Text>
                        {isSelected && (
                          <Text
                            style={{
                              fontSize: 10,
                              color: "#1890ff",
                              marginTop: 4,
                            }}
                          >
                            Đã chọn
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Text style={{ fontSize: 14, color: "#999" }}>
                    {selectedBranch
                      ? "Không có dịch vụ nào khả dụng trong chi nhánh này"
                      : "Vui lòng chọn chi nhánh trước"}
                  </Text>
                </View>
              }
            />
          )}
          <View
            style={{
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: "#e0e0e0",
            }}
          >
            <Button mode="contained" onPress={() => setServiceModal(false)}>
              Xong
            </Button>
          </View>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        duration={3000}
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
