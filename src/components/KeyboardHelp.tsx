import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Typography,
  Box,
  Divider,
  Alert
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import SpaceBarIcon from '@mui/icons-material/SpaceBar';

interface KeyboardHelpProps {
  open: boolean;
  onClose: () => void;
  relayMode?: boolean;
  relayType?: 'clicks' | 'time';
  isConfigMode?: boolean;
}

interface Shortcut {
  key: string;
  description: string;
  icon: React.ReactNode | string;
}

const navigationShortcuts: Shortcut[] = [
  {
    key: 'Arrow Keys',
    description: 'Navigate through maze squares',
    icon: (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <KeyboardArrowUpIcon />
        <KeyboardArrowDownIcon />
        <KeyboardArrowLeftIcon />
        <KeyboardArrowRightIcon />
      </Box>
    )
  },
  {
    key: 'Enter',
    description: 'Reveal selected square',
    icon: <KeyboardReturnIcon />
  },
  {
    key: 'Space',
    description: 'Reveal selected square',
    icon: <SpaceBarIcon />
  },
  {
    key: 'Tab',
    description: 'Move focus to next interactive element',
    icon: 'Tab'
  }
];

const controlShortcuts: Shortcut[] = [
  {
    key: 'M',
    description: 'Toggle sound mute/unmute',
    icon: 'M'
  },
  {
    key: 'H',
    description: 'Show/hide keyboard shortcuts',
    icon: 'H'
  },
  {
    key: 'Esc',
    description: 'Close any open dialog',
    icon: 'Esc'
  }
];

const KeyboardHelp: React.FC<KeyboardHelpProps> = ({ 
  open, 
  onClose, 
  relayMode = false, 
  relayType = 'clicks', 
  isConfigMode = false 
}) => {
  const getGameGoal = () => {
    if (isConfigMode) {
      return "Configure the maze by clicking squares to set them as path (green) or electric (red). Save your configuration when complete.";
    }
    
    if (relayMode) {
      return "Work as a team to find the safe path through the maze. Each player takes turns revealing squares. Avoid electric squares or your turn ends!";
    }
    
    return "Navigate through the maze to find the safe path from start to finish. Avoid the electric squares that will reset your progress!";
  };

  const getGameRules = () => {
    const rules = [];
    
    if (isConfigMode) {
      rules.push("• Click squares to toggle between neutral (gray), path (green), and electric (red)");
      rules.push("• Create a challenging but solvable path for players");
      rules.push("• Save your configuration with a descriptive name");
      rules.push("• Test your maze by switching to play mode");
    } else {
      rules.push("• Green squares are safe path squares - step on these to progress");
      rules.push("• Red squares are electric - touching them resets the maze");
      rules.push("• Gray squares are unknown - reveal them to see what they contain");
      rules.push("• Find the complete path from start to finish to win");
      
      if (relayMode) {
        if (relayType === 'clicks') {
          rules.push("• Each player has a limited number of clicks per turn");
          rules.push("• Turn automatically switches when clicks are used up");
        } else {
          rules.push("• Each player has a time limit for their turn");
          rules.push("• Turn automatically switches when time runs out");
        }
        rules.push("• Hitting an electric square ends your turn immediately");
        rules.push("• Team wins when any player completes the path");
      }
    }
    
    return rules;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {isConfigMode ? "Maze Configuration Help" : "Electric Maze Game Guide"}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {/* Game Goal Section */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🎯 Game Goal
          </Typography>
          <Typography>
            {getGameGoal()}
          </Typography>
        </Alert>

        {/* Game Rules Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            📋 Game Rules
          </Typography>
          <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            {getGameRules().map((rule, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                {rule}
              </Typography>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Keyboard Controls Section */}
        <TableContainer component={Paper} variant="outlined">
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 1, px: 2 }}>
            ⌨️ Keyboard Controls
          </Typography>
          <Table>
            <TableBody>
              {navigationShortcuts.map((shortcut) => (
                <TableRow key={shortcut.key}>
                  <TableCell 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1,
                      width: '40%'
                    }}
                  >
                    {typeof shortcut.icon === 'string' ? (
                      <Typography 
                        component="span" 
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          fontSize: '0.875rem'
                        }}
                      >
                        {shortcut.icon}
                      </Typography>
                    ) : (
                      shortcut.icon
                    )}
                    <Typography>{shortcut.key}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>{shortcut.description}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 3, px: 2 }}>
            General Controls
          </Typography>
          <Table>
            <TableBody>
              {controlShortcuts.map((shortcut) => (
                <TableRow key={shortcut.key}>
                  <TableCell 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1,
                      width: '40%'
                    }}
                  >
                    {typeof shortcut.icon === 'string' ? (
                      <Typography 
                        component="span" 
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          fontSize: '0.875rem'
                        }}
                      >
                        {shortcut.icon}
                      </Typography>
                    ) : (
                      shortcut.icon
                    )}
                    <Typography>{shortcut.key}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>{shortcut.description}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default KeyboardHelp;
