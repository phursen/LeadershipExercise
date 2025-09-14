import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon, Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useMaze } from '../context/MazeContext';
import { saveMazeConfig, getMazeConfigs, deleteMazeConfig, loadMazeConfig, exportMazeConfigs, importMazeConfigs } from '../utils/storage';

const MazeConfigs: React.FC = () => {
  const { grid, setSquareStatus, resetMaze } = useMaze();
  const [open, setOpen] = useState(false);
  const [configName, setConfigName] = useState('');
  const [configs, setConfigs] = useState(getMazeConfigs());
  const [importError, setImportError] = useState('');

  const handleSave = () => {
    const name = configName.trim() || generateDefaultConfigName();
    saveMazeConfig(grid, name);
    setConfigName('');
    setConfigs(getMazeConfigs());
  };

  const generateDefaultConfigName = () => {
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/[/,]/g, '-').replace(/\s/g, '_');
    return `Game Config ${timestamp}`;
  };

  const handleLoad = (name: string) => {
    const loadedConfig = loadMazeConfig(name);
    if (!loadedConfig) return;

    const loadedGrid = loadedConfig.grid;
    
    console.log('🔧 Loading maze configuration:', loadedConfig.name);
    console.log('📋 Loaded grid:', loadedGrid);
    
    // Validate loadedGrid exists and is an array
    if (!loadedGrid || !Array.isArray(loadedGrid)) {
      console.error('❌ Invalid grid data:', loadedGrid);
      return;
    }
    
    // Count and log valid squares from the loaded configuration
    const validSquares = {
      pathSquares: [] as string[],
      electricSquares: [] as string[]
    };
    
    const summary = {
      path: 0,
      electric: 0,
      neutral: 0,
      revealed: 0
    };
    
    loadedGrid.forEach((row: any[], rowIndex: number) => {
      row.forEach((square: any, colIndex: number) => {
        if (square.isPath) {
          summary.path++;
          validSquares.pathSquares.push(`[${rowIndex},${colIndex}]`);
        } else if (square.isElectric) {
          summary.electric++;
          validSquares.electricSquares.push(`[${rowIndex},${colIndex}]`);
        } else {
          summary.neutral++;
        }
        
        if (square.isRevealed) {
          summary.revealed++;
        }
      });
    });
    
    console.log('📊 Grid Summary:', summary);
    console.log('✅ Valid Path Squares:', validSquares.pathSquares.join(', '));
    console.log('⚡ Valid Electric Squares:', validSquares.electricSquares.join(', '));
    console.log('🎯 All Valid Squares (Path + Electric):', [...validSquares.pathSquares, ...validSquares.electricSquares].join(', '));

    // Close dialog first to prevent focus issues
    setOpen(false);
    
    // Reset the entire grid first, then apply the loaded configuration
    console.log('🔄 Resetting grid before loading configuration...');
    
    // Call resetMaze to clear the grid completely
    resetMaze();
    
    // Use setTimeout to ensure grid reset is complete before loading
    setTimeout(() => {
      console.log('🔄 Starting grid application after reset...');
      
      // Apply all squares from the loaded configuration
      loadedGrid.forEach((row: any[], rowIndex: number) => {
        row.forEach((square: any, colIndex: number) => {
          console.log(`🔧 Applying square [${rowIndex},${colIndex}]:`, square);
          
          // Ensure tiles are not revealed when loading configuration
          const cleanSquare = {
            ...square,
            isRevealed: false,
            isActive: false
          };
          
          console.log(`🔧 Clean square [${rowIndex},${colIndex}]:`, cleanSquare);
          setSquareStatus(rowIndex, colIndex, cleanSquare);
        });
      });
      
      console.log('✅ Grid loaded and applied to maze');
      console.log(`📊 Expected result: ${summary.path} path squares, ${summary.electric} electric squares`);
    }, 200);
  };

  const handleDelete = (name: string) => {
    deleteMazeConfig(name);
    setConfigs(getMazeConfigs());
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    const success = await importMazeConfigs(file);
    
    if (success) {
      setConfigs(getMazeConfigs());
    } else {
      setImportError('Failed to import configurations. Please check the file format.');
    }

    // Reset the input
    event.target.value = '';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
        sx={{ mt: 2 }}
        fullWidth
      >
        Manage Maze Configurations
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Maze Configurations</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <TextField
              label="Configuration Name (optional)"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 1 }}
              placeholder="Leave blank for auto-generated name"
            />
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              fullWidth
              sx={{ mb: 1 }}
            >
              Save Current Configuration
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                component="label"
                fullWidth
              >
                Import Configs
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={handleImport}
                />
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportMazeConfigs}
                fullWidth
              >
                Export All
              </Button>
            </Box>
            {importError && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                {importError}
              </Typography>
            )}
          </Box>

          {configs.length === 0 ? (
            <Typography color="text.secondary" align="center">
              No saved configurations
            </Typography>
          ) : (
            <List>
              {configs.map((config, index) => (
                <ListItem
                  key={`${config.name}-${config.createdAt}-${index}`}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(config.name)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={config.name}
                    secondary={formatDate(config.createdAt)}
                    sx={{ mr: 2 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleLoad(config.name)}
                  >
                    Load
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MazeConfigs;
