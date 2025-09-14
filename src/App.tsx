import React, { useEffect } from 'react';
import { ThemeProvider, CssBaseline, Container, Box, Grid } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import MazeGrid from './components/MazeGrid';
import ControlPanel from './components/ControlPanel';
import Analytics from './components/Analytics';
import { MazeProvider } from './context/MazeContext';
import { AnnouncerProvider } from './utils/announcer';
import { RetryConfigProvider } from './context/RetryConfigContext';
import { SimpleSocketStatusProvider } from './context/SimpleSocketStatusContext';
import ErrorBoundary from './components/ErrorBoundary';

console.log('🔍 Debug: App.tsx loaded');

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

console.log('🔍 Debug: Theme created:', theme);

function App() {
  console.log('🔍 Debug: App component rendering...');
  
  useEffect(() => {
    console.log('🔍 Debug: App component mounted');
    return () => {
      console.log('🔍 Debug: App component unmounting');
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RetryConfigProvider>
          <SimpleSocketStatusProvider>
            <MazeProvider>
              <AnnouncerProvider>
                <Container maxWidth="lg">
                  <Box sx={{ py: 4 }}>
                    <h1>Electric Maze Exercise</h1>
                    <Grid container spacing={4}>
                      <Grid item xs={12} md={8}>
                        <Box sx={{ mb: 4 }}>
                          <MazeGrid />
                        </Box>
                        <Analytics />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <ControlPanel />
                      </Grid>
                    </Grid>
                  </Box>
                </Container>
              </AnnouncerProvider>
            </MazeProvider>
          </SimpleSocketStatusProvider>
        </RetryConfigProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
