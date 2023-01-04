import { configMockWithCO2Sensor } from '@/mocks/config';
import { loggerMock } from '@/mocks/logger';
import { HttpApi } from './http';

describe('api/http', () => {
  it('should create an instance', () => {
    const httpApi = new HttpApi({
      ip: configMockWithCO2Sensor.api.ip,
      username: configMockWithCO2Sensor.api.username,
      password: configMockWithCO2Sensor.api.password,
      logger: loggerMock,
      verboseLogging: configMockWithCO2Sensor.verboseLogging,
    });

    expect(httpApi).toBeTruthy();
  });
});
