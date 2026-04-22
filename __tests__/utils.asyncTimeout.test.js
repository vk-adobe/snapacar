/**
 * Tests for withTimeout utility.
 */
import { withTimeout } from '../src/utils/asyncTimeout';

describe('withTimeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('resolves with the promise value when it completes before the timeout', async () => {
    const promise = Promise.resolve('done');
    await expect(withTimeout(promise, 5000, 'test')).resolves.toBe('done');
  });

  it('rejects with a timeout error message when the promise exceeds the limit', async () => {
    const hanging = new Promise(() => {}); // never resolves
    const result = withTimeout(hanging, 100, 'Slow op');
    jest.advanceTimersByTime(200);
    await expect(result).rejects.toThrow(/Slow op timed out/i);
  });

  it('rejects with the original error when the promise rejects before the timeout', async () => {
    const failing = Promise.reject(new Error('upstream error'));
    await expect(withTimeout(failing, 5000, 'test')).rejects.toThrow('upstream error');
  });

  it('includes the ms duration in the timeout error message', async () => {
    const hanging = new Promise(() => {});
    const result = withTimeout(hanging, 3000, 'Upload');
    jest.advanceTimersByTime(5000);
    await expect(result).rejects.toThrow('3s');
  });
});
