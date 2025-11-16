import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Platform, ScrollView, TouchableOpacity, View } from "react-native";
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
  bookingScheduleService, 
  SlotInfo,
  AvailableTimeRangesResponse,
} from "../../../../src/services/bookingSchedule.service";
import { BranchDisplay, branchService } from "../../../../src/services/branch.service";
import { PriceBookItem, pricingService } from "../../../../src/services/pricing.service";
import { ServiceBay, serviceBayService } from "../../../../src/services/serviceBay.service";
import { VehicleProfileDto, vehicleProfileService } from "../../../../src/services/vehicleProfile.service";
import { BookingInfoDto, CreateBookingItemRequest } from "../../../../src/types/booking.types";

interface SelectedSlot {
  time: string; // HH:mm format
  endTime: string; // HH:mm format (calculated)
  serviceDurationMinutes: number;
  bayId?: string; // Optional: bay ID
  date?: string; // Optional: date in YYYY-MM-DD format
}

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
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleProfileDto | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<BranchDisplay | null>(null);
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
  const [timeRangesData, setTimeRangesData] = useState<AvailableTimeRangesResponse | null>(null);
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
  const [availableServices, setAvailableServices] = useState<PriceBookItem[]>([]);
  const [serviceBays, setServiceBays] = useState<ServiceBay[]>([]);

  // Modal states
  const [vehicleModal, setVehicleModal] = useState(false);
  const [branchModal, setBranchModal] = useState(false);
  const [serviceModal, setServiceModal] = useState(false);

  // Refs
  const isInitialized = useRef(false);

  // Calculate totals
  const { totalPrice, totalDuration } = useMemo(() => {
    const price = selectedItems.reduce((sum, item) => sum + (item.fixed_price || 0), 0);
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
        setSnackbar({ visible: true, message: "Không tìm thấy booking", error: true });
        setLoading(false);
        return;
      }
      // Cast to full BookingInfoDto type
      const bookingData = bookingDataRaw as any as BookingInfoDto;
      setBooking(bookingData);
      setNotes(bookingData.notes || "");

      // Load dropdown data
      const [vehicles, branchesData, servicesData] = await Promise.all([
        vehicleProfileService.getByOwner(user.user_id, { size: 1000 }).then(r => r.content || []),
        branchService.getAll(),
        pricingService.getAllItems(),
      ]);

      setUserVehicles(vehicles);
      setBranches(branchesData);
      setAvailableServices(servicesData);

      // Set selected vehicle - try multiple ways to find vehicle
      if (bookingData.vehicle_id) {
        const vehicle = vehicles.find((v) => v.vehicle_id === bookingData.vehicle_id);
        if (vehicle) {
          setSelectedVehicle(vehicle);
        }
      } else if (bookingData.vehicle_license_plate) {
        // Fallback: try to find by license plate
        const vehicle = vehicles.find((v) => v.license_plate === bookingData.vehicle_license_plate);
        if (vehicle) {
          setSelectedVehicle(vehicle);
        }
      }

      // Set selected branch
      let selectedBranchData: BranchDisplay | null = null;
      if (bookingData.branch_id) {
        const branch = branchesData.find((b) => b.branch_id === bookingData.branch_id);
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
          console.log("🔍 Processing booking item:", {
            service_id: item.service_id,
            item_name: item.item_name,
          });

          // Primary: Try to match by service_id
          if (item.service_id && !seenServiceIds.has(item.service_id)) {
            const priceBookItem = servicesData.find(
              (s) => s.service?.service_id === item.service_id
            );
            if (priceBookItem && !seenServiceIds.has(priceBookItem.item_id)) {
              console.log("✅ Found matching service by service_id:", {
                item_id: priceBookItem.item_id,
                item_name: priceBookItem.item_name,
                service: priceBookItem.service,
              });
              services.push(priceBookItem);
              seenServiceIds.add(item.service_id);
              seenServiceIds.add(priceBookItem.item_id);
            } else {
              console.warn("⚠️ Service not found by service_id:", item.service_id);
            }
          } else if (!item.service_id && item.item_name) {
            // Fallback: Try to match by item_name if service_id is null
            console.log("⚠️ service_id is null, trying to match by item_name:", item.item_name);
            const priceBookItem = servicesData.find(
              (s) => s.item_name === item.item_name && s.service && !seenServiceIds.has(s.item_id)
            );
            if (priceBookItem) {
              console.log("✅ Found matching service by item_name:", {
                item_id: priceBookItem.item_id,
                item_name: priceBookItem.item_name,
                service_id: priceBookItem.service?.service_id,
              });
              services.push(priceBookItem);
              if (priceBookItem.service?.service_id) {
                seenServiceIds.add(priceBookItem.service.service_id);
              }
              seenServiceIds.add(priceBookItem.item_id);
            } else {
              console.warn("⚠️ Service not found by item_name:", item.item_name);
            }
          }
        });

        const uniqueServices = services.filter((s, i, self) =>
          i === self.findIndex((sv) => sv.item_id === s.item_id)
        );

        console.log("📋 Final services array:", {
          originalCount: bookingData.booking_items.length,
          uniqueCount: uniqueServices.length,
          services: uniqueServices.map((s) => ({
            item_name: s.item_name,
            service_id: s.service?.service_id,
          })),
        });

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
          const bays = await serviceBayService.getActive(selectedBranchData.branch_id);
          const filteredBays = bays.filter((bay) => bay.allow_booking !== false);
          setServiceBays(filteredBays);

          // Set bay and slot for slot bookings
          const isSlotBooking = bookingData.booking_code?.startsWith("BK") || false;
          if (isSlotBooking && bookingData.bay_id && bookingData.scheduled_start_at && bookingData.slot_start_time) {
            const bay = filteredBays.find((b) => b.bay_id === bookingData.bay_id) || 
                        bays.find((b) => b.bay_id === bookingData.bay_id);
            if (bay) {
              setSelectedBay(bay);
              const slotDate = parseAndNormalizeDate(bookingData.scheduled_start_at);
              if (slotDate) {
                const serviceDuration = bookingData.estimated_duration_minutes || 60;
                const startTime = bookingData.slot_start_time || "";
                // Calculate end time
                const startMinutes = bookingScheduleService.parseTime(startTime);
                const endMinutes = startMinutes + serviceDuration;
                const endTime = bookingScheduleService.formatTime(endMinutes);
                
                const slot: SelectedSlot = {
                  time: startTime,
                  endTime: endTime,
                  serviceDurationMinutes: serviceDuration,
                  bayId: bay.bay_id,
                  date: formatDateString(slotDate),
                };
                setSelectedSlot(slot);
                setOriginalSlot(slot);
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
      setSnackbar({ visible: true, message: e?.message || "Không thể tải dữ liệu", error: true });
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
  const parseAndNormalizeDate = (dateString: string | undefined | null): Date | null => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      // Normalize to local timezone at midnight to avoid timezone shift issues
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return normalizedDate;
    } catch {
      return null;
    }
  };

  // Load service bays when branch changes manually by user (after initialization)
  useEffect(() => {
    if (selectedBranch && isInitialized.current && !selectedBay) {
      serviceBayService.getActive(selectedBranch.branch_id).then((bays) => {
        const filteredBays = bays.filter((bay) => bay.allow_booking !== false);
        setServiceBays(filteredBays);
        
        // If bay was not set during initialization, try to set it now
        if (booking?.bay_id) {
          const bay = filteredBays.find((b) => b.bay_id === booking.bay_id) || 
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
        const timeRangesResp = await bookingScheduleService.getAvailableTimeRanges({
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
          const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
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
  }, [loadAvailableSlots, totalDuration, selectedBranch, selectedBay, bookingDate]);

  // Validate selected slot after available slots are loaded
  // Also restore original slot if we're back on the original bay and date
  useEffect(() => {
    if (selectedBay && availableSlots.length > 0 && originalSlot) {
      // Check if we should restore the original slot
      // We restore if:
      // 1. We're on the original bay (check by comparing with booking.bay_id)
      // 2. We're on the original date (check by comparing slot time with booking.slot_start_time)
      // 3. No slot is currently selected
      const isOriginalBay = booking?.bay_id === selectedBay.bay_id;
      const isOriginalDate = booking?.slot_start_time === originalSlot.time;
      
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
  }, [availableSlots, selectedSlot, selectedBay, originalSlot, bookingDate, booking]);

  // Check if duration exceeds original slot duration
  const isDurationExceedsOriginal = useMemo(() => {
    const isSlotBooking = booking?.booking_code?.startsWith("BK") || false;
    if (!isSlotBooking || !originalTotalDuration) return false;

    const SLOT_DURATION_MINUTES = 60;
    const originalSlotCount = Math.ceil(originalTotalDuration / SLOT_DURATION_MINUTES);
    const totalOriginalSlotTime = originalSlotCount * SLOT_DURATION_MINUTES;
    return totalDuration > totalOriginalSlotTime;
  }, [totalDuration, originalTotalDuration, booking?.booking_code]);

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
        return slotStartMinutes >= rangeStart && slotEndMinutes <= (rangeEnd + TOLERANCE_MINUTES);
      });
    },
    [timeRangesData, totalDuration]
  );

  const canSelectSlot = useCallback(
    (slot: SlotInfo) => {
      if (isDurationExceedsOriginal) return false;
      return slot.isAvailable && isSlotSuitable(slot);
    },
    [isSlotSuitable, isDurationExceedsOriginal]
  );

  // Handle slot selection
  const handleSlotSelect = useCallback(
    (slot: SlotInfo) => {
      if (isDurationExceedsOriginal) {
        setSnackbar({
          visible: true,
          message: "Không thể đổi slot khi dịch vụ vượt quá thời gian slot ban đầu",
          error: true,
        });
        return;
      }

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
    [canSelectSlot, totalDuration, isDurationExceedsOriginal, selectedBay?.bay_id, bookingDate]
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

    console.log("🔍 Building booking_items array:", {
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
        console.log("🗑️ Adding DELETE item (by service_id):", {
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
        console.warn("⚠️ Skipping item without service_id:", item);
        return;
      }

      const isNew = !originalServiceIds.has(serviceId);
      if (isNew) {
        // ADD: New item - send service_id and item_name
        const bookingItem: CreateBookingItemRequest = {
          service_id: serviceId,
          item_name: item.item_name,
        };
        bookingItems.push(bookingItem);
        console.log("➕ Adding NEW item:", {
          service_id: serviceId,
          item_name: item.item_name,
        });
      }
      // Note: UPDATE operations are not sent explicitly
      // Backend will handle UPDATE implicitly if service_id exists in both original and selected
      // We only need to send DELETE and ADD operations
    });

    console.log("📦 Final booking_items array:", bookingItems);
    return bookingItems;
  }, [originalItems, selectedItems]);

  // Handle submit
  const handleSubmit = async () => {
    if (!booking || !selectedBranch || !selectedVehicle) {
      setSnackbar({ visible: true, message: "Vui lòng điền đầy đủ thông tin", error: true });
      return;
    }

    const isSlotBooking = booking.booking_code?.startsWith("BK") || false;
    if (isSlotBooking && !selectedSlot) {
      setSnackbar({ visible: true, message: "Vui lòng chọn slot cho lịch đặt slot booking", error: true });
      return;
    }

    if (isDurationExceedsOriginal && originalTotalDuration) {
      const SLOT_DURATION_MINUTES = 60;
      const originalSlotCount = Math.ceil(originalTotalDuration / SLOT_DURATION_MINUTES);
      const totalOriginalSlotTime = originalSlotCount * SLOT_DURATION_MINUTES;
      setSnackbar({
        visible: true,
        message: `Tổng thời gian dịch vụ (${totalDuration} phút) vượt quá tổng thời gian các slot đã đặt ban đầu (${totalOriginalSlotTime} phút)`,
        error: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      // Format date string directly from date components to avoid timezone issues
      // toISOString() can cause date shift when converting to UTC
      const dateStr = formatDateString(bookingDate);
      
      // Build booking_items array for API
      const bookingItems = buildBookingItemsArray();
      
      // For slot booking, backend will calculate scheduled_start_at and scheduled_end_at from slot_date and slot_start_time
      // So we should NOT send scheduled_start_at and scheduled_end_at when we have slot_date and slot_start_time
      // to avoid timezone issues and let backend handle the calculation correctly
      const updateRequest: any = {
        vehicle_license_plate: selectedVehicle.license_plate,
        vehicle_brand_name: selectedVehicle.brand_name || "",
        vehicle_model_name: selectedVehicle.model_name || "",
        vehicle_type_name: selectedVehicle.type_name || "",
        branch_id: selectedBranch.branch_id,
        service_bay_id: selectedSlot && selectedBay ? selectedBay.bay_id : undefined,
        estimated_duration_minutes: totalDuration,
        buffer_minutes: 15,
        total_price: totalPrice,
        currency: "VND",
        notes: notes || "",
      };

      // Add booking_items array if it has items
      if (bookingItems.length > 0) {
        updateRequest.booking_items = bookingItems;
      }

      // For slot booking, send slot_date and slot_start_time - backend will calculate dates correctly
      if (selectedSlot && isSlotBooking) {
        updateRequest.slot_date = dateStr;
        updateRequest.slot_start_time = selectedSlot.time;
        
        // Use local time format (YYYY-MM-DDTHH:mm:ss) instead of ISO to avoid timezone issues
        const [startHour, startMinute] = selectedSlot.time.split(":").map(Number);
        const startLocal = new Date(
          bookingDate.getFullYear(),
          bookingDate.getMonth(),
          bookingDate.getDate(),
          startHour || 0,
          startMinute || 0,
          0,
          0
        );
        const durationMs = selectedSlot.serviceDurationMinutes * 60 * 1000;
        const endLocal = new Date(startLocal.getTime() + durationMs);
        const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
        const slotStartLocal = `${startLocal.getFullYear()}-${pad(startLocal.getMonth() + 1)}-${pad(startLocal.getDate())}T${pad(startLocal.getHours())}:${pad(startLocal.getMinutes())}:${pad(startLocal.getSeconds())}`;
        const slotEndLocal = `${endLocal.getFullYear()}-${pad(endLocal.getMonth() + 1)}-${pad(endLocal.getDate())}T${pad(endLocal.getHours())}:${pad(endLocal.getMinutes())}:${pad(endLocal.getSeconds())}`;
        
        updateRequest.scheduled_start_at = slotStartLocal;
        updateRequest.scheduled_end_at = slotEndLocal;
      } else {
        // For non-slot booking, send scheduled times directly
        updateRequest.scheduled_start_at = bookingDate.toISOString();
      }

      await bookingService.updateBooking(bookingId, updateRequest);
      setSnackbar({ visible: true, message: "Cập nhật booking thành công!", error: false });
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (e: any) {
      setSnackbar({ visible: true, message: e?.message || "Cập nhật booking thất bại", error: true });
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

  const isSlotBooking = booking.booking_code?.startsWith("BK") || false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Booking Info */}
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
          <Card.Title title="Thông tin booking" />
          <Divider />
          <Card.Content>
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>Mã booking</Text>
              <Text style={{ fontFamily: "monospace", fontSize: 16, fontWeight: "600", marginTop: 4 }}>
                {booking.booking_code}
              </Text>
            </View>
            <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#6b7280", fontSize: 12, marginRight: 8 }}>Trạng thái:</Text>
              <Chip
                style={{ backgroundColor: getStatusColor(booking.status) + "20" }}
                textStyle={{ color: getStatusColor(booking.status), fontSize: 12 }}
              >
                {booking.status}
              </Chip>
            </View>
            {booking.branch_name && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>Chi nhánh hiện tại</Text>
                <Text style={{ fontSize: 14, marginTop: 4 }}>{booking.branch_name}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Customer Info (Read-only) */}
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
          <Card.Title title="Thông tin khách hàng" />
          <Divider />
          <Card.Content>
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>Tên</Text>
              <Text style={{ fontSize: 14, marginTop: 4 }}>{user?.full_name || booking.customer_name}</Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#6b7280", fontSize: 12 }}>SĐT</Text>
              <Text style={{ fontSize: 14, marginTop: 4 }}>{user?.phone_number || booking.customer_phone}</Text>
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
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
          <Card.Title title="Thông tin xe" />
          <Divider />
          <Card.Content>
            <List.Item
              title="Chọn xe"
              description={selectedVehicle ? selectedVehicle.license_plate : "Chọn xe của bạn"}
              left={(props) => <List.Icon {...props} icon="car" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setVehicleModal(true)}
              style={{ paddingHorizontal: 0 }}
            />
            {selectedVehicle && (
              <View style={{ marginTop: 8, padding: 12, backgroundColor: "#E3F2FD", borderRadius: 8 }}>
                <Text style={{ fontWeight: "600" }}>{selectedVehicle.license_plate}</Text>
                <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  {selectedVehicle.brand_name} {selectedVehicle.model_name} • {selectedVehicle.type_name}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Branch and Slot Selection */}
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
          <Card.Title title="Thời gian và địa điểm" />
          <Divider />
          <Card.Content>
            {/* Booking Date */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>Ngày đặt lịch</Text>
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
                <Text>{formatDateString(bookingDate).split("-").reverse().join("/")}</Text>
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
                description={selectedBranch ? selectedBranch.branch_name : "Chọn chi nhánh"}
                left={(props) => <List.Icon {...props} icon="map-marker" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setBranchModal(true)}
                style={{ paddingHorizontal: 0 }}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Service Selection */}
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
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
              <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {selectedItems.map((item) => (
                  <Chip
                    key={item.item_id}
                    onClose={() => {
                      // Prevent event propagation to avoid circular reference
                      // Filter out the removed item
                      const newItems = selectedItems.filter((i) => i.item_id !== item.item_id);
                      setSelectedItems(newItems);
                      console.log("🗑️ Service removed from selection:", {
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
            {isDurationExceedsOriginal && isSlotBooking && (
              <View style={{ marginTop: 12, padding: 12, backgroundColor: "#FFEBEE", borderRadius: 8 }}>
                <Text style={{ color: "#d32f2f", fontSize: 12 }}>
                  ⚠️ Tổng thời gian dịch vụ vượt quá tổng thời gian các slot đã đặt ban đầu. Vui lòng chọn lại dịch vụ.
                </Text>
              </View>
            )}
            <View style={{ marginTop: 16, flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1, padding: 12, backgroundColor: "#F3F4F6", borderRadius: 8, alignItems: "center" }}>
                <Text style={{ color: "#52c41a", fontSize: 18, fontWeight: "600" }}>
                  {totalPrice.toLocaleString()} VNĐ
                </Text>
                <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Tổng giá</Text>
              </View>
              <View style={{ flex: 1, padding: 12, backgroundColor: "#F3F4F6", borderRadius: 8, alignItems: "center" }}>
                <Text style={{ color: "#1890ff", fontSize: 18, fontWeight: "600" }}>
                  {totalDuration} phút
                </Text>
                <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Tổng thời gian</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Bay and Slot Selection */}
        {isSlotBooking && selectedBranch && bookingDate && (
          <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
            <Card.Title title="Khu vực chăm sóc và thời gian" />
            <Divider />
            <Card.Content>
              {/* Bay Selection */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>Khu vực dịch vụ</Text>
                {isDurationExceedsOriginal && (
                  <View style={{ marginBottom: 8, padding: 12, backgroundColor: "#FFEBEE", borderRadius: 8 }}>
                    <Text style={{ color: "#d32f2f", fontSize: 12 }}>
                      Không thể đổi slot khi dịch vụ vượt quá thời gian slot ban đầu
                    </Text>
                  </View>
                )}
                {totalDuration > 60 && !isDurationExceedsOriginal && (
                  <View style={{ marginBottom: 8, padding: 12, backgroundColor: "#E3F2FD", borderRadius: 8 }}>
                    <Text style={{ fontSize: 12 }}>
                      Dịch vụ yêu cầu {Math.ceil(totalDuration / 60)} slot liên tiếp ({totalDuration} phút)
                    </Text>
                  </View>
                )}
                {totalDuration <= 0 && (
                  <View style={{ marginBottom: 8, padding: 12, backgroundColor: "#FFF7E6", borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, color: "#faad14" }}>
                      Vui lòng chọn dịch vụ để xem các mốc thời gian khả dụng
                    </Text>
                  </View>
                )}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {serviceBays.slice(0, 8).map((bay) => (
                      <TouchableOpacity
                        key={bay.bay_id}
                        onPress={() => {
                          setSelectedBay(bay);
                          // Clear available slots to force reload for new bay
                          setAvailableSlots([]);
                          // Check if this is the original bay and date
                          const currentDateStr = formatDateString(bookingDate);
                          const isOriginalBay = originalSlot && originalSlot.bayId === bay.bay_id;
                          const isOriginalDate = originalSlot && originalSlot.date === currentDateStr;
                          
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
                          borderColor: selectedBay?.bay_id === bay.bay_id ? "#1890ff" : "#d9d9d9",
                          backgroundColor: selectedBay?.bay_id === bay.bay_id ? "#E6F7FF" : "#fff",
                          minWidth: 100,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontWeight: "600" }}>{bay.bay_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Slot Selection */}
              {selectedBay && totalDuration > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 8 }}>
                    Chọn thời gian
                  </Text>
                  {loadingSlots ? (
                    <View style={{ padding: 20, alignItems: "center" }}>
                      <ActivityIndicator />
                      <Text style={{ marginTop: 8, fontSize: 12 }}>Đang tải danh sách slot...</Text>
                    </View>
                  ) : availableSlots.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {availableSlots.map((slot, index) => {
                          const canSelect = canSelectSlot(slot);
                          const isSelected = selectedSlot && selectedSlot.time === slot.time;
                          
                          // Get status color and label based on availability
                          const getSlotStatusInfo = (isAvailable: boolean) => {
                            if (isAvailable) {
                              return { color: "#52c41a", bgColor: "#F6FFED", borderColor: "#52c41a", label: "Trống", textColor: "#52c41a" };
                            } else {
                              return { color: "#ff4d4f", bgColor: "#FFF2F0", borderColor: "#ff4d4f", label: "Không khả dụng", textColor: "#ff4d4f" };
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
                              <Text style={{ fontSize: 14, fontWeight: "600" }}>{slot.time}</Text>
                              {!canSelect && (
                                <Text style={{ fontSize: 8, color: statusInfo.textColor, marginTop: 4, fontWeight: "500" }}>
                                  {statusInfo.label}
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  ) : (
                    <View style={{ padding: 12, backgroundColor: "#FFF7E6", borderRadius: 8 }}>
                      <Text style={{ fontSize: 12 }}>Không có slot khả dụng</Text>
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
                        Slot đã chọn: {selectedSlot.time} - {selectedSlot.endTime}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                        Service Bay: {selectedBay?.bay_name} • Ngày: {formatDateString(bookingDate)}
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
                          Hủy chọn slot
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
        <Card mode="elevated" style={{ borderRadius: 12, marginBottom: 16 }}>
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
            (isSlotBooking && !selectedSlot) ||
            isDurationExceedsOriginal
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
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" }}>
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
                style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}
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
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Chọn chi nhánh</Text>
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
                style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}
              >
                <Text style={{ fontWeight: "600" }}>{item.branch_name}</Text>
                {item.address && (
                  <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{item.address}</Text>
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
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e0e0e0" }}>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Chọn dịch vụ</Text>
          </View>
          <FlatList
            data={availableServices}
            keyExtractor={(item) => item.item_id}
            renderItem={({ item }) => {
              const isSelected = selectedItems.some((i) => i.item_id === item.item_id);
              return (
                <TouchableOpacity
                  onPress={() => {
                    if (isSelected) {
                      setSelectedItems(selectedItems.filter((i) => i.item_id !== item.item_id));
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
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600" }}>{item.item_name}</Text>
                      {item.service && (
                        <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                          {item.service.estimated_duration || 60} phút
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontWeight: "600", color: "#52c41a" }}>
                        {item.fixed_price?.toLocaleString()} VNĐ
                      </Text>
                      {isSelected && <Text style={{ fontSize: 10, color: "#1890ff", marginTop: 4 }}>Đã chọn</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: "#e0e0e0" }}>
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
        style={{ backgroundColor: snackbar.error ? theme.colors.error : theme.colors.primary }}
      >
        {snackbar.message}
      </Snackbar>
    </SafeAreaView>
  );
}