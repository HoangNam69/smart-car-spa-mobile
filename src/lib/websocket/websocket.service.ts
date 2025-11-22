import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { getWebSocketUrl, WS_CONFIG } from "./websocket.config";
import {
  Topic,
  MessageSignal,
  MessageCallback,
  WebSocketStatus,
} from "./websocket.types";
import { tokenStorage } from "../../storage/tokenStorage";

import "text-encoding";

class WebSocketService {
  private client: Client | null = null;
  private status: WebSocketStatus = "DISCONNECTED";
  private subscriptions: Map<Topic, StompSubscription> = new Map();
  private callbacks: Map<Topic, Set<MessageCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private statusListeners: Set<(status: WebSocketStatus) => void> = new Set();

  private async getToken(): Promise<string | null> {
    try {
      return await tokenStorage.getAccessToken();
    } catch (error) {
      console.error("[WebSocket] Error getting token:", error);
      return null;
    }
  }

  /**
   * Build WebSocket URL với JWT token
   *
   * FORMAT: ws://host:port/ws-native?token=<JWT_TOKEN>
   */
  private async buildWebSocketUrl(): Promise<string> {
    const baseUrl = getWebSocketUrl();
    const token = await this.getToken();

    if (!token) {
      console.warn("[WebSocket] No token available");
      return baseUrl;
    }

    const urlWithToken = `${baseUrl}?token=${encodeURIComponent(token)}`;

    if (WS_CONFIG.debug) {
      console.log("[WebSocket] Building WebSocket URL:", {
        baseUrl,
        hasToken: !!token,
        url: urlWithToken.substring(0, 100) + "...",
      });
    }

    return urlWithToken;
  }

