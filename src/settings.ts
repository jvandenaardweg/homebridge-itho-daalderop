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
