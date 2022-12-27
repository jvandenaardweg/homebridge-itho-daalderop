import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
  APIEvent,
} from 'homebridge';

import {
  DEFAULT_AIR_QUALITY_SENSOR_NAME,
  DEFAULT_FAN_NAME,
  PLATFORM_NAME,
  PLUGIN_NAME,
} from '@/settings';
import { FanAccessory } from '@/fan-accessory';
import { ZodError } from 'zod';
import { ConfigSchema, configSchema } from './config.schema';
import { IthoDaalderopAccessoryContext } from './types';
import { AirQualitySensorAccessory } from './air-quality-sensor-accessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HomebridgeIthoDaalderop implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public cachedAccessories: PlatformAccessory<IthoDaalderopAccessoryContext>[] = [];

  private config: ConfigSchema;

  private loggerPrefix: string;

  constructor(public readonly log: Logger, config: PlatformConfig, public readonly api: API) {
    const loggerPrefix = `[Platform Setup] -> `;
    this.loggerPrefix = loggerPrefix;

    this.config = config as ConfigSchema;

    this.log.debug(loggerPrefix, 'Finished initializing platform:', config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they were not added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      this.log.debug(loggerPrefix, 'Executed didFinishLaunching callback');

      // Check if the config is valid. We do this here to prevent bugs later.
      // It also helps the user in setting the config properly, if not used from within the UI, but manually adjusted in the config.json file.
      if (!this.isValidConfigSchema(this.config)) {
        this.log.error(
          this.loggerPrefix,
          `Please fix the issues in your config.json file for this plugin. Once fixed, restart Homebridge.`,
        );
        return;
      }

      this.addFanAccessory(DEFAULT_FAN_NAME, this.api.hap.uuid.generate(DEFAULT_FAN_NAME));

      this.addAirQualitySensor(
        DEFAULT_AIR_QUALITY_SENSOR_NAME,
        this.api.hap.uuid.generate(DEFAULT_AIR_QUALITY_SENSOR_NAME),
      );
    });

    // On Homebridge shutdown, cleanup some things
    // Note: this is not called when our plugin is uninstalled
    this.api.on(APIEvent.SHUTDOWN, () => {
      // TODO: handle
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory<IthoDaalderopAccessoryContext>): void {
    this.log.debug(this.loggerPrefix, `Loading accessory from cache: ${accessory.displayName}`);

    this.cachedAccessories.push(accessory);
  }

  /**
   * We should prevent the plugin from starting if the config is invalid.
   */
  isValidConfigSchema(config: ConfigSchema): boolean {
    try {
      configSchema.parse(config);

      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const mappedErrors = err.errors.map(err => {
          return `${err.message} at: ${err.path.join('.')}`;
        });

        this.log.error(
          this.loggerPrefix,
          `There is an error in your config: ${JSON.stringify(mappedErrors)}`,
        );

        return false;
      }

      this.log.error(
        this.loggerPrefix,
        `A unknown error happened while validation your config: ${JSON.stringify(err)}`,
      );

      return false;
    }
  }

  addFanAccessory(displayName: string, uuid: string) {
    try {
      const existingAccessory = this.cachedAccessories.find(
        accessory => accessory.UUID === uuid,
      ) as PlatformAccessory<IthoDaalderopAccessoryContext>;

      if (!existingAccessory) {
        // The accessory does not yet exist, so we need to create it

        this.log.info(this.loggerPrefix, 'Adding new fan accessory:', uuid);

        // Create a new accessory
        const newAccessory = new this.api.platformAccessory<IthoDaalderopAccessoryContext>(
          displayName,
          uuid,
        );

        // Create the accessory handler for the newly create accessory
        this.attachFanAccessoryToPlatform(newAccessory);

        // Link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [newAccessory]);

        return;
      }

      // When we end up here, accessory is found in cache

      // The accessory already exists, so we can restore it from our cache
      this.log.info(
        this.loggerPrefix,
        `Restoring existing fan accessory from cache: ${existingAccessory.displayName}`,
      );

      // Update the existing accessory with the new data, for example, the IP address might have changed
      // existingAccessory.context.somethingExtra = 'asd';
      this.api.updatePlatformAccessories([existingAccessory]);

      // Create the accessory handler for the restored accessory
      this.attachFanAccessoryToPlatform(existingAccessory);
    } catch (error) {
      this.log.error(
        this.loggerPrefix,
        `Error while adding the fan accessory: ${JSON.stringify(error)}`,
      );
    }
  }

  addAirQualitySensor(displayName: string, uuid: string) {
    try {
      const existingAccessory = this.cachedAccessories.find(
        accessory => accessory.UUID === uuid,
      ) as PlatformAccessory<IthoDaalderopAccessoryContext>;

      if (!existingAccessory) {
        // The accessory does not yet exist, so we need to create it

        this.log.info(this.loggerPrefix, 'Adding new air quality sensor accessory:', uuid);

        // Create a new accessory
        const newAccessory = new this.api.platformAccessory<IthoDaalderopAccessoryContext>(
          displayName,
          uuid,
        );

        // Create the accessory handler for the newly create accessory
        this.attachAirQualitySensorAccessoryToPlatform(newAccessory);

        // Link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [newAccessory]);

        return;
      }

      // When we end up here, accessory is found in cache

      // The accessory already exists, so we can restore it from our cache
      this.log.info(
        this.loggerPrefix,
        `Restoring existing air quality sensor accessory from cache: ${existingAccessory.displayName}`,
      );

      // Update the existing accessory with the new data, for example, the IP address might have changed
      // existingAccessory.context.somethingExtra = 'asd';
      this.api.updatePlatformAccessories([existingAccessory]);

      // Create the accessory handler for the restored accessory
      this.attachAirQualitySensorAccessoryToPlatform(existingAccessory);
    } catch (error) {
      this.log.error(
        this.loggerPrefix,
        `Error while adding the air quality sensor accessory: ${JSON.stringify(error)}`,
      );
    }
  }

  attachFanAccessoryToPlatform(accessory: PlatformAccessory<IthoDaalderopAccessoryContext>): void {
    this.log.debug(
      this.loggerPrefix,
      'Attaching fan accessory to platform:',
      accessory.displayName,
    );

    // Create the accessory handler for the restored accessory
    new FanAccessory(this, accessory, this.config);
  }

  attachAirQualitySensorAccessoryToPlatform(
    accessory: PlatformAccessory<IthoDaalderopAccessoryContext>,
  ): void {
    this.log.debug(
      this.loggerPrefix,
      'Attaching air qualoty sensor accessory to platform:',
      accessory.displayName,
    );

    // Create the accessory handler for the restored accessory
    new AirQualitySensorAccessory(this, accessory, this.config);
  }
}
