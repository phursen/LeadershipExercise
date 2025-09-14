import React from 'react';

// Test each import individually
console.log('🔍 Testing imports...');

try {
  console.log('🔍 Testing React imports...');
  const { ThemeProvider, CssBaseline, Container, Box, Grid } = require('@mui/material');
  console.log('✅ Material-UI core imports successful');
} catch (error) {
  console.error('❌ Material-UI core import failed:', error);
}

try {
  const { createTheme } = require('@mui/material/styles');
  console.log('✅ Material-UI styles import successful');
} catch (error) {
  console.error('❌ Material-UI styles import failed:', error);
}

try {
  const MazeGrid = require('./components/MazeGrid');
  console.log('✅ MazeGrid import successful');
} catch (error) {
  console.error('❌ MazeGrid import failed:', error);
}

try {
  const ControlPanel = require('./components/ControlPanel');
  console.log('✅ ControlPanel import successful');
} catch (error) {
  console.error('❌ ControlPanel import failed:', error);
}

try {
  const Analytics = require('./components/Analytics');
  console.log('✅ Analytics import successful');
} catch (error) {
  console.error('❌ Analytics import failed:', error);
}

try {
  const { MazeProvider } = require('./context/MazeContext');
  console.log('✅ MazeProvider import successful');
} catch (error) {
  console.error('❌ MazeProvider import failed:', error);
}

try {
  const { AnnouncerProvider } = require('./utils/announcer');
  console.log('✅ AnnouncerProvider import successful');
} catch (error) {
  console.error('❌ AnnouncerProvider import failed:', error);
}

try {
  const { RetryConfigProvider } = require('./context/RetryConfigContext');
  console.log('✅ RetryConfigProvider import successful');
} catch (error) {
  console.error('❌ RetryConfigProvider import failed:', error);
}

try {
  const { SocketStatusProvider } = require('./context/SocketStatusContext');
  console.log('✅ SocketStatusProvider import successful');
} catch (error) {
  console.error('❌ SocketStatusProvider import failed:', error);
}

try {
  const ErrorBoundary = require('./components/ErrorBoundary');
  console.log('✅ ErrorBoundary import successful');
} catch (error) {
  console.error('❌ ErrorBoundary import failed:', error);
}

function TestComponents() {
  return (
    <div style={{ color: 'white', padding: '20px', backgroundColor: '#121212' }}>
      <h1>🔍 Component Import Test</h1>
      <p>Check console for import results</p>
    </div>
  );
}

export default TestComponents;
