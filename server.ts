import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { join } from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

interface MazeSquare {
  isPath: boolean;
  isRevealed: boolean;
  isActive: boolean;
}

interface GameState {
  grid: MazeSquare[][];
  teams: string[];
  currentTeam: string;
}

const gameState: GameState = {
  grid: Array(6).fill(null).map(() => 
    Array(8).fill(null).map(() => ({
      isPath: false,
      isRevealed: false,
      isActive: false
    }))
  ),
  teams: [],
  currentTeam: ''
};

io.on('connection', (socket) => {
  console.log('Client connected');

  // Send initial game state
  socket.emit('gameState', gameState);

  // Handle square updates
  socket.on('updateSquare', ({ row, col, status }) => {
    gameState.grid[row][col] = { ...gameState.grid[row][col], ...status };
    io.emit('squareUpdated', { row, col, status });
  });

  // Handle team updates
  socket.on('addTeam', (teamName: string) => {
    if (!gameState.teams.includes(teamName)) {
      gameState.teams.push(teamName);
      io.emit('teamAdded', teamName);
    }
  });

  // Handle current team changes
  socket.on('setCurrentTeam', (teamName: string) => {
    gameState.currentTeam = teamName;
    io.emit('currentTeamChanged', teamName);
  });

  // Handle maze reset
  socket.on('resetMaze', () => {
    gameState.grid = Array(6).fill(null).map(() => 
      Array(8).fill(null).map(() => ({
        isPath: false,
        isRevealed: false,
        isActive: false
      }))
    );
    io.emit('mazeReset');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
