import { useEffect, useRef, useState } from 'react';
import { websocketService } from '../lib/websocket/websocket.service';
import { MessageSignal, WebSocketStatus, BookingEventDto, TrackingEventDto, EnhancedMessageCallback } from '../lib/websocket/websocket.types';

/**
 * Hook để subscribe booking reload notifications
 * 
 * MỤC ĐÍCH:
 * - Subscribe vào /topic/bookings
 * - Khi nhận signal "RELOAD_BOOKING", gọi onReload callback
 * - Tự động unsubscribe khi component unmount
 *
 * LÝ DO useRef cho callback:
 * - Callback có thể thay đổi (ví dụ: refetch function)
 * - useRef giữ reference mới nhất mà không trigger re-subscribe
 * - Tránh unsubscribe/subscribe lại mỗi khi callback thay đổi
 * 
 * @param onReload - Callback function được gọi khi nhận reload signal
 */
export function useBookingReload(onReload: () => void): void {
  // useRef để giữ reference mới nhất của callback
  const callbackRef = useRef(onReload);
  
  // Update callback ref khi nó thay đổi
  useEffect(() => {
    callbackRef.current = onReload;
  }, [onReload]);

  useEffect(() => {
    // Subscribe to booking topic
    const unsubscribe = websocketService.subscribe(
      '/topic/bookings',
      (signalOrEvent: MessageSignal | BookingEventDto) => {
        // Handle backward compatible string signal
        if (typeof signalOrEvent === 'string' && signalOrEvent === 'RELOAD_BOOKING') {
          console.log('[WebSocket] Booking reload signal received');
          callbackRef.current();
        }
        // Handle structured event (fallback to reload for now)
        else if (typeof signalOrEvent === 'object' && 'event_type' in signalOrEvent) {
          console.log('[WebSocket] Booking event received:', signalOrEvent.event_type);
          // For backward compatibility, still call reload callback
          // Components can use useBookingEvents hook for smart update
          callbackRef.current();
        }
      }
    );

    // Cleanup: unsubscribe khi component unmount
    return unsubscribe;
  }, []); // Empty deps: chỉ subscribe một lần khi mount
}

/**
 * Hook để subscribe vehicle profile reload notifications
 * 
 * TƯƠNG TỰ như useBookingReload nhưng cho vehicle profiles
 * 
 * @param onReload - Callback function được gọi khi nhận reload signal
 */
export function useVehicleProfileReload(onReload: () => void): void {
  const callbackRef = useRef(onReload);
  
  useEffect(() => {
    callbackRef.current = onReload;
  }, [onReload]);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe(
      '/topic/vehicle-profiles',
      (signal: MessageSignal) => {
        if (signal === 'RELOAD_VEHICLE_PROFILE') {
          console.log('[WebSocket] Vehicle profile reload signal received');
          callbackRef.current();
        }
      }
    );

    return unsubscribe;
  }, []);
}

/**
 * Hook để subscribe customer reload notifications
 * 
 * TƯƠNG TỰ như useBookingReload nhưng cho customers
 * 
 * @param onReload - Callback function được gọi khi nhận reload signal
 */
export function useCustomerReload(onReload: () => void): void {
  const callbackRef = useRef(onReload);
  
  useEffect(() => {
    callbackRef.current = onReload;
  }, [onReload]);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe(
      '/topic/customers',
      (signal: MessageSignal) => {
        if (signal === 'RELOAD_CUSTOMER') {
          console.log('[WebSocket] Customer reload signal received');
          callbackRef.current();
        }
      }
    );

    return unsubscribe;
  }, []);
}

/**
 * Hook để monitor WebSocket connection status
 * 
 * MỤC ĐÍCH:
 * - Theo dõi connection status trong React components
 * - Có thể dùng để hiển thị connection indicator trong UI
 *
 * @returns Current WebSocket connection status
 */
export function useWebSocketStatus(): WebSocketStatus {
  // State để store status
  const [status, setStatus] = useState<WebSocketStatus>(
    websocketService.getStatus() // Initial status
  );

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = websocketService.onStatusChange(setStatus);
    
    // Cleanup: unsubscribe khi component unmount
    return unsubscribe;
  }, []);

  return status;
}

