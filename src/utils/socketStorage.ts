const SOCKET_STORAGE_KEY = 'electric-maze-socket-state';

export interface SocketState {
  lastConnected: string | null;
  lastDisconnected: string | null;
  reconnectAttempts: number;
  lastError: string | null;
}

export const saveSocketState = (state: SocketState): void => {
  try {
    localStorage.setItem(SOCKET_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save socket state:', error);
  }
};

export const loadSocketState = (): SocketState | null => {
  try {
    const stored = localStorage.getItem(SOCKET_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return null;

    // Validate structure
    const requiredFields = ['lastConnected', 'lastDisconnected', 'reconnectAttempts', 'lastError'];
    if (!requiredFields.every(field => field in parsed)) {
      return null;
    }

    return parsed as SocketState;
  } catch (error) {
    console.warn('Failed to load socket state:', error);
    return null;
  }
};

export const clearSocketState = (): void => {
  try {
    localStorage.removeItem(SOCKET_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear socket state:', error);
  }
};
