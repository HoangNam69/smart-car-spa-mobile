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
  private isTokenExpired = false; // Flag để dừng retry khi token expired

  private async getToken(): Promise<string | null> {
    try {
      return await tokenStorage.getAccessToken();
    } catch (error) {
      console.error("[WebSocket] Error getting token:", error);
      return null;
    }
  }

  /**
   * Decode base64 string (React Native compatible)
   * React Native không có atob, dùng cách decode thủ công
   */
  private base64Decode(base64: string): string {
    try {
      // Base64URL decode (replace - với +, _ với /, và thêm padding nếu cần)
      const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
      
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let result = "";
      
      // Decode từng nhóm 4 ký tự
      for (let i = 0; i < padded.length; i += 4) {
        const enc1 = chars.indexOf(padded.charAt(i));
        const enc2 = chars.indexOf(padded.charAt(i + 1));
        const enc3 = chars.indexOf(padded.charAt(i + 2));
        const enc4 = chars.indexOf(padded.charAt(i + 3));
        
        if (enc1 === -1 || enc2 === -1) {
          break; // Invalid base64
        }
        
        const bitmap = (enc1 << 18) | (enc2 << 12) | ((enc3 !== -1 ? enc3 : 64) << 6) | (enc4 !== -1 ? enc4 : 64);
        
        result += String.fromCharCode((bitmap >> 16) & 255);
        if (enc3 !== -1 && enc3 !== 64) {
          result += String.fromCharCode((bitmap >> 8) & 255);
        }
        if (enc4 !== -1 && enc4 !== 64) {
          result += String.fromCharCode(bitmap & 255);
        }
      }
      
      return result;
    } catch (error) {
      console.error("[WebSocket] Error decoding base64:", error);
      throw error;
    }
  }

  /**
   * Check if JWT token is expired by decoding the payload
   * JWT format: header.payload.signature
   * Payload contains 'exp' claim (expiration timestamp in seconds)
   */
  private isTokenExpiredCheck(token: string): boolean {
    try {
      // JWT có 3 parts được phân cách bởi dấu chấm
      const parts = token.split(".");
      if (parts.length !== 3) {
        console.warn("[WebSocket] Invalid token format");
        return true; // Coi như expired nếu format không đúng
      }

      // Decode payload (base64url)
      const payload = parts[1];
      const decoded = this.base64Decode(payload);
      const claims = JSON.parse(decoded);

      // Check exp claim (expiration time in seconds)
      if (!claims.exp) {
        console.warn("[WebSocket] Token has no expiration claim");
        return true;
      }

      const expirationTime = claims.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const isExpired = currentTime >= expirationTime;

      if (isExpired) {
        const expiredSecondsAgo = Math.floor((currentTime - expirationTime) / 1000);
        console.error(
          `[WebSocket] Token expired ${expiredSecondsAgo} seconds ago (exp: ${new Date(expirationTime).toISOString()}, now: ${new Date(currentTime).toISOString()})`
        );
      }

      return isExpired;
    } catch (error) {
      console.error("[WebSocket] Error checking token expiration:", error);
      return true; // Coi như expired nếu không thể decode
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

    // Reset token expired flag khi bắt đầu connect mới
    this.isTokenExpired = false;

    const token = await this.getToken();
    if (!token) {
      console.error("[WebSocket] Cannot connect: No token available");
      this.setStatus("ERROR");
      return;
    }

    // Check token expiration trước khi connect
    if (this.isTokenExpiredCheck(token)) {
      console.error(
        "[WebSocket] Cannot connect: Token is expired. Please refresh token or login again."
      );
      this.isTokenExpired = true; // Set flag để dừng retry
      this.setStatus("ERROR");
      this.reconnectAttempts = this.maxReconnectAttempts; // Set max attempts để không retry
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
        
        // Check nếu error liên quan đến authentication (token expired/invalid)
        const errorMessage = frame?.body || frame?.headers?.message || "";
        if (
          errorMessage.toLowerCase().includes("expired") ||
          errorMessage.toLowerCase().includes("unauthorized") ||
          errorMessage.toLowerCase().includes("invalid token")
        ) {
          console.error(
            "[WebSocket] Authentication error detected. Token may be expired or invalid."
          );
          this.isTokenExpired = true;
          this.reconnectAttempts = this.maxReconnectAttempts; // Dừng retry
        }
        
        this.setStatus("ERROR");
      },

      // Event: WebSocket connection closed
      onWebSocketClose: (event: CloseEvent) => {
        console.log("[WebSocket] Connection closed", {
          code: event?.code,
          reason: event?.reason,
          wasClean: event?.wasClean,
        });
        
        // Check nếu close code là 1006 (abnormal closure) và token expired
        // 1006 thường xảy ra khi handshake fail (token expired)
        if (event?.code === 1006 && this.isTokenExpired) {
          console.error(
            "[WebSocket] Connection closed due to token expiration. Will not retry."
          );
        }
        
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

      // Check nếu token expired, dừng retry ngay lập tức
      if (this.isTokenExpired) {
        console.error(
          "[WebSocket] Token expired detected. Stopping reconnection attempts. Please refresh token or login again."
        );
        this.reconnectAttempts = this.maxReconnectAttempts; // Set max để không retry
        return;
      }

      // Auto reconnect với exponential backoff (chỉ khi không phải token expired)
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay =
          WS_CONFIG.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        console.log(
          `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
        );

        setTimeout(() => {
          // Check lại token trước khi retry
          this.getToken().then((token) => {
            if (token && this.isTokenExpiredCheck(token)) {
              console.error(
                "[WebSocket] Token expired during retry. Stopping reconnection."
              );
              this.isTokenExpired = true;
              this.reconnectAttempts = this.maxReconnectAttempts;
              this.setStatus("ERROR");
              return;
            }

            if (this.status !== "CONNECTED" && !this.isTokenExpired) {
              this.connect();
            }
          });
        }, delay);
      } else {
        console.error(
          "[WebSocket] Max reconnection attempts reached. Please check:"
        );
        console.error("  1. Backend endpoint /ws-native is available");
        console.error("  2. Network connectivity");
        console.error("  3. Token is valid and not expired");
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
