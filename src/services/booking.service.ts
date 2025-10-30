import axiosInstance from "../config/axiosConfig";

export interface BookingItemDto {
  service_id?: string;
  item_name?: string;
}

export interface BookingInfoDto {
  booking_id: string;
  booking_code: string;
  status: string;
  scheduled_start_at: string;
  scheduled_end_at?: string;
  total_price?: number;
  currency?: string;
  branch_id?: string;
  branch_name?: string;
  bay_name?: string;
  vehicle_license_plate?: string;
  vehicle_brand_name?: string;
  vehicle_model_name?: string;
  payment_status?: string;
  booking_items?: BookingItemDto[];
}

export const bookingService = {
  async getCustomerBookings(userId: string): Promise<BookingInfoDto[]> {
    try {
      // Primary endpoint aligned with web app
      const res = await axiosInstance.get(`/customers/${userId}/bookings`);
      const api = res.data;
      if (api?.success && api?.data) return api.data as BookingInfoDto[];
    } catch (_) {
      // Fallback to query param variant
      try {
        const alt = await axiosInstance.get(`/bookings?customerId=${userId}`);
        const api2 = alt.data;
        if (api2?.success && api2?.data) return api2.data as BookingInfoDto[];
      } catch (_) {
        // ignore
      }
    }
    return [];
  },

  async createBooking(data: any) {
    const res = await axiosInstance.post(
      "/integrated-booking/create-with-slot",
      data
    );
    const api = res.data;
    if (!api?.success || !api?.data)
      throw new Error(api?.message || "Tạo lịch thất bại");
    return api.data as BookingInfoDto;
  },

  async getBookingById(bookingId: string): Promise<BookingInfoDto | null> {
    try {
      const res = await axiosInstance.get(`/bookings/${bookingId}`);
      const api = res.data;
      if (api?.success && api?.data) return api.data as BookingInfoDto;
      return null;
    } catch {
      return null;
    }
  },
};
