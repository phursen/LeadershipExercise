import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert
} from '@mui/material';

interface ConfigAuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ConfigAuthDialog: React.FC<ConfigAuthDialogProps> = ({ open, onClose, onSuccess }) => {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

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

  // Select riddle based on current hour to add some variety
  const currentHour = new Date().getHours();
  const selectedRiddle = leadershipRiddles[currentHour % leadershipRiddles.length];

  const handleSubmit = () => {
    const normalizedAnswer = answer.toLowerCase().trim();
    
    if (selectedRiddle.answers.includes(normalizedAnswer)) {
      setError('');
      setAnswer('');
      setAttempts(0);
      onSuccess();
    } else {
      setAttempts(prev => prev + 1);
      setError(`Incorrect answer. Think about leadership principles. (Attempt ${attempts + 1}/3)`);
      
      if (attempts >= 2) {
        setError('Too many attempts. Please try again later.');
        setTimeout(() => {
          onClose();
          setAttempts(0);
          setError('');
          setAnswer('');
        }, 2000);
      }
    }
  };

  const handleClose = () => {
    setAnswer('');
    setError('');
    setAttempts(0);
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && answer.trim()) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          🔐 Configuration Access
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            To access configuration mode, please answer this leadership riddle:
          </Typography>
          
          <Alert severity="info" sx={{ my: 2 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '1.1em' }}>
              "{selectedRiddle.question}"
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            label="Your Answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Think about what makes teams successful..."
            variant="outlined"
            sx={{ mt: 2 }}
            autoFocus
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Hint: Think about fundamental leadership and teamwork principles
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!answer.trim() || attempts >= 3}
        >
          Submit Answer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigAuthDialog;
