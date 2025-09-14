import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  useTheme,
  Tooltip
} from '@mui/material';
import { ConnectionStats } from '../utils/socketAnalytics';

interface ConnectionStatsSummaryProps {
  stats: ConnectionStats;
  healthScore: number;
  filteredEventCount: number;
}

const ConnectionStatsSummary: React.FC<ConnectionStatsSummaryProps> = ({
  stats,
  healthScore,
  filteredEventCount
}) => {
  const theme = useTheme();

  const getHealthColor = (score: number) => {
    if (score > 80) return theme.palette.success.main;
    if (score > 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const calculateSuccessRate = () => {
    if (stats.totalReconnectAttempts === 0) return 100;
    return (stats.successfulReconnects / stats.totalReconnectAttempts) * 100;
  };

  const formatDuration = (ms: number) => {
    if (ms === 0) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const StatBox: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    progress?: number;
    progressColor?: string;
  }> = ({ title, value, subtitle, progress, progressColor }) => (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" gutterBottom>
        {value}
      </Typography>
      {progress !== undefined && (
        <Box sx={{ width: '100%', mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                backgroundColor: progressColor || theme.palette.primary.main
              }
            }}
          />
        </Box>
      )}
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title="Health Score"
          value={`${healthScore}%`}
          progress={healthScore}
          progressColor={getHealthColor(healthScore)}
          subtitle={`Based on ${stats.totalReconnectAttempts} reconnect attempts`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title="Reconnect Success Rate"
          value={`${calculateSuccessRate().toFixed(1)}%`}
          progress={calculateSuccessRate()}
          progressColor={theme.palette.success.main}
          subtitle={`${stats.successfulReconnects} of ${stats.totalReconnectAttempts} attempts`}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Tooltip title="Average time to reconnect after disconnection">
          <Box>
            <StatBox
              title="Avg. Reconnect Time"
              value={formatDuration(stats.averageReconnectTime)}
              subtitle={`${stats.totalDisconnects} total disconnects`}
            />
          </Box>
        </Tooltip>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatBox
          title="Events"
          value={filteredEventCount}
          subtitle={filteredEventCount === stats.events.length
            ? 'Showing all events'
            : `Filtered from ${stats.events.length} total events`}
        />
      </Grid>
    </Grid>
  );
};

export default ConnectionStatsSummary;
