import { z } from 'zod';

export const retryConfigSchema = z.object({
  maxAttempts: z.number()
    .int('Maximum attempts must be a whole number')
    .min(1, 'Maximum attempts must be at least 1')
    .max(5, 'Maximum attempts cannot exceed 5'),
  
  initialDelay: z.number()
    .int('Initial delay must be a whole number')
    .min(500, 'Initial delay must be at least 500ms')
    .max(3000, 'Initial delay cannot exceed 3000ms'),
  
  maxDelay: z.number()
    .int('Maximum delay must be a whole number')
    .min(1000, 'Maximum delay must be at least 1000ms')
    .max(10000, 'Maximum delay cannot exceed 10000ms'),
  
  backoffFactor: z.number()
    .min(1.5, 'Backoff factor must be at least 1.5')
    .max(4, 'Backoff factor cannot exceed 4')
}).refine(
  (data) => data.maxDelay >= data.initialDelay,
  {
    message: 'Maximum delay must be greater than or equal to initial delay',
    path: ['maxDelay']
  }
);

export type RetryConfigSchema = z.infer<typeof retryConfigSchema>;

export const validateConfigSchema = (config: unknown) => {
  try {
    return {
      success: true,
      data: retryConfigSchema.parse(config),
      error: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        error: error.issues.map((err: z.ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message
        }))
      };
    }
    return {
      success: false,
      data: null,
      error: [{ path: '', message: 'Invalid configuration format' }]
    };
  }
};
