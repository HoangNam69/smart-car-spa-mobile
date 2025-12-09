/**
 * Booking Info DTO (import từ booking types)
 * 
 * Sử dụng BookingInfoDto từ src/types/booking.types.ts
 * Re-export để dễ import trong websocket context
 */
import { BookingInfoDto } from '../../types/booking.types';
export type { BookingInfoDto };

export type WebSocketStatus = 
  | 'DISCONNECTED' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'ERROR';

export type Topic = 
  | '/topic/bookings'
  | '/topic/vehicle-profiles'
  | '/topic/customers'
  | '/topic/trackings';

export type MessageSignal = 
  | 'RELOAD_BOOKING'
  | 'RELOAD_VEHICLE_PROFILE'
  | 'RELOAD_CUSTOMER';

export type MessageCallback = (signal: MessageSignal) => void;

export interface WebSocketMessage {
  signal: MessageSignal;
  timestamp?: number;
  data?: unknown; // Optional data payload
}

/**
 * Booking Event Type
 * 
 * Enum cho các loại booking events từ backend
 */
export type BookingEventType = 
  | 'CREATED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'CHECKED_IN'
  | 'STARTED'
  | 'COMPLETED'
  | 'UPDATED';

/**
 * Booking Event DTO
 * 
 * Structured event message từ backend cho booking changes
 * Chứa thông tin chi tiết để frontend có thể update smart
 */
export interface BookingEventDto {
  event_type: BookingEventType;
  booking_id: string;
  booking_code: string;
  booking_data?: BookingInfoDto | null; // Optional - null nếu booking đã bị xóa
  timestamp: string; // ISO 8601 format
  message: string; // User-friendly message
}

/**
 * Enhanced Message Callback
 * 
 * Callback có thể nhận cả string signal (backward compatible) 
 * và structured BookingEventDto
 */
export type EnhancedMessageCallback = (
  signalOrEvent: MessageSignal | BookingEventDto
) => void;

/**
 * Tracking Event Type
 * 
 * Enum cho các loại tracking events từ backend
 */
export type TrackingEventType = 
  | 'CREATED'
  | 'STARTED'
  | 'UPDATED'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Tracking Event DTO
 * 
 * Structured event message từ backend cho tracking changes
 * Chứa thông tin chi tiết để frontend có thể update smart
 */
export interface TrackingEventDto {
  event_type: TrackingEventType;
  tracking_id: string;
  booking_id: string;
  booking_code: string;
  tracking_data?: ServiceProcessTrackingInfoDto | null; // Optional - null nếu tracking đã bị xóa
  timestamp: string; // ISO 8601 format
  message: string; // User-friendly message
}

/**
 * Service Process Tracking Info DTO (import từ tracking types)
 * 
 * Sử dụng ServiceProcessTrackingInfoDto từ src/types/service-process-tracking.types.ts
 * Re-export để dễ import trong websocket context
 */
import { ServiceProcessTrackingInfoDto } from '../../types/service-process-tracking.types';
export type { ServiceProcessTrackingInfoDto };

