/**
 * Simple event emitter for auth-related events
 * Used to notify AuthContext when tokens are revoked externally (e.g., password change)
 */

type AuthEventListener = () => void;

class AuthEventEmitter {
  private listeners: AuthEventListener[] = [];

  /**
   * Subscribe to auth logout events
   */
  onLogout(listener: AuthEventListener) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Emit logout event (called when tokens are revoked)
   */
  emitLogout() {
    console.log('[AuthEventEmitter] Emitting logout event to', this.listeners.length, 'listeners');
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('[AuthEventEmitter] Error in logout listener:', error);
      }
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.listeners = [];
  }
}

// Export singleton instance
export const authEventEmitter = new AuthEventEmitter();

