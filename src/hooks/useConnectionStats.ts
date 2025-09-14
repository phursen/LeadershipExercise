import { useState, useEffect, useCallback } from 'react';
import { loadConnectionStats, getConnectionHealthScore, ConnectionStats } from '../utils/socketAnalytics';

export const useConnectionStats = (refreshInterval = 1000) => {
  const [stats, setStats] = useState<ConnectionStats>(loadConnectionStats());
  const [healthScore, setHealthScore] = useState(getConnectionHealthScore());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const refresh = useCallback(() => {
    setStats(loadConnectionStats());
    setHealthScore(getConnectionHealthScore());
  }, []);

  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval, isAutoRefresh]);

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefresh(prev => !prev);
  }, []);

  return {
    stats,
    healthScore,
    refresh,
    isAutoRefresh,
    toggleAutoRefresh
  };
};
