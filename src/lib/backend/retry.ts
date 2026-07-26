export interface RetryOptions { attempts?: number; baseDelayMs?: number; maxDelayMs?: number; shouldRetry?: (error: unknown) => boolean; sleep?: (ms: number) => Promise<void> }

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = options.attempts ?? 3;
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await operation(); } catch (error) {
      lastError = error;
      if (attempt + 1 >= attempts || options.shouldRetry?.(error) === false) throw error;
      await sleep(Math.min(options.maxDelayMs ?? 2000, (options.baseDelayMs ?? 100) * 2 ** attempt));
    }
  }
  throw lastError;
}
