import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface MazeSquare {
  isPath: boolean;
  isRevealed: boolean;
  isActive: boolean;
  isElectric?: boolean;
}

interface TeamStats {
  explored: Set<string>;
  mistakes: number;
  startTime?: number;
  completionTime?: number;
}

interface MazeContextType {
  grid: Array<Array<MazeSquare>>;
  currentTeam: string;
  teams: string[];
  isConfigMode: boolean;
  isRelayMode: boolean;
  relayType: 'clicks' | 'time';
  currentPlayer: string;
  playersInTeam: string[];
  remainingClicks: number;
  maxClicksPerTurn: number;
  remainingTime: number;
  maxTimePerTurn: number;
  isTimerActive: boolean;
  teamStats: Record<string, TeamStats>;
  setSquareStatus: (row: number, col: number, status: Partial<MazeSquare>) => void;
  updateSquare: (row: number, col: number, status: Partial<MazeSquare>) => void;
  resetMaze: () => void;
  addTeam: (teamName: string) => void;
  removeTeam: (teamName: string) => void;
  setCurrentTeam: (teamName: string) => void;
  setConfigMode: (mode: boolean) => void;
  setRelayMode: (mode: boolean) => void;
  setRelayType: (type: 'clicks' | 'time') => void;
  addPlayerToTeam: (playerName: string) => void;
  nextPlayer: () => void;
  resetTurn: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  validatePath: () => Promise<{ valid: boolean; error?: string }>;
  getTeamStats: (teamName: string) => TeamStats;
  getTeamProgress: (teamName: string) => string;
  startOver: () => void;
}

const MazeContext = createContext<MazeContextType | undefined>(undefined);