/**
 * Hook để subscribe booking events với smart update
 * 
 * MỤC ĐÍCH:
 * - Subscribe vào /topic/bookings
 * - Xử lý structured BookingEventDto events
 * - Update specific booking thay vì reload toàn bộ
 * - Hiển thị notifications cho user
 * 
 * USAGE:
 * ```typescript
 * import { useQuery, useQueryClient } from '@tanstack/react-query';
 * import { useBookingEvents } from '@/hooks/useWebSocket';
 * 
 * function BookingScreen() {
 *   const queryClient = useQueryClient();
 *   const { data: bookings } = useQuery(['bookings'], fetchBookings);
 * 
 *   useBookingEvents({
 *     onBookingCreated: (event) => {
 *       if (event.booking_data) {
 *         queryClient.setQueryData(['bookings'], (old: Booking[]) => 
 *           [...(old || []), event.booking_data!]
 *         );
 *       }
 *     },
 *     onBookingUpdated: (event) => {
 *       if (event.booking_data) {
 *         queryClient.setQueryData(['bookings'], (old: Booking[]) => 
 *           old?.map(b => b.booking_id === event.booking_id ? event.booking_data! : b) || []
 *         );
 *       }
 *     },
 *     onBookingCancelled: (event) => {
 *       queryClient.setQueryData(['bookings'], (old: Booking[]) => 
 *         old?.filter(b => b.booking_id !== event.booking_id) || []
 *       );
 *     },
 *   });
 * }
 * ```
 * 
 * @param callbacks - Callbacks cho các loại events
 */
export function useBookingEvents(callbacks: {
  onBookingCreated?: (event: BookingEventDto) => void;
  onBookingConfirmed?: (event: BookingEventDto) => void;
  onBookingCancelled?: (event: BookingEventDto) => void;
  onBookingCheckedIn?: (event: BookingEventDto) => void;
  onBookingStarted?: (event: BookingEventDto) => void;
  onBookingCompleted?: (event: BookingEventDto) => void;
  onBookingUpdated?: (event: BookingEventDto) => void;
  onReload?: () => void; // Fallback for string signals
}): void {
  const callbacksRef = useRef(callbacks);
  
  // Update callbacks ref khi chúng thay đổi
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe(
      '/topic/bookings',
      (signalOrEvent: MessageSignal | BookingEventDto) => {
        // Handle backward compatible string signal
        if (typeof signalOrEvent === 'string' && signalOrEvent === 'RELOAD_BOOKING') {
          console.log('[WebSocket] Booking reload signal received');
          callbacksRef.current.onReload?.();
          return;
        }
        
        // Handle structured event
        if (typeof signalOrEvent === 'object' && 'event_type' in signalOrEvent) {
          const event = signalOrEvent as BookingEventDto;
          console.log('[WebSocket] Booking event received:', event.event_type, event.booking_code);
          
          // Call appropriate callback based on event type
          switch (event.event_type) {
            case 'CREATED':
              callbacksRef.current.onBookingCreated?.(event);
              break;
            case 'CONFIRMED':
              callbacksRef.current.onBookingConfirmed?.(event);
              break;
            case 'CANCELLED':
              callbacksRef.current.onBookingCancelled?.(event);
              break;
            case 'CHECKED_IN':
              callbacksRef.current.onBookingCheckedIn?.(event);
              break;
            case 'STARTED':
              callbacksRef.current.onBookingStarted?.(event);
              break;
            case 'COMPLETED':
              callbacksRef.current.onBookingCompleted?.(event);
              break;
            case 'UPDATED':
              callbacksRef.current.onBookingUpdated?.(event);
              break;
            default:
              console.warn('[WebSocket] Unknown booking event type:', event.event_type);
              // Fallback to reload
              callbacksRef.current.onReload?.();
          }
        }
      }
    );

    return unsubscribe;
  }, []); // Empty deps: chỉ subscribe một lần khi mount
}

/**
 * Hook để subscribe tracking events với smart update
 * 
 * MỤC ĐÍCH:
 * - Subscribe vào /topic/trackings
 * - Xử lý structured TrackingEventDto events
 * - Update specific tracking thay vì reload toàn bộ
 * - Hiển thị notifications cho user
 * 
 * USAGE:
 * ```typescript
 * import { useQuery, useQueryClient } from '@tanstack/react-query';
 * import { useTrackingEvents } from '@/hooks/useWebSocket';
 * 
 * function TrackingScreen() {
 *   const queryClient = useQueryClient();
 *   const { data: trackings } = useQuery(['trackings'], fetchTrackings);
 * 
 *   useTrackingEvents({
 *     onTrackingCreated: (event) => {
 *       if (event.tracking_data) {
 *         queryClient.setQueryData(['trackings'], (old: Tracking[]) => 
 *           [...(old || []), event.tracking_data!]
 *         );
 *       }
 *     },
 *     onTrackingUpdated: (event) => {
 *       if (event.tracking_data) {
 *         queryClient.setQueryData(['trackings'], (old: Tracking[]) => 
 *           old?.map(t => t.trackingId === event.tracking_id ? event.tracking_data! : t) || []
 *         );
 *       }
 *     },
 *   });
 * }
 * ```
 * 
 * @param callbacks - Callbacks cho các loại events
 */
