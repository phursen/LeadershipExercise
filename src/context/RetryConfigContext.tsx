import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Slider,
  IconButton,
  Tooltip
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HistoryIcon from '@mui/icons-material/History';
import { validateRetryConfig, RetryConfigValidation } from '../utils/configValidation';
import ValidationHistoryDialog from '../components/ValidationHistoryDialog';
import { validateConfigSchema, RetryConfigSchema } from '../utils/configSchema';
import { saveValidationState, loadValidationState, clearValidationState } from '../utils/validationStorage';
import { addHistoryEntry, getValidationStats } from '../utils/validationHistory';

interface RetryConfig extends RetryConfigSchema {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface RetryConfigContextType {
  config: RetryConfig;
  updateConfig: (newConfig: Partial<RetryConfig>) => void;
  openSettings: () => void;
  exportConfig: () => void;
  importConfig: (file: File) => Promise<void>;
}

const STORAGE_KEY = 'electric-maze-retry-config';

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2
};

const loadStoredConfig = (): RetryConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_CONFIG;

    const parsed = JSON.parse(stored);
    const schemaValidation = validateConfigSchema(parsed);
    
    if (!schemaValidation.success || !schemaValidation.data) {
      console.warn('Invalid stored configuration:', schemaValidation.error);
      return DEFAULT_CONFIG;
    }

    return schemaValidation.data;
  } catch {
    return DEFAULT_CONFIG;
  }
};

