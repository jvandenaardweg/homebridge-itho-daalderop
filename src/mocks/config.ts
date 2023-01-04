import { ConfigSchema } from '@/config.schema';
import { DEFAULT_BRIDGE_NAME, PLATFORM_NAME } from '@/settings';

export const configMockWithCO2Sensor: ConfigSchema = {
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
