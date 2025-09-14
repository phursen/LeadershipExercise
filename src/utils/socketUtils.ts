import { withRetry } from './retryUtils';
import { Socket } from 'socket.io-client';
import { SOCKET_CONFIG } from '../config/socket';

const SOCKET_TIMEOUT = SOCKET_CONFIG.options.timeout || 5000;

export class SocketTimeoutError extends Error {
  constructor(operation: string) {
    super(`Operation "${operation}" timed out`);
    this.name = 'SocketTimeoutError';
  }
}

export const withTimeout = <T>(
  promise: Promise<T>,
  operation: string,
  timeoutMs: number = SOCKET_TIMEOUT
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new SocketTimeoutError(operation));
      }, timeoutMs);
    })
  ]);
};

export const createSocketPromise = <T>(
  socket: Socket,
  event: string,
  data: unknown,
  operation: string,
  retryConfig?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  }
): Promise<T> => {
  return withRetry(
    () => withTimeout(
      new Promise<T>((resolve, reject) => {
        socket.timeout(SOCKET_TIMEOUT).emit(event, data, (error: Error | null, response: T) => {
          if (error) {
            if (error.message?.includes('timeout')) {
              reject(new SocketTimeoutError(operation));
            } else {
              reject(error);
            }
          } else {
            resolve(response);
          }
        });
      }),
      operation,
      SOCKET_TIMEOUT
    ),
    retryConfig
  );
};
