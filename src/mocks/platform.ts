import { IthoDaalderopAccessoryContext } from '@/types';
import { HomebridgeIthoDaalderop } from '@/platform';
import { Accessory, Characteristic, Service } from 'hap-nodejs';
import { PlatformAccessory } from 'homebridge';
import { mockUUID, mockAccessoryContext, mockDisplayName } from './fan-accessory';
import { loggerMock } from './logger';

// export const mockSetCharacteristics = vi.fn((category, value) => {
export const mockSetCharacteristics = vi.fn(() => {
  //   console.log('set', category, value);

  return {
    updateValue: vi.fn().mockReturnThis(),
    onSet: vi.fn().mockReturnThis(),
    onGet: vi.fn().mockReturnThis(),
    setCharacteristic: mockSetCharacteristics,
    getCharacteristics: mockGetCharacteristics,
  };
});

const mockGetCharacteristics = () => {
  //   console.log('get', category);
  // if (category === 'FirmwareRevision') {
  //   return {
  //     value: mockFirmwareVersion,
  //   };
  // }

  return {
    updateValue: vi.fn().mockReturnThis(),
    onSet: vi.fn().mockReturnThis(),
    onGet: vi.fn().mockReturnThis(),
    getCharacteristics: mockGetCharacteristics,
    setCharacteristics: mockSetCharacteristics,
    setProps: vi.fn().mockReturnThis(),
  };
};

const getServiceMock = () => {
  // const getServiceMock = category => {
  // console.log('get service', category);
  return {
    setCharacteristic: mockSetCharacteristics,
    getCharacteristic: mockGetCharacteristics,
  };
};

const addServiceMock = () => {
  // const addServiceMock = category => {
  // console.log('add service', category);
  return {
    setCharacteristic: mockSetCharacteristics,
    getCharacteristic: mockGetCharacteristics,
  };
};

export const platformMock = {
  log: loggerMock,
  api: {
    hap: {
      Service,
      Characteristic,
      HapStatusError: vi.fn(),
      HAPStatus: {
        SUCCESS: 'SUCCESS',
        SERVICE_COMMUNICATION_FAILURE: 'SERVICE_COMMUNICATION_FAILURE',
      },
    },
  },
  Service,
  Characteristic,
} as unknown as HomebridgeIthoDaalderop;

export const accessoryMock = {
  context: {
    energySocket: mockAccessoryContext,
  },
  getService: getServiceMock,
  addService: addServiceMock,
  // addService: vi.fn(),
  on: vi.fn(),
  emit: vi.fn(),
  removeService: vi.fn(),
  displayName: mockDisplayName,
  UUID: mockUUID,
  _associatedHAPAccessory: {} as Accessory,
  category: '' as any,
  reachable: true,
  services: [],
  getServiceById: vi.fn(),
  getServiceByUUIDAndSubType: vi.fn(),
  updateReachability: vi.fn(),
  configureCameraSource: vi.fn(),
  configureController: vi.fn(),
  removeController: vi.fn(),
  addListener: vi.fn(),
  once: vi.fn(),
  removeListener: vi.fn(),
  off: vi.fn(),
  removeAllListeners: vi.fn(),
  setMaxListeners: vi.fn(),
  getMaxListeners: vi.fn(),
  listeners: vi.fn(),
  rawListeners: vi.fn(),
  listenerCount: vi.fn(),
  prependListener: vi.fn(),
  prependOnceListener: vi.fn(),
  eventNames: vi.fn(),
} as unknown as PlatformAccessory<IthoDaalderopAccessoryContext>;
