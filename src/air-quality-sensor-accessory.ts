import { Service, PlatformAccessory, CharacteristicValue, Nullable } from 'homebridge';

import { HomebridgeIthoDaalderop } from '@/platform';
import { IthoDaalderopAccessoryContext } from './types';
import { PLATFORM_MANUFACTURER } from './settings';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class AirQualitySensorAccessory {
  private service: Service;
  private informationService: Service | undefined;

  constructor(
    private readonly platform: HomebridgeIthoDaalderop,
    private readonly accessory: PlatformAccessory<IthoDaalderopAccessoryContext>,
  ) {
    this.log.debug(`Initializing platform accessory`);

    const informationService = this.accessory.getService(
      this.platform.Service.AccessoryInformation,
    );

    informationService?.setCharacteristic(
      this.platform.Characteristic.Manufacturer,
      PLATFORM_MANUFACTURER,
    );
    // informationService?.setCharacteristic(
    //   this.platform.Characteristic.Model,
    //   this.modelName, // "Energy Socket (HWE-SKT"
    // );
    // informationService?.setCharacteristic(
    //   this.platform.Characteristic.SerialNumber,
    //   this.properties.serialNumber, // Like: "1c23e7280952"
    // );
    // informationService?.setCharacteristic(
    //   this.platform.Characteristic.FirmwareRevision,
    //   this.properties.firmwareVersion, // Like: "3.02"
    // );

    // Set accessory information
    this.informationService = informationService;

    // https://developers.homebridge.io/#/service/AirQualitySensor
    this.service =
      this.accessory.getService(this.platform.Service.AirQualitySensor) ||
      this.accessory.addService(this.platform.Service.AirQualitySensor);

    // REQUIRED

    // https://developers.homebridge.io/#/characteristic/AirQuality
    this.service.setCharacteristic(
      this.platform.Characteristic.AirQuality,
      this.platform.Characteristic.AirQuality.GOOD,
    );

    // OPTIONAL

    // https://developers.homebridge.io/#/characteristic/CarbonDioxideLevel
    this.service.setCharacteristic(this.platform.Characteristic.CarbonDioxideLevel, 0); // 0 - 100000 ppm
    this.service.setCharacteristic(this.platform.Characteristic.CarbonDioxidePeakLevel, 0); // 0 - 100000 ppm

    this.service.setCharacteristic(this.platform.Characteristic.CurrentTemperature, 0); // -270 - 100, minStep 0.1

    this.service.setCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, 0); // 0-100
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
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   *
   * Do not return anything from this method. Otherwise we'll get this error:
   * SET handler returned write response value, though the characteristic doesn't support write response. See https://homebridge.io/w/JtMGR for more info.
   */
  handleSetAirQuality(value: CharacteristicValue): void {
    // handle

    // TODO: this is not handled within homekit, we should handle this with the API ourselves

    // TODO: https://github.com/arjenhiemstra/ithowifi/wiki/HomeBridge#configuration

    this.log.debug('handleSetAirQuality ->', value);

    this.service.setCharacteristic(this.platform.Characteristic.AirQuality, value);
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
    // handle

    // TODO: https://github.com/arjenhiemstra/ithowifi/wiki/HomeBridge#configuration

    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.AirQuality,
    ).value;

    this.log.debug('handleGetAirQuality ->', currentValue);

    return Promise.resolve(currentValue);
  }

  async handleGetStatusActive(): Promise<Nullable<CharacteristicValue>> {
    // handle

    // TODO: https://github.com/arjenhiemstra/ithowifi/wiki/HomeBridge#configuration

    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.StatusActive,
    ).value;

    this.log.debug('handleGetStatusActive ->', currentValue);

    return Promise.resolve(currentValue);
  }
}
