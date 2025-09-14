import { ConnectionStats, ConnectionEvent } from './socketAnalytics';

const STATS_STORAGE_KEY = 'electric-maze-connection-stats';
const MAX_EVENTS = 1000;

export interface StoredStats {
  stats: ConnectionStats;
  lastUpdated: string;
  version: string;
}

export const saveStats = (stats: ConnectionStats): void => {
  try {
    // Trim events if they exceed the maximum
    if (stats.events.length > MAX_EVENTS) {
      stats = {
        ...stats,
        events: stats.events.slice(-MAX_EVENTS)
      };
    }

    const storedStats: StoredStats = {
      stats,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };

    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(storedStats));
  } catch (error) {
    console.warn('Failed to save connection stats:', error);
  }
};

export const loadStats = (): ConnectionStats | null => {
  try {
    const stored = localStorage.getItem(STATS_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as StoredStats;
    
    // Version check and migration if needed
    if (parsed.version !== '1.0.0') {
      console.warn(`Stats version mismatch: ${parsed.version}`);
      // Add migration logic here if needed in the future
    }

    // Validate basic structure
    if (!parsed.stats || !Array.isArray(parsed.stats.events)) {
      console.error('Invalid stats structure');
      return null;
    }

    // Validate event structure
    const validEvents = parsed.stats.events.filter((event: any): event is ConnectionEvent => {
      return (
        event &&
        typeof event === 'object' &&
        typeof event.timestamp === 'string' &&
        typeof event.type === 'string' &&
        ['connect', 'disconnect', 'reconnect_attempt', 'reconnect_success', 'reconnect_failure'].includes(event.type)
      );
    });

    // If any events were filtered out, log a warning
    if (validEvents.length !== parsed.stats.events.length) {
      console.warn(`Filtered out ${parsed.stats.events.length - validEvents.length} invalid events`);
    }

    // Return validated stats
    return {
      ...parsed.stats,
      events: validEvents
    };
  } catch (error) {
    console.error('Failed to load connection stats:', error);
    return null;
  }
};

export const clearStats = (): void => {
  try {
    localStorage.removeItem(STATS_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear connection stats:', error);
  }
};

export const migrateStats = (stats: ConnectionStats): ConnectionStats => {
  // Add migration logic here when needed
  return stats;
};
