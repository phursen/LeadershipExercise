import { SOUND_CONFIG } from '../config/sounds';
import { SUCCESS_SOUND_BASE64 } from '../assets/sounds/success';
import { FAILURE_SOUND_BASE64 } from '../assets/sounds/failure';
import { COMPLETION_SOUND_BASE64 } from '../assets/sounds/completion';

// Volume state
let currentVolume = 0.5;
let isMuted = false;

// Load settings from localStorage
const loadSettings = () => {
  const savedVolume = localStorage.getItem('electric-maze-volume');
  const savedMuted = localStorage.getItem('electric-maze-muted');
  
  if (savedVolume) currentVolume = parseFloat(savedVolume);
  if (savedMuted) isMuted = savedMuted === 'true';
};

// Save settings to localStorage
const saveSettings = () => {
  localStorage.setItem('electric-maze-volume', currentVolume.toString());
  localStorage.setItem('electric-maze-muted', isMuted.toString());
};

// Create audio element with base64 data URL
const createAudio = (base64Data: string): HTMLAudioElement => {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = base64Data;
  return audio;
};

// Sound instances
const sounds = {
  success: createAudio(SUCCESS_SOUND_BASE64),
  failure: createAudio(FAILURE_SOUND_BASE64),
  completion: createAudio(COMPLETION_SOUND_BASE64)
};

// Initialize settings
loadSettings();

// Update all audio volumes
const updateVolumes = () => {
  const volume = isMuted ? 0 : currentVolume;
  Object.values(sounds).forEach(audio => {
    audio.volume = volume;
  });
};

// Track if audio is ready to play
let isAudioReady = false;

// Initialize audio on first user interaction
const initAudio = () => {
  const init = async () => {
    if (isAudioReady) return;
    
    try {
      // Try to play and pause a silent sound to unlock audio
      const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 'A'.repeat(100));
      audio.volume = 0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise.catch(() => {});
        audio.pause();
        audio.currentTime = 0;
      }
      
      isAudioReady = true;
      console.log('Audio initialized successfully');
    } catch (e) {
      console.warn('Audio initialization warning:', e);
    }
  };

  // Add event listeners for first interaction
  const initOnce = () => {
    init();
    document.removeEventListener('click', initOnce);
    document.removeEventListener('touchstart', initOnce);
    document.removeEventListener('keydown', initOnce);
  };

  // Only add event listeners if we're in a browser environment
  if (typeof document !== 'undefined') {
    document.addEventListener('click', initOnce, { once: true });
    document.addEventListener('touchstart', initOnce, { once: true });
    document.addEventListener('keydown', initOnce, { once: true });
  }
};

// Initialize audio on module load in a browser environment
if (typeof window !== 'undefined') {
  initAudio();
}

// Volume controls
export const getVolume = (): number => currentVolume;
export const setVolume = (volume: number): void => {
  currentVolume = Math.max(0, Math.min(1, volume));
  updateVolumes();
  saveSettings();
};

export const getMuted = (): boolean => isMuted;
export const setMuted = (muted: boolean): void => {
  isMuted = muted;
  updateVolumes();
  saveSettings();
};

// Play sounds
export const playSound = {
  success: async (): Promise<void> => {
    try {
      sounds.success.currentTime = 0;
      await sounds.success.play();
    } catch (error) {
      console.error('Error playing success sound:', error);
    }
  },
  
  failure: async (): Promise<void> => {
    try {
      sounds.failure.currentTime = 0;
      await sounds.failure.play();
    } catch (error) {
      console.error('Error playing failure sound:', error);
    }
  },
  
  completion: async (): Promise<void> => {
    try {
      sounds.completion.currentTime = 0;
      await sounds.completion.play();
    } catch (error) {
      console.error('Error playing completion sound:', error);
    }
  }
};

// Set initial volumes
updateVolumes();
