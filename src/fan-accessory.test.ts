import { Characteristic } from 'hap-nodejs';
import { ConfigSchema } from './config.schema';
import { FanAccessory } from './fan-accessory';
import { mockSanitizedStatusPayload } from './mocks/api-payloads';
import { accessoryMock, platformMock } from './mocks/platform';
import {
  PLATFORM_NAME,
  DEFAULT_BRIDGE_NAME,
  DEFAULT_FAN_NAME,
  ACTIVE_SPEED_THRESHOLD,
} from './settings';
import { FanInfo, IthoCveStatusSanitizedPayload } from './types';

const configMockWithCO2Sensor: ConfigSchema = {
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
    const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

    expect(fanAccessory).toBeTruthy();
  });

  it('should have the correct displayName', () => {
    const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

    expect(fanAccessory['accessory'].displayName).toBe(DEFAULT_FAN_NAME);
  });

  describe('rotationSpeedProps', () => {
    it('should return the correct rotation speed props when there is no co2Sensor config property', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMockWithCO2Sensor,
        device: {
          co2Sensor: false,
        },
      });

      const expected = {
        minValue: 0,
        maxValue: 100,
        minStep: 1,
      };

      expect(fanAccessory['rotationSpeedProps']).toEqual(expected);
    });

    it('should return the correct rotation speed props when there is a co2Sensor config property', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMockWithCO2Sensor,
        device: {
          co2Sensor: true,
        },
      });

      const expected = {
        minValue: 0,
        maxValue: 100,
        minStep: 33.333333333333336,
      };

      expect(fanAccessory['rotationSpeedProps']).toEqual(expected);
    });
  });

  describe('allowsManualSpeedControl', () => {
    it('should return false when config options device.co2Sensor is true', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMockWithCO2Sensor,
        device: {
          co2Sensor: true,
        },
      });

      expect(fanAccessory['allowsManualSpeedControl']).toBe(false);
    });

    it('should return false when config options device.nonCve is true', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMockWithCO2Sensor,
        device: {
          nonCve: true,
        },
      });

      expect(fanAccessory['allowsManualSpeedControl']).toBe(false);
    });

    it('should return false when both config options device.co2Sensor ánd device.nonCve are true', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMockWithCO2Sensor,
        device: {
          co2Sensor: true,
          nonCve: true,
        },
      });

      expect(fanAccessory['allowsManualSpeedControl']).toBe(false);
    });

    it('should return true when both config options device.co2Sensor ánd device.nonCve are false', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMockWithCO2Sensor,
        device: {
          co2Sensor: false,
          nonCve: false,
        },
      });

      expect(fanAccessory['allowsManualSpeedControl']).toBe(true);
    });

    it('should return true when the device option is undefined', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, {
        ...configMockWithCO2Sensor,
        device: undefined,
      });

      expect(fanAccessory['allowsManualSpeedControl']).toBe(true);
    });
  });

  describe('getTargetFanStateName()', () => {
    it('should return the correct name for the target fan state', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      expect(fanAccessory['getTargetFanStateName'](Characteristic.TargetFanState.MANUAL)).toBe(
        'MANUAL',
      );
      expect(fanAccessory['getTargetFanStateName'](Characteristic.TargetFanState.AUTO)).toBe(
        'AUTO',
      );
    });
  });

  describe('getCurrentFanStateName()', () => {
    it('should return the correct name for the current fan state', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      expect(fanAccessory['getCurrentFanStateName'](Characteristic.CurrentFanState.INACTIVE)).toBe(
        'INACTIVE',
      );
      expect(fanAccessory['getCurrentFanStateName'](Characteristic.CurrentFanState.IDLE)).toBe(
        'IDLE',
      );
      expect(
        fanAccessory['getCurrentFanStateName'](Characteristic.CurrentFanState.BLOWING_AIR),
      ).toBe('BLOWING_AIR');
    });
  });

  describe('getActiveName()', () => {
    it('should return the correct name for the active state', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      expect(fanAccessory['getActiveName'](Characteristic.Active.INACTIVE)).toBe('INACTIVE');
      expect(fanAccessory['getActiveName'](Characteristic.Active.ACTIVE)).toBe('ACTIVE');
    });
  });

  describe('getActiveStateByRotationSpeed()', () => {
    it('should return the correct active state for the given rotation speed', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      expect(fanAccessory['getActiveStateByRotationSpeed'](0)).toBe(Characteristic.Active.INACTIVE);
      expect(fanAccessory['getActiveStateByRotationSpeed'](19)).toBe(
        Characteristic.Active.INACTIVE,
      );

      // 20 or 20+ should be active
      expect(fanAccessory['getActiveStateByRotationSpeed'](20)).toBe(Characteristic.Active.ACTIVE);
      expect(fanAccessory['getActiveStateByRotationSpeed'](21)).toBe(Characteristic.Active.ACTIVE);
    });
  });

  describe('setRotationSpeed()', () => {
    it('should set the correct RotationSpeed', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

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
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

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
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockActiveState = Characteristic.Active.ACTIVE;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['setActive'](mockActiveState);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.Active,
        mockActiveState,
      );
    });

    it('should set the correct active state', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockActiveState = Characteristic.Active.INACTIVE;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['setActive'](mockActiveState);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.Active,
        mockActiveState,
      );
    });

    it('should not set the active state if the same value is already set', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockActiveState = Characteristic.Active.ACTIVE;

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

  describe('syncCurrentFanState()', () => {
    it('should set current fan state to INACTIVE when rotation speed is 0', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedStatus = 0;
      const mockFanInfo = 'auto';

      const mockStatusPayload = {
        ...mockSanitizedStatusPayload,
        'Speed status': mockSpeedStatus,
        FanInfo: mockFanInfo,
      } as IthoCveStatusSanitizedPayload;

      const expected = Characteristic.CurrentFanState.INACTIVE;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncCurrentFanState'](mockStatusPayload);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        expected,
      );
    });

    it('should set the current fan state to IDLE when rotation speed is below the active speed threshold but above 0', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedStatus = ACTIVE_SPEED_THRESHOLD - 1;
      const mockFanInfo = 'auto';

      const mockStatusPayload = {
        ...mockSanitizedStatusPayload,
        'Speed status': mockSpeedStatus,
        FanInfo: mockFanInfo,
      } as IthoCveStatusSanitizedPayload;

      const expected = Characteristic.CurrentFanState.IDLE;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncCurrentFanState'](mockStatusPayload);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        expected,
      );
    });

    it('should set the current fan state to BLOWING_AIR when rotation speed is above the speed threshold', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedStatus = ACTIVE_SPEED_THRESHOLD + 1;
      const mockFanInfo = 'auto';

      const mockStatusPayload = {
        ...mockSanitizedStatusPayload,
        'Speed status': mockSpeedStatus,
        FanInfo: mockFanInfo,
      } as IthoCveStatusSanitizedPayload;

      const expected = Characteristic.CurrentFanState.BLOWING_AIR;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncCurrentFanState'](mockStatusPayload);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        expected,
      );
    });
  });

  describe('sendVirtualRemoteCommand()', () => {
    it('should send the correct command to the virtual remote for speed value 20', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedValue = 20;
      const expected = 'low';

      const setVirtualRemoteCommandSpy = vi.fn();

      const mqttApiClient = fanAccessory['mqttApiClient'];

      if (!mqttApiClient) {
        throw new Error('MQTT API client is not defined');
      }

      mqttApiClient['setVirtualRemoteCommand'] = setVirtualRemoteCommandSpy;

      fanAccessory['sendVirtualRemoteCommand'](mockSpeedValue);

      expect(setVirtualRemoteCommandSpy).toHaveBeenCalledWith(expected);
    });

    it('should send the correct command to the virtual remote for speed value 50', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedValue = 50;
      const expected = 'medium';

      const setVirtualRemoteCommandSpy = vi.fn();

      const mqttApiClient = fanAccessory['mqttApiClient'];

      if (!mqttApiClient) {
        throw new Error('MQTT API client is not defined');
      }

      mqttApiClient['setVirtualRemoteCommand'] = setVirtualRemoteCommandSpy;

      fanAccessory['sendVirtualRemoteCommand'](mockSpeedValue);

      expect(setVirtualRemoteCommandSpy).toHaveBeenCalledWith(expected);
    });

    it('should send the correct command to the virtual remote for speed value 100', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedValue = 100;
      const expected = 'high';

      const setVirtualRemoteCommandSpy = vi.fn();

      const mqttApiClient = fanAccessory['mqttApiClient'];

      if (!mqttApiClient) {
        throw new Error('MQTT API client is not defined');
      }

      mqttApiClient['setVirtualRemoteCommand'] = setVirtualRemoteCommandSpy;

      fanAccessory['sendVirtualRemoteCommand'](mockSpeedValue);

      expect(setVirtualRemoteCommandSpy).toHaveBeenCalledWith(expected);
    });
  });

  describe.skip('syncRotationSpeed()', () => {
    it('should set the correct RotationSpeed when FanInfo is "auto" and Speed status is 50', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedStatus = 50;
      const mockFanInfo: FanInfo = 'auto';
      const mockStatusPayload = {
        ...mockSanitizedStatusPayload,
        'Speed status': mockSpeedStatus,
        FanInfo: mockFanInfo,
      } as IthoCveStatusSanitizedPayload;

      // The fan has a built-in CO2 sensor (see configMock)
      // so the rotation speed is mapped based on 3 steps: low, medium/auto and high
      const expectedRotationSpeed = 66.66666666666667;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncRotationSpeed'](mockStatusPayload);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        expectedRotationSpeed,
      );
    });

    it('should set the correct RotationSpeed when FanInfo is "auto" and Speed status is 100', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedStatus = 100;
      const mockFanInfo: FanInfo = 'auto';
      const mockStatusPayload = {
        ...mockSanitizedStatusPayload,
        'Speed status': mockSpeedStatus,
        FanInfo: mockFanInfo,
      } as IthoCveStatusSanitizedPayload;

      // The fan has a built-in CO2 sensor (see configMock)
      // so the rotation speed is mapped based on 3 steps: low, medium/auto and high
      const expectedRotationSpeed = 100;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncRotationSpeed'](mockStatusPayload);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        expectedRotationSpeed,
      );
    });

    it('should set the correct RotationSpeed when FanInfo is "auto" and Speed status is 25', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedStatus = 25;
      const mockFanInfo: FanInfo = 'auto';
      const mockStatusPayload = {
        ...mockSanitizedStatusPayload,
        'Speed status': mockSpeedStatus,
        FanInfo: mockFanInfo,
      } as IthoCveStatusSanitizedPayload;

      // The fan has a built-in CO2 sensor (see configMock)
      // so the rotation speed is mapped based on 3 steps: low, medium/auto and high
      const expectedRotationSpeed = 66.66666666666667;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncRotationSpeed'](mockStatusPayload);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        expectedRotationSpeed,
      );
    });

    it('should set the correct RotationSpeed when FanInfo is "auto" and Speed status is 1', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedStatus = 1;
      const mockFanInfo: FanInfo = 'auto';
      const mockStatusPayload = {
        ...mockSanitizedStatusPayload,
        'Speed status': mockSpeedStatus,
        FanInfo: mockFanInfo,
      } as IthoCveStatusSanitizedPayload;

      // The fan has a built-in CO2 sensor (see configMock)
      // so the rotation speed is mapped based on 3 steps: low, medium/auto and high
      const expectedRotationSpeed = 66.66666666666667;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncRotationSpeed'](mockStatusPayload);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        expectedRotationSpeed,
      );
    });

    it('should set the correct RotationSpeed when FanInfo is "auto" and Speed status is 0', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedStatus = 0;
      const mockFanInfo: FanInfo = 'auto';
      const mockStatusPayload = {
        ...mockSanitizedStatusPayload,
        'Speed status': mockSpeedStatus,
        FanInfo: mockFanInfo,
      } as IthoCveStatusSanitizedPayload;

      // The fan has a built-in CO2 sensor (see configMock)
      // so the rotation speed is mapped based on 3 steps: low, medium/auto and high
      const expectedRotationSpeed = 0;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncRotationSpeed'](mockStatusPayload);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        expectedRotationSpeed,
      );
    });

    it('should set the correct RotationSpeed when FanInfo is "high" and Speed status is 90', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedStatus = 90;
      const mockFanInfo: FanInfo = 'high';
      const mockStatusPayload = {
        ...mockSanitizedStatusPayload,
        'Speed status': mockSpeedStatus,
        FanInfo: mockFanInfo,
      } as IthoCveStatusSanitizedPayload;

      // The fan has a built-in CO2 sensor (see configMock)
      // so the rotation speed is mapped based on 3 steps: low, medium/auto and high
      const expectedRotationSpeed = 100;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncRotationSpeed'](mockStatusPayload);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        expectedRotationSpeed,
      );
    });

    it('should set the correct RotationSpeed when FanInfo is "low" and Speed status is 1', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedStatus = 1;
      const mockFanInfo: FanInfo = 'low';
      const mockStatusPayload = {
        ...mockSanitizedStatusPayload,
        'Speed status': mockSpeedStatus,
        FanInfo: mockFanInfo,
      } as IthoCveStatusSanitizedPayload;

      // The fan has a built-in CO2 sensor (see configMock)
      // so the rotation speed is mapped based on 3 steps: low, medium/auto and high
      const expectedRotationSpeed = 33.333333333333336;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncRotationSpeed'](mockStatusPayload);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        expectedRotationSpeed,
      );
    });

    it('should not set the rotation speed if the same value is already set', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockSpeedStatus = 50;
      const mockFanInfo: FanInfo = 'auto';
      const mockStatusPayload = {
        ...mockSanitizedStatusPayload,
        'Speed status': mockSpeedStatus,
        FanInfo: mockFanInfo,
      } as IthoCveStatusSanitizedPayload;

      // The fan has a built-in CO2 sensor (see configMock)
      // so the rotation speed is mapped based on 3 steps: low, medium/auto and high
      const expectedRotationSpeed = 66.66666666666667;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['service'].getCharacteristic = vi.fn().mockReturnValue({
        value: expectedRotationSpeed,
      });

      fanAccessory['syncRotationSpeed'](mockStatusPayload);

      expect(updateCharacteristicSpy).not.toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        expectedRotationSpeed,
      );
    });
  });

  describe('syncCharacteristicsByRotationSpeed()', () => {
    it('should set the correct characteristics when RotationSpeed is 0', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockRotationSpeed = 0;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncCharacteristicsByRotationSpeed'](mockRotationSpeed);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        mockRotationSpeed,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        platformMock.Characteristic.CurrentFanState.INACTIVE,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.Active,
        platformMock.Characteristic.Active.INACTIVE,
      );
    });

    it('should set the correct characteristics when RotationSpeed is 15', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockRotationSpeed = 15;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncCharacteristicsByRotationSpeed'](mockRotationSpeed);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        mockRotationSpeed,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        platformMock.Characteristic.CurrentFanState.IDLE,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.Active,
        platformMock.Characteristic.Active.ACTIVE,
      );
    });

    it('should set the correct characteristics when RotationSpeed is 20', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockRotationSpeed = 20;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncCharacteristicsByRotationSpeed'](mockRotationSpeed);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        mockRotationSpeed,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        platformMock.Characteristic.CurrentFanState.IDLE,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.Active,
        platformMock.Characteristic.Active.ACTIVE,
      );
    });

    it('should set the correct characteristics when RotationSpeed is higher than ACTIVE_SPEED_THRESHOLD', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockRotationSpeed = ACTIVE_SPEED_THRESHOLD + 1;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncCharacteristicsByRotationSpeed'](mockRotationSpeed);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        mockRotationSpeed,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        platformMock.Characteristic.CurrentFanState.BLOWING_AIR,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.Active,
        platformMock.Characteristic.Active.ACTIVE,
      );
    });

    it('should set the correct characteristics when RotationSpeed is higher than ACTIVE_SPEED_THRESHOLD but virtual remote command is "low"', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockRotationSpeed = ACTIVE_SPEED_THRESHOLD + 1;
      const mockVirtualRemoteCommand = 'low';

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncCharacteristicsByRotationSpeed'](
        mockRotationSpeed,
        mockVirtualRemoteCommand,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        mockRotationSpeed,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        platformMock.Characteristic.CurrentFanState.IDLE,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.Active,
        platformMock.Characteristic.Active.ACTIVE,
      );
    });

    it('should set the correct characteristics when RotationSpeed is 100', () => {
      const fanAccessory = new FanAccessory(platformMock, accessoryMock, configMockWithCO2Sensor);

      const mockRotationSpeed = 100;

      const updateCharacteristicSpy = vi.fn();

      fanAccessory['service'].updateCharacteristic = updateCharacteristicSpy;

      fanAccessory['syncCharacteristicsByRotationSpeed'](mockRotationSpeed);

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.RotationSpeed,
        mockRotationSpeed,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.CurrentFanState,
        platformMock.Characteristic.CurrentFanState.BLOWING_AIR,
      );

      expect(updateCharacteristicSpy).toHaveBeenCalledWith(
        platformMock.Characteristic.Active,
        platformMock.Characteristic.Active.ACTIVE,
      );
    });
  });
});
