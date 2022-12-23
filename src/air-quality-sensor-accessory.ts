import { Service, PlatformAccessory, CharacteristicValue, Nullable } from 'homebridge';
import mqtt from 'mqtt';

import { HomebridgeIthoDaalderop } from '@/platform';
import { IthoDaalderopAccessoryContext } from './types';
import { DEFAULT_AIR_QUALITY_SENSOR_NAME, MANUFACTURER, MQTT_STATUS_TOPIC } from './settings';
import { IthoStatusPayload } from './mocks/mqtt-payloads';
import { parseMQTTMessage } from './utils/mqtt';
import { isNil } from './utils';

// function getRndInteger(min: number, max: number): number {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class AirQualitySensorAccessory {
  private service: Service;
  private informationService: Service | undefined;
  private mqttClient: mqtt.Client;

  constructor(
    private readonly platform: HomebridgeIthoDaalderop,
    private readonly accessory: PlatformAccessory<IthoDaalderopAccessoryContext>,
  ) {
    this.log.debug(`Initializing platform accessory`);

    // TODO: use correct ip
    this.mqttClient = mqtt.connect('mqtt://test.mosquitto.org');

    // Mock until we connect to the real mqtt server
    // this.mqttClient.on('connect', () => {
    //   this.mqttClient.subscribe(MQTT_STATUS_TOPIC, err => {
    //     if (!err) {
    //       setInterval(() => {
    //         const payload = JSON.stringify({
    //           temp: getRndInteger(15, 25),
    //           hum: getRndInteger(40, 80),
    //           'CO2level (ppm)': getRndInteger(100, 5000),
    //         });

    //         this.mqttClient.publish(MQTT_STATUS_TOPIC, payload);
    //       }, 5000);
    //     }
    //   });
    // });

    const statusSubscription = this.mqttClient.subscribe(MQTT_STATUS_TOPIC);

    // Update the characteristic values when we receive a new message from mqtt
    statusSubscription.on('message', (_, message) => {
      this.log.debug(`Received new status payload: ${message.toString()}`);

      const data = parseMQTTMessage<IthoStatusPayload>(message);

      this.log.debug(`Parsed new status payload to: ${JSON.stringify(data)}`);

      const airQuality = this.getAirQualityFromStatusPayload(data);
      const currentRelativeHumidity = data.hum || 0;
      const currentTemperature = data.temp || 0;
      const carbonDioxideLevel = data['CO2level (ppm)'] || 0;

      this.setAirQuality(airQuality);
      this.setCurrentRelativeHumidity(currentRelativeHumidity);
      this.setCurrentTemperature(currentTemperature);
      this.setCarbonDioxideLevel(carbonDioxideLevel);
    });

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

    // Set accessory information
    this.informationService = informationService;

    this.service =
      this.accessory.getService(this.platform.Service.AirQualitySensor) ||
      this.accessory.addService(this.platform.Service.AirQualitySensor);

    // REQUIRED

    // Set a default AirQuality value on instantiation
    this.service.setCharacteristic(
      this.platform.Characteristic.AirQuality,
      this.platform.Characteristic.AirQuality.GOOD,
    );

    // OPTIONAL
    // this.service.setCharacteristic(this.platform.Characteristic.CarbonDioxideLevel, 0); // 0 - 100000 ppm
    // this.service.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 0); // -270 - 100, minStep 0.1
    // this.service.setCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, 0); // 0-100

    this.service.setCharacteristic(this.platform.Characteristic.StatusActive, true); // 0-100

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    this.service
      .getCharacteristic(this.platform.Characteristic.AirQuality)
      .onGet(this.handleGetAirQuality.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.StatusActive)
      .onGet(this.handleGetStatusActive.bind(this));
  }

  getAirQualityName(value: number): string | undefined {
    return Object.keys(this.platform.Characteristic.AirQuality).find(
      key => this.platform.Characteristic.AirQuality[key] === value,
    );
  }

  setAirQuality(value: number): void {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.AirQuality,
    ).value;

    const newAirQualityName = this.getAirQualityName(value);
    const currentAirQualityName = this.getAirQualityName(currentValue as number);

    if (currentValue === value) {
      this.log.debug(`AirQuality: Already set to: ${newAirQualityName}. Ignoring.`);
      return;
    }

    this.log.debug(`AirQuality: Setting to: ${newAirQualityName} (was: ${currentAirQualityName})`);

    this.service.updateCharacteristic(this.platform.Characteristic.AirQuality, value);
  }

  setCurrentRelativeHumidity(value: number): void {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.CurrentRelativeHumidity,
    ).value;

    if (currentValue === value) {
      this.log.debug(`CurrentRelativeHumidity: Already set to: ${value}. Ignoring.`);
      return;
    }

    this.log.debug(`CurrentRelativeHumidity: Setting to: ${value} (was: ${currentValue})`);

    this.service.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, value);
  }

  setCurrentTemperature(value: number): void {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.CurrentTemperature,
    ).value;

    if (currentValue === value) {
      this.log.debug(`CurrentTemperature: Already set to: ${value}. Ignoring.`);
      return;
    }

    this.log.debug(`CurrentTemperature: Setting to: ${value} (was: ${currentValue})`);

    this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, value);
  }

  setCarbonDioxideLevel(value: number): void {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.CarbonDioxideLevel,
    ).value;

    if (currentValue === value) {
      this.log.debug(`CarbonDioxideLevel: Already set to: ${value}. Ignoring.`);
      return;
    }

    this.log.debug(`CarbonDioxideLevel: Setting to: ${value} (was: ${currentValue})`);

    this.service.updateCharacteristic(this.platform.Characteristic.CarbonDioxideLevel, value);
  }

  getAirQualityFromStatusPayload(data: IthoStatusPayload): number {
    const ppm = data['CO2level (ppm)'];

    if (isNil(ppm)) return this.platform.Characteristic.AirQuality.UNKNOWN;

    if (ppm < 350) return this.platform.Characteristic.AirQuality.EXCELLENT;
    if (ppm < 1000) return this.platform.Characteristic.AirQuality.GOOD;
    if (ppm < 2500) return this.platform.Characteristic.AirQuality.FAIR;
    if (ppm < 5000) return this.platform.Characteristic.AirQuality.INFERIOR;

    return this.platform.Characteristic.AirQuality.POOR;
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
