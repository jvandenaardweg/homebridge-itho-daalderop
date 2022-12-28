import { serialNumberFromUUID } from './serial';

describe('utils/serial', () => {
  describe('serialNumberFromUUID()', () => {
    it('should return the serial number from a UUID', () => {
      const uuid = 'e85b99bf-350e-41c5-b7b3-98ecec9b4212';
      const serial = 'e85b99bf350e41c5';
      expect(serialNumberFromUUID(uuid)).toEqual(serial);
    });
  });
});
