export function initErrorReporting(): void {}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (__DEV__) {
    console.error('[Error]', error, context ?? '');
  }
}

export function setErrorUser(_id: string | null): void {}
