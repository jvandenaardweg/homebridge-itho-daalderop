import { ConfigSchema } from './config.schema';
import { FanAccessory } from './fan-accessory';
import { accessoryMock, platformMock } from './mocks/platform';
import {
  PLATFORM_NAME,
  DEFAULT_BRIDGE_NAME,
  DEFAULT_FAN_NAME,
  ACTIVE_SPEED_THRESHOLD,
} from './settings';

const configMock: ConfigSchema = {
  platform: PLATFORM_NAME,
  name: DEFAULT_BRIDGE_NAME,
  api: {
    ip: '192.168.0.10',
    port: 1883,
    protocol: 'mqtt',
  },
  device: {
    co2Sensor: true,
  },
};

describe('FanAccessory', () => {
  it('should create an instance', () => {
    const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

    expect(fanAccessory).toBeTruthy();
  });

  it('should have the correct displayName', () => {
    const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

    expect(fanAccessory['accessory'].displayName).toBe(DEFAULT_FAN_NAME);
  });

  describe('allowsManualSpeedControl', () => {
    it('should return false when config options device.co2Sensor is true', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMock,
        device: {
          co2Sensor: true,
        },
      });

      expect(fanAccessory['allowsManualSpeedControl']).toBe(false);
    });

    it('should return false when config options device.nonCve is true', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMock,
        device: {
          nonCve: true,
        },
      });

      expect(fanAccessory['allowsManualSpeedControl']).toBe(false);
    });

    it('should return false when both config options device.co2Sensor ánd device.nonCve are true', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMock,
        device: {
          co2Sensor: true,
          nonCve: true,
        },
      });

      expect(fanAccessory['allowsManualSpeedControl']).toBe(false);
    });

    it('should return true when both config options device.co2Sensor ánd device.nonCve are false', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMock,
        device: {
          co2Sensor: false,
          nonCve: false,
        },
      });

      expect(fanAccessory['allowsManualSpeedControl']).toBe(true);
    });

    it('should return true when the device option is undefined', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMock,
        device: undefined,
      });

      expect(fanAccessory['allowsManualSpeedControl']).toBe(true);
    });
  });

  describe('getTargetFanStateName()', () => {
    it('should return the correct name for the target fan state', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

      expect(fanAccessory['getTargetFanStateName'](0)).toBe('MANUAL');
      expect(fanAccessory['getTargetFanStateName'](1)).toBe('AUTO');
    });
  });

  describe('getCurrentFanStateName()', () => {
    it('should return the correct name for the current fan state', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

      expect(fanAccessory['getCurrentFanStateName'](0)).toBe('INACTIVE');
      expect(fanAccessory['getCurrentFanStateName'](1)).toBe('IDLE');
      expect(fanAccessory['getCurrentFanStateName'](2)).toBe('BLOWING_AIR');
    });
  });

  describe('getActiveName()', () => {
    it('should return the correct name for the active state', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

      expect(fanAccessory['getActiveName'](0)).toBe('INACTIVE');
      expect(fanAccessory['getActiveName'](1)).toBe('ACTIVE');
    });
  });

  describe('getActiveStateByRotationSpeed()', () => {
    it('should return the correct active state for the given rotation speed', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

      expect(fanAccessory['getActiveStateByRotationSpeed'](0)).toBe(0);
      expect(fanAccessory['getActiveStateByRotationSpeed'](19)).toBe(0);

      // 20 or 20+ should be active
      expect(fanAccessory['getActiveStateByRotationSpeed'](20)).toBe(1);
      expect(fanAccessory['getActiveStateByRotationSpeed'](21)).toBe(1);
    });
  });

  describe('setRotationSpeed()', () => {
    it('should set the correct rotation speed', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

      const mockRotationSpeed = 20;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['setRotationSpeed'](mockRotationSpeed);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        mockRotationSpeed,
      );
    });

    it('should not set the rotation speed if the same value is already set', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

      const mockRotationSpeed = 20;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['service'].getCharacteristic = vi.fn().mockReturnValue({
        value: mockRotationSpeed,
      });

      fanAccessory['setRotationSpeed'](mockRotationSpeed);

      expect(updateCharacteristicSpy).not.toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        mockRotationSpeed,
      );
    });
  });

  describe('setActive()', () => {
    it('should set the correct active state', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

      const mockActiveState = 1; // active

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['setActive'](mockActiveState);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.Active,
        mockActiveState,
      );
    });

    it('should not set the active state if the same value is already set', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

      const mockActiveState = 1;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['service'].getCharacteristic = vi.fn().mockReturnValue({
        value: mockActiveState,
      });

      fanAccessory['setActive'](mockActiveState);

      expect(updateCharacteristicSpy).not.toHaveBeenCalledWith(
        platformMock.Characteristic.Active,
        mockActiveState,
      );
    });
  });

  describe('setCurrentFanState()', () => {
    it('should set current fan state to INACTIVE when rotation speed is 0', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

      const mockRotationSpeed = 0;
      const expected = 0; // INACTIVE

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['setCurrentFanState'](mockRotationSpeed);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        expected,
      );
    });

    it('should set the current fan state to IDLE when rotation speed is below the active speed threshold but above 0', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

      const mockRotationSpeed = ACTIVE_SPEED_THRESHOLD - 1;
      const expected = 1; // IDLE

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['setCurrentFanState'](mockRotationSpeed);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        expected,
      );
    });

    it('should set the current fan state to BLOWING_AIR when rotation speed is above the speed threshold', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMock);

      const mockRotationSpeed = ACTIVE_SPEED_THRESHOLD + 1;
      const expected = 2; // BLOWING_AIR

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['setCurrentFanState'](mockRotationSpeed);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        expected,
      );
    });
  });
});
