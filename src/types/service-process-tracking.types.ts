/**
 * Service Process Tracking Management Types
 * Type definitions for service process tracking-related API requests and responses
 * Updated to match backend ServiceProcessTrackingInfoDto
 */

export interface ServiceProcessTrackingInfoDto {
  // Core tracking info
  trackingId: string;

  // Booking information
  bookingId: string;
  bookingCode?: string;
  customerName?: string;
  customerPhone?: string;
  vehicleLicensePlate?: string;

  // Service step information
  serviceStepId: string;
  serviceStepName?: string;
  serviceStepDescription?: string;
  serviceStepOrder?: number;
  estimatedTime?: number;
  isRequired?: boolean;

  // Car service information
  carServiceId?: string;

  // Technician information
  technicianId: string;
  technicianName?: string;
  technicianCode?: string;

  // Bay information
  bayId: string;
  bayName?: string;
  bayCode?: string;

  // Timing information
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  actualDuration?: number;

  // Status and progress
  status: TrackingStatus;
  progressPercent?: number;

  // Additional information
  notes?: string;
  evidenceMediaUrls?: string;

  // Last update information
  lastUpdatedBy?: string;
  lastUpdatedByName?: string;
  lastUpdatedAt?: string;

  // Audit information
  createdAt: string;
  modifiedAt: string;
  createdBy?: string;
  modifiedBy?: string;

  // Calculated fields
  efficiency?: number;
  statusDisplay?: string;
  durationDisplay?: string;
  progressDisplay?: string;
}

export interface TrackingStepInfo {
  stepId: string;
  stepName: string;
  stepOrder: number;
  status: StepStatus;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  progress: number; // 0-100
  notes?: string;
  evidenceMedia?: string[];
  products?: TrackingStepProductInfo[];
}

export interface TrackingStepProductInfo {
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  usedQuantity?: number;
  notes?: string;
}

export enum TrackingStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum StepStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  SKIPPED = "SKIPPED",
}

export interface ServiceProcessTrackingFilterParam {
  // Filter by booking
  bookingId?: string;
  bookingCode?: string;

  // Filter by technician
  technicianId?: string;
  technicianName?: string;

  // Filter by slot
  slotId?: string;
  slotName?: string;

  // Filter by service step
  serviceStepId?: string;
  serviceStepName?: string;
  isRequired?: boolean;

  // Filter by status
  status?: TrackingStatus;

  // Filter by time range
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;

  // Filter by progress
  progressFrom?: number;
  progressTo?: number;

  // Filter by duration
  estimatedDurationFrom?: number;
  estimatedDurationTo?: number;
  actualDurationFrom?: number;
  actualDurationTo?: number;

  // Filter by branch (through booking)
  branchId?: string;
  branchName?: string;

  // Filter by customer (through booking)
  customerId?: string;
  customerName?: string;
  customerPhone?: string;

  // Filter by vehicle (through booking)
  vehicleId?: string;
  vehicleLicensePlate?: string;

  // Search text
  searchText?: string;
}

export interface CreateServiceProcessTrackingRequest {
  booking_id: string;
  service_step_id: string;
  technician_id?: string;
  bay_id?: string;
  car_service_id?: string;
  estimated_duration?: number;
  status?: TrackingStatus;
  progress_percent?: number;
  notes?: string;
  evidence_media_urls?: string;
}

export interface UpdateServiceProcessTrackingRequest {
  estimated_duration?: number;
  status?: TrackingStatus;
  progress_percent?: number;
  notes?: string;
  evidence_media_urls?: string;
}

export interface StartStepRequest {
  notes?: string;
}

export interface ProgressUpdateRequest {
  progress_percent?: number;
  media_url?: string;
  notes?: string;
}

export interface CompleteStepRequest {
  notes?: string;
  evidence_media_urls?: string;
}

export interface CancelStepRequest {
  reason: string;
}

export interface ServiceProcessTrackingResponse {
  success: boolean;
  message: string;
  data: ServiceProcessTrackingInfoDto;
}

export interface ServiceProcessTrackingListResponse {
  success: boolean;
  message: string;
  data: ServiceProcessTrackingInfoDto[];
}
