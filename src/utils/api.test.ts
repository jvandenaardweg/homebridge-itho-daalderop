import { sanitizeStatusPayload } from './api';

describe('utils/api', () => {
  describe('sanitizeStatusPayload()', () => {
    it('should replace "not available" with null', () => {
      const payload = JSON.stringify({
        foo: 'not available',
        bar: 'baz',
        baz: 1,
      });

      const sanitizedPayload = {
        foo: null,
        bar: 'baz',
        baz: 1,
      };
      expect(sanitizeStatusPayload(payload)).toEqual(sanitizedPayload);
    });
  });
});
