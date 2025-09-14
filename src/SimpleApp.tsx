import React from 'react';

console.log('🔍 Debug: SimpleApp.tsx loaded');

function SimpleApp() {
  console.log('🔍 Debug: SimpleApp component rendering...');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#121212', 
      color: 'white', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🔍 Simple App Test</h1>
      <div style={{ 
        border: '2px solid #90caf9', 
        padding: '20px', 
        margin: '20px 0',
        borderRadius: '8px'
      }}>
        <h2>✅ React is working!</h2>
        <p>If you can see this, React is rendering correctly.</p>
        <ul>
          <li>HTML structure: ✅</li>
          <li>CSS styling: ✅</li>
          <li>React rendering: ✅</li>
          <li>JavaScript execution: ✅</li>
        </ul>
      </div>
      
      <div style={{ 
        backgroundColor: '#333', 
        padding: '15px', 
        margin: '10px 0',
        borderRadius: '4px'
      }}>
        <p><strong>Next steps:</strong> Check browser console for debug messages</p>
      </div>
    </div>
  );
}

export default SimpleApp;