export const MazeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [grid, setGrid] = useState<Array<Array<MazeSquare>>>(() => {
    // Try to load initial configuration from config file
    try {
      const configData = require('../config/electric-maze-config-onload.json');
      if (configData && configData.length > 0 && configData[0].grid) {
        console.log('🎮 STARTUP - Loading initial maze configuration from config file');
        const loadedGrid = configData[0].grid.map((row: any[]) => 
          row.map((square: any) => ({
            isPath: square.isPath || false,
            isRevealed: false, // Always start with squares hidden for gameplay
            isActive: false,
            isElectric: square.isElectric || false
          }))
        );
        console.log('✅ STARTUP - Initial maze configuration loaded successfully');
        return loadedGrid;
      }
    } catch (error) {
      console.log('⚠️ STARTUP - Could not load initial config, using default empty grid:', error);
    }
    
    // Fallback to empty grid
    console.log('🎮 STARTUP - Using default empty grid');
    return Array(8).fill(null).map(() => 
      Array(8).fill(null).map(() => ({
        isPath: false,
        isRevealed: false,
        isActive: false,
        isElectric: false
      }))
    );
  });

  const [currentTeam, setCurrentTeamState] = useState<string>('');
  
  const setCurrentTeam = useCallback((teamName: string) => {
    console.log(`🎯 CONTEXT - Setting current team from "${currentTeam}" to "${teamName}"`);
    setCurrentTeamState(teamName);
    console.log(`✅ CONTEXT - Current team set to: "${teamName}"`);
  }, [currentTeam]);
  const [teams, setTeams] = useState<string[]>([]);
  const [isConfigMode, setConfigMode] = useState<boolean>(false);
  const [isRelayMode, setRelayMode] = useState<boolean>(false);
  const [relayType, setRelayType] = useState<'clicks' | 'time'>('clicks');
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [playersInTeam, setPlayersInTeam] = useState<string[]>([]);
  const [remainingClicks, setRemainingClicks] = useState<number>(5);
  const [maxClicksPerTurn] = useState<number>(5);
  const [remainingTime, setRemainingTime] = useState<number>(30);
  const [maxTimePerTurn] = useState<number>(30);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [teamStats, setTeamStats] = useState<Record<string, TeamStats>>({});

  const setSquareStatus = useCallback((row: number, col: number, status: Partial<MazeSquare>) => {
    console.log(`🔧 setSquareStatus called for [${row},${col}]:`, status);
    
    setGrid(prev => {
      // Ensure prev is properly initialized as a 2D array
      if (!Array.isArray(prev) || prev.length === 0) {
        console.warn('Grid not properly initialized, creating new grid');
        return Array(8).fill(null).map(() => 
          Array(8).fill(null).map(() => ({
            isPath: false,
            isRevealed: false,
            isActive: false,
            isElectric: false
          }))
        );
      }
      
      // Validate row exists and is an array
      if (!prev[row] || !Array.isArray(prev[row])) {
        console.warn(`Row ${row} is not properly initialized`);
        return prev;
      }
      
      const oldSquare = prev[row][col];
      console.log(`📋 Old square [${row},${col}]:`, oldSquare);
      
      const newGrid = [...prev];
      newGrid[row] = [...prev[row]];
      newGrid[row][col] = { ...prev[row][col], ...status };
      
      console.log(`✅ New square [${row},${col}]:`, newGrid[row][col]);
      
      return newGrid;
    });
  }, []);

  const updateSquare = useCallback((row: number, col: number, status: Partial<MazeSquare>) => {
    setSquareStatus(row, col, status);
  }, [setSquareStatus]);

  const addPlayerToTeam = useCallback((playerName: string) => {
    setPlayersInTeam(prev => {
      if (!prev.includes(playerName)) {
        const newPlayers = [...prev, playerName];
        if (newPlayers.length === 1) {
          setCurrentPlayer(playerName);
        }
        return newPlayers;
      }
      return prev;
    });
  }, []);

  // Timer management
  const startTimer = useCallback(() => {
    setIsTimerActive(true);
    setRemainingTime(maxTimePerTurn);
  }, [maxTimePerTurn]);

  const pauseTimer = useCallback(() => {
    setIsTimerActive(false);
  }, []);

  const setConfigModeWithCleanup = useCallback((mode: boolean) => {
    console.log(`🔧 CONFIG MODE - Changing from ${isConfigMode} to ${mode}`);
    
    if (isConfigMode && !mode) {
      // Exiting config mode - ensure all squares are hidden for gameplay
      console.log('🔧 CONFIG MODE - Exiting config mode, hiding all revealed squares');
      setGrid(prev => {
        const newGrid = prev.map(row => 
          row.map(square => {
            const hiddenSquare = {
              ...square,
              isRevealed: false,
              isActive: false
            };
            console.log(`🔧 CONFIG MODE - Hiding square [${square}]:`, hiddenSquare);
            return hiddenSquare;
          })
        );
        console.log('🔧 CONFIG MODE - New grid after hiding squares:', newGrid);
        return newGrid;
      });
    }
    
    setConfigMode(mode);
    console.log(`🔧 CONFIG MODE - Mode set to: ${mode}`);
  }, [isConfigMode]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerActive && remainingTime > 0 && relayType === 'time') {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // Time's up - automatically switch to next player
            setIsTimerActive(false);
            if (playersInTeam.length > 1) {
              const currentIndex = playersInTeam.indexOf(currentPlayer);
              const nextIndex = (currentIndex + 1) % playersInTeam.length;
              setCurrentPlayer(playersInTeam[nextIndex]);
              setRemainingTime(maxTimePerTurn);
              setIsTimerActive(true);
            }
            return maxTimePerTurn;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerActive, remainingTime, relayType, playersInTeam, currentPlayer, maxTimePerTurn]);

  const nextPlayer = useCallback(() => {
    if (playersInTeam.length <= 1) return;
    
    const currentIndex = playersInTeam.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % playersInTeam.length;
    setCurrentPlayer(playersInTeam[nextIndex]);
    
    if (relayType === 'clicks') {
      setRemainingClicks(maxClicksPerTurn);
    } else {
      setRemainingTime(maxTimePerTurn);
      setIsTimerActive(true);
    }
  }, [currentPlayer, playersInTeam, maxClicksPerTurn, maxTimePerTurn, relayType]);

  const resetTurn = useCallback(() => {
    if (relayType === 'clicks') {
      setRemainingClicks(maxClicksPerTurn);
    } else {
      setRemainingTime(maxTimePerTurn);
      setIsTimerActive(true);
    }
  }, [maxClicksPerTurn, maxTimePerTurn, relayType]);

  const resetMaze = useCallback(() => {
    console.log('🔄 resetMaze called - clearing all squares to neutral state');
    setGrid(Array(8).fill(null).map(() => 
      Array(8).fill(null).map(() => ({
        isPath: false,
        isRevealed: false,
        isActive: false,
        isElectric: false
      }))
    ));
  }, []);

  const addTeam = useCallback((teamName: string) => {
    console.log(`🏆 CONTEXT - Adding team "${teamName}"`);
    console.log(`🏆 CONTEXT - Current teams:`, teams);
    
    setTeams(prev => {
      // Prevent duplicate team names
      if (prev.includes(teamName)) {
        console.log(`🚫 CONTEXT - Team "${teamName}" already exists`);
        return prev;
      }
      const newTeams = [...prev, teamName];
      console.log(`✅ CONTEXT - New teams array:`, newTeams);
      return newTeams;
    });
    
    setTeamStats(prev => {
      const newStats = {
        ...prev,
        [teamName]: {
          explored: new Set<string>(),
          mistakes: 0,
          startTime: Date.now()
        }
      };
      console.log(`✅ CONTEXT - New team stats:`, newStats);
      return newStats;
    });
  }, [teams]);

  const removeTeam = useCallback((teamName: string) => {
    setTeams(prev => prev.filter(team => team !== teamName));
    setTeamStats(prev => {
      const newStats = { ...prev };
      delete newStats[teamName];
      return newStats;
    });
    // If removing the current team, clear current team selection
    if (currentTeam === teamName) {
      setCurrentTeam('');
    }
  }, [currentTeam]);

  const startOver = useCallback(() => {
    // Reset all revealed squares but keep the maze configuration
    setGrid(prev => prev.map(row => 
      row.map(square => ({
        ...square,
        isRevealed: false, // Hide all squares when starting over
        isActive: false
      }))
    ));
    
    // Reset all team stats but keep teams
    setTeamStats(prev => {
      const resetStats: Record<string, TeamStats> = {};
      Object.keys(prev).forEach(teamName => {
        resetStats[teamName] = {
          explored: new Set<string>(),
          mistakes: 0,
          startTime: Date.now()
        };
      });
      return resetStats;
    });
  }, []);

  const isValidPath = useCallback(async (startRow: number, startCol: number, endRow: number, endCol: number): Promise<boolean> => {
    const visited = new Set<string>();

    const isValid = async (row: number, col: number): Promise<boolean> => {
      // Check bounds
      if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {
        return false;
      }

      // Check if this is a path square and hasn't been visited
      const key = `${row},${col}`;
      if (!grid[row][col].isPath || visited.has(key)) {
        return false;
      }

      // Mark as visited
      visited.add(key);

      // Check if we reached the end
      if (row === endRow && col === endCol) {
        return true;
      }

      // Try all four directions
      return (
        await isValid(row - 1, col) || // up
        await isValid(row + 1, col) || // down
        await isValid(row, col - 1) || // left
        await isValid(row, col + 1)    // right
      );
    };

    return isValid(startRow, startCol);
  }, [grid]);

  const validatePath = useCallback(async () => {
    // Count total path squares
    const pathSquares = grid.flatMap((row, rowIndex) => 
      row.map((square, colIndex) => 
        square.isPath ? `${rowIndex},${colIndex}` : null
      ).filter(Boolean)
    );

    // Check for minimum path length
    if (pathSquares.length < 3) {
      return {
        valid: false,
        error: 'Invalid Maze: Path too short. Need at least 3 connected path squares for a meaningful challenge.'
      };
    }

    // Check for maximum path density (shouldn't be more than 50% of grid)
    const totalSquares = grid.length * grid[0].length;
    if (pathSquares.length > totalSquares * 0.5) {
      return {
        valid: false,
        error: 'Invalid Maze: Too many path squares. Path should be no more than 50% of the grid to maintain challenge.'
      };
    }

    // Find start (first row) and end (last row)
    const firstRow = grid[0];
    const lastRow = grid[grid.length - 1];

    // Check if there's at least one path square in first and last row
    const hasStart = firstRow.some(square => square.isPath);
    const hasEnd = lastRow.some(square => square.isPath);

    if (!hasStart) {
      return {
        valid: false,
        error: 'Invalid Maze: No starting point found. Add at least one green path square in the top row (row 1) to define where teams begin.'
      };
    }

    if (!hasEnd) {
      return {
        valid: false,
        error: 'Invalid Maze: No ending point found. Add at least one green path square in the bottom row (row 8) to define the goal destination.'
      };
    }

    // Check for isolated path squares (not connected to any other path)
    const isolatedSquares = [];
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        if (grid[row][col].isPath) {
          const hasAdjacentPath = [
            [row - 1, col], [row + 1, col], // up, down
            [row, col - 1], [row, col + 1]  // left, right
          ].some(([r, c]) => 
            r >= 0 && r < grid.length && 
            c >= 0 && c < grid[0].length && 
            grid[r][c].isPath
          );
          
          if (!hasAdjacentPath && pathSquares.length > 1) {
            isolatedSquares.push(`Row ${row + 1}, Column ${col + 1}`);
          }
        }
      }
    }

    if (isolatedSquares.length > 0) {
      return {
        valid: false,
        error: `Invalid Maze: Found ${isolatedSquares.length} isolated path square(s) at: ${isolatedSquares.join(', ')}. All path squares must connect to at least one other path square (horizontally or vertically adjacent).`
      };
    }

    // Find all path squares in the first row
    const startSquares = firstRow
      .map((square, index) => square.isPath ? index : -1)
      .filter(index => index !== -1);

    // Find all path squares in the last row
    const endSquares = lastRow
      .map((square, index) => square.isPath ? index : -1)
      .filter(index => index !== -1);

    // Check for multiple start points (confusing for teams)
    if (startSquares.length > 3) {
      return {
        valid: false,
        error: `Invalid Maze: Too many starting points (${startSquares.length} in top row). Limit to 3 or fewer start squares to avoid confusion about where teams should begin.`
      };
    }

    // Check for multiple end points (confusing for teams)
    if (endSquares.length > 3) {
      return {
        valid: false,
        error: `Invalid Maze: Too many ending points (${endSquares.length} in bottom row). Limit to 3 or fewer end squares to provide clear completion objectives.`
      };
    }

    // Try each possible start-end combination to find valid path
    let validPathFound = false;
    for (const startCol of startSquares) {
      for (const endCol of endSquares) {
        if (await isValidPath(0, startCol, grid.length - 1, endCol)) {
          validPathFound = true;
          break;
        }
      }
      if (validPathFound) break;
    }

    if (!validPathFound) {
      return {
        valid: false,
        error: 'Invalid Maze: No continuous path connects start to finish. Ensure path squares form an unbroken chain from top row to bottom row. Check for gaps that require diagonal movement (not allowed) or path segments that don\'t connect properly.'
      };
    }

    // Check for electric squares blocking all possible routes
    const electricSquares = grid.flatMap((row, rowIndex) => 
      row.map((square, colIndex) => 
        (!square.isPath && square.isRevealed && square.isActive) ? `${rowIndex},${colIndex}` : null
      ).filter(Boolean)
    );

    // Validate that electric squares don't completely block the path
    if (electricSquares.length > 0) {
      // This is a simplified check - in a full implementation, you'd verify
      // that electric squares don't create impossible bottlenecks
      const electricCount = electricSquares.length;
      const pathCount = pathSquares.length;
      
      if (electricCount > pathCount * 2) {
        return {
          valid: false,
          error: `Invalid Maze: Too many electric squares (${electricCount}) relative to path squares (${pathCount}). Reduce electric squares to maintain solvability - recommended ratio is no more than 2:1 electric to path squares.`
        };
      }
    }

    return { valid: true };
  }, [grid, isValidPath]);

  const getTeamStats = useCallback((teamName: string) => {
    return teamStats[teamName] || { explored: new Set(), mistakes: 0 };
  }, [teamStats]);

  const getTeamProgress = useCallback((teamName: string) => {
    const stats = getTeamStats(teamName);
    const total = grid.flatMap(row => row.filter(square => square.isPath)).length;
    const revealed = stats.explored.size;
    return `${revealed}/${total} squares explored`;
  }, [grid, getTeamStats]);

  const isPathCompleted = useCallback((explored: Set<string>): boolean => {
    // Check if any path from top row to bottom row is completed
    const pathSquares = grid.flatMap((row, rowIndex) => 
      row.map((square, colIndex) => 
        square.isPath ? `${rowIndex},${colIndex}` : null
      ).filter(Boolean)
    );

    return pathSquares.every(square => square && explored.has(square));
  }, [grid]);

  const value: MazeContextType = {
    grid,
    currentTeam,
    teams,
    isConfigMode,
    isRelayMode,
    relayType,
    currentPlayer,
    playersInTeam,
    remainingClicks,
    maxClicksPerTurn,
    remainingTime,
    maxTimePerTurn,
    isTimerActive,
    teamStats,
    setSquareStatus,
    updateSquare,
    resetMaze,
    addTeam,
    removeTeam,
    setCurrentTeam,
    setConfigMode: setConfigModeWithCleanup,
    setRelayMode,
    setRelayType,
    addPlayerToTeam,
    nextPlayer,
    resetTurn,
    startTimer,
    pauseTimer,
    validatePath,
    getTeamStats,
    getTeamProgress,
    startOver
  };

  return <MazeContext.Provider value={value}>{children}</MazeContext.Provider>;
};

export const useMaze = () => {
  const context = useContext(MazeContext);
  if (context === undefined) {
    throw new Error('useMaze must be used within a MazeProvider');
  }
  return context;
};
