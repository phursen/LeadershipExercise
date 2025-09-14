import React, { createContext, useContext, useCallback, useState } from 'react';

interface AnnouncerContextType {
  announce: (message: string, assertive?: boolean) => void;
}

const AnnouncerContext = createContext<AnnouncerContextType | undefined>(undefined);

export const AnnouncerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const [politeMessage, setPoliteMessage] = useState('');

  const announce = useCallback((message: string, assertive = false) => {
    if (assertive) {
      setAssertiveMessage(''); // Clear to force re-announcement
      setTimeout(() => setAssertiveMessage(message), 100);
    } else {
      setPoliteMessage('');
      setTimeout(() => setPoliteMessage(message), 100);
    }
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {assertiveMessage}
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {politeMessage}
      </div>
      {children}
    </AnnouncerContext.Provider>
  );
};

export const useAnnouncer = () => {
  const context = useContext(AnnouncerContext);
  if (!context) {
    throw new Error('useAnnouncer must be used within an AnnouncerProvider');
  }
  return context;
};
