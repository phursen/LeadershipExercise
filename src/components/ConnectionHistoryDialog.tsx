import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { ConnectionEvent, clearConnectionStats, addConnectionEvent } from '../utils/socketAnalytics';
import { exportStats } from '../utils/statsExport';
import { importStats } from '../utils/statsImport';
import ConnectionStatsSummary from './ConnectionStatsSummary';
import ConnectionStatsTrends from './ConnectionStatsTrends';
import ConnectionStatsCharts from './ConnectionStatsCharts';
import { useConnectionStats } from '../hooks/useConnectionStats';
import RefreshIcon from '@mui/icons-material/Refresh';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface ConnectionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
}

const ConnectionHistoryDialog: React.FC<ConnectionHistoryDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const { stats, healthScore, refresh, isAutoRefresh, toggleAutoRefresh } = useConnectionStats();
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });

  const getEventIcon = (event: ConnectionEvent) => {
    switch (event.type) {
      case 'connect':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'disconnect':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'reconnect_attempt':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'reconnect_success':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'reconnect_failure':
        return <ErrorIcon color="error" fontSize="small" />;
    }
  };

  const getEventColor = (event: ConnectionEvent) => {
    switch (event.type) {
      case 'connect':
      case 'reconnect_success':
        return theme.palette.success.main;
      case 'disconnect':
      case 'reconnect_failure':
        return theme.palette.error.main;
      case 'reconnect_attempt':
        return theme.palette.warning.main;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Connection History</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                id="import-stats"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const result = await importStats(file);
                      if (result.success && result.data) {
                        if (result.warnings) {
                          const proceed = window.confirm(
                            `Warning: ${result.warnings.join('\n')}\n\nDo you want to proceed with the import?`
                          );
                          if (!proceed) return;
                        }
                        // Update stats and refresh
                        clearConnectionStats();
                        result.data.events.forEach(event => {
                          // Re-add events in chronological order
                          addConnectionEvent(event);
                        });
                        refresh();
                      } else {
                        alert(`Import failed: ${result.error}`);
                      }
                    } catch (error) {
                      alert('Failed to import configuration');
                    }
                    e.target.value = '';
                  }
                }}
              />
              <Tooltip title="Import Analytics">
                <IconButton
                  size="small"
                  component="label"
                  htmlFor="import-stats"
                >
                  <FileUploadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export Analytics">
                <IconButton
                  size="small"
                  onClick={() => {
                    exportStats(stats, stats.events, dateRange);
                  }}
                >
                  <FileDownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Tooltip title="Clear History">
              <IconButton
                size="small"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear the connection history?')) {
                    clearConnectionStats();
                    refresh();
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Manual Refresh">
              <IconButton size="small" onClick={refresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isAutoRefresh ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh'}>
              <IconButton size="small" onClick={toggleAutoRefresh}>
                {isAutoRefresh ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            </Tooltip>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                label="Event Type"
              >
                <MenuItem value="all">All Events</MenuItem>
                <MenuItem value="connect">Connections</MenuItem>
                <MenuItem value="disconnect">Disconnections</MenuItem>
                <MenuItem value="reconnect_attempt">Reconnect Attempts</MenuItem>
                <MenuItem value="reconnect_success">Successful Reconnects</MenuItem>
                <MenuItem value="reconnect_failure">Failed Reconnects</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              size="small"
              label="From Date"
              type="datetime-local"
              value={dateRange.start || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value || null }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              label="To Date"
              type="datetime-local"
              value={dateRange.end || ''}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value || null }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ mb: 3 }}>
            <ConnectionStatsCharts
              events={stats.events}
              timeRange={dateRange}
            />
          </Box>
          <Box sx={{ mb: 3 }}>
            <ConnectionStatsTrends
              events={stats.events}
              timeRange={dateRange}
            />
          </Box>
          <ConnectionStatsSummary
            stats={stats}
            healthScore={healthScore}
            filteredEventCount={
              stats.events
                .filter(event => eventFilter === 'all' || event.type === eventFilter)
                .filter(event => {
                  if (!searchQuery) return true;
                  const searchLower = searchQuery.toLowerCase();
                  return (
                    event.type.toLowerCase().includes(searchLower) ||
                    event.error?.toLowerCase().includes(searchLower) ||
                    event.timestamp.toLowerCase().includes(searchLower) ||
                    (event.attemptNumber !== undefined && event.attemptNumber.toString().includes(searchLower))
                  );
                })
                .filter(event => {
                  const eventDate = new Date(event.timestamp);
                  if (dateRange.start && new Date(dateRange.start) > eventDate) return false;
                  if (dateRange.end && new Date(dateRange.end) < eventDate) return false;
                  return true;
                }).length
            }
          />
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.events
                .filter(event => {
                  if (eventFilter === 'all') return true;
                  return event.type === eventFilter;
                })
                .filter(event => {
                  if (!searchQuery) return true;
                  const searchLower = searchQuery.toLowerCase();
                  return (
                    event.type.toLowerCase().includes(searchLower) ||
                    event.error?.toLowerCase().includes(searchLower) ||
                    event.timestamp.toLowerCase().includes(searchLower) ||
                    (event.attemptNumber !== undefined && event.attemptNumber.toString().includes(searchLower))
                  );
                })
                .filter(event => {
                  const eventDate = new Date(event.timestamp);
                  if (dateRange.start && new Date(dateRange.start) > eventDate) return false;
                  if (dateRange.end && new Date(dateRange.end) < eventDate) return false;
                  return true;
                })
                .map((event, index) => (
                <TableRow
                  key={index}
                  sx={{
                    backgroundColor: `${getEventColor(event)}10`
                  }}
                >
                  <TableCell>
                    <Tooltip title={event.type}>
                      {getEventIcon(event)}
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                  <TableCell>
                    <Chip
                      label={event.type.replace('_', ' ')}
                      size="small"
                      sx={{
                        backgroundColor: `${getEventColor(event)}20`,
                        color: getEventColor(event),
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {event.attemptNumber !== undefined && (
                      <Typography variant="caption" display="block">
                        Attempt: {event.attemptNumber}
                      </Typography>
                    )}
                    {event.delay !== undefined && (
                      <Typography variant="caption" display="block">
                        Delay: {event.delay}ms
                      </Typography>
                    )}
                    {event.error && (
                      <Typography variant="caption" color="error" display="block">
                        {event.error}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionHistoryDialog;
