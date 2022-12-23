import { Service, PlatformAccessory, CharacteristicValue, Nullable } from 'homebridge';

import { HomebridgeIthoDaalderop } from '@/platform';
import { IthoDaalderopAccessoryContext } from './types';
import { PLATFORM_MANUFACTURER } from './settings';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class FanAccessory {
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
      this.accessory.getService(this.platform.Service.Fanv2) ||
      this.accessory.addService(this.platform.Service.Fanv2);

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    this.service.setCharacteristic(
      this.platform.Characteristic.Active,
      this.platform.Characteristic.Active.ACTIVE,
    );
    this.service.setCharacteristic(
      this.platform.Characteristic.CurrentFanState,
      this.platform.Characteristic.CurrentFanState.BLOWING_AIR,
    );
    this.service.setCharacteristic(
      this.platform.Characteristic.TargetFanState,
      this.platform.Characteristic.TargetFanState.AUTO,
    );

    this.service.setCharacteristic(this.platform.Characteristic.RotationSpeed, 0);

    this.service
      .getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.handleSetActive.bind(this))
      .onGet(this.handleGetActive.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .onSet(this.handleSetRotationSpeed.bind(this))
      .onGet(this.handleGetRotationSpeed.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentFanState)
      .onGet(this.handleGetCurrentFanState.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.TargetFanState)
      .onSet(this.handleSetTargetFanState.bind(this))
      .onGet(this.handleGetTargetFanState.bind(this));
  }

  get log() {
    const loggerPrefix = `[Fan: ${this.accessory.displayName}] -> `;

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
  async handleSetRotationSpeed(value: CharacteristicValue): Promise<void> {
    // handle

    this.log.debug('handleSetRotationSpeed', value);

    // this.service.setCharacteristic(this.platform.Characteristic.RotationSpeed, value);
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   *
   * Do not return anything from this method. Otherwise we'll get this error:
   * SET handler returned write response value, though the characteristic doesn't support write response. See https://homebridge.io/w/JtMGR for more info.
   */
  async handleSetActive(value: CharacteristicValue): Promise<void> {
    // handle

    // TODO: https://github.com/arjenhiemstra/ithowifi/wiki/HomeBridge#configuration

    this.log.debug('handleSetActive', value);

    // this.service.setCharacteristic(this.platform.Characteristic.Active, value);
  }

  async handleSetTargetFanState(value: CharacteristicValue): Promise<void> {
    // handle

    // TODO: https://github.com/arjenhiemstra/ithowifi/wiki/HomeBridge#configuration

    this.log.debug('handleSetTargetFanState', value);

    // this.service.setCharacteristic(this.platform.Characteristic.TargetFanState, value);
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
  handleGetActive(): Nullable<CharacteristicValue> {
    // handle

    // TODO: https://github.com/arjenhiemstra/ithowifi/wiki/HomeBridge#configuration

    const currentValue = this.service.getCharacteristic(this.platform.Characteristic.Active).value;

    this.log.debug('handleGetActive', currentValue);

    return currentValue;
  }

  async handleGetRotationSpeed(): Promise<Nullable<CharacteristicValue>> {
    // handle

    // TODO: https://github.com/arjenhiemstra/ithowifi/wiki/HomeBridge#configuration

    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.RotationSpeed,
    ).value;

    this.log.debug('handleGetRotationSpeed', currentValue);

    return Promise.resolve(currentValue);
  }

  async handleGetCurrentFanState(): Promise<Nullable<CharacteristicValue>> {
    // handle

    // TODO: https://github.com/arjenhiemstra/ithowifi/wiki/HomeBridge#configuration

    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.CurrentFanState,
    ).value;

    this.log.debug('handleGetCurrentFanState', currentValue);

    return Promise.resolve(currentValue);
  }

  async handleGetTargetFanState(): Promise<Nullable<CharacteristicValue>> {
    // handle

    // TODO: https://github.com/arjenhiemstra/ithowifi/wiki/HomeBridge#configuration

    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.TargetFanState,
    ).value;

    this.log.debug('handleGetTargetFanState', currentValue);

    return Promise.resolve(currentValue);
  }
}
