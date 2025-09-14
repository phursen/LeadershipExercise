import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import AnimatedTooltip from './AnimatedTooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { styled } from '@mui/material/styles';
import { useMaze } from '../context/MazeContext';
import { useSocket } from '../hooks/useSocket';
import CompletionDialog from './CompletionDialog';
import KeyboardHelp from './KeyboardHelp';
import VolumeControl from './VolumeControl';
import ModeTransition from './ModeTransition';
import { playSound } from '../utils/audio';
import { useAnnouncer } from '../utils/announcer';

const GridSquare = styled(Paper)(({ theme }) => ({
  width: '80px',
  height: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 'inherit',
    transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: 'none'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    '&::before': {
      boxShadow: `0 4px 8px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)'}`,
    }
  },
  '&:active': {
    transform: 'translateY(0)',
    '&::before': {
      boxShadow: `0 2px 4px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
    }
  }
}));

const MazeGrid: React.FC = () => {
  const { 
    grid, 
    currentTeam, 
    isConfigMode, 
    isRelayMode,
    relayType,
    currentPlayer,
    playersInTeam,
    remainingClicks,
    remainingTime,
    isTimerActive,
    nextPlayer,
    setSquareStatus, 
    teamStats, 
    getTeamStats 
  } = useMaze();
  const { emitSquareUpdate } = useSocket();
  const { announce } = useAnnouncer();
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completedPath, setCompletedPath] = useState<string[]>([]);
  const [lastCompletedTeam, setLastCompletedTeam] = useState('');
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // Debug grid state when component renders or grid changes
  useEffect(() => {
    console.log('🖥️ MAIN GRID SCREEN - Current grid state:');
    
    let pathCount = 0;
    let electricCount = 0;
    let revealedCount = 0;
    
    grid.forEach((row, rowIndex) => {
      row.forEach((square, colIndex) => {
        if (square.isPath) {
          pathCount++;
          console.log(`🟢 Main screen - Path square at [${rowIndex},${colIndex}]:`, square);
        }
        if (square.isElectric) {
          electricCount++;
          console.log(`🔴 Main screen - Electric square at [${rowIndex},${colIndex}]:`, square);
        }
        if (square.isRevealed) {
          revealedCount++;
          console.log(`👁️ Main screen - REVEALED square at [${rowIndex},${colIndex}]:`, square);
        }
      });
    });
    
    console.log(`🖥️ Main Screen Grid Summary: ${pathCount} path, ${electricCount} electric, ${revealedCount} revealed squares`);
    console.log(`🎮 Config Mode: ${isConfigMode ? 'ON' : 'OFF'}, Current Team: ${currentTeam || 'None'}`);
    
    // Check if any squares are incorrectly revealed when not in config mode
    if (!isConfigMode && revealedCount > 0) {
      console.warn(`⚠️ WARNING: ${revealedCount} squares are revealed but config mode is OFF!`);
      console.warn('🔍 This suggests squares were not properly hidden when exiting config mode');
    }
  }, [grid, isConfigMode, currentTeam]);

  const checkCompletion = () => {
    if (!currentTeam) return;
    
    const stats = getTeamStats(currentTeam);
    const pathSquares = grid.flatMap((row, rowIndex) => 
      row.map((square, colIndex) => 
        square.isPath ? `${rowIndex},${colIndex}` : null
      ).filter(Boolean)
    ) as string[];

    // Don't check completion if there are no path squares (no maze configured)
    if (pathSquares.length === 0) return;
    
    // Don't check completion if team hasn't explored any squares yet
    if (stats.explored.size === 0) return;

    const isComplete = pathSquares.every(square => stats.explored.has(square));
    if (isComplete && currentTeam !== lastCompletedTeam) {
      setCompletedPath(pathSquares);
      setLastCompletedTeam(currentTeam);
      setCompletionOpen(true);
      // playSound.completion().catch(console.error);
      announce(`Congratulations ${currentTeam}! You've successfully completed the maze!`, true);
    }
  };

  useEffect(() => {
    checkCompletion();
  }, [grid, currentTeam]);

  const handleSquareClick = (row: number, col: number) => {
    const square = grid[row][col];
    
    console.log(`🎯 CLICK - Square [${row},${col}] clicked:`, square);
    console.log(`🎯 CLICK - Config mode: ${isConfigMode}, Revealed: ${square.isRevealed}, Active: ${square.isActive}`);
    
    if (isConfigMode) {
      // Configuration mode - toggle square types
      console.log(`🔧 CONFIG CLICK - Toggling square [${row},${col}] in config mode`);
      if (square.isElectric) {
        setSquareStatus(row, col, { isElectric: false, isPath: false, isRevealed: false });
        console.log(`🔧 CONFIG CLICK - Set to neutral`);
      } else if (square.isPath) {
        setSquareStatus(row, col, { isPath: false, isElectric: true, isRevealed: false });
        console.log(`🔧 CONFIG CLICK - Set to electric`);
      } else {
        setSquareStatus(row, col, { isPath: true, isElectric: false, isRevealed: false });
        console.log(`🔧 CONFIG CLICK - Set to path`);
      }
      return;
    }

    if (!currentTeam) {
      console.log(`🚫 CLICK BLOCKED - No current team selected`);
      return;
    }
    
    console.log(`✅ CLICK PROCEEDING - Current team: ${currentTeam}`);

    // Relay mode: Check turn limits
    if (isRelayMode) {
      console.log(`🔄 RELAY MODE CHECK - Type: ${relayType}, Clicks: ${remainingClicks}, Timer: ${isTimerActive}`);
      if (relayType === 'clicks' && remainingClicks <= 0) {
        console.log(`🚫 RELAY BLOCKED - No clicks remaining`);
        announce(`${currentPlayer}'s turn is over! Click "Next Player" to continue.`);
        return;
      }
      if (relayType === 'time' && !isTimerActive) {
        console.log(`🚫 RELAY BLOCKED - Timer not active`);
        announce(`Timer not active. Click "Start Timer" to begin ${currentPlayer}'s turn.`);
        return;
      }
    }
    
    console.log(`🎮 GAMEPLAY CLICK - Processing square [${row},${col}] for team ${currentTeam}`);
    
    // Debug logging for gameplay clicks
    const clickedSquare = grid[row][col];
    console.log(`🎮 Square clicked at [${row},${col}]:`, {
      isPath: clickedSquare.isPath,
      isElectric: clickedSquare.isElectric,
      isRevealed: clickedSquare.isRevealed,
      isActive: clickedSquare.isActive,
      relayMode: isRelayMode,
      currentPlayer: currentPlayer,
      remainingClicks: remainingClicks
    });
    
    // Update square status to revealed and active
    console.log(`🔄 REVEALING - Setting square [${row},${col}] to revealed and active`);
    console.log(`🔄 REVEALING - Square before update:`, {
      isPath: clickedSquare.isPath,
      isElectric: clickedSquare.isElectric,
      isRevealed: clickedSquare.isRevealed,
      isActive: clickedSquare.isActive
    });
    
    setSquareStatus(row, col, { isRevealed: true, isActive: true });
    
    // Log what should happen after the update
    console.log(`🔄 REVEALING - Square should now be revealed with color:`, {
      expectedColor: clickedSquare.isElectric ? 'red' : (clickedSquare.isPath ? 'green' : 'blue'),
      isElectric: clickedSquare.isElectric,
      isPath: clickedSquare.isPath
    });
    
    console.log(`📡 SOCKET - Emitting square update for [${row},${col}]`);
    emitSquareUpdate(row, col, {
      isRevealed: true,
      isActive: true
    });

    // Play appropriate sound and handle visual feedback
    if (clickedSquare.isElectric) {
      // Electric square - always triggers electric feedback
      console.log(`⚡ Electric square triggered at [${row},${col}]`);
      // playSound.failure().catch(console.error);
      
      let announceMessage = `Electric square at row ${row + 1}, column ${col + 1}! Zap!`;
      
      // In relay mode, end current player's turn
      if (isRelayMode && playersInTeam.length > 1) {
        announceMessage += ` ${currentPlayer}'s turn is over!`;
        console.log(`🔄 RELAY MODE - Electric square ends ${currentPlayer}'s turn`);
        
        // Switch to next player after electric hit
        setTimeout(() => {
          nextPlayer();
          announce(`Switching to next player after electric hit.`);
        }, 500);
      }
      
      announce(announceMessage + ' Resetting game board...');
      
      // Reset the entire game board after electric square is clicked
      setTimeout(() => {
        console.log('🔄 ELECTRIC SQUARE HIT - Resetting game board visibility');
        
        // Hide all squares but keep the maze configuration
        grid.forEach((gridRow, gridRowIndex) => {
          gridRow.forEach((square, gridColIndex) => {
            console.log(`🔄 RESET - Hiding square [${gridRowIndex},${gridColIndex}]`);
            setSquareStatus(gridRowIndex, gridColIndex, {
              isRevealed: false,  // Hide all squares again
              isActive: false     // Reset active state
            });
            emitSquareUpdate(gridRowIndex, gridColIndex, {
              isRevealed: false,  // Hide all squares again
              isActive: false     // Reset active state
            });
          });
        });
        
        console.log('✅ Game board reset - all squares hidden again');
        announce('Game board reset! All progress hidden.');
      }, 1000);
    } else if (!clickedSquare.isPath) {
      // Non-path, non-electric square
      console.log(`❌ Wrong path at [${row},${col}]`);
      // playSound.failure().catch(console.error);
      announce(`Incorrect path at row ${row + 1}, column ${col + 1}`);
      setTimeout(() => {
        emitSquareUpdate(row, col, { isActive: false });
      }, 1000);
    } else {
      // Correct path square
      console.log(`✅ Correct path at [${row},${col}]`);
      // playSound.success().catch(console.error);
      announce(`Correct path at row ${row + 1}, column ${col + 1}`);
      
      // In relay mode, decrement clicks
      if (isRelayMode && relayType === 'clicks') {
        console.log(`🔄 RELAY MODE - Decrementing clicks for ${currentPlayer}`);
      }
    }
  };

  const getSquareColor = (square: any, pos?: string) => {
    console.log(`🎨 COLOR - Square color check for ${pos}:`, {
      isConfigMode,
      isRevealed: square.isRevealed,
      isPath: square.isPath,
      isElectric: square.isElectric,
      isActive: square.isActive
    });

    if (isConfigMode) {
      // In config mode, show actual configuration
      if (square.isElectric) {
        console.log(`🎨 CONFIG MODE - Showing electric (red) for ${pos}`);
        return '#f44336'; // Red for electric
      }
      if (square.isPath) {
        console.log(`🎨 CONFIG MODE - Showing path (green) for ${pos}`);
        return '#4caf50'; // Green for path
      }
      console.log(`🎨 CONFIG MODE - Showing neutral (dark gray) for ${pos}`);
      return '#424242'; // Dark gray for neutral
    }

    // In game mode, only show revealed squares
    if (!square.isRevealed) {
      console.log(`🎨 GAME MODE - Unrevealed square (dark gray) for ${pos}`);
      return '#424242'; // Dark gray for unrevealed
    }

    // If we reach here, square is revealed in game mode
    if (square.isElectric) {
      console.log(`🎨 GAME MODE - Revealed electric (red) for ${pos}`);
      return '#f44336'; // Red for electric
    }
    if (square.isPath) {
      console.log(`🎨 GAME MODE - Revealed path (green) for ${pos}`);
      return '#4caf50'; // Green for path
    }
    console.log(`🎨 GAME MODE - Revealed neutral (light gray) for ${pos}`);
    return '#757575'; // Light gray for neutral revealed
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle help dialog shortcut regardless of game state
      if (event.key.toLowerCase() === 'h' && 
          !(event.target instanceof HTMLInputElement) && 
          !(event.target instanceof HTMLTextAreaElement)) {
        setHelpOpen(true);
        return;
      }

      if (!currentTeam || isConfigMode || !selectedSquare) return;

      const [currentRow, currentCol] = selectedSquare;
      let newRow = currentRow;
      let newCol = currentCol;

      switch (event.key) {
        case 'ArrowUp':
          newRow = Math.max(0, currentRow - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(grid.length - 1, currentRow + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, currentCol - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(grid[0].length - 1, currentCol + 1);
          break;
        case 'Enter':
        case ' ':
          handleSquareClick(currentRow, currentCol);
          return;
        default:
          return;
      }

      if (newRow !== currentRow || newCol !== currentCol) {
        setSelectedSquare([newRow, newCol]);
        announce(`Selected square at row ${newRow + 1}, column ${newCol + 1}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSquare, currentTeam, isConfigMode, grid]);

  return (
    <>
      <Box sx={{ position: 'relative', mb: 2 }}>
        <Box sx={{ position: 'absolute', right: 0, top: -40, display: 'flex', gap: 1 }}>
          <VolumeControl />
          <AnimatedTooltip 
            title="Keyboard Controls (Press 'H')"
            placement="top"
            arrow
          >
            <IconButton 
              onClick={() => setHelpOpen(true)}
              aria-label="Show keyboard controls (Press H key)"
            >
              <HelpOutlineIcon />
            </IconButton>
          </AnimatedTooltip>
        </Box>
      </Box>
      <ModeTransition isConfigMode={isConfigMode}>
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(8, 1fr)', 
            gap: 1,
            outline: 'none',
            '&:focus': {
              outline: 'none'
            }
          }}
          tabIndex={0}
          onFocus={() => {
            if (!selectedSquare) {
              setSelectedSquare([0, 0]);
            }
          }}
          role="grid"
          aria-label="Maze grid"
        >
          {grid.map((row, rowIndex) =>
            row.map((square, colIndex) => {
              const pos = `${rowIndex},${colIndex}`;
              return (
                <GridSquare
                  key={pos}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  role="gridcell"
                  aria-label={`Grid square at row ${rowIndex + 1}, column ${colIndex + 1}${square.isRevealed ? square.isPath ? ', correct path' : ', incorrect path' : ''}`}
                  aria-selected={(selectedSquare && selectedSquare[0] === rowIndex && selectedSquare[1] === colIndex) || false}
                  aria-disabled={!currentTeam}
                  tabIndex={selectedSquare && selectedSquare[0] === rowIndex && selectedSquare[1] === colIndex ? 0 : -1}
                  sx={(theme: any) => {
                    const color = getSquareColor(square, pos);
                    console.log(`🎨 UI - Applying color ${color} to square ${pos}`);
                    return {
                      bgcolor: color,
                      transform: square.isActive ? 'translateY(-4px)' : 'none',
                      '&::before': {
                        boxShadow: square.isActive
                          ? `0 6px 12px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)'}`
                          : 'none'
                      },
                      outline: selectedSquare && selectedSquare[0] === rowIndex && selectedSquare[1] === colIndex
                        ? '3px solid #2196f3'
                        : 'none',
                      '&:focus': {
                        outline: '3px solid #2196f3'
                      },
                      cursor: currentTeam ? 'pointer' : 'not-allowed'
                    };
                  }}
                  onFocus={() => setSelectedSquare([rowIndex, colIndex])}
                />
              );
            })
          )}
        </Box>
      </ModeTransition>
      <KeyboardHelp
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        relayMode={isRelayMode}
        relayType={relayType}
        isConfigMode={isConfigMode}
      />
      {currentTeam && (
        <CompletionDialog
          open={completionOpen}
          onClose={() => setCompletionOpen(false)}
          teamName={currentTeam}
          stats={{
            explored: getTeamStats(currentTeam).explored.size,
            mistakes: getTeamStats(currentTeam).mistakes,
            elapsedTime: getTeamStats(currentTeam).completionTime
              ? getTeamStats(currentTeam).completionTime! - getTeamStats(currentTeam).startTime!
              : Date.now() - getTeamStats(currentTeam).startTime!
          }}
        />
      )}
    </>
  );
};

export default MazeGrid;
