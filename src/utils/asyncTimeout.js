/**
 * Race `promise` against a timeout. On timeout, rejects with Error(`label timed out`).
 */
export function withTimeout(promise, ms, label = 'Request') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}
