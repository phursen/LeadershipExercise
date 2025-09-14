import { COMPLETION_SOUND_BASE64 } from '../assets/sounds/completion';
import { SUCCESS_SOUND_BASE64 } from '../assets/sounds/success';
import { FAILURE_SOUND_BASE64 } from '../assets/sounds/failure';

// Use base64-encoded audio data to prevent range request issues
export const SOUND_CONFIG = {
  success: SUCCESS_SOUND_BASE64,
  failure: FAILURE_SOUND_BASE64,
  completion: COMPLETION_SOUND_BASE64
};
