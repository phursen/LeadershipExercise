import React, { Component, ErrorInfo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  CircularProgress
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { errorReporting } from '../utils/errorReporting';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isReporting: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isReporting: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      isReporting: false
    };
  }

  public async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      isReporting: true
    });
    
    try {
      await errorReporting.reportError(error, errorInfo.componentStack || undefined);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    } finally {
      this.setState({ isReporting: false });
    }
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Box sx={{ mt: 4 }}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'error.dark',
                position: 'relative'
              }}
            >
              {this.state.isReporting && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'white'
                  }}
                >
                  <CircularProgress size={20} color="inherit" />
                  <Typography variant="caption">Reporting error...</Typography>
                </Box>
              )}
              <ErrorOutlineIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
              <Typography variant="h5" component="h1" gutterBottom color="white">
                Oops! Something went wrong
              </Typography>
              <Typography variant="body1" color="white" paragraph>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Typography>
              <Button
                variant="contained"
                onClick={this.handleReset}
                sx={{
                  mt: 2,
                  bgcolor: 'white',
                  color: 'error.dark',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Reset Application
              </Button>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Box sx={{ mt: 4, textAlign: 'left' }}>
                  <Typography variant="subtitle2" color="white" gutterBottom>
                    Error Details:
                  </Typography>
                  <Paper sx={{ p: 2, maxHeight: '200px', overflow: 'auto' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
