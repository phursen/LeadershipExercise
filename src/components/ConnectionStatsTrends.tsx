import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Tooltip
} from '@mui/material';
import { ConnectionEvent } from '../utils/socketAnalytics';

interface ConnectionStatsTrendsProps {
  events: ConnectionEvent[];
  timeRange: {
    start: string | null;
    end: string | null;
  };
}

interface TrendMetrics {
  disconnectFrequency: number;
  reconnectSuccessRate: number;
  averageReconnectTime: number;
  trendDirection: 'improving' | 'stable' | 'degrading';
  comparisonPeriod: string;
}

const ConnectionStatsTrends: React.FC<ConnectionStatsTrendsProps> = ({
  events,
  timeRange
}) => {
  const theme = useTheme();

  const calculateTrends = (events: ConnectionEvent[]): TrendMetrics => {
    const now = new Date();
    const periodEnd = timeRange.end ? new Date(timeRange.end) : now;
    const periodStart = timeRange.start 
      ? new Date(timeRange.start)
      : new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to last 24 hours

    const totalPeriod = periodEnd.getTime() - periodStart.getTime();
    const midPoint = new Date(periodStart.getTime() + totalPeriod / 2);

    // Split events into recent and previous periods
    const recentEvents = events.filter(e => new Date(e.timestamp) >= midPoint);
    const previousEvents = events.filter(e => new Date(e.timestamp) < midPoint);

    // Calculate metrics for both periods
    const calculatePeriodMetrics = (periodEvents: ConnectionEvent[]) => {
      const disconnects = periodEvents.filter(e => e.type === 'disconnect').length;
      const reconnectAttempts = periodEvents.filter(e => e.type === 'reconnect_attempt').length;
      const successfulReconnects = periodEvents.filter(e => e.type === 'reconnect_success').length;
      
      const periodDuration = totalPeriod / 2 / (1000 * 60 * 60); // hours
      const disconnectFrequency = disconnects / periodDuration;
      const reconnectSuccessRate = reconnectAttempts > 0 
        ? (successfulReconnects / reconnectAttempts) * 100 
        : 100;

      // Calculate average reconnect time
      let totalReconnectTime = 0;
      let reconnectCount = 0;
      
      periodEvents.forEach((event, index) => {
        if (event.type === 'disconnect') {
          const reconnectEvent = periodEvents.slice(index).find(e => 
            e.type === 'reconnect_success' || e.type === 'connect'
          );
          if (reconnectEvent) {
            totalReconnectTime += new Date(reconnectEvent.timestamp).getTime() - 
              new Date(event.timestamp).getTime();
            reconnectCount++;
          }
        }
      });

      return {
        disconnectFrequency,
        reconnectSuccessRate,
        averageReconnectTime: reconnectCount > 0 ? totalReconnectTime / reconnectCount : 0
      };
    };

    const recentMetrics = calculatePeriodMetrics(recentEvents);
    const previousMetrics = calculatePeriodMetrics(previousEvents);

    // Determine trend direction
    const getTrendDirection = () => {
      const metrics = [
        recentMetrics.disconnectFrequency < previousMetrics.disconnectFrequency,
        recentMetrics.reconnectSuccessRate > previousMetrics.reconnectSuccessRate,
        recentMetrics.averageReconnectTime < previousMetrics.averageReconnectTime
      ];

      const improvements = metrics.filter(Boolean).length;
      if (improvements >= 2) return 'improving';
      if (improvements <= 1) return 'degrading';
      return 'stable';
    };

    return {
      ...recentMetrics,
      trendDirection: getTrendDirection(),
      comparisonPeriod: `${Math.round(totalPeriod / (1000 * 60 * 60 * 2))}h`
    };
  };

  const trends = useMemo(() => calculateTrends(events), [events, timeRange]);

  const TrendIndicator: React.FC<{ value: number; label: string; unit: string; improved: boolean }> = ({
    value,
    label,
    unit,
    improved
  }) => (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Typography variant="h6" color={improved ? 'success.main' : 'error.main'}>
        {value.toFixed(1)}{unit}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );

  const formatDuration = (ms: number) => {
    if (ms === 0) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Connection Trends
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comparing last {trends.comparisonPeriod} vs previous {trends.comparisonPeriod}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
        <TrendIndicator
          value={trends.disconnectFrequency}
          label="Disconnects/Hour"
          unit=""
          improved={trends.disconnectFrequency < 1}
        />
        <TrendIndicator
          value={trends.reconnectSuccessRate}
          label="Reconnect Success"
          unit="%"
          improved={trends.reconnectSuccessRate > 90}
        />
        <TrendIndicator
          value={trends.averageReconnectTime / 1000}
          label="Avg Reconnect Time"
          unit="s"
          improved={trends.averageReconnectTime < 3000}
        />
      </Box>

      <Box sx={{ 
        p: 2, 
        bgcolor: trends.trendDirection === 'improving'
          ? theme.palette.success.main + '10'
          : trends.trendDirection === 'degrading'
            ? theme.palette.error.main + '10'
            : theme.palette.warning.main + '10',
        borderRadius: 1
      }}>
        <Typography 
          variant="body1"
          color={
            trends.trendDirection === 'improving'
              ? 'success.main'
              : trends.trendDirection === 'degrading'
                ? 'error.main'
                : 'warning.main'
          }
        >
          Connection stability is {trends.trendDirection}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ConnectionStatsTrends;
