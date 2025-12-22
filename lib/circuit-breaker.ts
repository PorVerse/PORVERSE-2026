import { logger } from './logger';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      throw new Error('Circuit breaker is OPEN');
    }
    try {
      return await fn();
    } catch (error) {
      this.failureCount++;
      if (this.failureCount >= 5) {this.state = CircuitState.OPEN;}
      throw error;
    }
  }
}
