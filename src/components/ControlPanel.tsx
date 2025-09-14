import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  List, 
  ListItem, 
  ListItemText, 
  CircularProgress, 
  Tooltip, 
  IconButton, 
  Switch, 
  FormControlLabel,
  Divider 
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useMaze } from '../context/MazeContext';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useSocket } from '../hooks/useSocket';
import { useAnnouncer } from '../utils/announcer';
import MazeConfigs from './MazeConfigs';
import ModeTransition from './ModeTransition';
import RetryConfigButton from './RetryConfigButton';
import HelpDialog from './HelpDialog';
import HelpIcon from '@mui/icons-material/Help';
import ConfigAuthDialog from './ConfigAuthDialog';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

const ControlPanel: React.FC = () => {
  const { 
    grid, 
    teams, 
    addTeam, 
    removeTeam,
    startOver,
    currentTeam, 
    setCurrentTeam, 
    isConfigMode, 
    setConfigMode, 
    isRelayMode,
    setRelayMode,
    relayType,
    setRelayType,
    currentPlayer,
    playersInTeam,
    remainingClicks,
    remainingTime,
    isTimerActive,
    addPlayerToTeam,
    nextPlayer,
    startTimer,
    pauseTimer,
    validatePath,
    getTeamProgress,
    setSquareStatus
  } = useMaze();
  const { emitAddTeam, emitSetCurrentTeam, emitResetMaze } = useSocket();
  const { announce } = useAnnouncer();

  useEffect(() => {
    // Ensure socket connection is established
    const checkConnection = async () => {
      try {
        await emitResetMaze();
      } catch (error) {
        console.error('Failed to establish socket connection:', error);
        setValidationError('Failed to connect to server');
      }
    };
    checkConnection();
  }, [emitResetMaze]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [validationError, setValidationError] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [changingTeam, setChangingTeam] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const handleTeamChange = async (event: SelectChangeEvent<string>) => {
    const team = event.target.value;
    if (team && team !== currentTeam) {
      setChangingTeam(team);
      try {
        await emitSetCurrentTeam(team);
        announce(`Current team changed to ${team}`);
      } finally {
        setChangingTeam(null);
      }
    }
  };

  const handleAddTeam = async () => {
    const teamName = newTeamName.trim();
    console.log(`🏆 TEAM ADD - Attempting to add team: "${teamName}"`);
    
    if (teamName) {
      setChangingTeam(teamName);
      try {
        console.log(`🏆 TEAM ADD - Adding team to context...`);
        addTeam(teamName);
        
        console.log(`🏆 TEAM ADD - Setting as current team...`);
        setCurrentTeam(teamName);
        
        console.log(`🏆 TEAM ADD - Team "${teamName}" added and selected`);
        announce(`Team ${teamName} added and selected`);
      } finally {
        setChangingTeam(null);
        setNewTeamName('');
      }
    } else {
      console.log(`🚫 TEAM ADD - Empty team name provided`);
    }
  };

  const handleConfigModeToggle = async () => {
    if (!isConfigMode) {
      // Trying to enter config mode - show auth dialog
      setAuthDialogOpen(true);
    } else {
      // Exiting config mode - save and exit
      setIsTransitioning(true);
      try {
        const timestamp = new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).replace(/[/:]/g, '-').replace(', ', '_');
        
        const configName = `Auto Save ${timestamp}`;
        
        // Import saveMazeConfig function
        const { saveMazeConfig } = await import('../utils/storage');
        saveMazeConfig(grid, configName);
        
        // Log what config was just saved
        console.log('🎯 CONFIG SAVE COMPLETE - Post-save verification:');
        const savedConfigs = localStorage.getItem('electric-maze-configs');
        if (savedConfigs) {
          const configs = JSON.parse(savedConfigs);
          console.log('📋 Total configs in storage:', configs.length);
          console.log('🔍 Last saved config:', configs[configs.length - 1]?.name);
        }
        
        // Reset grid for gameplay while preserving the maze configuration
        setSquareStatus(-1, -1, { isRevealed: false });
        console.log('✅ Grid reset for gameplay while preserving maze configuration');
        
        announce(`Configuration saved as "${configName}"`);
        setConfigMode(false);
        announce('Exited configuration mode');
      } catch (error) {
        setValidationError('Failed to update configuration');
        console.error('Config mode toggle error:', error);
      } finally {
        setIsTransitioning(false);
      }
    }
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
    setConfigMode(true);
    announce('Entered configuration mode');
  };

  const handleStartOver = () => {
    startOver();
    announce('Game reset - all team progress cleared');
  };

  const handleRemoveTeam = (teamName: string) => {
    removeTeam(teamName);
    announce(`Team ${teamName} removed`);
  };

  return (
    <Box>
      <ModeTransition isConfigMode={isConfigMode}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Control Panel
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Help">
                <IconButton onClick={() => setHelpOpen(true)}>
                  <HelpIcon />
                </IconButton>
              </Tooltip>
              <RetryConfigButton />
            </Box>
          </Box>

          {/* Relay Mode Toggle */}
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isRelayMode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRelayMode(e.target.checked)}
                  color="primary"
                />
              }
              label="Relay Mode (Team takes turns)"
            />
            
            {/* Relay Type Selection */}
            {isRelayMode && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Relay Type:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={relayType === 'time'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setRelayType(e.target.checked ? 'time' : 'clicks')
                        }
                        color="secondary"
                        size="small"
                      />
                    }
                    label={relayType === 'time' ? 'Time-based (30s per turn)' : 'Click-based (5 clicks per turn)'}
                  />
                </Box>
                
                {relayType === 'clicks' && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Each player gets {remainingClicks} clicks per turn
                  </Typography>
                )}
                
                {relayType === 'time' && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Each player gets 30 seconds per turn
                    </Typography>
                    {isTimerActive && (
                      <Typography 
                        variant="h6" 
                        color={remainingTime <= 10 ? 'error' : 'primary'}
                        sx={{ mt: 1, fontWeight: 'bold' }}
                      >
                        ⏱️ {remainingTime}s remaining
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Player Management for Relay Mode */}
          {isRelayMode && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Players ({playersInTeam.length})
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  label="Player Name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newPlayerName.trim()) {
                      addPlayerToTeam(newPlayerName.trim());
                      setNewPlayerName('');
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (newPlayerName.trim()) {
                      addPlayerToTeam(newPlayerName.trim());
                      setNewPlayerName('');
                    }
                  }}
                  disabled={!newPlayerName.trim()}
                >
                  Add Player
                </Button>
              </Box>

              {playersInTeam.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Current Player: <strong>{currentPlayer}</strong> 
                    {relayType === 'clicks' && ` (${remainingClicks} clicks left)`}
                    {relayType === 'time' && isTimerActive && ` (${remainingTime}s left)`}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={nextPlayer}
                      disabled={playersInTeam.length <= 1}
                    >
                      Next Player
                    </Button>
                    {relayType === 'time' && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={startTimer}
                          disabled={isTimerActive}
                          color="success"
                        >
                          Start Timer
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={pauseTimer}
                          disabled={!isTimerActive}
                          color="warning"
                        >
                          Pause Timer
                        </Button>
                      </>
                    )}
                  </Box>
                  <List dense>
                    {playersInTeam.map((player, index) => (
                      <ListItem key={player} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={player}
                          secondary={player === currentPlayer ? "Current turn" : `Position ${index + 1}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color={isConfigMode ? 'secondary' : 'primary'}
              fullWidth
              onClick={handleConfigModeToggle}
              disabled={isTransitioning}
              sx={{
                position: 'relative',
                '& .MuiCircularProgress-root': {
                  position: 'absolute',
                  left: '50%',
                  marginLeft: '-12px'
                }
              }}
            >
              {isTransitioning ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isConfigMode ? 'Save and Exit Configuration' : 'Configure Maze Path'
              )}
            </Button>
            {validationError && (
              <Typography color="error" sx={{ mt: 1 }}>
                {validationError}
              </Typography>
            )}
            {isConfigMode && <MazeConfigs />}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Team Management
            </Typography>
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Add Team"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                fullWidth
                disabled={isConfigMode || isTransitioning}
                InputProps={{
                  endAdornment: (
                    <Button
                      onClick={handleAddTeam}
                      disabled={!newTeamName.trim() || changingTeam === newTeamName}
                      sx={{ ml: 1 }}
                    >
                      {changingTeam === newTeamName ? (
                        <CircularProgress size={24} />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  ),
                }}
              />
            </Box>
            <FormControl fullWidth sx={{ mb: 3 }} disabled={isConfigMode || isTransitioning}>
              <InputLabel>Current Team</InputLabel>
              <Select
                value={currentTeam || ''}
                onChange={handleTeamChange}
                label="Current Team"
              >
                {teams.map((team) => (
                  <MenuItem
                    key={team}
                    value={team}
                    disabled={changingTeam === team}
                  >
                    {team}
                    {changingTeam === team && (
                      <CircularProgress size={16} sx={{ ml: 1 }} />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1">
              Team Progress
            </Typography>
            <Tooltip title="Start Over - Reset all team progress">
              <span>
                <IconButton 
                  onClick={handleStartOver}
                  color="warning"
                  disabled={teams.length === 0}
                >
                  <RestartAltIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          
          <List>
            {teams.map((team, index) => (
              <ListItem 
                key={`${team}-${index}`}
                secondaryAction={
                  <Tooltip title={`Remove ${team}`}>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemoveTeam(team)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemText
                  primary={team}
                  secondary={getTeamProgress(team)}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
        
        <HelpDialog
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
        />
        
        <ConfigAuthDialog
          open={authDialogOpen}
          onClose={() => setAuthDialogOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </ModeTransition>
    </Box>
  );
};

export default ControlPanel;
