import React, { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface CompletionDialogProps {
  open: boolean;
  onClose: () => void;
  teamName: string;
  stats: {
    explored: number;
    mistakes: number;
    elapsedTime: number;
  };
}

const CompletionDialog: React.FC<CompletionDialogProps> = ({
  open,
  onClose,
  teamName,
  stats
}) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <ReactConfetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={200}
        recycle={false}
        run={open}
      />
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 30 }} />
          <Typography variant="h5" component="span">
            Maze Completed!
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="h6" gutterBottom>
            Congratulations, {teamName}!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You've successfully navigated through the maze.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1">
              Time: {formatTime(stats.elapsedTime)}
            </Typography>
            <Typography variant="subtitle1">
              Squares Explored: {stats.explored}
            </Typography>
            <Typography variant="subtitle1">
              Mistakes: {stats.mistakes}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" fullWidth>
          Close
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default CompletionDialog;
