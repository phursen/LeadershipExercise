import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import MouseIcon from '@mui/icons-material/Mouse';
import RouteIcon from '@mui/icons-material/Route';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ open, onClose }) => {
  const ConfigSection = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Configuring the Maze Path
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon>
            <EditIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Enter Configuration Mode"
            secondary="Click 'Configure Maze Path' button in the Control Panel to start"
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <MouseIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Create the Path"
            secondary="Click squares to mark them as part of the correct path through the maze"
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <RouteIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Valid Path Requirements"
            secondary="The path must connect from the top row to the bottom row of the maze"
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <CheckCircleIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Save Configuration"
            secondary="Click 'Save and Exit Configuration' when done. The path will be validated before saving."
          />
        </ListItem>
      </List>
    </Paper>
  );

  const PlaySection = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Playing the Game
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon>
            <GroupsIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Team Management"
            secondary="Add teams and switch between them using the Control Panel"
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <MouseIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Exploring the Maze"
            secondary="Click squares to reveal them. Teams must find the correct path from top to bottom."
          />
        </ListItem>
      </List>
    </Paper>
  );

  const AccessibilitySection = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Accessibility Features
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon>
            <KeyboardIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Keyboard Navigation"
            secondary="Use arrow keys to navigate the maze, Space/Enter to select squares"
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <VolumeUpIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Screen Reader Support"
            secondary="All actions and game events are announced for screen readers"
          />
        </ListItem>
      </List>
    </Paper>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="help-dialog-title"
    >
      <DialogTitle id="help-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Electric Maze Help</Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <ConfigSection />
        <Divider sx={{ my: 2 }} />
        <PlaySection />
        <Divider sx={{ my: 2 }} />
        <AccessibilitySection />
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
