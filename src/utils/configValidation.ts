interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedValue?: any;
}

interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

interface FieldValidation<T> {
  rules: ValidationRule<T>[];
  sanitize?: (value: T) => T;
}

export interface RetryConfigValidation {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const retryConfigRules: Record<keyof RetryConfigValidation, FieldValidation<number>> = {
  maxAttempts: {
    rules: [
      {
        validate: (value) => Number.isInteger(value),
        message: 'Maximum attempts must be a whole number'
      },
      {
        validate: (value) => value >= 1 && value <= 5,
        message: 'Maximum attempts must be between 1 and 5'
      }
    ],
    sanitize: (value) => Math.min(Math.max(Math.round(value), 1), 5)
  },
  initialDelay: {
    rules: [
      {
        validate: (value) => Number.isInteger(value),
        message: 'Initial delay must be a whole number'
      },
      {
        validate: (value) => value >= 500 && value <= 3000,
        message: 'Initial delay must be between 500ms and 3000ms'
      }
    ],
    sanitize: (value) => Math.min(Math.max(Math.round(value), 500), 3000)
  },
  maxDelay: {
    rules: [
      {
        validate: (value) => Number.isInteger(value),
        message: 'Maximum delay must be a whole number'
      },
      {
        validate: (value) => value >= 1000 && value <= 10000,
        message: 'Maximum delay must be between 1000ms and 10000ms'
      }
    ],
    sanitize: (value) => Math.min(Math.max(Math.round(value), 1000), 10000)
  },
  backoffFactor: {
    rules: [
      {
        validate: (value) => value >= 1.5 && value <= 4,
        message: 'Backoff factor must be between 1.5 and 4'
      }
    ],
    sanitize: (value) => Math.min(Math.max(value, 1.5), 4)
  }
};

export const validateRetryConfig = (config: Partial<RetryConfigValidation>): ValidationResult => {
  const errors: ValidationError[] = [];
  const sanitizedConfig: Partial<RetryConfigValidation> = {};

  Object.entries(config).forEach(([key, value]) => {
    const fieldKey = key as keyof RetryConfigValidation;
    const validation = retryConfigRules[fieldKey];

    if (validation) {
      // Apply validation rules
      validation.rules.forEach(rule => {
        if (!rule.validate(value)) {
          errors.push({
            field: fieldKey,
            message: rule.message
          });
        }
      });

      // Sanitize value
      if (validation.sanitize) {
        sanitizedConfig[fieldKey] = validation.sanitize(value);
      } else {
        sanitizedConfig[fieldKey] = value;
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedConfig
  };
};
