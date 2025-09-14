import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, LinearProgress, Box, Typography, Paper, CircularProgress, Button, Tooltip } from '@mui/material';
import { SOCKET_CONFIG } from '../config/socket';
import { saveSocketState, loadSocketState, clearSocketState } from '../utils/socketStorage';
import { addConnectionEvent, getConnectionHealthScore } from '../utils/socketAnalytics';
import ConnectionHistoryDialog from '../components/ConnectionHistoryDialog';

interface SocketStatus {
  isReconnecting: boolean;
  reconnectAttempt: number;
  reconnectDelay: number | null;
  isConnected: boolean;
  isPending: boolean;
  error: string | null;
  lastOperation: string | null;
  currentAttempt: number;
  maxAttempts: number;
  retryDelay: number | null;
}

interface SocketStatusContextType {
  status: SocketStatus;
  startOperation: (operation: string) => void;
  endOperation: (error?: string) => void;
  setConnected: (connected: boolean) => void;
}

const SocketStatusContext = createContext<SocketStatusContextType | undefined>(undefined);

export const SocketStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SocketStatus>(() => {
    const savedState = loadSocketState();
    // Initialize with disconnected state
    return {
      isReconnecting: false,
      reconnectAttempt: 0,
      reconnectDelay: null,
      isConnected: false,
      isPending: false,
      error: savedState?.lastError || null,
      lastOperation: null,
      currentAttempt: 0,
      maxAttempts: 0,
      retryDelay: null
    };
  });

  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  const startOperation = useCallback((operation: string, maxAttempts: number = 3) => {
    setStatus(prev => ({
      ...prev,
      isPending: true,
      lastOperation: operation,
      error: null,
      currentAttempt: 1,
      maxAttempts
    }));
  }, []);

  const endOperation = useCallback((error?: string, isRetry: boolean = false, nextRetryDelay?: number) => {
    setStatus(prev => ({
      ...prev,
      isPending: false,
      error: error || null,
      currentAttempt: isRetry ? prev.currentAttempt + 1 : 0,
      maxAttempts: isRetry ? prev.maxAttempts : 0,
      retryDelay: nextRetryDelay || null
    }));

    if (retryTimeout) {
      clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }

    if (nextRetryDelay) {
      const timer = setInterval(() => {
        setStatus(prev => ({
          ...prev,
          retryDelay: prev.retryDelay && prev.retryDelay > 1000 ? prev.retryDelay - 1000 : null
        }));
      }, 1000);
      setRetryTimeout(timer);
    }
  }, [retryTimeout]);

  const [healthScore, setHealthScore] = useState(() => getConnectionHealthScore());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const setConnected = useCallback((connected: boolean, isReconnecting = false) => {
    const now = new Date().toISOString();
    const previousState = loadSocketState();

    setStatus(prev => ({
      ...prev,
      isConnected: connected,
      isReconnecting,
      error: connected ? null : 'Connection lost',
      reconnectAttempt: isReconnecting ? prev.reconnectAttempt + 1 : 0,
      reconnectDelay: isReconnecting ? SOCKET_CONFIG.options.reconnectionDelay : null
    }));

    const newState = {
      lastConnected: connected ? now : previousState?.lastConnected || null,
      lastDisconnected: !connected ? now : previousState?.lastDisconnected || null,
      reconnectAttempts: isReconnecting ? (previousState?.reconnectAttempts || 0) + 1 : 0,
      lastError: !connected ? 'Connection lost' : null
    };

    saveSocketState(newState);

    // Track connection events
    if (connected && isReconnecting) {
      addConnectionEvent({
        timestamp: now,
        type: 'reconnect_success',
        attemptNumber: previousState?.reconnectAttempts || 0
      });
    } else if (!connected) {
      addConnectionEvent({
        timestamp: now,
        type: 'disconnect',
        error: 'Connection lost'
      });
    } else if (connected) {
      addConnectionEvent({
        timestamp: now,
        type: 'connect'
      });
    }

    // Update health score
    setHealthScore(getConnectionHealthScore());
    setStatus(prev => ({
      ...prev,
      isConnected: connected,
      isReconnecting,
      error: connected ? null : 'Connection lost',
      reconnectAttempt: isReconnecting ? prev.reconnectAttempt + 1 : 0,
      reconnectDelay: isReconnecting ? SOCKET_CONFIG.options.reconnectionDelay : null
    }));

    if (isReconnecting) {
      addConnectionEvent({
        timestamp: now,
        type: 'reconnect_attempt',
        attemptNumber: previousState?.reconnectAttempts || 0,
        delay: SOCKET_CONFIG.options.reconnectionDelay
      });

      if (!connected) {
      const timer = setInterval(() => {
        setStatus(prev => ({
          ...prev,
          reconnectDelay: prev.reconnectDelay && prev.reconnectDelay > 1000 
            ? prev.reconnectDelay - 1000 
            : SOCKET_CONFIG.options.reconnectionDelay
        }));
      }, 1000);

        return () => clearInterval(timer);
      }
    }
  }, []);

  return (
    <SocketStatusContext.Provider value={{ status, startOperation, endOperation, setConnected }}>
      {status.isReconnecting && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Paper sx={{ p: 3, maxWidth: 400, textAlign: 'center', position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Tooltip title="View Connection History">
                <Box
                  onClick={() => setIsHistoryOpen(true)}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <Typography variant="caption" color={healthScore > 80 ? 'success.main' : healthScore > 50 ? 'warning.main' : 'error.main'}>
                    Health: {healthScore}%
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
            {status.reconnectAttempt > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${(status.reconnectAttempt / SOCKET_CONFIG.options.reconnectionAttempts) * 100}%`,
                  height: 4,
                  bgcolor: 'warning.main',
                  transition: 'width 0.3s ease-in-out'
                }}
              />
            )}
            <CircularProgress sx={{ mb: 2 }} variant={status.reconnectDelay ? 'determinate' : 'indeterminate'} value={status.reconnectDelay ? ((SOCKET_CONFIG.options.reconnectionDelay - (status.reconnectDelay || 0)) / SOCKET_CONFIG.options.reconnectionDelay) * 100 : 0} />
            <Typography variant="h6" gutterBottom>
              {status.reconnectAttempt > 0 ? 'Reconnecting...' : 'Connection Lost'}
            </Typography>
            <Typography color="text.secondary" paragraph>
              {status.reconnectAttempt === 0 ? (
                'Attempting to establish connection...'
              ) : status.reconnectAttempt >= SOCKET_CONFIG.options.reconnectionAttempts ? (
                'Maximum reconnection attempts reached. Please refresh the page.'
              ) : (
                <>
                  Attempting to reconnect...
                  {status.reconnectDelay && (
                    <Box component="span" sx={{ display: 'block' }}>
                      Next attempt in {Math.ceil(status.reconnectDelay / 1000)}s
                    </Box>
                  )}
                </>
              )}
            </Typography>
            {status.reconnectAttempt > 0 && status.reconnectAttempt < SOCKET_CONFIG.options.reconnectionAttempts && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setStatus(prev => ({
                    ...prev,
                    reconnectDelay: 0
                  }));
                }}
              >
                Retry Now
              </Button>
            )}
            {status.reconnectAttempt >= SOCKET_CONFIG.options.reconnectionAttempts && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  const handleReset = () => {
                    if (status.reconnectAttempt >= SOCKET_CONFIG.options.reconnectionAttempts) {
                      addConnectionEvent({
                        timestamp: new Date().toISOString(),
                        type: 'reconnect_failure',
                        attemptNumber: status.reconnectAttempt,
                        error: 'Maximum reconnection attempts reached'
                      });
                    }
                    clearSocketState();
                    window.location.reload();
                  };
                  handleReset();
                }}
              >
                Refresh Page
              </Button>
            )}
            <Typography variant="caption" color="text.secondary">
              Attempt {status.reconnectAttempt} of {SOCKET_CONFIG.options.reconnectionAttempts}
            </Typography>
          </Paper>
        </Box>
      )}
      {status.isPending && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <LinearProgress />
            <Box
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              {status.retryDelay && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    textShadow: '0 0 4px rgba(0,0,0,0.5)',
                    fontWeight: 500
                  }}
                >
                  Retrying in {Math.ceil(status.retryDelay / 1000)}s
                </Typography>
              )}
              {status.maxAttempts > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    textShadow: '0 0 4px rgba(0,0,0,0.5)',
                    fontWeight: 500
                  }}
                >
                  Attempt {status.currentAttempt} of {status.maxAttempts}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}
      <Snackbar
        open={!!status.error}
        autoHideDuration={6000}
        onClose={() => setStatus(prev => ({ ...prev, error: null }))}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {status.error}
        </Alert>
      </Snackbar>
      <ConnectionHistoryDialog
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </SocketStatusContext.Provider>
  );
};

export const useSocketStatus = () => {
  const context = useContext(SocketStatusContext);
  if (!context) {
    throw new Error('useSocketStatus must be used within a SocketStatusProvider');
  }
  return context;
};
