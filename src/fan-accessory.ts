import { Service, PlatformAccessory, CharacteristicValue, Nullable } from 'homebridge';

import { HomebridgeIthoDaalderop } from '@/platform';
import { IthoDaalderopAccessoryContext, IthoStatusSanitizedPayload } from './types';
import {
  DEFAULT_FAN_NAME,
  MANUFACTURER,
  MAX_ROTATION_SPEED,
  MQTT_STATE_TOPIC,
  MQTT_STATUS_TOPIC,
} from './settings';
import { sanitizeStatusPayload } from './utils/api';
import { ConfigSchema } from './config.schema';
import { isNil } from './utils';
import { HttpApi } from './api/http';
import { MqttApi } from './api/mqtt';

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
  private lastStatusPayload: Nullable<IthoStatusSanitizedPayload> = null;
  private lastStatusPayloadTimestamp: Nullable<number> = null;
  /** A number between 0 and 254 */
  private lastStatePayload: Nullable<number> = null;
  private lastStatePayloadTimestamp: Nullable<number> = null;

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
    this.informationService?.setCharacteristic(
      this.platform.Characteristic.SerialNumber,
      'Unknown', // Value is unknown, we'll set something
    );
    this.informationService?.setCharacteristic(
      this.platform.Characteristic.FirmwareRevision,
      '1.0', // Value is unknown, we'll set something
    );

    this.service =
      this.accessory.getService(this.platform.Service.Fanv2) ||
      this.accessory.addService(this.platform.Service.Fanv2);

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    // Set the fan active as default
    // TODO: get status from mqtt
    this.service.setCharacteristic(
      this.platform.Characteristic.Active,
      this.platform.Characteristic.Active.ACTIVE,
    );

    this.service
      .getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.handleSetActive.bind(this))
      .onGet(this.handleGetActive.bind(this));

    this.service
      .getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .onSet(this.handleSetRotationSpeed.bind(this))
      .onGet(this.handleGetRotationSpeed.bind(this));

    // TODO: enable when we've found a way, seems to be a huge hassle:
    // https://github.com/arjenhiemstra/ithowifi/wiki/Controlling-the-speed-of-a-fan

    // this.service
    //   .getCharacteristic(this.platform.Characteristic.CurrentFanState)
    //   .onGet(this.handleGetCurrentFanState.bind(this));

    // this.service
    //   .getCharacteristic(this.platform.Characteristic.TargetFanState)
    //   .onSet(this.handleSetTargetFanState.bind(this))
    //   .onGet(this.handleGetTargetFanState.bind(this));
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
        if (!this.config.verboseLogging) return;
        this.platform.log.debug(loggerPrefix, ...parameters);
      },
    };
  }

  get isActive(): boolean {
    return (
      this.service.getCharacteristic(this.platform.Characteristic.Active).value ===
      this.platform.Characteristic.Active.ACTIVE
    );
  }

  get isInAutoMode(): boolean {
    return (
      this.lastStatusPayload?.FanInfo === 'auto' ||
      this.lastStatusPayload?.FanInfo === 'medium' ||
      this.lastStatusPayload?.FanInfo === '3' ||
      this.lastStatusPayload?.Selection === 'auto' ||
      this.lastStatusPayload?.Selection === 'medium' ||
      this.lastStatusPayload?.Selection === 3
    );
  }

  get targetFanState(): Nullable<CharacteristicValue> {
    return this.service.getCharacteristic(this.platform.Characteristic.TargetFanState).value;
  }

  setRotationSpeed(value: number): void {
    const currentValue = this.service.getCharacteristic(
      this.platform.Characteristic.RotationSpeed,
    ).value;

    if (isNaN(value)) {
      this.log.error(`RotationSpeed: Value is not a number: ${value}`);
      return;
    }

    if (currentValue === value) {
      this.log.debug(`RotationSpeed: Already set to: ${value}`);
      return;
    }

    this.log.debug(`RotationSpeed: Setting to: ${value} (was: ${currentValue})`);

    this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, value);
  }

  setActive(value: number): void {
    const currentValue = this.service.getCharacteristic(this.platform.Characteristic.Active).value;

    if (isNaN(value)) {
      this.log.error(`Active: Value is not a number: ${value}`);
      return;
    }

    if (
      (value === this.platform.Characteristic.Active.INACTIVE &&
        this.lastStatusPayload?.FanInfo === 'auto') ||
      this.lastStatusPayload?.FanInfo === 'medium'
    ) {
      this.log.warn(
        'Important, you are disabling the fan, but it is in auto/medium mode. So it will probably turn on again.',
      );
    }

    if (currentValue === value) {
      // this.log.debug(`Active: Already set to: ${value}`);
      return;
    }

    this.log.debug(`Active: Setting to: ${value} (was: ${currentValue})`);

    this.service.updateCharacteristic(this.platform.Characteristic.Active, value);
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
    return rotationSpeed >= 20
      ? this.platform.Characteristic.Active.ACTIVE
      : this.platform.Characteristic.Active.INACTIVE;
  }

  handleMqttMessage(topic: string, message: Buffer): void {
    const messageString = message.toString();

    if (topic === MQTT_STATUS_TOPIC) {
      const sanitizedStatusPayload =
        sanitizeStatusPayload<IthoStatusSanitizedPayload>(messageString);

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

  handleStatusResponse(statusPayload: IthoStatusSanitizedPayload) {
    this.lastStatusPayload = statusPayload;
    this.lastStatusPayloadTimestamp = Date.now();
  }

  handleSpeedResponse(speed: number) {
    this.lastStatePayload = speed;
    this.lastStatePayloadTimestamp = Date.now();
  }

  /**
   * User manually changed the rotation speed in the Home App.
   *
   * The value is a range between 0-100. We need to convert it to a range between 0-254.
   *
   * Do not return anything from this method. Otherwise we'll get this error:
   * SET handler returned write response value, though the characteristic doesn't support write response. See https://homebridge.io/w/JtMGR for more info.
   */
  handleSetRotationSpeed(value: CharacteristicValue): void {
    // A range between 0-254
    const valueToSet = Math.round(Number(value) * 2.54);

    if (isNaN(valueToSet)) {
      this.log.error(`RotationSpeed: Value is not a number: ${value}`);
      return;
    }

    this.log.info(`Setting RotationSpeed to ${value}/${MAX_ROTATION_SPEED}`);

    if (this.isInAutoMode) {
      this.log.debug(
        'Fan is in auto mode. Adjusting the rotation speed manually will probably not work. Switch the fan to another state first.',
      );
    }

    if (this.mqttApiClient) {
      // https://github.com/arjenhiemstra/ithowifi/wiki/MQTT-integration#cve-unit
      const speedPayload = JSON.stringify({
        // ...(this.isInAutoMode ? { command: VirtualRemo teOptions.MEDIUM } : undefined), // if the fan is in auto mode, we need to switch it out of that mode first
        // A range between 0-254
        speed: `${valueToSet}`,
      });

      // Publish to MQTT server to update the rotation speed
      this.mqttApiClient.publish('itho/cmd', speedPayload);
      this.log.debug('mqttClient.publish', 'itho/cmd', speedPayload);
    } else {
      this.httpApiClient.setSpeed(valueToSet);
    }

    // The user adjusted the rotation speed manually, so we need to set the TargetFanState to "manual"
    // if (this.targetFanState !== this.platform.Characteristic.TargetFanState.MANUAL) {
    //   this.log.info(
    //     'Setting TargetFanState to "manual" because the rotation speed is manually adjusted.',
    //   );

    //   this.service.updateCharacteristic(
    //     this.platform.Characteristic.TargetFanState,
    //     this.platform.Characteristic.TargetFanState.MANUAL,
    //   );
    // } else {
    //   this.log.debug('TargetFanState already set to "manual", skipping.');
    // }

    // We will receive a message from the MQTT server with the new state
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   *
   * Do not return anything from this method. Otherwise we'll get this error:
   * SET handler returned write response value, though the characteristic doesn't support write response. See https://homebridge.io/w/JtMGR for more info.
   */
  handleSetActive(value: CharacteristicValue): void {
    const activeName = this.getActiveName(value as number);

    this.log.info(`Setting Active to ${value} (${activeName})`);

    // If value to set is 1 (ACTIVE), then we need to set the fan as active
    const activate = value === this.platform.Characteristic.Active.ACTIVE;

    // A rotation speed of 0 will turn the fan off
    // A rotation speed of 20 will turn the fan on
    const activeStateValue = activate ? 20 : 0;
    const activeMqttValue = activeStateValue.toString();

    if (this.mqttApiClient) {
      this.mqttApiClient.publish(MQTT_STATE_TOPIC, activeMqttValue);
      this.log.debug('mqttClient.publish', MQTT_STATE_TOPIC, activeMqttValue);
    } else {
      this.httpApiClient.setSpeed(activeStateValue);
    }

    this.service.updateCharacteristic(this.platform.Characteristic.Active, value);
  }

  // async handleSetTargetFanState(value: CharacteristicValue): Promise<void> {
  //   // 0 = Manual
  //   // 1 = Auto

  //   const targetFanStateName = this.getTargetFanStateName(value as number);

  //   this.log.debug(`Setting TargetFanState to ${targetFanStateName} (${value})`);

  //   // TODO: save to mqtt

  //   this.service.updateCharacteristic(this.platform.Characteristic.TargetFanState, value);
  // }

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
    const rotationSpeed = this.service.getCharacteristic(
      this.platform.Characteristic.RotationSpeed,
    ).value;

    if (isNil(rotationSpeed)) {
      this.log.warn('RotationSpeed is not set yet, returning "inactive"');
      return this.platform.Characteristic.Active.INACTIVE;
    }

    const currentValue =
      rotationSpeed > 0
        ? this.platform.Characteristic.Active.ACTIVE
        : this.platform.Characteristic.Active.INACTIVE;

    // const currentValue = this.service.getCharacteristic(this.platform.Characteristic.Active).value;

    const activeName = this.getActiveName(currentValue as number);

    this.log.info(`Active is ${activeName} (${currentValue})`);

    return currentValue;
  }

  async handleGetRotationSpeed(): Promise<Nullable<CharacteristicValue>> {
    let rotationSpeedNumber: number;

    if (this.mqttApiClient) {
      rotationSpeedNumber = this.lastStatePayload || 0;
    } else {
      rotationSpeedNumber = await this.httpApiClient.getSpeed();
    }

    const rotationSpeed = Math.round(Number(rotationSpeedNumber) / 2.54);

    this.log.info(`RotationSpeed is ${rotationSpeed}/${MAX_ROTATION_SPEED}`);

    return rotationSpeed;
  }

  // handleGetCurrentFanState(): Nullable<CharacteristicValue> {
  //   const currentValue = this.service.getCharacteristic(
  //     this.platform.Characteristic.CurrentFanState,
  //   ).value;

  //   const currentFanStateName = this.getCurrentFanStateName(currentValue as number);

  //   this.log.debug(`CurrentFanState is ${currentFanStateName} (${currentValue})`);

  //   return currentValue;
  // }

  // handleGetTargetFanState(): Nullable<CharacteristicValue> {
  //   // 0 = Manual
  //   // 1 = Auto

  //   const currentValue = this.targetFanState;

  //   const currentTargetFanStateName = this.getTargetFanStateName(currentValue as number);

  //   this.log.info(`TargetFanState is ${currentTargetFanStateName} (${currentValue})`);

  //   return currentValue;
  // }
}
