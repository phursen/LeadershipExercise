const HISTORY_STORAGE_KEY = 'electric-maze-validation-history';
const MAX_HISTORY_ENTRIES = 50;

export interface ValidationHistoryEntry {
  timestamp: string;
  errors: { [key: string]: string };
  config: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
  isValid: boolean;
}

export interface ValidationHistory {
  entries: ValidationHistoryEntry[];
  lastUpdated: string;
}

export const addHistoryEntry = (entry: ValidationHistoryEntry): void => {
  try {
    const history = loadHistory();
    history.entries.unshift(entry);

    // Keep only the most recent entries
    if (history.entries.length > MAX_HISTORY_ENTRIES) {
      history.entries = history.entries.slice(0, MAX_HISTORY_ENTRIES);
    }

    history.lastUpdated = new Date().toISOString();
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to add validation history entry:', error);
  }
};

export const loadHistory = (): ValidationHistory => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) {
      return { entries: [], lastUpdated: new Date().toISOString() };
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed.entries)) {
      return { entries: [], lastUpdated: new Date().toISOString() };
    }

    // Validate entries structure
    const validEntries = parsed.entries.filter((entry: any) => {
      return (
        entry &&
        typeof entry === 'object' &&
        typeof entry.timestamp === 'string' &&
        typeof entry.isValid === 'boolean' &&
        entry.config &&
        typeof entry.config === 'object' &&
        typeof entry.config.maxAttempts === 'number' &&
        typeof entry.config.initialDelay === 'number' &&
        typeof entry.config.maxDelay === 'number' &&
        typeof entry.config.backoffFactor === 'number'
      );
    });

    return {
      entries: validEntries,
      lastUpdated: parsed.lastUpdated || new Date().toISOString()
    };
  } catch (error) {
    console.warn('Failed to load validation history:', error);
    return { entries: [], lastUpdated: new Date().toISOString() };
  }
};

export const clearHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear validation history:', error);
  }
};

export const getValidationStats = (): {
  totalValidations: number;
  successRate: number;
  mostCommonError: string | null;
} => {
  const history = loadHistory();
  const totalValidations = history.entries.length;
  
  if (totalValidations === 0) {
    return {
      totalValidations: 0,
      successRate: 0,
      mostCommonError: null
    };
  }

  const successCount = history.entries.filter(entry => entry.isValid).length;
  const successRate = (successCount / totalValidations) * 100;

  // Count error occurrences
  const errorCounts: { [key: string]: number } = {};
  history.entries.forEach(entry => {
    if (!entry.isValid && entry.errors) {
      Object.values(entry.errors).forEach(error => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
    }
  });

  // Find most common error
  let mostCommonError = null;
  let maxCount = 0;
  Object.entries(errorCounts).forEach(([error, count]) => {
    if (count > maxCount) {
      mostCommonError = error;
      maxCount = count;
    }
  });

  return {
    totalValidations,
    successRate,
    mostCommonError
  };
};
