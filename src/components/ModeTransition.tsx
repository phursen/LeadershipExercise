import React from 'react';
import { Box, Fade } from '@mui/material';

interface ModeTransitionProps {
  children: React.ReactNode;
  isConfigMode: boolean;
}

const ModeTransition: React.FC<ModeTransitionProps> = ({ children, isConfigMode }) => {
  return (
    <Box sx={{ position: 'relative' }}>
      <Fade 
        in={true} 
        timeout={{ 
          enter: 500,
          exit: 300
        }}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Box
          sx={{
            transform: `scale(${isConfigMode ? 0.98 : 1})`,
            opacity: isConfigMode ? 0.95 : 1,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: isConfigMode ? 'brightness(1.1)' : 'none'
          }}
        >
          {children}
        </Box>
      </Fade>
    </Box>
  );
};

export default ModeTransition;
