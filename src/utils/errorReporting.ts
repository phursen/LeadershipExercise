interface ErrorReport {
  error: Error;
  componentStack?: string;
  timestamp: number;
  userAgent: string;
  location: string;
}

class ErrorReportingService {
  private static instance: ErrorReportingService;
  private readonly endpoint = 'https://api.error-reporting.example.com/v1/errors';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  private constructor() {}

  public static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private async sendWithRetry(report: ErrorReport, attempt = 1): Promise<void> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok && attempt < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.sendWithRetry(report, attempt + 1);
      }
    } catch (error) {
      if (attempt < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.sendWithRetry(report, attempt + 1);
      }
      console.error('Failed to send error report after multiple attempts:', error);
    }
  }

  public async reportError(error: Error, componentStack?: string): Promise<void> {
    const report: ErrorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      location: window.location.href,
    };

    // In development, log the error report to console
    if (process.env.NODE_ENV === 'development') {
      console.group('Error Report');
      console.log(report);
      console.groupEnd();
      return;
    }

    // In production, send to error reporting service
    await this.sendWithRetry(report);
  }

  public async reportWarning(message: string, details?: any): Promise<void> {
    const warning = new Error(message);
    warning.name = 'Warning';
    await this.reportError(warning);
  }
}

export const errorReporting = ErrorReportingService.getInstance();
