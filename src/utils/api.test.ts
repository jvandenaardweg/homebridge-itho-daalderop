import { ActualMode, FanInfo } from '@/types';
import {
  getRotationSpeedFromActualMode,
  getRotationSpeedFromFanInfo,
  getVirtualRemoteCommandForRotationSpeed,
  sanitizeStatusPayload,
} from './api';

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

  describe('getVirtualRemoteCommandForRotationSpeed()', () => {
    it('should return "low" when the rotation speed is between 0 and 33.333', () => {
      expect(getVirtualRemoteCommandForRotationSpeed(0)).toEqual('low');
      expect(getVirtualRemoteCommandForRotationSpeed(33.333)).toEqual('low');
    });

    it('should return "medium" when the rotation speed is between 33.334 and 66.666', () => {
      expect(getVirtualRemoteCommandForRotationSpeed(33.334)).toEqual('medium');
      expect(getVirtualRemoteCommandForRotationSpeed(66.666)).toEqual('medium');
    });

    it('should return "high" when the rotation speed is above 66.666', () => {
      expect(getVirtualRemoteCommandForRotationSpeed(66.667)).toEqual('high');
      expect(getVirtualRemoteCommandForRotationSpeed(100)).toEqual('high');
    });

    it('should fallback to medium when no match is found', () => {
      expect(getVirtualRemoteCommandForRotationSpeed(1000)).toEqual('medium');
    });
  });

  describe('getRotationSpeedForVirtualRemoteCommand()', () => {
    it('should return 33.333 when the virtual remote command is "low"', () => {
      expect(getRotationSpeedFromFanInfo('low')).toEqual(33.333333333333336);
    });

    it('should return 66.666 when the virtual remote command is "medium"', () => {
      expect(getRotationSpeedFromFanInfo('medium')).toEqual(66.66666666666667);
    });

    it('should return 66.666 when the virtual remote command is "auto"', () => {
      expect(getRotationSpeedFromFanInfo('auto')).toEqual(66.66666666666667);
    });

    it('should return 66.666 when the virtual remote command is not "low", "medium", "auto" or "high"', () => {
      expect(getRotationSpeedFromFanInfo('unknown' as FanInfo)).toEqual(66.66666666666667);
    });

    it('should return 100 when the virtual remote command is "high"', () => {
      expect(getRotationSpeedFromFanInfo('high')).toEqual(100);
    });
  });

  describe('getRotationSpeedFromActualMode()', () => {
    it('should return 33.333 when the actual mode is 1', () => {
      expect(getRotationSpeedFromActualMode(1)).toEqual(33.333333333333336);
    });

    it('should return 66.666 when the actual mode is 2', () => {
      expect(getRotationSpeedFromActualMode(2)).toEqual(66.66666666666667);
    });

    it('should return 66.666 when the actual mode is 24', () => {
      expect(getRotationSpeedFromActualMode(24)).toEqual(66.66666666666667);
    });

    it('should return 66.666 when the actual mode is not "low", "medium", "auto" or "high"', () => {
      expect(getRotationSpeedFromActualMode('unknown' as never)).toEqual(66.66666666666667);
    });

    it('should return 100 when the actual mode is 3', () => {
      expect(getRotationSpeedFromActualMode(3)).toEqual(100);
    });
  });
});
