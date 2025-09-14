import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton,
  Slider,
  Popover,
  Box
} from '@mui/material';
import AnimatedTooltip from './AnimatedTooltip';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import { getVolume, setVolume, getMuted, setMuted } from '../utils/audio';

const VolumeControl: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [volume, setVolumeState] = useState(getVolume());
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(getMuted());
  const [showMuteTooltip, setShowMuteTooltip] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleVolumeChange = (_event: Event | KeyboardEvent, newValue: number | number[]) => {
    const newVolume = newValue as number;
    setVolumeState(newVolume);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      setMuted(false);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setMuted(newMuted);
    if (newMuted) {
      setPrevVolume(volume);
    } else {
      setVolumeState(prevVolume);
      setVolume(prevVolume);
    }
  };

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Only handle 'M' key when not typing in an input
    if (event.key.toLowerCase() === 'm' && 
        !(event.target instanceof HTMLInputElement) && 
        !(event.target instanceof HTMLTextAreaElement)) {
      toggleMute();
      setShowMuteTooltip(true);
      setTimeout(() => setShowMuteTooltip(false), 2000);
    }
  }, [toggleMute]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeOffIcon />;
    if (volume < 0.5) return <VolumeMuteIcon />;
    return <VolumeUpIcon />;
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <AnimatedTooltip 
        title={`Sound Volume (${Math.round(volume * 100)}%)`}
        placement="top"
        arrow
        enterDelay={200}
        leaveDelay={0}
      >
        <IconButton 
          onClick={handleClick}
          aria-label={`Sound volume: ${Math.round(volume * 100)}%`}
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls={open ? 'volume-popover' : undefined}
        >
          {getVolumeIcon()}
        </IconButton>
      </AnimatedTooltip>
      <Popover
        id="volume-popover"
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        role="dialog"
        aria-label="Volume control"
      >
        <Box
          sx={{ p: 2, width: 200 }}
          role="region"
          aria-label="Volume control panel">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
            role="group"
            aria-label="Volume controls"
          >
            <IconButton
              onClick={toggleMute}
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
              size="small"
            >
              {volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
            <Slider
              value={volume}
              onChange={handleVolumeChange}
              onKeyDown={(e) => {
                if (e.key === 'm') {
                  e.preventDefault();
                  toggleMute();
                }
              }}
              aria-label="Volume"
              aria-valuetext={`${Math.round(volume * 100)}%`}
              min={0}
              max={1}
              step={0.1}
              marks={[
                { value: 0, label: '0%' },
                { value: 0.5, label: '50%' },
                { value: 1, label: '100%' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default VolumeControl;
