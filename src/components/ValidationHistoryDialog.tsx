import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { loadHistory, ValidationHistoryEntry } from '../utils/validationHistory';

interface ValidationHistoryDialogProps {
  open: boolean;
  onClose: () => void;
}

const ValidationHistoryDialog: React.FC<ValidationHistoryDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const history = loadHistory();
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    let filtered = [...history.entries];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => {
        return statusFilter === 'valid' ? entry.isValid : !entry.isValid;
      });
    }

    // Apply time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      const ranges = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      };

      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return now.getTime() - entryDate.getTime() <= ranges[timeRange];
      });
    }

    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(entry => {
        return (
          entry.timestamp.includes(searchQuery) ||
          JSON.stringify(entry.config).includes(searchQuery) ||
          JSON.stringify(entry.errors).includes(searchQuery)
        );
      });
    }

    return filtered;
  }, [history.entries, statusFilter, timeRange, searchQuery]);

  const handleExport = () => {
    const exportData = {
      history: history.entries,
      exportedAt: new Date().toISOString(),
      stats: {
        totalValidations: history.entries.length,
        validCount: history.entries.filter(entry => entry.isValid).length,
        invalidCount: history.entries.filter(entry => !entry.isValid).length
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validation-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatConfig = (config: ValidationHistoryEntry['config']) => {
    return [
      `Attempts: ${config.maxAttempts}`,
      `Initial: ${config.initialDelay}ms`,
      `Max: ${config.maxDelay}ms`,
      `Factor: ${config.backoffFactor}x`
    ].join(' | ');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">Validation History</Typography>
            <Tooltip title="Export History">
              <IconButton size="small" onClick={handleExport}>
                <FileDownloadIcon />
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    label="Status"
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="valid">Valid</MenuItem>
                    <MenuItem value="invalid">Invalid</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small">
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                    label="Time Range"
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="day">Last 24 Hours</MenuItem>
                    <MenuItem value="week">Last Week</MenuItem>
                    <MenuItem value="month">Last Month</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small">
                  <TextField
                    label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ minWidth: 200 }}
                  />
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="body2" color="success.main">
                  Valid: {filteredEntries.filter(entry => entry.isValid).length}
                </Typography>
                <Typography variant="body2" color="error.main">
                  Invalid: {filteredEntries.filter(entry => !entry.isValid).length}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Showing {filteredEntries.length} of {history.entries.length} validation events
              </Typography>
            </Box>
          </Box>
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Configuration</TableCell>
                <TableCell>Validation Messages</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntries.map((entry, index) => (
                <TableRow key={index} sx={{
                  backgroundColor: entry.isValid 
                    ? theme.palette.success.main + '10'
                    : theme.palette.error.main + '10'
                }}>
                  <TableCell>
                    <Tooltip title={entry.isValid ? 'Valid' : 'Invalid'}>
                      {entry.isValid ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <ErrorIcon color="error" fontSize="small" />
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell>{formatTimestamp(entry.timestamp)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {formatConfig(entry.config)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {entry.isValid ? (
                      <Chip
                        label="Valid Configuration"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {Object.entries(entry.errors).map(([field, message], i) => (
                          <Chip
                            key={i}
                            label={`${field}: ${message}`}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        ))}
                      </Box>
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

export default ValidationHistoryDialog;
