const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const fs = require('fs');
const path = require('path');

// Serve static files from both public and src/assets
app.use(express.static('public'));
app.use('/assets', express.static('src/assets'));

// Handle audio files with proper range requests and CORS
app.use('/sounds', (req, res, next) => {
  // Set CORS headers
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD',
    'Access-Control-Allow-Headers': 'Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range'
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // Set CORS headers for all audio requests
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD',
    'Access-Control-Allow-Headers': 'Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range'
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  const requestTime = new Date().toISOString();
  console.log(`[${requestTime}] Processing request for: ${req.path}`);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  // Only handle .mp3 files
  if (!req.path.endsWith('.mp3')) {
    console.log(`[${requestTime}] Skipping non-MP3 file: ${req.path}`);
    return next();
  }
  
  console.log(`Looking for audio file: ${req.path}`);

  // Try both public/sounds and src/assets/sounds
  const filename = path.basename(req.path);
  const publicPath = path.join(__dirname, '..', 'public', 'sounds', filename);
  const assetsPath = path.join(__dirname, '..', 'src', 'assets', 'sounds', filename);
  const beepPath = path.join(__dirname, '..', 'public', 'sounds', 'beep.mp3');
  
  console.log(`[${new Date().toISOString()}] Looking for file: ${filename}`);
  
  // Skip non-MP3 files
  if (!filename.endsWith('.mp3')) {
    console.log(`Skipping non-MP3 file: ${filename}`);
    return next();
  }
  
  let filePath;
  
  // Check public path first
  if (fs.existsSync(publicPath)) {
    filePath = publicPath;
    console.log(`Found in public directory: ${filePath}`);
  } 
  // Then check assets path
  else if (fs.existsSync(assetsPath)) {
    filePath = assetsPath;
    console.log(`Found in assets directory: ${filePath}`);
  }
  // Fall back to beep sound
  else if (fs.existsSync(beepPath)) {
    filePath = beepPath;
    console.log(`Using fallback beep sound for: ${req.path}`);
  }
  // If nothing is found
  else {
    console.error(`Audio file not found: ${req.path}, and fallback beep.mp3 not found`);
    return res.status(404).send('Audio file not found');
  }

  try {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Set default headers for all audio files with correct MIME type
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.weba': 'audio/webm'
    };
    
    res.set({
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'Content-Length': fileSize,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': stat.mtime.toUTCString()
    });
    
    // If no range header, send the entire file
    if (!range) {
      console.log('No range header, sending entire file');
      return fs.createReadStream(filePath).pipe(res);
    }
    
    console.log(`File size: ${fileSize} bytes`);
    console.log(`Range header: ${range}`);

    // Handle empty files by using the beep sound
    if (fileSize === 0) {
      console.warn(`Empty audio file detected: ${filePath}`);
      filePath = path.join(__dirname, '..', 'public', 'sounds', 'beep.mp3');
      if (!fs.existsSync(filePath)) {
        return res.status(500).send('Fallback audio file not found');
      }
      const stat = fs.statSync(filePath);
      fileSize = stat.size;
    }

    if (range) {
      try {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
          res.status(416).send('Requested range not satisfiable');
          return;
        }

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });

        file.on('error', (error) => {
          console.error('Error streaming audio file range:', error);
          if (!res.headersSent) {
            res.status(500).send('Error streaming audio file');
          }
        });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000'
        });

        file.pipe(res);
      } catch (error) {
        console.error('Error processing range request:', error);
        res.status(416).send('Requested range not satisfiable');
      }
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000'
    });

    const file = fs.createReadStream(filePath);
    file.on('error', (error) => {
      console.error('Error streaming audio file:', error);
      if (!res.headersSent) {
        res.status(500).send('Error streaming audio file');
      }
    });
    file.pipe(res);
  }
  } catch (error) {
    console.error('Error accessing audio file:', error);
    res.status(404).send('Audio file not found');
  }
});

// Additional static file handling with proper headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST']
  }
});

// Game state
let gameState = {
  grid: Array(8).fill(null).map(() => Array(8).fill({ isPath: false, isRevealed: false, isActive: false })),
  teams: [],
  currentTeam: null
};

io.on('connection', (socket) => {
  console.log('Client connected');

  // Send initial game state
  socket.emit('gameState', gameState);

  // Handle square updates
  socket.on('updateSquare', ({ row, col, status }, callback) => {
    if (row >= 0 && row < gameState.grid.length && col >= 0 && col < gameState.grid[0].length) {
      gameState.grid[row][col] = status;
      io.emit('squareUpdated', { row, col, status });
      callback({ success: true });
    } else {
      callback({ success: false, error: 'Invalid square position' });
    }
  });

  // Handle team management
  socket.on('addTeam', (teamName, callback) => {
    if (!gameState.teams.includes(teamName)) {
      gameState.teams.push(teamName);
      io.emit('teamAdded', teamName);
      callback({ success: true });
    } else {
      callback({ success: false, error: 'Team already exists' });
    }
  });

  socket.on('setCurrentTeam', (teamName, callback) => {
    if (gameState.teams.includes(teamName)) {
      gameState.currentTeam = teamName;
      io.emit('currentTeamChanged', teamName);
      callback({ success: true });
    } else {
      callback({ success: false, error: 'Team not found' });
    }
  });

  // Handle maze reset
  socket.on('resetMaze', (_, callback) => {
    gameState.grid = Array(8).fill(null).map(() => 
      Array(8).fill({ isPath: false, isRevealed: false, isActive: false })
    );
    io.emit('mazeReset');
    callback({ success: true });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3003;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
