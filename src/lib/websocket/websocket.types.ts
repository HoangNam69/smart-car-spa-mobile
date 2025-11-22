
export type WebSocketStatus = 
  | 'DISCONNECTED' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'ERROR';

export type Topic = 
  | '/topic/bookings'
  | '/topic/vehicle-profiles'
  | '/topic/customers';

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