export function useTrackingEvents(callbacks: {
  onTrackingCreated?: (event: TrackingEventDto) => void;
  onTrackingStarted?: (event: TrackingEventDto) => void;
  onTrackingUpdated?: (event: TrackingEventDto) => void;
  onTrackingCompleted?: (event: TrackingEventDto) => void;
  onTrackingCancelled?: (event: TrackingEventDto) => void;
  onReload?: () => void; // Fallback for string signals
}): void {
  const callbacksRef = useRef(callbacks);
  
  // Update callbacks ref khi chúng thay đổi
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe(
      '/topic/trackings',
      (signalOrEvent: MessageSignal | TrackingEventDto) => {
        // Handle backward compatible string signal
        if (typeof signalOrEvent === 'string' && signalOrEvent === 'RELOAD_TRACKING') {
          console.log('[WebSocket] Tracking reload signal received');
          callbacksRef.current.onReload?.();
          return;
        }
        
        // Handle structured event
        if (typeof signalOrEvent === 'object' && 'event_type' in signalOrEvent) {
          const event = signalOrEvent as TrackingEventDto;
          console.log('[WebSocket] Tracking event received:', event.event_type, event.tracking_id);
          
          // Call appropriate callback based on event type
          switch (event.event_type) {
            case 'CREATED':
              callbacksRef.current.onTrackingCreated?.(event);
              break;
            case 'STARTED':
              callbacksRef.current.onTrackingStarted?.(event);
              break;
            case 'UPDATED':
              callbacksRef.current.onTrackingUpdated?.(event);
              break;
            case 'COMPLETED':
              callbacksRef.current.onTrackingCompleted?.(event);
              break;
            case 'CANCELLED':
              callbacksRef.current.onTrackingCancelled?.(event);
              break;
            default:
              console.warn('[WebSocket] Unknown tracking event type:', event.event_type);
              // Fallback to reload
              callbacksRef.current.onReload?.();
          }
        }
      }
    );

    return unsubscribe;
  }, []); // Empty deps: chỉ subscribe một lần khi mount
}

/**
 * Hook để subscribe password changed notifications
 * 
 * MỤC ĐÍCH:
 * - Subscribe vào /topic/auth/{userId}
 * - Khi nhận signal "PASSWORD_CHANGED", logout user
 * - Tự động unsubscribe khi component unmount
 * 
 * USAGE:
 * ```typescript
 * usePasswordChanged(() => {
 *   // Logout user
 *   logout();
 *   router.replace('/auths/login');
 * }, userId);
 * ```
 * 
 * @param onPasswordChanged - Callback function được gọi khi password changed
 * @param userId - User ID để subscribe vào topic cụ thể
 */
export function usePasswordChanged(
  onPasswordChanged: () => void,
  userId: string | null
): void {
  const callbackRef = useRef(onPasswordChanged);
  
  useEffect(() => {
    callbackRef.current = onPasswordChanged;
  }, [onPasswordChanged]);

  useEffect(() => {
    if (!userId) {
      console.log('[usePasswordChanged] Skipping subscription: userId is null');
      return; // Don't subscribe if no userId
    }

    console.log('[usePasswordChanged] Subscribing to password changed notifications for userId:', userId);
    
    // Subscribe to user-specific auth topic
    const topic = `/topic/auth/${userId}`;
    console.log('[usePasswordChanged] Subscribing to topic:', topic);
    
    const unsubscribe = websocketService.subscribe(
      topic,
      (signal: MessageSignal) => {
        console.log('[usePasswordChanged] Received signal on topic', topic, ':', signal);
        if (signal === 'PASSWORD_CHANGED') {
          console.log('[usePasswordChanged] Password changed signal received, calling callback');
          callbackRef.current();
        }
      }
    );

    console.log('[usePasswordChanged] Subscription created for topic:', topic);

    return () => {
      console.log('[usePasswordChanged] Unsubscribing from topic:', topic);
      unsubscribe();
    };
  }, [userId]);
}

