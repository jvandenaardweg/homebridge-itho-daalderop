import {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  Nullable,
  PartialAllowingNull,
  CharacteristicProps,
} from 'homebridge';

import { HomebridgeIthoDaalderop } from '@/platform';
import { IthoDaalderopAccessoryContext, IthoCveStatusSanitizedPayload } from './types';
import {
  ACTIVE_SPEED_THRESHOLD,
  DEFAULT_FAN_NAME,
  FAN_INFO_KEY,
  MANUFACTURER,
  MQTT_STATE_TOPIC,
  MQTT_STATUS_TOPIC,
  REQ_FAN_SPEED_KEY,
  SPEED_STATUS_KEY,
} from './settings';
import {
  getMappedRotationSpeedFromFanInfo,
  getVirtualRemoteCommandForRotationSpeed,
  sanitizeStatusPayload,
} from './utils/api';
import { ConfigSchema } from './config.schema';
import { isNil } from './utils/lang';
import { HttpApi } from './api/http';
import { MqttApi } from './api/mqtt';
import { serialNumberFromUUID } from './utils/serial';
import { PLUGIN_VERSION } from './version';
import { debounce } from './utils/debounce';

const SYNC_ROTATION_SPEED_INTERVAL = 10000; // 10 seconds
const DEFAULT_DEBOUNCE_INTERVAL = 500; // 500ms

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class FanAccessory {
  private service: Service;
  private informationService: Service | undefined;
  private mqttApiClient: MqttApi | null = null;
  private httpApiClient: HttpApi;
  private lastStatusPayload: Nullable<IthoCveStatusSanitizedPayload> = null;
  private lastStatusPayloadTimestamp: Nullable<number> = null;
  /** A number between 0 and 254 */
  private lastStatePayload: Nullable<number> = null;
  private lastStatePayloadTimestamp: Nullable<number> = null;
  private lastManuallySetRotationSpeedTimestamp: Nullable<number> = null;
  private lastManuallySetActiveTimestamp: Nullable<number> = null;

  private rotationSpeedProps: PartialAllowingNull<CharacteristicProps>;

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
        verboseLogging: this.config.verboseLogging,
      });

      this.mqttApiClient.subscribe([MQTT_STATE_TOPIC, MQTT_STATUS_TOPIC]);

      this.mqttApiClient.on('message', this.handleMqttMessage.bind(this));
    }

    // Always setup the HTTP API client, because it's the default and always available on the Wifi module
    this.httpApiClient = new HttpApi({
      ip: this.config.api.ip,
      username: this.config.api.username,
      password: this.config.api.password,
      logger: this.platform.log,
      verboseLogging: this.config.verboseLogging,
    });

    // Only start polling if we're using the HTTP API
    if (this.config.api.protocol === 'http') {
      this.httpApiClient.polling.getSpeed.start();
      this.httpApiClient.polling.getStatus.start();

      this.httpApiClient.polling.getSpeed.on(
        'response.getSpeed',
        this.handleSpeedResponse.bind(this),
      );

      this.httpApiClient.polling.getStatus.on(
        'response.getStatus',
        this.handleStatusResponse.bind(this),
      );
    }

    const informationService = this.accessory.getService(
      this.platform.Service.AccessoryInformation,
    );

    // Set accessory information
    this.informationService = informationService;

    this.informationService?.setCharacteristic(
      this.platform.Characteristic.Manufacturer,
      MANUFACTURER,
    );

    this.informationService?.setCharacteristic(
      this.platform.Characteristic.Model,
      DEFAULT_FAN_NAME, // Value is unknown, we'll set something
    );

    // It is required to have a unique serial number for each accessory
    // We'll use the UUID of the accessory as the serial number
    this.informationService?.setCharacteristic(
      this.platform.Characteristic.SerialNumber,
      serialNumberFromUUID(this.accessory.UUID),
    );

    // We'll use the version of this plugin as the firmware revision
    this.informationService?.setCharacteristic(
      this.platform.Characteristic.FirmwareRevision,
      PLUGIN_VERSION || '1.0',
    );

    this.service =
      this.accessory.getService(this.platform.Service.Fanv2) ||
      this.accessory.addService(this.platform.Service.Fanv2);

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    // Set the fan active as default
    // this.service.setCharacteristic(
    //   this.platform.Characteristic.Active,
    //   this.platform.Characteristic.Active.ACTIVE,
    // );

    this.service
      .getCharacteristic(this.platform.Characteristic.Active)
      // Debounce the setter, because this active characteristic also triggered when the rotation speed is changed
      .onSet(debounce(this.handleSetActive.bind(this), DEFAULT_DEBOUNCE_INTERVAL));
    // We don't need this get handler, we'll keep the characteristic in sync using syncCharacteristicsByRotationSpeed
    // .onGet(this.handleGetActive.bind(this));

    // If the device has a CO2 or the device is a non-CVE device, we'll use 3 steps (low, medium high), otherwise 100 (0 - 100%)
    this.rotationSpeedProps = !this.allowsManualSpeedControl
      ? {
          minValue: 0,
          maxValue: 100,
          minStep: 100 / 3, // TODO: find a better way to do this, 33% is not really "low", as "low" is 0% on the device
        }
      : {
          minValue: 0,
          maxValue: 100,
          minStep: 1,
        };

    this.service
      .getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .setProps(this.rotationSpeedProps)
      // Debounce the set handler to prevent spamming the with requests because the interface is a slider
      .onSet(debounce(this.handleSetRotationSpeed.bind(this), DEFAULT_DEBOUNCE_INTERVAL));
    // We don't need this get handler, we'll keep the characteristic in sync using syncRotationSpeed
    // .onGet(this.handleGetRotationSpeed.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentFanState);
    // We don't need this get handler, we'll keep the characteristic in sync using syncCurrentFanState
    // .onGet(this.handleGetCurrentFanState.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.Identify)
      .onGet(this.handleGetIdentify.bind(this));
  }

  get log() {
    const loggerPrefix = `[${this.accessory.displayName}] -> `;

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
        if (!this.config.verboseLogging) return;
        this.platform.log.debug(loggerPrefix, ...parameters);
      },
    };
  }

  get allowsManualSpeedControl(): boolean {
    // The I2C to PWM protocol (manual speed control from 0 - 254) is overruled by the CO2 sensor. Virtual remote commands work as expected.
    // So, if the box has an internal CO2 sensor, we can't control the fan speed manually on a 0-254 (0-100 in homekit) scale.
    // We need to use the virtual remote commands.
    // https://github.com/arjenhiemstra/ithowifi/wiki/CO2-sensors#itho-with-built-in-co2--sensor-cve-s-optima-inside
    // https://gathering.tweakers.net/forum/list_message/73948328#73948328

    // If the device is a non-CVE device, we cannot control the fan speed manually. We also have to use virtual remote commands for this.
    // https://github.com/arjenhiemstra/ithowifi/wiki/Non-CVE-units-support#how-to-control-the-speed

    return !this.config.device?.co2Sensor && !this.config.device?.nonCve;
  }

  setRotationSpeed(value: number): void {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.RotationSpeed,
    ).value;

    if (currentValue === value) {
      this.log.debug(`RotationSpeed: Already set to: ${value}. Ignoring.`);
      return;
    }

    this.log.debug(`RotationSpeed: Setting to: ${value} (was: ${currentValue})`);

    this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, value);
  }

  setActive(value: number): void {
    const currentValue = this.service.getCharacteristic(this.platform.Characteristic.Active).value;

    const activeName = this.getActiveName(value as number);

    if (currentValue === value) {
      this.log.debug(`Active: Already set to: ${value} (${activeName}). Ignoring.`);
      return;
    }

    this.log.debug(`Active: Setting to: ${value} (was: ${currentValue})`);

    this.service.updateCharacteristic(this.platform.Characteristic.Active, value);
  }

  syncCurrentFanState(statusPayload: IthoCveStatusSanitizedPayload): void {
    const currentSpeedStatus: number =
      statusPayload[SPEED_STATUS_KEY] || statusPayload[REQ_FAN_SPEED_KEY] || 0;

    const currentFanStateValue = this.service.getCharacteristic(
      this.platform.Characteristic.CurrentFanState,
    ).value;

    const currentFanStateName = this.getCurrentFanStateName((currentFanStateValue || 0) as number);

    if (currentSpeedStatus === 0) {
      if (currentFanStateValue === this.platform.Characteristic.CurrentFanState.INACTIVE) {
        this.log.debug(`CurrentFanState: Already set to: ${currentFanStateName}. Ignoring.`);
        return;
      }

      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentFanState,
        this.platform.Characteristic.CurrentFanState.INACTIVE,
      );

      return;
    }

    if (currentSpeedStatus < ACTIVE_SPEED_THRESHOLD) {
      if (currentFanStateValue === this.platform.Characteristic.CurrentFanState.IDLE) {
        this.log.debug(`CurrentFanState: Already set to: ${currentFanStateName}. Ignoring.`);
        return;
      }

      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentFanState,
        this.platform.Characteristic.CurrentFanState.IDLE,
      );

      return;
    }

    if (currentFanStateValue === this.platform.Characteristic.CurrentFanState.BLOWING_AIR) {
      this.log.debug(`CurrentFanState: Already set to: ${currentFanStateName}. Ignoring.`);
      return;
    }

    this.service.updateCharacteristic(
      this.platform.Characteristic.CurrentFanState,
      this.platform.Characteristic.CurrentFanState.BLOWING_AIR,
    );
  }

  getTargetFanStateName(value: number): string | undefined {
    // If "manual" => The fan should be controlled manually.
    // If "auto" => The fan should be controlled automatically.
    // https://developer.apple.com/documentation/homekit/hmcharacteristicvaluetargetfanstate
    return Object.keys(this.platform.Characteristic.TargetFanState).find(
      key => this.platform.Characteristic.TargetFanState[key] === value,
    );
  }

  getCurrentFanStateName(value: number): string | undefined {
    // If "idle" => The fan is idle.
    // If "blowing air" => The fan is blowing air.
    // If "inactive" => The fan is inactive.
    // https://developer.apple.com/documentation/homekit/hmcharacteristicvaluecurrentfanstate
    return Object.keys(this.platform.Characteristic.CurrentFanState).find(
      key => this.platform.Characteristic.CurrentFanState[key] === value,
    );
  }

  getActiveName(value: number): string | undefined {
    return Object.keys(this.platform.Characteristic.Active).find(
      key => this.platform.Characteristic.Active[key] === value,
    );
  }

  getActiveStateByRotationSpeed(rotationSpeed: number): number {
    return rotationSpeed >= ACTIVE_SPEED_THRESHOLD
      ? this.platform.Characteristic.Active.ACTIVE
      : this.platform.Characteristic.Active.INACTIVE;
  }

  sendVirtualRemoteCommand(speedValue: number): void {
    const virtualRemoteCommand = getVirtualRemoteCommandForRotationSpeed(speedValue);

    if (this.config.device?.co2Sensor) {
      this.log.warn(
        `Your unit has a build in CO2 sensor, which prohibits the use of manual speed control. We'll map the speed "${speedValue}" to a virtual remote command "${virtualRemoteCommand}" instead.`,
      );
    }

    if (this.config.device?.nonCve) {
      this.log.warn(
        `Your unit is not a CVE unit, which prohibits the use of manual speed control. We'll map the speed "${speedValue}" to a virtual remote command "${virtualRemoteCommand}" instead.`,
      );
    }

    if (this.mqttApiClient) {
      this.mqttApiClient.setVirtualRemoteCommand(virtualRemoteCommand);
    } else {
      this.httpApiClient.setVirtualRemoteCommand(virtualRemoteCommand);
    }
  }

  handleMqttMessage(topic: string, message: Buffer): void {
    if (
      this.lastManuallySetRotationSpeedTimestamp &&
      Date.now() - this.lastManuallySetRotationSpeedTimestamp < SYNC_ROTATION_SPEED_INTERVAL
    ) {
      this.log.debug('Do not sync, last sync was less than 10 seconds ago...');
      return;
    }

    const messageString = message.toString();

    if (topic === MQTT_STATUS_TOPIC) {
      const sanitizedStatusPayload =
        sanitizeStatusPayload<IthoCveStatusSanitizedPayload>(messageString);

      this.handleStatusResponse(sanitizedStatusPayload);

      return;
    }

    if (topic === MQTT_STATE_TOPIC) {
      this.log.debug(`Received new state payload: ${messageString}`);

      const rotationSpeedNumber = Number(messageString);

      this.handleSpeedResponse(rotationSpeedNumber);

      return;
    }
  }

  handleStatusResponse(statusPayload: IthoCveStatusSanitizedPayload) {
    this.lastStatusPayload = statusPayload;
    this.lastStatusPayloadTimestamp = Date.now();

    // Keep the CurrentFanState characteristic in sync with the real speed of the fan unit.
    // this.syncCurrentFanState(statusPayload);

    // Keep the RotationSpeed in sync with the real speed of the fan unit, where possible.
    // For example, this is only partial possible when not allowed to control the speed manually.
    // this.syncRotationSpeed(statusPayload);

    // Keep the Active characteristic in sync with the real speed of the fan unit.
    // this.syncActive(statusPayload);

    // Prevent syncing when the fan is recently controlled manually. This is to prevent the fan characteristics to be overwritten by the status response.
    // We expect the fan to reach the desired speed within 10 seconds.
    if (
      this.lastManuallySetRotationSpeedTimestamp &&
      Date.now() - this.lastManuallySetRotationSpeedTimestamp < SYNC_ROTATION_SPEED_INTERVAL
    ) {
      this.log.debug('Do not sync, last sync was less than 10 seconds ago...');
      return;
    }

    const currentSpeedStatus: number = statusPayload[SPEED_STATUS_KEY] || 0;

    if (!this.allowsManualSpeedControl) {
      const fanInfo = !isNil(statusPayload[FAN_INFO_KEY]) ? statusPayload[FAN_INFO_KEY] : 'medium';
      const mappedRotationSpeed = getMappedRotationSpeedFromFanInfo(fanInfo);
      const virtualRemoteCommand = getVirtualRemoteCommandForRotationSpeed(mappedRotationSpeed);

      this.syncCharacteristicsByRotationSpeed(mappedRotationSpeed, virtualRemoteCommand);
      return;
    }

    this.syncCharacteristicsByRotationSpeed(currentSpeedStatus);
  }

  handleSpeedResponse(speed: number) {
    this.lastStatePayload = speed;
    this.lastStatePayloadTimestamp = Date.now();
  }

  // syncActive(statusPayload: IthoCveStatusSanitizedPayload): void {
  //   const loggerPrefix = '[Sync Active]';

  //   if (
  //     this.lastManuallySetActiveTimestamp &&
  //     Date.now() - this.lastManuallySetActiveTimestamp < SYNC_ROTATION_SPEED_INTERVAL
  //   ) {
  //     this.log.debug(loggerPrefix, 'Do not sync, last sync was less than 5 seconds ago...');
  //     return;
  //   }

  //   const currentActiveValue = this.service.getCharacteristic(
  //     this.platform.Characteristic.Active,
  //   ).value;

  //   const activeName = this.getActiveName(currentActiveValue as number);

  //   const currentSpeedStatus: number = statusPayload[SPEED_STATUS_KEY] || 0;
  //   const fanInfo = statusPayload[FAN_INFO_KEY];

  //   if (fanInfo !== 'medium' && fanInfo !== 'auto') {
  //     const activeStateByRotationSpeed = this.getActiveStateByRotationSpeed(currentSpeedStatus);

  //     if (activeStateByRotationSpeed === currentActiveValue) {
  //       this.log.debug(`${loggerPrefix} Active: Already set to: ${activeName}. Ignoring sync.`);
  //       return;
  //     }

  //     const activeStateByRotationSpeedName = this.getActiveName(activeStateByRotationSpeed);

  //     this.log.debug(`${loggerPrefix} Active: Setting to: ${activeStateByRotationSpeedName}`);

  //     this.service.updateCharacteristic(
  //       this.platform.Characteristic.Active,
  //       activeStateByRotationSpeed,
  //     );

  //     return;
  //   }

  //   if (currentActiveValue === this.platform.Characteristic.Active.ACTIVE) {
  //     this.log.debug(`${loggerPrefix} Active: Already set to: ${activeName}. Ignoring sync.`);
  //     return;
  //   }

  //   this.log.debug(`${loggerPrefix} Active: Setting to: ACTIVE`);

  //   // FanInfo is medium or auto, always set to active.
  //   this.service.updateCharacteristic(
  //     this.platform.Characteristic.Active,
  //     this.platform.Characteristic.Active.ACTIVE,
  //   );
  // }

  /**
   * Sync the RotationSpeed characteristic with the real speed of the fan unit.
   *
   * When the speed is changed outside of HomeKit, we want to sync the speed in HomeKit.
   *
   * This can happen when the fan is controlled by:
   * - a physical remote control
   * - by the Itho web interface
   * - the CO2 sensor
   * - the humidity sensor
   * - the built-in timer
   * - the built-in "auto" mode
   *
   * We'll sync the speed every 5 seconds.
   *
   * We'll wait 5 seconds to give the fan some time to get up to speed to avoid false positives.
   *
   * The sync timer is reset when the speed is changed through HomeKit.
   */
  // async syncRotationSpeed(statusPayload: IthoCveStatusSanitizedPayload): Promise<void> {
  //   const loggerPrefix = '[Sync Rotation Speed]';

  //   if (
  //     this.lastManuallySetRotationSpeedTimestamp &&
  //     Date.now() - this.lastManuallySetRotationSpeedTimestamp < SYNC_ROTATION_SPEED_INTERVAL
  //   ) {
  //     this.log.debug(loggerPrefix, 'Do not sync, last sync was less than 5 seconds ago...');
  //     return;
  //   }

  //   const currentRotationSpeed = this.service.getCharacteristic(
  //     this.platform.Characteristic.RotationSpeed,
  //   ).value;

  //   // TODO: support non CVE units that do not have this key
  //   const speedPercentageRounded = Math.ceil(Number(statusPayload[SPEED_STATUS_KEY])); // a value between 0 and 50

  //   this.log.debug(loggerPrefix, `Speed Status is: ${speedPercentageRounded}`);

  //   if (!this.allowsManualSpeedControl) {
  //     // The unit does not allow manual speed control

  //     // TODO: support non-cve devices with other key

  //     const fanInfo = statusPayload?.[FAN_INFO_KEY];

  //     if (isNil(fanInfo)) {
  //       this.log.warn(loggerPrefix, `${FAN_INFO_KEY} property not found, ignoring.`);

  //       return;
  //     }

  //     this.log.debug(loggerPrefix, `FanInfo is: ${fanInfo}`);

  //     // FanInfo is low, medium/auto or high

  //     // If the rotation speed is already set, we can ignore the sync
  //     if (currentRotationSpeed === speedPercentageRounded) {
  //       this.log.debug(
  //         loggerPrefix,
  //         `RotationSpeed already set to ${speedPercentageRounded}. Ignoring sync.`,
  //       );
  //       return;
  //     }

  //     // If FanInfo is medium/auto or high, but the speed percentage we received is 100 or 0, we should just sync to that exact rotation speed
  //     if (speedPercentageRounded === 100 || speedPercentageRounded === 0) {
  //       this.log.info(loggerPrefix, `Syncing RotationSpeed to: ${speedPercentageRounded}`);

  //       this.service.updateCharacteristic(
  //         this.platform.Characteristic.RotationSpeed,
  //         speedPercentageRounded,
  //       );

  //       return;
  //     }

  //     // FanInfo is medium/auto or high, but the speed percentage is not 100 or 0

  //     // Because we can't manually control the speed from 0 - 100, we should determine the speed from the FanInfo mapping
  //     const mappedRotationSpeed = getMappedRotationSpeedFromFanInfo(fanInfo);

  //     // If already set, we can ignore
  //     if (currentRotationSpeed === mappedRotationSpeed) {
  //       this.log.debug(
  //         loggerPrefix,
  //         `RotationSpeed already set to mapped rotation speed ${mappedRotationSpeed} (${fanInfo}). Ignoring sync.`,
  //       );
  //       return;
  //     }

  //     this.log.debug(
  //       loggerPrefix,
  //       `Syncing RotationSpeed to mapped rotation speed: ${mappedRotationSpeed} (${fanInfo})`,
  //     );

  //     this.service.updateCharacteristic(
  //       this.platform.Characteristic.RotationSpeed,
  //       mappedRotationSpeed,
  //     );

  //     return;
  //   }

  //   // TODO: when we end up here, the user has full manual control (0 - 100) in HomeKit, should we keep sync with itho/state instead?

  //   this.log.info(loggerPrefix, `Syncing rotation speed to: ${speedPercentageRounded}`);

  //   this.service.updateCharacteristic(
  //     this.platform.Characteristic.RotationSpeed,
  //     speedPercentageRounded,
  //   );

  //   this.log.debug(loggerPrefix, `Waiting for next sync interval...`);
  // }

  /**
   * User manually changed the rotation speed in the Home App.
   *
   * The value is a range between 0-100. We need to convert it to a range between 0-254.
   *
   * Do not return anything from this method. Otherwise we'll get this error:
   * SET handler returned write response value, though the characteristic doesn't support write response. See https://homebridge.io/w/JtMGR for more info.
   */
  handleSetRotationSpeed(rotationSpeed: CharacteristicValue): void {
    // Reset sync timer when the user manually changes the speed, or an automation changes it
    this.lastManuallySetActiveTimestamp = Date.now();
    this.lastManuallySetRotationSpeedTimestamp = Date.now();

    const rotationSpeedNumber = Number(rotationSpeed);

    // A range between 0-254
    const speedValueToSet = Math.round(rotationSpeedNumber * 2.54);

    if (!this.allowsManualSpeedControl) {
      const virtualRemoteCommand = getVirtualRemoteCommandForRotationSpeed(rotationSpeedNumber);

      this.syncCharacteristicsByRotationSpeed(rotationSpeedNumber, virtualRemoteCommand);

      this.sendVirtualRemoteCommand(rotationSpeedNumber);

      return;
    }

    this.syncCharacteristicsByRotationSpeed(rotationSpeedNumber);

    if (this.mqttApiClient) {
      this.mqttApiClient.setSpeed(speedValueToSet);
    } else {
      this.httpApiClient.setSpeed(speedValueToSet);
    }
  }

  /**
   * Method that syncs all the Characteristics based on RotationSpeed.
   *
   * This allows us to properly keep track of the RotationSpeed, CurrentFanState and Active characteristics
   * for both virtual remote commands and manual speed control.
   */
  syncCharacteristicsByRotationSpeed(
    rotationSpeed: number,
    virtualRemoteCommand?: 'low' | 'medium' | 'high',
  ): void {
    // Always update the RotationSpeed characteristic
    this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, rotationSpeed);

    // When the RotationSpeed is 0, we should set the CurrentFanState to INACTIVE and Active to INACTIVE
    if (rotationSpeed === 0) {
      const currentFanState = this.platform.Characteristic.CurrentFanState.INACTIVE;
      const active = this.platform.Characteristic.Active.INACTIVE;
      const currentFanStateName = this.getCurrentFanStateName(currentFanState);
      const activeName = this.getActiveName(active);

      // Keep CurrentFanState in sync when changing RotationSpeed
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentFanState,
        currentFanState,
      );

      // Keep Active in sync when changing RotationSpeed
      this.service.updateCharacteristic(this.platform.Characteristic.Active, active);

      this.log.debug(
        `Syncing RotationSpeed to ${rotationSpeed}, CurrentFanState to ${currentFanStateName} and Active to ${activeName}`,
      );

      return;
    }

    // When the RotationSpeed is between 0 and 20, or virtual remote command is "low", we should set the CurrentFanState to IDLE and Active to ACTIVE
    if (
      (rotationSpeed > 0 && rotationSpeed <= ACTIVE_SPEED_THRESHOLD) ||
      virtualRemoteCommand === 'low'
    ) {
      // RotationSpeed is between 0 and 20 OR virtualRemoteCommand is low

      const currentFanState = this.platform.Characteristic.CurrentFanState.IDLE;
      const active = this.platform.Characteristic.Active.ACTIVE;
      const currentFanStateName = this.getCurrentFanStateName(currentFanState);
      const activeName = this.getActiveName(active);

      // Keep CurrentFanState in sync when changing RotationSpeed
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentFanState,
        currentFanState,
      );

      // Keep Active in sync when changing RotationSpeed
      this.service.updateCharacteristic(this.platform.Characteristic.Active, active);

      this.log.debug(
        `Syncing RotationSpeed to ${rotationSpeed}, CurrentFanState to ${currentFanStateName} and Active to ${activeName}`,
      );

      return;
    }

    // RotationSpeed is between 20 and 100, and/or virtualRemoteCommand is medium or high

    const currentFanState = this.platform.Characteristic.CurrentFanState.BLOWING_AIR;
    const active = this.platform.Characteristic.Active.ACTIVE;
    const currentFanStateName = this.getCurrentFanStateName(currentFanState);
    const activeName = this.getActiveName(active);

    // Keep CurrentFanState in sync when changing RotationSpeed
    this.service.updateCharacteristic(
      this.platform.Characteristic.CurrentFanState,
      currentFanState,
    );

    // Keep Active in sync when changing RotationSpeed
    this.service.updateCharacteristic(this.platform.Characteristic.Active, active);

    this.log.debug(
      `Syncing RotationSpeed to ${rotationSpeed}, CurrentFanState to ${currentFanStateName} and Active to ${activeName}`,
    );
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   *
   * Do not return anything from this method. Otherwise we'll get this error:
   * SET handler returned write response value, though the characteristic doesn't support write response. See https://homebridge.io/w/JtMGR for more info.
   *
   * The value we receive here is the value already set in HomeKit, this method runs after the Characteristic has been set.
   * So we don't need to set the Characteristic here. We just need to handle any logic that depends on the Characteristic being set.
   */
  handleSetActive(value: CharacteristicValue): void {
    const currentRotationSpeed = this.service.getCharacteristic(
      this.platform.Characteristic.RotationSpeed,
    ).value as number;

    const activeName = this.getActiveName(value as number);

    this.log.debug(`Active: Set to ${activeName}`);

    // Reset sync timers when the user manually changes the active state, or an automation changes it
    this.lastManuallySetActiveTimestamp = Date.now();
    this.lastManuallySetRotationSpeedTimestamp = Date.now();

    const activate = value === this.platform.Characteristic.Active.ACTIVE;
    const deactivate = value === this.platform.Characteristic.Active.INACTIVE;

    // The HomeKit RotationSpeed slider also acts as a Active/Inactive switch, so we need to handle that here
    // When there's already a RotationSpeed registered (Home App slider), we'll use that value to set the speed
    // Otherwise, we'll use the default speed threshold to set the speed
    // When we "deactivate" the speedValue is 0. We need to put the fan in low mode.
    const rotationSpeedValueToSet = activate
      ? currentRotationSpeed
        ? currentRotationSpeed
        : ACTIVE_SPEED_THRESHOLD
      : 0;

    if (!this.allowsManualSpeedControl) {
      // When we "activate" the speedValue is higher than 0. We need to put the fan in medium mode
      // The downside of also doing this here, is that we'll send a command to the fan twice when the user manually changes the speed. But we can live with that.
      this.sendVirtualRemoteCommand(rotationSpeedValueToSet);

      // Set as inactive
      if (deactivate) {
        const rotationSpeed = 0;

        this.syncCharacteristicsByRotationSpeed(rotationSpeed);

        return;
      }

      if (activate) {
        const virtualRemoteCommand = getVirtualRemoteCommandForRotationSpeed(
          currentRotationSpeed as number,
        );
        const mappedRotationSpeed = getMappedRotationSpeedFromFanInfo(virtualRemoteCommand);

        this.syncCharacteristicsByRotationSpeed(mappedRotationSpeed, virtualRemoteCommand);

        return;
      }

      return;
    }

    // TODO: handle manual speed control, test this
    this.syncCharacteristicsByRotationSpeed(rotationSpeedValueToSet);
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
  // handleGetActive(): Nullable<CharacteristicValue> {
  //   const rotationSpeed = this.service.getCharacteristic(
  //     this.platform.Characteristic.RotationSpeed,
  //   ).value;

  //   if (isNil(rotationSpeed)) {
  //     this.log.warn('RotationSpeed is not set yet, returning "inactive"');
  //     return this.platform.Characteristic.Active.INACTIVE;
  //   }

  //   const currentValue =
  //     rotationSpeed > ACTIVE_SPEED_THRESHOLD
  //       ? this.platform.Characteristic.Active.ACTIVE
  //       : this.platform.Characteristic.Active.INACTIVE;

  //   // const currentValue = this.service.getCharacteristic(this.platform.Characteristic.Active).value;

  //   const activeName = this.getActiveName(currentValue as number);

  //   this.log.info(`Active is ${activeName} (${currentValue})`);

  //   return currentValue;
  // }

  // async handleGetRotationSpeed(): Promise<Nullable<CharacteristicValue>> {
  //   if (!this.allowsManualSpeedControl) {
  //     // non-cve devices
  //     // https://github.com/arjenhiemstra/ithowifi/wiki/Non-CVE-units-support#how-to-control-the-speed
  //     if (this.config.device?.nonCve) {
  //       const actualMode = this.lastStatusPayload?.[ACTUAL_MODE_KEY];

  //       if (!actualMode) {
  //         this.log.warn(`${ACTUAL_MODE_KEY} property not found, returning 0 as RotationSpeed.`);

  //         return 0;
  //       }

  //       const mappedRotationSpeed = getMappedRotationSpeedFromActualMode(actualMode);

  //       this.log.info(
  //         `RotationSpeed is ${mappedRotationSpeed}/${MAX_ROTATION_SPEED} (${actualMode})`,
  //       );

  //       return mappedRotationSpeed;
  //     }

  //     // cve device with co2 sensor
  //     if (this.config.device?.co2Sensor) {
  //       const fanInfo = this.lastStatusPayload?.[FAN_INFO_KEY];

  //       if (!fanInfo) {
  //         this.log.warn(`${FAN_INFO_KEY} property not found, returning 0 as RotationSpeed.`);

  //         return 0;
  //       }

  //       const mappedRotationSpeed = getMappedRotationSpeedFromFanInfo(fanInfo);

  //       this.log.info(`RotationSpeed is ${mappedRotationSpeed}/${MAX_ROTATION_SPEED} (${fanInfo})`);

  //       return mappedRotationSpeed;
  //     }
  //   }

  //   let rotationSpeedNumber: number;

  //   if (this.mqttApiClient) {
  //     rotationSpeedNumber = this.lastStatePayload || 0;
  //   } else {
  //     rotationSpeedNumber = await this.httpApiClient.getSpeed();
  //   }

  //   const rotationSpeed = Math.round(Number(rotationSpeedNumber) / 2.54);

  //   this.log.info(`RotationSpeed is ${rotationSpeed}/${MAX_ROTATION_SPEED}`);

  //   return rotationSpeed;
  // }

  // handleGetCurrentFanState(): Nullable<CharacteristicValue> {
  //   const currentValue = this.service.getCharacteristic(
  //     this.platform.Characteristic.CurrentFanState,
  //   ).value;

  //   const currentFanStateName = this.getCurrentFanStateName(currentValue as number);

  //   this.log.debug(`CurrentFanState is ${currentFanStateName} (${currentValue})`);

  //   return currentValue;
  // }

  handleGetIdentify(): Nullable<CharacteristicValue> {
    this.log.warn('Identify feature not supported.');

    return null;
  }
}
