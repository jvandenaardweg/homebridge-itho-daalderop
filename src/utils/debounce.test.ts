import { debounce } from './debounce';

describe('utils/debounce', () => {
  describe('debounce()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
    });
    it('should return a function', () => {
      expect(typeof debounce(() => {}, 100)).toEqual('function');
    });

    it('should call the callback after the given delay', () => {
      const callback = vi.fn();
      const debouncedCallback = debounce(callback, 100);

      debouncedCallback();

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalled();
    });

    it('should call the callback only once when called multiple times within the given delay', () => {
      const callback = vi.fn();
      const debouncedCallback = debounce(callback, 100);

      debouncedCallback();
      debouncedCallback();
      debouncedCallback();

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call the callback multiple times when called multiple times outside the given delay', () => {
      const callback = vi.fn();
      const debouncedCallback = debounce(callback, 100);

      debouncedCallback();
      vi.advanceTimersByTime(100);
      debouncedCallback();
      vi.advanceTimersByTime(100);
      debouncedCallback();
      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should call the callback with the given arguments', () => {
      const callback = vi.fn();
      const debouncedCallback = debounce(callback, 100);

      debouncedCallback('foo', 'bar');

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledWith('foo', 'bar');
    });
  });
});
