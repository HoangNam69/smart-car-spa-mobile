import axiosInstance from "../config/axiosConfig";

export interface ServiceProcessTrackingInfoDto {
  trackingId: string;
  bookingId: string;
  bookingCode?: string;
  customerName?: string;
  customerPhone?: string;
  vehicleLicensePlate?: string;
  serviceStepId: string;
  serviceStepName?: string;
  serviceStepDescription?: string;
  serviceStepOrder?: number;
  estimatedTime?: number;
  isRequired?: boolean;
  carServiceId?: string;
  technicianId: string;
  technicianName?: string;
  bayId: string;
  bayName?: string;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  progressPercent?: number;
  notes?: string;
  evidenceMediaUrls?: string;
}

export const serviceProcessTrackingService = {
  async getTrackingsByBooking(bookingId: string): Promise<ServiceProcessTrackingInfoDto[]> {
    try {
      const res = await axiosInstance.get(`/service-process-trackings/booking/${bookingId}`);
      const api = res.data;
      if (api?.success && api?.data) return api.data as ServiceProcessTrackingInfoDto[];
      return [];
    } catch {
      return [];
    }
  },
};

