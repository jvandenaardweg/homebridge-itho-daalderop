import { configMockWithCO2Sensor } from '@/mocks/config';
import { loggerMock } from '@/mocks/logger';
import { HttpApi, HttpApiOptions } from './http';

const httpApiOptions: HttpApiOptions = {
  ip: configMockWithCO2Sensor.api.ip,
  username: configMockWithCO2Sensor.api.username,
  password: configMockWithCO2Sensor.api.password,
  logger: loggerMock,
  verboseLogging: configMockWithCO2Sensor.verboseLogging,
};

describe('api/http', () => {
  it('should create an instance', () => {
    const httpApi = new HttpApi(httpApiOptions);

    expect(httpApi).toBeTruthy();

    expect(httpApi['verboseLogging']).toBe(configMockWithCO2Sensor.verboseLogging ? true : false);
    expect(httpApi['logger']).toBe(loggerMock);
  });

  it('should set the correct url', () => {
    const httpApi = new HttpApi(httpApiOptions);

    expect(httpApi['url']).instanceOf(URL);
    expect(httpApi['url'].origin).toEqual(`http://${configMockWithCO2Sensor.api.ip}`);
    expect(httpApi['url'].pathname).toEqual('/api.html');

    expect(httpApi['url'].searchParams.get('username')).toEqual(
      configMockWithCO2Sensor.api.username ? configMockWithCO2Sensor.api.username : null,
    );
    expect(httpApi['url'].searchParams.get('password')).toEqual(
      configMockWithCO2Sensor.api.password ? configMockWithCO2Sensor.api.password : null,
    );
  });
});
