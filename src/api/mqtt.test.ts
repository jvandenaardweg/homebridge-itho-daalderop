import { configMockWithCO2Sensor } from '@/mocks/config';
import { loggerMock } from '@/mocks/logger';
import { MqttApi, MqttApiOptions } from './mqtt';
import mqtt from 'mqtt';
import { MQTT_CMD_TOPIC } from '@/settings';

const mockMqttApiOptions: MqttApiOptions = {
  ip: configMockWithCO2Sensor.api.ip,
  port: configMockWithCO2Sensor.api.port,
  username: configMockWithCO2Sensor.api.username,
  password: configMockWithCO2Sensor.api.password,
  logger: loggerMock,
  verboseLogging: configMockWithCO2Sensor.verboseLogging,
};

describe('api/mqtt', () => {
  it('should create an instance', () => {
    const mqttApi = new MqttApi(mockMqttApiOptions);

    expect(mqttApi).toBeTruthy();

    expect(mqttApi['verboseLogging']).toBe(configMockWithCO2Sensor.verboseLogging ? true : false);
    expect(mqttApi['logger']).toBe(loggerMock);
  });

  it('should connect to the mqtt broker using the config options', async () => {
    const connectSpy = vi.spyOn(mqtt, 'connect');

    const mqttApi = new MqttApi(mockMqttApiOptions);

    expect(connectSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        host: mockMqttApiOptions.ip,
        hostname: mockMqttApiOptions.ip,
        port: mockMqttApiOptions.port,
        username: mockMqttApiOptions.username,
        password: mockMqttApiOptions.password,
        protocol: 'mqtt',
      }),
    );
    expect(mqttApi['mqttApiClient']).toBeTruthy();
  });

  it('should set and handle the connect event', async () => {
    const onSpy = vi.spyOn(mqtt.Client.prototype, 'on');
    const handleMqttConnectSpy = vi.spyOn(MqttApi.prototype, 'handleMqttConnect');

    const mqttApi = new MqttApi(mockMqttApiOptions);

    expect(onSpy).toHaveBeenCalledWith('connect', expect.any(Function));

    mqttApi['mqttApiClient'].emit('connect', 'test-connect');

    expect(handleMqttConnectSpy).toHaveBeenCalledWith('test-connect');
  });

  it('should set and handle the error event', async () => {
    const onSpy = vi.spyOn(mqtt.Client.prototype, 'on');
    const handleMqttErrorSpy = vi.spyOn(MqttApi.prototype, 'handleMqttError');

    const mqttApi = new MqttApi(mockMqttApiOptions);

    expect(onSpy).toHaveBeenCalledWith('error', expect.any(Function));

    mqttApi['mqttApiClient'].emit('error', 'test-error');

    expect(handleMqttErrorSpy).toHaveBeenCalledWith('test-error');
  });

  it('should subscribe to the given topic', async () => {
    const subscribeSpy = vi.spyOn(mqtt.Client.prototype, 'subscribe');

    const mqttApi = new MqttApi(mockMqttApiOptions);

    mqttApi.subscribe('test-topic');

    expect(subscribeSpy).toHaveBeenCalledWith('test-topic');
  });

  it('should publish the given message to the given topic', async () => {
    const publishSpy = vi.spyOn(mqtt.Client.prototype, 'publish');

    const mqttApi = new MqttApi(mockMqttApiOptions);

    mqttApi.publish('test-topic', 'test-message');

    expect(publishSpy).toHaveBeenCalledWith('test-topic', 'test-message');
  });

  it('should set the speed using setSpeed', async () => {
    const publishSpy = vi.spyOn(mqtt.Client.prototype, 'publish');

    const mqttApi = new MqttApi(mockMqttApiOptions);

    const speedNumber = 25;

    mqttApi.setSpeed(speedNumber);

    expect(publishSpy).toHaveBeenCalledWith(
      MQTT_CMD_TOPIC,
      JSON.stringify({ speed: `${speedNumber}` }),
    );
  });

  it('should set the virtual remote control using setVirtualRemoteControl', async () => {
    const publishSpy = vi.spyOn(mqtt.Client.prototype, 'publish');

    const mqttApi = new MqttApi(mockMqttApiOptions);

    mqttApi.setVirtualRemoteCommand('medium');

    expect(publishSpy).toHaveBeenCalledWith(MQTT_CMD_TOPIC, JSON.stringify({ vremote: 'medium' }));
  });
});
