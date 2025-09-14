const VALIDATION_STORAGE_KEY = 'electric-maze-validation-state';

export interface ValidationState {
  errors: { [key: string]: string };
  lastValidated: string;
  draftConfig: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
}

export const saveValidationState = (state: ValidationState): void => {
  try {
    localStorage.setItem(VALIDATION_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save validation state:', error);
  }
};

export const loadValidationState = (): ValidationState | null => {
  try {
    const stored = localStorage.getItem(VALIDATION_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return null;

    // Validate structure
    if (!parsed.errors || !parsed.lastValidated || !parsed.draftConfig) {
      return null;
    }

    // Validate draft config structure
    const requiredFields = ['maxAttempts', 'initialDelay', 'maxDelay', 'backoffFactor'];
    if (!requiredFields.every(field => typeof parsed.draftConfig[field] === 'number')) {
      return null;
    }

    return parsed as ValidationState;
  } catch (error) {
    console.warn('Failed to load validation state:', error);
    return null;
  }
};

export const clearValidationState = (): void => {
  try {
    localStorage.removeItem(VALIDATION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear validation state:', error);
  }
};
