import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import AnswerKey from './components/AnswerKey'
import { MazeProvider } from './context/MazeContext'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createTheme } from '@mui/material/styles'

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

console.log('🔍 Debug: main.tsx loaded');

// Check if root element exists
const rootElement = document.getElementById('root');
console.log('🔍 Debug: Root element found:', !!rootElement);
console.log('🔍 Debug: Root element details:', rootElement);

if (!rootElement) {
  console.error('❌ Debug: Root element not found!');
  document.body.innerHTML = '<div style="color: red; padding: 20px; font-size: 18px;">ERROR: Root element not found</div>';
} else {
  console.log('🔍 Debug: Creating React root...');
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('🔍 Debug: React root created successfully');
    
    console.log('🔍 Debug: Rendering App component...');
    root.render(
      <React.StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <MazeProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/answer-key" element={<AnswerKey />} />
              </Routes>
            </BrowserRouter>
          </MazeProvider>
        </ThemeProvider>
      </React.StrictMode>
    );
    console.log('🔍 Debug: App component render initiated');
  } catch (error) {
    console.error('❌ Debug: Error creating React root or rendering:', error);
    rootElement.innerHTML = `<div style="color: red; padding: 20px; font-size: 18px;">ERROR: ${error}</div>`;
  }
}