const saveConfig = (config: RetryConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const RetryConfigContext = createContext<RetryConfigContextType | undefined>(undefined);

export const RetryConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<RetryConfig>(loadStoredConfig());
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>(() => {
    const validationState = loadValidationState();
    return validationState?.errors || {};
  });
  const [validationStats, setValidationStats] = useState(() => getValidationStats());
  const [draftConfig, setDraftConfig] = useState<RetryConfig>(() => {
    const validationState = loadValidationState();
    return validationState?.draftConfig || loadStoredConfig();
  });

  const validateAndUpdateDraft = useCallback((newConfig: Partial<RetryConfig>) => {
    const merged = { ...draftConfig, ...newConfig };
    const schemaValidation = validateConfigSchema(merged);
    
    const errors: { [key: string]: string } = {};
    if (!schemaValidation.success || !schemaValidation.data) {
      schemaValidation.error?.forEach((error: { path: string; message: string }) => {
        errors[error.path] = error.message;
      });
    }
    
    setValidationErrors(errors);
    setDraftConfig(merged);
    
    // Save validation state and history
    const timestamp = new Date().toISOString();
    saveValidationState({
      errors,
      lastValidated: timestamp,
      draftConfig: merged
    });

    addHistoryEntry({
      timestamp,
      errors,
      config: merged,
      isValid: Object.keys(errors).length === 0
    });

    // Update validation stats
    setValidationStats(getValidationStats());
    
    return errors;
  }, [draftConfig]);

  const updateConfig = useCallback((newConfig: Partial<RetryConfig>, showErrors = true) => {
    const merged = { ...config, ...newConfig };
    const schemaValidation = validateConfigSchema(merged);
    
    if (!schemaValidation.success || !schemaValidation.data) {
      const errors: { [key: string]: string } = {};
      schemaValidation.error?.forEach((error: { path: string; message: string }) => {
        errors[error.path] = error.message;
        console.error(`Configuration error: ${error.path} - ${error.message}`);
      });
      if (showErrors) {
        setValidationErrors(errors);
      }
      return;
    }
    setValidationErrors({});

    setConfig(schemaValidation.data);
    saveConfig(schemaValidation.data);
  }, []);

  const openSettings = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setValidationErrors({});
    setDraftConfig(config);
    clearValidationState();
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setDraftConfig(DEFAULT_CONFIG);
    saveConfig(DEFAULT_CONFIG);
    setValidationErrors({});
    clearValidationState();
  };

  const exportConfig = useCallback(() => {
    const configData = JSON.stringify(config, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `retry-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [config]);

  const importConfig = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      const schemaValidation = validateConfigSchema(imported);

      if (!schemaValidation.success || !schemaValidation.data) {
        const errorMessages = schemaValidation.error
          ?.map((error: { path: string; message: string }) => `${error.path}: ${error.message}`)
          .join('\n') || 'Unknown validation error';
        throw new Error(`Invalid configuration:\n${errorMessages}`);
      }

      setConfig(schemaValidation.data);
      saveConfig(schemaValidation.data);
    } catch (error) {
      console.error('Failed to import configuration:', error);
      throw error;
    }
  }, []);

  return (
    <RetryConfigContext.Provider value={{ config, updateConfig, openSettings, exportConfig, importConfig }}>
      {children}
      <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6">Retry Configuration</Typography>
              <Typography variant="caption" color="textSecondary">
                Success Rate: {validationStats.successRate.toFixed(1)}% ({validationStats.totalValidations} validations)
              </Typography>
              {validationStats.mostCommonError && (
                <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                  Most common error: {validationStats.mostCommonError}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title="View Validation History">
                <IconButton size="small" onClick={() => setIsHistoryOpen(true)}>
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                id="import-config"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    importConfig(file).catch(() => {
                      alert('Failed to import configuration');
                    });
                  }
                  e.target.value = '';
                }}
              />
              <Tooltip title="Import Configuration">
                <Button
                  size="small"
                  startIcon={<FileUploadIcon />}
                  component="label"
                  htmlFor="import-config"
                >
                  Import
                </Button>
              </Tooltip>
              <Tooltip title="Export Configuration">
                <Button
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportConfig}
                >
                  Export
                </Button>
              </Tooltip>
              <Button size="small" onClick={handleReset}>Reset</Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Maximum Retry Attempts</Typography>
              <Slider
                value={draftConfig.maxAttempts}
                onChange={(_, value) => validateAndUpdateDraft({ maxAttempts: value as number })}
                min={1}
                max={5}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
              {validationErrors.maxAttempts && (
                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  {validationErrors.maxAttempts}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Initial Retry Delay (ms)</Typography>
              <Slider
                value={draftConfig.initialDelay}
                onChange={(_, value) => validateAndUpdateDraft({ initialDelay: value as number })}
                min={500}
                max={3000}
                step={500}
                marks
                valueLabelDisplay="auto"
              />
              {validationErrors.initialDelay && (
                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  {validationErrors.initialDelay}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Maximum Retry Delay (ms)</Typography>
              <Slider
                value={draftConfig.maxDelay}
                onChange={(_, value) => validateAndUpdateDraft({ maxDelay: value as number })}
                min={1000}
                max={10000}
                step={1000}
                marks
                valueLabelDisplay="auto"
              />
              {validationErrors.maxDelay && (
                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  {validationErrors.maxDelay}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Backoff Factor</Typography>
              <Slider
                value={draftConfig.backoffFactor}
                onChange={(_, value) => validateAndUpdateDraft({ backoffFactor: value as number })}
                min={1.5}
                max={4}
                step={0.5}
                marks
                valueLabelDisplay="auto"
              />
              {validationErrors.backoffFactor && (
                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  {validationErrors.backoffFactor}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              const errors = validateAndUpdateDraft(draftConfig);
              if (Object.keys(errors).length === 0) {
                setConfig(draftConfig);
                saveConfig(draftConfig);
                clearValidationState();
                handleClose();
              }
            }}
            disabled={Object.keys(validationErrors).length > 0}
          >
            Save
          </Button>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <ValidationHistoryDialog
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </RetryConfigContext.Provider>
  );
};

export const useRetryConfig = () => {
  const context = useContext(RetryConfigContext);
  if (!context) {
    throw new Error('useRetryConfig must be used within a RetryConfigProvider');
  }
  return context;
};

