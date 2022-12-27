import { Service, PlatformAccessory, CharacteristicValue, Nullable } from 'homebridge';

import { HomebridgeIthoDaalderop } from '@/platform';
import { IthoDaalderopAccessoryContext, IthoStatusSanitizedPayload } from './types';
import { DEFAULT_AIR_QUALITY_SENSOR_NAME, MANUFACTURER, MQTT_STATUS_TOPIC } from './settings';
import { sanitizeStatusPayload } from './utils/api';
import { isNil } from './utils';
import { ConfigSchema } from './config.schema';
import { HttpApi } from './api/http';
import { MqttApi } from './api/mqtt';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class AirQualitySensorAccessory {
  private service: Service;
  private mqttApiClient: MqttApi | null = null;
  private httpApiClient: HttpApi;
  private lastStatusPayload: Nullable<IthoStatusSanitizedPayload> = null;
  private lastStatusPayloadTimestamp: Nullable<number> = null;

  constructor(
    private readonly platform: HomebridgeIthoDaalderop,
    private readonly accessory: PlatformAccessory<IthoDaalderopAccessoryContext>,
    private readonly config: ConfigSchema,
  ) {
    this.log.debug(`Initializing platform accessory`);
    this.log.debug(`Using API: ${JSON.stringify(this.config.api)}`);

    if (this.config.api.protocol === 'mqtt') {
      this.mqttApiClient = new MqttApi({
        ip: this.config.api.ip,
        port: this.config.api.port,
        username: this.config.api.username,
        password: this.config.api.password,
        logger: this.platform.log,
      });

      this.mqttApiClient.subscribe(MQTT_STATUS_TOPIC);

      this.mqttApiClient.on('message', this.handleMqttMessage.bind(this));
    }

    // Always setup the HTTP API client, because it's the default and always available on the Wifi module
    this.httpApiClient = new HttpApi({
      ip: this.config.api.ip,
      username: this.config.api.username,
      password: this.config.api.password,
      logger: this.platform.log,
    });

    // Only start polling if we're using the HTTP API
    if (this.config.api.protocol === 'http') {
      this.httpApiClient.polling.getStatus.start();

      this.log.debug(`Starting polling for status...`);

      this.httpApiClient.polling.getStatus.on('response', response => {
        this.handleStatusResponse(response as IthoStatusSanitizedPayload); // TODO: fix type
      });
    }

    const informationService = this.accessory.getService(
      this.platform.Service.AccessoryInformation,
    );

    informationService?.setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER);
    informationService?.setCharacteristic(
      this.platform.Characteristic.Model,
      DEFAULT_AIR_QUALITY_SENSOR_NAME, // Value is unknown, we'll set something
    );
    informationService?.setCharacteristic(
      this.platform.Characteristic.SerialNumber,
      'Unknown', // Value is unknown, we'll set something
    );
    informationService?.setCharacteristic(
      this.platform.Characteristic.FirmwareRevision,
      '1.0', // Value is unknown, we'll set something
    );

    this.service =
      this.accessory.getService(this.platform.Service.AirQualitySensor) ||
      this.accessory.addService(this.platform.Service.AirQualitySensor);

    // REQUIRED

    // Set a default AirQuality value on instantiation
    this.service.setCharacteristic(
      this.platform.Characteristic.AirQuality,
      this.platform.Characteristic.AirQuality.GOOD,
    );

    this.service.setCharacteristic(this.platform.Characteristic.StatusActive, true);

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    this.service
      .getCharacteristic(this.platform.Characteristic.AirQuality)
      .onGet(this.handleGetAirQuality.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.StatusActive)
      .onGet(this.handleGetStatusActive.bind(this));
  }

  get log() {
    const loggerPrefix = `[Air Quality Sensor: ${this.accessory.displayName}] -> `;

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      info: (...parameters: any[]) => {
        this.platform.log.info(loggerPrefix, ...parameters);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      warn: (...parameters: any[]) => {
        this.platform.log.warn(loggerPrefix, ...parameters);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (...parameters: any[]) => {
        this.platform.log.error(loggerPrefix, ...parameters);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      debug: (...parameters: any[]) => {
        this.platform.log.debug(loggerPrefix, ...parameters);
      },
    };
  }

  setAirQuality(value: number): void {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.AirQuality,
    ).value;

    const newAirQualityName = this.getAirQualityName(value);
    const currentAirQualityName = this.getAirQualityName(currentValue as number);

    if (currentValue === value) {
      // this.log.debug(`AirQuality: Already set to: ${newAirQualityName}. Ignoring.`);
      return;
    }

    this.log.debug(`AirQuality: Setting to: ${newAirQualityName} (was: ${currentAirQualityName})`);

    this.service.updateCharacteristic(this.platform.Characteristic.AirQuality, value);
  }

  setCurrentRelativeHumidity(value: number): void {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.CurrentRelativeHumidity,
    ).value;

    // Transform to a rounded value, as that is what HomeKit uses
    const roundedValue = Math.round(value);

    if (currentValue === roundedValue) {
      // this.log.debug(`CurrentRelativeHumidity: Already set to: ${value}. Ignoring.`);
      return;
    }

    this.log.debug(`CurrentRelativeHumidity: Setting to: ${roundedValue} (was: ${currentValue})`);

    this.service.updateCharacteristic(
      this.platform.Characteristic.CurrentRelativeHumidity,
      roundedValue,
    );
  }

  setCurrentTemperature(value: number): void {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.CurrentTemperature,
    ).value;

    // Set toFixed to 1 to prevent values like 21.999999999999996
    // HomeKit uses a minStep of 0.1, so we'll round to 1 decimal
    const parsedValue = parseFloat(value.toFixed(1));
    const parsedCurrentValue = parseFloat((currentValue as number).toFixed(1));

    if (parsedCurrentValue === parsedValue) {
      // this.log.debug(`CurrentTemperature: Already set to: ${parsedValue}. Ignoring.`);
      return;
    }

    this.log.debug(`CurrentTemperature: Setting to: ${parsedValue} (was: ${parsedCurrentValue})`);

    this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, parsedValue);
  }

  setCarbonDioxideLevel(value: number): void {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.CarbonDioxideLevel,
    ).value;

    if (currentValue === value) {
      // this.log.debug(`CarbonDioxideLevel: Already set to: ${value}. Ignoring.`);
      return;
    }

    this.log.debug(`CarbonDioxideLevel: Setting to: ${value} (was: ${currentValue})`);

    this.service.updateCharacteristic(this.platform.Characteristic.CarbonDioxideLevel, value);
  }

  getAirQualityName(value: number): string | undefined {
    return Object.keys(this.platform.Characteristic.AirQuality).find(
      key => this.platform.Characteristic.AirQuality[key] === value,
    );
  }

  getAirQualityFromStatusPayload(data: IthoStatusSanitizedPayload): number {
    const ppm = data['CO2level (ppm)'];

    if (isNil(ppm)) return this.platform.Characteristic.AirQuality.UNKNOWN;

    if (ppm < 350) return this.platform.Characteristic.AirQuality.EXCELLENT;
    if (ppm < 1000) return this.platform.Characteristic.AirQuality.GOOD;
    if (ppm < 2500) return this.platform.Characteristic.AirQuality.FAIR;
    if (ppm < 5000) return this.platform.Characteristic.AirQuality.INFERIOR;

    return this.platform.Characteristic.AirQuality.POOR;
  }

  handleMqttMessage(topic: string, message: Buffer): void {
    // this.log.debug(`Received new status payload: ${message.toString()}`);

    if (topic === MQTT_STATUS_TOPIC) {
      const messageString = message.toString();

      const sanitizedStatusPayload =
        sanitizeStatusPayload<IthoStatusSanitizedPayload>(messageString);

      this.handleStatusResponse(sanitizedStatusPayload);

      return;
    }
  }

  handleStatusResponse(data: IthoStatusSanitizedPayload) {
    this.lastStatusPayload = data;
    this.lastStatusPayloadTimestamp = Date.now();

    // this.log.debug(`Parsed new status payload to: ${JSON.stringify(data)}`);

    const airQuality = this.getAirQualityFromStatusPayload(data);
    const currentRelativeHumidity = data.hum || 0;
    const currentTemperature = data.temp || 0;
    const carbonDioxideLevel = data['CO2level (ppm)'] || 0;

    this.setAirQuality(airQuality);
    this.setCurrentRelativeHumidity(currentRelativeHumidity);
    this.setCurrentTemperature(currentTemperature);
    this.setCarbonDioxideLevel(carbonDioxideLevel);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async handleGetAirQuality(): Promise<Nullable<CharacteristicValue>> {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.AirQuality,
    ).value;

    const airQualityName = this.getAirQualityName(currentValue as number);

    this.log.debug(`AirQuality is ${airQualityName} (${currentValue})`);

    return Promise.resolve(currentValue);
  }

  async handleGetStatusActive(): Promise<Nullable<CharacteristicValue>> {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.StatusActive,
    ).value;

    this.log.debug(`StatusActive is ${currentValue ? 'ACTIVE' : 'INACTIVE'} (${currentValue})`);

    return currentValue;
  }
}
