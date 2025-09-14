import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Grid as MuiGrid,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { useMaze } from '../context/MazeContext';
import { loadMazeConfig } from '../utils/storage';
import MazeConfigs from './MazeConfigs';

const AnswerKey: React.FC = () => {
  const { 
    grid, 
    isConfigMode, 
    setConfigMode, 
    resetMaze,
    setSquareStatus 
  } = useMaze();
  
  const [showControls, setShowControls] = useState(false);

  // Debug: Check localStorage for saved configurations
  console.log('🔑 Answer Key - Checking localStorage...');
  const savedConfigs = localStorage.getItem('electric-maze-configs');
  console.log('🔑 Saved configs in localStorage:', savedConfigs ? JSON.parse(savedConfigs) : 'None found');
  
  // Try to load the most recent configuration directly
  let directLoadedConfig = null;
  try {
    // Get all configs and load the most recent one
    const allConfigs = JSON.parse(savedConfigs || '[]');
    if (allConfigs.length > 0) {
      const mostRecentConfig = allConfigs[allConfigs.length - 1];
      console.log('🔑 Answer Key - Most recent config name:', mostRecentConfig.name);
      directLoadedConfig = loadMazeConfig(mostRecentConfig.name);
      console.log('🔑 Answer Key - Direct loadMazeConfig result:', directLoadedConfig);
    } else {
      console.log('🔑 Answer Key - No saved configs found');
    }
  } catch (error) {
    console.log('🔑 Answer Key - Error loading config:', error);
  }
  
  // Debug: Log the grid to see what we're receiving
  console.log('🔑 Answer Key - Current grid from context:', grid);
  
  let hasAnyConfiguration = false;
  grid.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      if (square.isPath || square.isElectric) {
        hasAnyConfiguration = true;
        console.log(`🔑 Answer Key - Square [${rowIndex},${colIndex}]:`, {
          isPath: square.isPath,
          isElectric: square.isElectric,
          isRevealed: square.isRevealed
        });
      }
    });
  });
  
  if (!hasAnyConfiguration) {
    console.log('🔑 Answer Key - NO CONFIGURATION FOUND! Grid appears to be empty/default state');
    console.log('🔑 Answer Key - The MazeContext grid is not being populated from localStorage');
    
    // If we have a direct loaded config but the context grid is empty, use the direct config
    if (directLoadedConfig && directLoadedConfig.grid) {
      console.log('🔑 Answer Key - Using directly loaded config instead of context grid');
      console.log('🔑 Answer Key - Direct config grid:', directLoadedConfig.grid);
    }
  }
  
  // Use direct loaded config if context grid is empty
  const displayGrid = hasAnyConfiguration ? grid : (directLoadedConfig?.grid || grid);


  const getSquareColor = (square: any) => {
    // Show the actual configuration regardless of revealed state
    if (square.isElectric) {
      return '#f44336'; // Red for electric squares
    } else if (square.isPath) {
      return '#4caf50'; // Green for path squares
    }
    return '#424242'; // Dark gray for neutral squares
  };

  const getSquareLabel = (square: any) => {
    // Show actual configuration values
    if (square.isElectric) {
      return 'E'; // Electric squares (red)
    } else if (square.isPath) {
      return 'P'; // Path squares (green)
    }
    return ''; // Neutral squares
  };

  const countSquares = () => {
    const counts = {
      path: 0,
      electric: 0,
      neutral: 0
    };

    displayGrid.flat().forEach(square => {
      if (square.isElectric) {
        counts.electric++;
      } else if (square.isPath) {
        counts.path++;
      } else {
        counts.neutral++;
      }
    });

    return counts;
  };

  const stats = countSquares();
  
  // Debug: Log the statistics
  console.log('🔑 Answer Key - Square counts:', stats);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          🔑 Answer Key
        </Typography>
        
        <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary">
          Electric Maze Configuration
        </Typography>

        {/* Legend */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Legend
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Chip 
              label="P - Path (Green)" 
              sx={{ backgroundColor: '#4caf50', color: 'white' }}
            />
            <Chip 
              label="E - Electric (Red)" 
              sx={{ backgroundColor: '#f44336', color: 'white' }}
            />
            <Chip 
              label="Neutral Square" 
              sx={{ backgroundColor: '#424242', color: 'white' }}
            />
          </Box>
          
          {/* Statistics */}
          <Typography variant="subtitle1" gutterBottom>
            Current Configuration:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label={`Path Squares: ${stats.path}`} variant="outlined" />
            <Chip label={`Electric Squares: ${stats.electric}`} variant="outlined" />
            <Chip label={`Neutral Squares: ${stats.neutral}`} variant="outlined" />
          </Box>
        </Paper>

        {/* Maze Grid */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Maze Configuration (8x8 Grid)
          </Typography>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(8, 1fr)', 
            gap: 1,
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            {displayGrid.map((row, rowIndex) =>
              row.map((square, colIndex) => (
                <Box
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => {
                    if (isConfigMode) {
                      // Cycle through: neutral -> path -> electric -> neutral
                      if (square.isElectric) {
                        setSquareStatus(rowIndex, colIndex, { isElectric: false, isPath: false, isRevealed: false });
                        console.log(`🔑 Answer Key - Set square [${rowIndex},${colIndex}] to neutral`);
                      } else if (square.isPath) {
                        setSquareStatus(rowIndex, colIndex, { isPath: false, isElectric: true, isRevealed: false });
                        console.log(`🔑 Answer Key - Set square [${rowIndex},${colIndex}] to electric`);
                      } else {
                        setSquareStatus(rowIndex, colIndex, { isPath: true, isElectric: false, isRevealed: false });
                        console.log(`🔑 Answer Key - Set square [${rowIndex},${colIndex}] to path`);
                      }
                    }
                  }}
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: getSquareColor(square),
                    border: '1px solid #666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'white',
                    position: 'relative',
                    cursor: isConfigMode ? 'pointer' : 'default',
                    '&:hover': isConfigMode ? {
                      opacity: 0.8,
                      transform: 'scale(1.05)'
                    } : {}
                  }}
                >
                  {getSquareLabel(square)}
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: 1,
                      left: 2,
                      fontSize: '8px',
                      opacity: 0.7
                    }}
                  >
                    {rowIndex},{colIndex}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </Paper>

        {/* Admin Controls */}
        <Paper sx={{ p: 3, mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Admin Controls
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={showControls}
                  onChange={(e) => setShowControls(e.target.checked)}
                />
              }
              label="Show Controls"
            />
          </Box>
          
          {showControls && (
            <>
              <Divider sx={{ mb: 3 }} />
              
              {/* Configuration Mode Toggle */}
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isConfigMode}
                      onChange={(e) => setConfigMode(e.target.checked)}
                    />
                  }
                  label="Configuration Mode"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  {isConfigMode 
                    ? "Click squares in the grid above to configure path and electric squares" 
                    : "Switch to configuration mode to edit the maze layout"
                  }
                </Typography>
              </Box>

              {/* Quick Save and Reset Buttons */}
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    const timestamp = new Date().toLocaleString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    }).replace(/[/:]/g, '-').replace(', ', '_');
                    
                    const configName = `Answer Key Config ${timestamp}`;
                    
                    // Debug: Log grid before saving
                    console.log('🔑 Answer Key - Grid before save:', grid);
                    let pathCount = 0;
                    let electricCount = 0;
                    grid.forEach((row, rowIndex) => {
                      row.forEach((square, colIndex) => {
                        if (square.isPath) {
                          pathCount++;
                          console.log(`🔑 Path square at [${rowIndex},${colIndex}]:`, square);
                        }
                        if (square.isElectric) {
                          electricCount++;
                          console.log(`🔑 Electric square at [${rowIndex},${colIndex}]:`, square);
                        }
                      });
                    });
                    console.log(`🔑 Answer Key - Found ${pathCount} path squares, ${electricCount} electric squares`);
                    // Import saveMazeConfig function
                    const { saveMazeConfig } = await import('../utils/storage');
                    saveMazeConfig(displayGrid, configName);
                    
                    console.log(' SAVE - Configuration saved successfully');
                    
                    // Reload the page to refresh the grid state
                    window.location.reload();
                  }}
                  sx={{ mr: 2 }}
                  disabled={!isConfigMode}
                >
                  Quick Save Configuration
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={resetMaze}
                  sx={{ mr: 2 }}
                >
                  Reset Maze
                </Button>
                <Typography variant="body2" color="text.secondary" component="span">
                  {isConfigMode ? "Save current grid or reset to neutral state" : "Enable config mode to save changes"}
                </Typography>
              </Box>

              {/* Maze Configuration Management */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Maze Configuration Management
                </Typography>
                <MazeConfigs />
              </Box>
            </>
          )}
        </Paper>

        {/* Instructions */}
        <Paper sx={{ p: 3, mt: 4, backgroundColor: '#1e1e1e' }}>
          <Typography variant="h6" gutterBottom>
            Admin Instructions
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>Path Squares (P - Green):</strong> Correct squares teams should step on to complete the maze
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>Electric Squares (E - Red):</strong> Squares that trigger electric feedback and reset the board
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>Neutral Squares:</strong> Squares that provide "wrong path" feedback but don't reset the board
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
            This view shows the actual maze configuration regardless of what players have revealed. Coordinates shown as (row,column) starting from (0,0) in top-left corner.
          </Typography>
        </Paper>

        {/* Configuration Access Riddle Answers */}
        <Paper sx={{ p: 3, mt: 4, backgroundColor: '#0d47a1' }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
            🔐 Configuration Access Riddle Answers
          </Typography>
          <Typography variant="body2" sx={{ color: 'white', mb: 2 }}>
            For facilitators: Current riddle and accepted answers for configuration mode access:
          </Typography>
          
          {(() => {
            const leadershipRiddles = [
              {
                question: "What connects all team members but is invisible?",
                answers: ["trust", "communication", "respect", "understanding", "bond", "connection", "relationship"]
              },
              {
                question: "What grows stronger when shared among a team?",
                answers: ["knowledge", "trust", "vision", "goals", "purpose", "strength", "unity"]
              },
              {
                question: "What does a leader give that costs nothing but is priceless?",
                answers: ["guidance", "support", "encouragement", "recognition", "feedback", "attention", "time"]
              },
              {
                question: "What must be earned but can be lost in an instant?",
                answers: ["trust", "respect", "credibility", "reputation", "confidence"]
              },
              {
                question: "What multiplies when divided among team members?",
                answers: ["responsibility", "ownership", "accountability", "knowledge", "success"]
              }
            ];
            
            const currentHour = new Date().getHours();
            const selectedRiddle = leadershipRiddles[currentHour % leadershipRiddles.length];
            
            return (
              <Box>
                <Typography variant="body2" sx={{ color: '#bbdefb', fontStyle: 'italic', mb: 1 }}>
                  Current Riddle (changes hourly):
                </Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                  "{selectedRiddle.question}"
                </Typography>
                <Typography variant="body2" sx={{ color: '#bbdefb', mb: 1 }}>
                  Accepted Answers:
                </Typography>
                <Typography variant="body2" sx={{ color: 'white' }}>
                  {selectedRiddle.answers.join(', ')}
                </Typography>
              </Box>
            );
          })()}
        </Paper>

      </Box>
    </Container>
  );
};

export default AnswerKey;
