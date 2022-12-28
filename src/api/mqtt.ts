import { MQTT_CMD_TOPIC } from '@/settings';
import { Logger } from 'homebridge';
import mqtt from 'mqtt';

interface MqttApiOptions {
  ip: string;
  port: number;
  username?: string;
  password?: string;
  verboseLogging?: boolean;
  logger: Logger;
}

export class MqttApi {
  private readonly mqttApiClient: mqtt.Client;
  private readonly logger: Logger;
  private readonly verboseLogging: boolean;

  constructor(options: MqttApiOptions) {
    this.mqttApiClient = mqtt.connect({
      host: options.ip,
      port: options.port,
      username: options.username,
      password: options.password,
      reconnectPeriod: 10000, // 10 seconds
    });

    this.mqttApiClient.on('connect', this.handleMqttConnect.bind(this));
    this.mqttApiClient.on('error', this.handleMqttError.bind(this));

    this.logger = options.logger;

    this.verboseLogging = options.verboseLogging || false;
  }

  protected log(...args: unknown[]): void {
    if (!this.logger) return;
    if (!this.verboseLogging) return;

    return this.logger.debug('[MQTT API] ->', ...args);
  }

  subscribe(topic: string | string[]): mqtt.Client {
    return this.mqttApiClient.subscribe(topic);
  }

  publish(topic: string, message: string): mqtt.Client {
    return this.mqttApiClient.publish(topic, message);
  }

  on(event: 'message', listener: mqtt.OnMessageCallback) {
    this.mqttApiClient.on(event, listener);
  }

  handleMqttConnect(packet: mqtt.IConnackPacket) {
    this.log(`MQTT connect: ${JSON.stringify(packet)}`);
  }

  handleMqttError(error: Error) {
    this.log(`MQTT error: ${JSON.stringify(error)}`);
  }

  setSpeed(speed: number): void {
    const speedPayload = JSON.stringify({
      // A range between 0-254
      speed: `${speed}`,
    });

    this.log(`Publish on ${MQTT_CMD_TOPIC}: ${speedPayload}`);

    this.mqttApiClient.publish(MQTT_CMD_TOPIC, speedPayload);
  }
}