  private setStatus(status: WebSocketStatus): void {
    if (this.status === status) return;

    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));

    if (WS_CONFIG.debug) {
      console.log(`[WebSocket] Status changed: ${status}`);
    }
  }

  public onStatusChange(
    callback: (status: WebSocketStatus) => void
  ): () => void {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Connect to WebSocket
   *
   * QUAN TRỌNG: Mobile dùng Native WebSocket, KHÔNG dùng SockJS
   */
  public async connect(): Promise<void> {
    if (this.client?.active) {
      console.warn("[WebSocket] Already connected");
      return;
    }

    const token = await this.getToken();
    if (!token) {
      console.error("[WebSocket] Cannot connect: No token available");
      this.setStatus("ERROR");
      return;
    }

    this.setStatus("CONNECTING");

    // Build WebSocket URL với token
    const wsUrl = await this.buildWebSocketUrl();

    // Create STOMP client với Native WebSocket
    this.client = new Client({
      // Sử dụng webSocketFactory để tạo WebSocket instance từ React Native
      // React Native có WebSocket global, không cần import
      webSocketFactory: () => {
        if (WS_CONFIG.debug) {
          console.log("[WebSocket] Creating React Native WebSocket:", wsUrl);
        }
        // Sử dụng global WebSocket từ React Native
        return new WebSocket(wsUrl) as any;
      },

      // Reconnect configuration
      reconnectDelay: WS_CONFIG.reconnectDelay,

      // Heartbeat configuration
      heartbeatIncoming: WS_CONFIG.heartbeatIncoming,
      heartbeatOutgoing: WS_CONFIG.heartbeatOutgoing,

      // Debug logging
      debug: (str: string) => {
        if (WS_CONFIG.debug) {
          console.log(`[STOMP] ${str}`);
        }
      },

      // Event: Connection established
      onConnect: (frame) => {
        console.log("[WebSocket] Connected successfully", {
          server: frame?.headers?.server,
          version: frame?.headers?.version,
        });
        this.setStatus("CONNECTED");
        this.reconnectAttempts = 0;
        this.subscribeToAllTopics();
      },

      // Event: STOMP protocol error
      onStompError: (frame) => {
        console.error("[WebSocket] STOMP error:", frame);
        this.setStatus("ERROR");
      },

      // Event: WebSocket connection closed
      onWebSocketClose: (event: CloseEvent) => {
        console.log("[WebSocket] Connection closed", {
          code: event?.code,
          reason: event?.reason,
          wasClean: event?.wasClean,
        });
        this.setStatus("DISCONNECTED");
        this.subscriptions.clear();
      },

      // Event: Disconnected
      onDisconnect: () => {
        console.log("[WebSocket] Disconnected");
        this.setStatus("DISCONNECTED");
        this.subscriptions.clear();
      },
    });

    // Handle WebSocket connection errors
    this.client.onWebSocketError = (error: any) => {
      // Log chi tiết error để debug
      const errorMessage =
        error?.message || error?.toString() || "Unknown error";
      const errorType = error?.type || "unknown";
      const errorCode = error?.code || "N/A";

      console.error("[WebSocket] Connection error:", {
        message: errorMessage,
        type: errorType,
        code: errorCode,
        url: wsUrl.substring(0, 100) + "...",
      });

      // Log full error trong debug mode
      if (WS_CONFIG.debug) {
        console.error("[WebSocket] Full error object:", error);
      }

      this.setStatus("ERROR");

      // Auto reconnect với exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay =
          WS_CONFIG.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        console.log(
          `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
        );

        setTimeout(() => {
          if (this.status !== "CONNECTED") {
            this.connect();
          }
        }, delay);
      } else {
        console.error(
          "[WebSocket] Max reconnection attempts reached. Please check:"
        );
        console.error("  1. Backend endpoint /ws-native is available");
        console.error("  2. Network connectivity");
        console.error("  3. Token is valid");
        console.error("  4. Backend WebSocket server is running");
        this.setStatus("ERROR");
      }
    };

    // Activate client → start connection
    this.client.activate();
  }

  public disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
    }

    this.setStatus("DISCONNECTED");
    this.reconnectAttempts = 0;
  }

  public subscribe(topic: Topic, callback: MessageCallback): () => void {
    if (!this.callbacks.has(topic)) {
      this.callbacks.set(topic, new Set());
    }
    this.callbacks.get(topic)!.add(callback);

    if (this.subscriptions.has(topic)) {
      return () => {
        this.callbacks.get(topic)?.delete(callback);
      };
    }

    if (this.client && this.client.active && this.status === "CONNECTED") {
      this.subscribeToTopic(topic);
    } else {
      if (WS_CONFIG.debug) {
        console.log(
          `[WebSocket] Deferring subscription to ${topic} until connection established`
        );
      }
    }

    return () => {
      this.callbacks.get(topic)?.delete(callback);
      if (this.callbacks.get(topic)?.size === 0) {
        this.subscriptions.get(topic)?.unsubscribe();
        this.subscriptions.delete(topic);
      }
    };
  }

  private subscribeToTopic(topic: Topic): void {
    if (!this.client || !this.client.active || this.status !== "CONNECTED") {
      console.warn(`[WebSocket] Cannot subscribe to ${topic}: Not connected`);
      return;
    }

    if (this.subscriptions.has(topic)) {
      console.warn(`[WebSocket] Already subscribed to ${topic}`);
      return;
    }

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const signal = message.body as MessageSignal;

        if (WS_CONFIG.debug) {
          console.log(`[WebSocket] Received message from ${topic}:`, signal);
        }

        const callbacks = this.callbacks.get(topic);
        if (callbacks) {
          callbacks.forEach((callback) => {
            try {
              callback(signal);
            } catch (error) {
              console.error(
                `[WebSocket] Error in callback for ${topic}:`,
                error
              );
            }
          });
        }
      } catch (error) {
        console.error(
          `[WebSocket] Error processing message from ${topic}:`,
          error
        );
      }
    });

    this.subscriptions.set(topic, subscription);
    console.log(`[WebSocket] Subscribed to ${topic}`);
  }

  private subscribeToAllTopics(): void {
    const topics: Topic[] = [
      "/topic/bookings",
      "/topic/vehicle-profiles",
      "/topic/customers",
    ];

    topics.forEach((topic) => {
      if (this.callbacks.has(topic) && this.callbacks.get(topic)!.size > 0) {
        this.subscribeToTopic(topic);
      }
    });
  }

  public getStatus(): WebSocketStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === "CONNECTED" && this.client?.active === true;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
