import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ConnectionEvent } from '../utils/socketAnalytics';

interface ConnectionStatsChartsProps {
  events: ConnectionEvent[];
  timeRange: {
    start: string | null;
    end: string | null;
  };
}

type ChartType = 'reconnectTime' | 'eventFrequency' | 'successRate';

const ConnectionStatsCharts: React.FC<ConnectionStatsChartsProps> = ({
  events,
  timeRange
}) => {
  const theme = useTheme();
  const [selectedChart, setSelectedChart] = React.useState<ChartType>('reconnectTime');

  const chartData = useMemo(() => {
    const now = new Date();
    const periodEnd = timeRange.end ? new Date(timeRange.end) : now;
    const periodStart = timeRange.start 
      ? new Date(timeRange.start)
      : new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const totalPeriod = periodEnd.getTime() - periodStart.getTime();
    const intervalCount = 12; // Number of data points
    const intervalSize = totalPeriod / intervalCount;

    const intervals = Array.from({ length: intervalCount }, (_, i) => ({
      start: new Date(periodStart.getTime() + i * intervalSize),
      end: new Date(periodStart.getTime() + (i + 1) * intervalSize)
    }));

    return intervals.map(interval => {
      const intervalEvents = events.filter(e => {
        const eventTime = new Date(e.timestamp);
        return eventTime >= interval.start && eventTime < interval.end;
      });

      // Calculate reconnect times
      let totalReconnectTime = 0;
      let reconnectCount = 0;
      intervalEvents.forEach((event, index) => {
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

      // Calculate event frequencies
      const disconnects = intervalEvents.filter(e => e.type === 'disconnect').length;
      const reconnectAttempts = intervalEvents.filter(e => e.type === 'reconnect_attempt').length;
      const successfulReconnects = intervalEvents.filter(e => e.type === 'reconnect_success').length;

      return {
        timestamp: interval.start.toISOString(),
        label: interval.start.toLocaleTimeString(),
        averageReconnectTime: reconnectCount > 0 ? totalReconnectTime / reconnectCount / 1000 : 0,
        disconnectCount: disconnects,
        reconnectAttempts,
        successfulReconnects,
        successRate: reconnectAttempts > 0 ? (successfulReconnects / reconnectAttempts) * 100 : 100
      };
    });
  }, [events, timeRange]);

  const renderChart = () => {
    switch (selectedChart) {
      case 'reconnectTime':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Reconnect Time (s)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 }
                }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}s`, 'Avg Reconnect Time']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageReconnectTime"
                name="Avg Reconnect Time"
                stroke={theme.palette.primary.main}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'eventFrequency':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Event Count',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 }
                }}
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="disconnectCount"
                name="Disconnects"
                fill={theme.palette.error.main}
              />
              <Bar
                dataKey="reconnectAttempts"
                name="Reconnect Attempts"
                fill={theme.palette.warning.main}
              />
              <Bar
                dataKey="successfulReconnects"
                name="Successful Reconnects"
                fill={theme.palette.success.main}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'successRate':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                label={{ 
                  value: 'Success Rate (%)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 }
                }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Success Rate']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="successRate"
                name="Reconnect Success Rate"
                stroke={theme.palette.success.main}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Connection Analytics</Typography>
        <ToggleButtonGroup
          size="small"
          value={selectedChart}
          exclusive
          onChange={(_, value) => value && setSelectedChart(value)}
        >
          <ToggleButton value="reconnectTime">
            Reconnect Time
          </ToggleButton>
          <ToggleButton value="eventFrequency">
            Event Frequency
          </ToggleButton>
          <ToggleButton value="successRate">
            Success Rate
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {renderChart()}
    </Paper>
  );
};

export default ConnectionStatsCharts;
