import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { HomebridgeIthoDaalderop } from '@/platform';
import { IthoDaalderopAccessoryContext } from './types';
import { PLATFORM_MANUFACTURER } from './settings';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class HumiditySensorAccessory {
  private service: Service;
  private informationService: Service | undefined;

  constructor(
    private readonly platform: HomebridgeIthoDaalderop,
    private readonly accessory: PlatformAccessory<IthoDaalderopAccessoryContext>,
  ) {
    // const properties = accessory.context.energySocket;

    // this.properties = properties;
    // this.config = properties.config;

    this.log.debug(`Initializing platform accessory`);

    // this.energySocketApi = api;

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

    // https://developers.homebridge.io/#/service/Fanv2
    this.service =
      this.accessory.getService(this.platform.Service.HumiditySensor) ||
      this.accessory.addService(this.platform.Service.HumiditySensor);

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    // REQUIRED

    // https://developers.homebridge.io/#/characteristic/CurrentRelativeHumidity
    this.service.setCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, 0); // 0-100
    this.service.setCharacteristic(
      this.platform.Characteristic.Active,
      this.platform.Characteristic.Active.ACTIVE,
    );

    // OPTIONAL

    // https://developers.homebridge.io/#/characteristic/StatusFault
    this.service.setCharacteristic(this.platform.Characteristic.StatusFault, 0); // 0 = No Fault, 1 = General Fault

    // https://developers.homebridge.io/#/characteristic/StatusLowBattery
    this.service.setCharacteristic(
      this.platform.Characteristic.StatusLowBattery,
      this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
    ); // 0 = Battery level is normal, 1 = Battery level is low

    // https://developers.homebridge.io/#/characteristic/StatusTampered
    this.service.setCharacteristic(
      this.platform.Characteristic.StatusTampered,
      this.platform.Characteristic.StatusTampered.NOT_TAMPERED,
    ); // 0 = Not tampered, 1 = Tampered

    // Register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.handleSetOn.bind(this))
      .onGet(this.handleGetOn.bind(this));
  }

  get log() {
    const loggerPrefix = `[Energy Socket: ${this.accessory.displayName}] -> `;

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
  async handleSetOn(value: CharacteristicValue): Promise<void> {
    // handle

    await Promise.resolve(value);

    return;
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
  async handleGetOn(): Promise<CharacteristicValue> {
    // handle

    return Promise.resolve(true);
  }
}
