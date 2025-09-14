import { saveStats, loadStats, clearStats } from './statsPersistence';

export interface ConnectionEvent {
  timestamp: string;
  type: 'connect' | 'disconnect' | 'reconnect_attempt' | 'reconnect_success' | 'reconnect_failure';
  attemptNumber?: number;
  delay?: number;
  error?: string;
}

export interface ConnectionStats {
  totalDisconnects: number;
  totalReconnectAttempts: number;
  successfulReconnects: number;
  failedReconnects: number;
  averageReconnectTime: number;
  lastDisconnectTime: string | null;
  lastReconnectTime: string | null;
  events: ConnectionEvent[];
}

const DEFAULT_STATS: ConnectionStats = {
  totalDisconnects: 0,
  totalReconnectAttempts: 0,
  successfulReconnects: 0,
  failedReconnects: 0,
  averageReconnectTime: 0,
  lastDisconnectTime: null,
  lastReconnectTime: null,
  events: []
};

const MAX_EVENTS = 100;

export const loadConnectionStats = (): ConnectionStats => {
  const stats = loadStats();
  return stats || DEFAULT_STATS;
};

export const saveConnectionStats = (stats: ConnectionStats): void => {
  saveStats(stats);
};

export const addConnectionEvent = (event: ConnectionEvent): void => {
  const stats = loadConnectionStats();
  const now = new Date();

  // Update event history
  stats.events.push(event);
  if (stats.events.length > MAX_EVENTS) {
    stats.events = stats.events.slice(-MAX_EVENTS);
  }

  // Update statistics based on event type
  switch (event.type) {
    case 'disconnect':
      stats.totalDisconnects++;
      stats.lastDisconnectTime = now.toISOString();
      break;

    case 'reconnect_attempt':
      stats.totalReconnectAttempts++;
      break;

    case 'reconnect_success':
      stats.successfulReconnects++;
      stats.lastReconnectTime = now.toISOString();
      
      // Calculate average reconnect time
      if (stats.lastDisconnectTime) {
        const reconnectTime = now.getTime() - new Date(stats.lastDisconnectTime).getTime();
        stats.averageReconnectTime = stats.averageReconnectTime === 0
          ? reconnectTime
          : (stats.averageReconnectTime + reconnectTime) / 2;
      }
      break;

    case 'reconnect_failure':
      stats.failedReconnects++;
      break;
  }

  saveConnectionStats(stats);
};

export const getConnectionHealthScore = (): number => {
  const stats = loadConnectionStats();
  if (stats.totalReconnectAttempts === 0) return 100;

  const successRate = stats.successfulReconnects / stats.totalReconnectAttempts;
  const timeWeight = Math.min(1, 30000 / Math.max(1, stats.averageReconnectTime));
  
  return Math.round((successRate * 0.7 + timeWeight * 0.3) * 100);
};

export const clearConnectionStats = (): void => {
  clearStats();
};
