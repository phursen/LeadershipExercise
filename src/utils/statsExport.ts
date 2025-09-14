import { ConnectionStats, ConnectionEvent } from './socketAnalytics';

interface ExportData {
  stats: ConnectionStats;
  chartData: ChartData[];
  trends: TrendData;
  metadata: ExportMetadata;
}

interface ChartData {
  timestamp: string;
  averageReconnectTime: number;
  disconnectCount: number;
  reconnectAttempts: number;
  successfulReconnects: number;
  successRate: number;
}

interface TrendData {
  disconnectFrequency: number;
  reconnectSuccessRate: number;
  averageReconnectTime: number;
  trendDirection: 'improving' | 'stable' | 'degrading';
  periodStart: string;
  periodEnd: string;
}

interface ExportMetadata {
  exportedAt: string;
  timeRange: {
    start: string | null;
    end: string | null;
  };
  version: string;
  totalEvents: number;
}

export const generateExportData = (
  stats: ConnectionStats,
  events: ConnectionEvent[],
  timeRange: { start: string | null; end: string | null }
): ExportData => {
  const now = new Date();
  const periodEnd = timeRange.end ? new Date(timeRange.end) : now;
  const periodStart = timeRange.start 
    ? new Date(timeRange.start)
    : new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Generate chart data
  const totalPeriod = periodEnd.getTime() - periodStart.getTime();
  const intervalCount = 12;
  const intervalSize = totalPeriod / intervalCount;

  const chartData = Array.from({ length: intervalCount }, (_, i) => {
    const intervalStart = new Date(periodStart.getTime() + i * intervalSize);
    const intervalEnd = new Date(periodStart.getTime() + (i + 1) * intervalSize);

    const intervalEvents = events.filter(e => {
      const eventTime = new Date(e.timestamp);
      return eventTime >= intervalStart && eventTime < intervalEnd;
    });

    let totalReconnectTime = 0;
    let reconnectCount = 0;
    intervalEvents.forEach((event) => {
      if (event.type === 'disconnect') {
        const reconnectEvent = events.find(e => 
          new Date(e.timestamp) > new Date(event.timestamp) &&
          (e.type === 'reconnect_success' || e.type === 'connect')
        );
        if (reconnectEvent) {
          totalReconnectTime += new Date(reconnectEvent.timestamp).getTime() - 
            new Date(event.timestamp).getTime();
          reconnectCount++;
        }
      }
    });

    const disconnects = intervalEvents.filter(e => e.type === 'disconnect').length;
    const reconnectAttempts = intervalEvents.filter(e => e.type === 'reconnect_attempt').length;
    const successfulReconnects = intervalEvents.filter(e => e.type === 'reconnect_success').length;

    return {
      timestamp: intervalStart.toISOString(),
      averageReconnectTime: reconnectCount > 0 ? totalReconnectTime / reconnectCount : 0,
      disconnectCount: disconnects,
      reconnectAttempts,
      successfulReconnects,
      successRate: reconnectAttempts > 0 ? (successfulReconnects / reconnectAttempts) * 100 : 100
    };
  });

  // Calculate trends
  const midPoint = new Date(periodStart.getTime() + totalPeriod / 2);
  const recentEvents = events.filter(e => new Date(e.timestamp) >= midPoint);
  const previousEvents = events.filter(e => new Date(e.timestamp) < midPoint);

  const calculateMetrics = (periodEvents: ConnectionEvent[]) => {
    const disconnects = periodEvents.filter(e => e.type === 'disconnect').length;
    const reconnectAttempts = periodEvents.filter(e => e.type === 'reconnect_attempt').length;
    const successfulReconnects = periodEvents.filter(e => e.type === 'reconnect_success').length;

    const periodDuration = totalPeriod / 2 / (1000 * 60 * 60);
    const disconnectFrequency = disconnects / periodDuration;
    const reconnectSuccessRate = reconnectAttempts > 0 
      ? (successfulReconnects / reconnectAttempts) * 100 
      : 100;

    let totalReconnectTime = 0;
    let reconnectCount = 0;
    periodEvents.forEach((event) => {
      if (event.type === 'disconnect') {
        const reconnectEvent = periodEvents.find(e => 
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

  const recentMetrics = calculateMetrics(recentEvents);
  const previousMetrics = calculateMetrics(previousEvents);

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

  const trends: TrendData = {
    ...recentMetrics,
    trendDirection: getTrendDirection(),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString()
  };

  // Generate metadata
  const metadata: ExportMetadata = {
    exportedAt: new Date().toISOString(),
    timeRange,
    version: '1.0.0',
    totalEvents: events.length
  };

  return {
    stats,
    chartData,
    trends,
    metadata
  };
};

export const exportStats = (
  stats: ConnectionStats,
  events: ConnectionEvent[],
  timeRange: { start: string | null; end: string | null }
): void => {
  const exportData = generateExportData(stats, events, timeRange);
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `connection-stats-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
