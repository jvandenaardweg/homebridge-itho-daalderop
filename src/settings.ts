/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 *
 * This name should match `pluginAlias` in config.schema.json
 */
export const PLATFORM_NAME = 'HomebridgeIthoDaalderop';

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = 'homebridge-itho-daalderop';

export const DEFAULT_BRIDGE_NAME = 'Itho Daalderop';

export const MANUFACTURER = 'Itho Daalderop';

export const DEFAULT_FAN_NAME = 'Mechanical Ventilation';
export const DEFAULT_AIR_QUALITY_SENSOR_NAME = 'Air Quality Sensor';

/**
 * This topic returns a dictionary object with key and value pair for each entries shown on the Itho status page.
 *
 * @link: https://github.com/arjenhiemstra/ithowifi/wiki/MQTT-integration#ithoithostatus-read-itho-status
 */
export const MQTT_STATUS_TOPIC = 'itho/ithostatus';

export const MQTT_STATE_TOPIC = 'itho/state';

/**
 * This topic is used to send commands to the add-on.
 * A common use case is to have this integrated with home automation software like Home Assistant or Domoticz.
 * The relevant commands vary between the non-CVE and CVE unit, see the above table for relevant options.
 *
 * @link: https://github.com/arjenhiemstra/ithowifi/wiki/MQTT-integration#ithocmd-change-device-settings
 */
export const MQTT_CMD_TOPIC = 'itho/cmd';

// https://developers.homebridge.io/#/characteristic/RotationSpeed
export const MAX_ROTATION_SPEED = 100;

/** Any value above this value is considered "active" */
export const ACTIVE_SPEED_THRESHOLD = 20;

export const CO2_LEVEL_SENSOR_KEY = 'CO2level (ppm)';
export const FAN_INFO_KEY = 'FanInfo';
export const ACTUAL_MODE_KEY = 'Actual_Mode';
export const SPEED_STATUS_KEY = 'Speed status'; // percentage
export const REQ_FAN_SPEED_KEY = 'ReqFanspeed'; // rpm

export const FALLBACK_VIRTUAL_REMOTE_COMMAND = 'medium';
