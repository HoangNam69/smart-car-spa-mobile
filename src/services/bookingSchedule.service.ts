import axiosInstance from "../config/axiosConfig";

// Legacy TimeSlotDto - kept for backward compatibility
export interface TimeSlotDto {
  bayId: string;
  bayName: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  status: "AVAILABLE" | "BOOKED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "BLOCKED" | "MAINTENANCE" | "UNAVAILABLE";
  durationMinutes: number;
}

// New time range types
export interface TimeRangeDto {
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
}

export interface WorkingHoursDto {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

export interface AvailableTimeRangesResponse {
  date: string; // YYYY-MM-DD format
  bay_id: string;
  bay_name: string;
  working_hours: WorkingHoursDto;
  available_time_ranges: TimeRangeDto[];
}

export interface GetAvailableTimeRangesRequest {
  bay_id: string;
  date: string; // YYYY-MM-DD format
  duration_minutes?: number;
}

// Slot info for UI display (simplified from TimeSlotDto)
export interface SlotInfo {
  time: string; // HH:mm format
  isAvailable: boolean;
}

export const bookingScheduleService = {
  /**
   * Legacy method - kept for backward compatibility
   * @deprecated Use getAvailableTimeRanges instead
   */
  async getAvailableSlots(params: { branchId: string; date: string; serviceDurationMinutes: number; bayId?: string }): Promise<TimeSlotDto[]> {
    const res = await axiosInstance.get(`/booking-schedule/available-slots`, { params });
    const api = res.data;
    if (api?.success && api?.data) return api.data as TimeSlotDto[];
    return [];
  },

  /**
   * Get available time ranges for a bay on a specific date
   * Backend trả về time ranges, frontend tự xử lý để hiển thị slots
   */
  async getAvailableTimeRanges(
    request: GetAvailableTimeRangesRequest
  ): Promise<AvailableTimeRangesResponse> {
    try {
      const params = new URLSearchParams({
        bayId: request.bay_id,
        date: request.date,
      });

      if (request.duration_minutes) {
        params.append('durationMinutes', request.duration_minutes.toString());
      }

      const response = await axiosInstance.get(
        `/booking-schedule/available-time-ranges?${params.toString()}`
      );
      
      const api = response.data;
      if (api?.success && api?.data) {
        return api.data as AvailableTimeRangesResponse;
      } else {
        throw new Error("Failed to get available time ranges");
      }
    } catch (error: any) {
      console.error("Get available time ranges error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Helper method: Convert time ranges to time slots for UI display
   * Frontend tự xử lý để hiển thị các mốc thời gian cố định (8:00, 8:30, 9:00, ...)
   * 
   * @param timeRanges - Available time ranges from backend
   * @param workingHours - Working hours from backend
   * @param serviceDurationMinutes - Duration of service in minutes
   * @param slotIntervalMinutes - Interval between slots (default: 30 minutes)
   * @returns Array of time slots with availability status
   */
  convertTimeRangesToSlots(
    timeRanges: Array<{ start_time: string; end_time: string }>,
    workingHours: { start: string; end: string },
    serviceDurationMinutes: number,
    slotIntervalMinutes: number = 30
  ): SlotInfo[] {
    const slots: SlotInfo[] = [];

    // Generate slots from working hours
    const workingStart = this.parseTime(workingHours.start);
    const workingEnd = this.parseTime(workingHours.end);

    let current = workingStart;
    while (current < workingEnd) {
      const timeStr = this.formatTime(current);
      const slotEnd = current + serviceDurationMinutes;
      
      // Check if this slot fits within any available time range
      const isAvailable = timeRanges.some((range) => {
        const rangeStart = this.parseTime(range.start_time);
        const rangeEnd = this.parseTime(range.end_time);
        // Slot is available if it starts within range and ends before range ends
        return current >= rangeStart && slotEnd <= rangeEnd;
      });

      slots.push({
        time: timeStr,
        isAvailable,
      });
      current = this.addMinutes(current, slotIntervalMinutes);
    }

    return slots;
  },

  /**
   * Helper: Parse time string (HH:mm) to minutes since midnight
   */
  parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  },

  /**
   * Helper: Format minutes since midnight to time string (HH:mm)
   */
  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },

  /**
   * Helper: Add minutes to time
   */
  addMinutes(timeMinutes: number, minutesToAdd: number): number {
    return timeMinutes + minutesToAdd;
  },
};


