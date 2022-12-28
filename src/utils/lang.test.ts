import { isNil } from './lang';

describe('utils/lang', () => {
  describe('isNil()', () => {
    it('should return true for null', () => {
      expect(isNil(null)).toEqual(true);
    });

    it('should return true for undefined', () => {
      expect(isNil(undefined)).toEqual(true);
    });

    it('should return false for NaN', () => {
      expect(isNil(NaN)).toEqual(false);
    });

    it('should return false for "1"', () => {
      expect(isNil('1')).toEqual(false);
    });
  });
});
