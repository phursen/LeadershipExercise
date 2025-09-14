import React, { createContext, useContext, useState, useCallback } from 'react';

interface SocketStatus {
  isConnected: boolean;
  isPending: boolean;
  error: string | null;
  lastOperation: string | null;
}

interface SocketStatusContextType {
  status: SocketStatus;
  startOperation: (operation: string) => void;
  endOperation: (error?: string) => void;
  setConnected: (connected: boolean) => void;
}

const SocketStatusContext = createContext<SocketStatusContextType | undefined>(undefined);

export const SimpleSocketStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SocketStatus>({
    isConnected: false,
    isPending: false,
    error: null,
    lastOperation: null
  });

  const startOperation = useCallback((operation: string) => {
    setStatus(prev => ({
      ...prev,
      isPending: true,
      lastOperation: operation,
      error: null
    }));
  }, []);

  const endOperation = useCallback((error?: string) => {
    setStatus(prev => ({
      ...prev,
      isPending: false,
      error: error || null
    }));
  }, []);

  const setConnected = useCallback((connected: boolean) => {
    setStatus(prev => ({
      ...prev,
      isConnected: connected,
      error: connected ? null : 'Connection lost'
    }));
  }, []);

  return (
    <SocketStatusContext.Provider value={{ status, startOperation, endOperation, setConnected }}>
      {children}
    </SocketStatusContext.Provider>
  );
};

export const useSocketStatus = () => {
  const context = useContext(SocketStatusContext);
  if (!context) {
    throw new Error('useSocketStatus must be used within a SimpleSocketStatusProvider');
  }
  return context;
};
