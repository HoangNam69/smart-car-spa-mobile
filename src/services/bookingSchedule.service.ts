import axiosInstance from "../config/axiosConfig";

export interface TimeSlotDto {
  bayId: string;
  bayName: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  status: "AVAILABLE" | "BOOKED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "BLOCKED" | "MAINTENANCE" | "UNAVAILABLE";
  durationMinutes: number;
}

export const bookingScheduleService = {
  async getAvailableSlots(params: { branchId: string; date: string; serviceDurationMinutes: number; bayId?: string }): Promise<TimeSlotDto[]> {
    const res = await axiosInstance.get(`/booking-schedule/available-slots`, { params });
    const api = res.data;
    if (api?.success && api?.data) return api.data as TimeSlotDto[];
    return [];
  },
};


