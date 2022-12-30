<p align="center">
<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">
</p>
<p align="center">
  <a href="https://npmjs.com/package/homebridge-itho-daalderop" title="NPM package"><img alt="npm" src="https://img.shields.io/npm/v/homebridge-itho-daalderop?color=%234c1&label=npm%20package" /></a>
  &nbsp;
  <a href="https://github.com/jvandenaardweg/homebridge-itho-daalderop/actions" title="Build and Test result"><img alt="github" src="http://img.shields.io/github/actions/workflow/status/jvandenaardweg/homebridge-itho-daalderop/build-and-test.yml?branch=main&color=%234c1" /></a>
  &nbsp;
  <a href="https://github.com/sponsors/jvandenaardweg" title="Sponsor me on GitHub"><img src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23db61a2" alt="github sponsor" /></a>
  &nbsp;
  <a href="https://github.com/jvandenaardweg/homebridge-itho-daalderop/blob/main/LICENSE" title="MIT license"><img alt="mit license" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
</p>

# Homebridge plugin for Itho Daalderop mechanical fan units

This Homebridge plugin exposes your [Itho Daalderop](https://www.ithodaalderop.nl/) mechanical fan unit to Apple HomeKit by using the [WiFi Add-on module](https://github.com/arjenhiemstra/ithowifi). So you can use the Home App to control your fan units and integrate into your Home Automations.

## Features

- Control your mechanical ventilation unit from within the Home App
- Use your mechanical ventilation unit in your Home Automations
- Exposes an Air Quality Sensor with CO2, Humidity and Temperature measurements
- Supports both MQTT and HTTP API. The HTTP API is enabled by default

## Requirements

It is required to have installed and configured the [WiFi Add-on module](https://github.com/arjenhiemstra/ithowifi) for your fan unit. More info about this module and for a complete list on what mechanical ventilation models models are supported, please take a look at [Arjan Hiemstra's GitHub repository](https://github.com/arjenhiemstra/ithowifi) or this forum thread on Tweakers.net (Dutch): [Itho Daalderop - open source wifi control add-on module](https://gathering.tweakers.net/forum/list_messages/1976492).

### MQTT

Using the MQTT API is optional, the plugin will use the HTTP API by default as it requires no additional software to be present in your network.

However, using MQTT is recommended as it is more reliable and faster than the HTTP API.

If you want to use the MQTT API, you will need to install and configure a MQTT broker on your local network. I recommend using [Mosquitto](https://mosquitto.org/).
The IP address of the MQTT broker is required to configure the plugin in Homebridge and in the WiFi Add-on module.

## Installation

This plugin requires Node 14 or higher to be installed.

```
npm install -g homebridge-itho-daalderop
```

Or use the Homebridge UI to install the plugin:

1. Go to your Homebridge UI and click on "Plugins"
2. Search for `Itho Daalderop` and select the plugin `Homebridge Itho Daalderop` from `@jvandenaardweg` and click "Install"

## Configuring the plugin

I recommend using the Homebridge UI to configure the plugin settings, as it gives guidance on what settings are required.

1. Go the the plugin settings in the Homebridge UI
2. On the plugin page click on "Settings" for `Homebridge Itho Daalderop`
3. Let the plugin know if you have a build-in CO2 sensor in your fan unit
4. And choose between using MQTT or the HTTP API and fill in the required settings
5. Save the config
6. Click the little QR code icon for the plugin and enable the bridge. Save it and restart Homebridge
7. After restarting Homebridge, click the QR code icon again and scan the QR code with your iPhone using the Home App. This will add the plugin bridge to your Home App
8. Your Mechanical Ventilation unit should now be available to configure in the Home App

### Example config

```json
{
  "platform": "HomebridgeIthoDaalderop",
  "name": "Itho Daalderop",
  "api": {
    "protocol": "mqtt",
    "ip": "192.168.1.21",
    "port": 1883
  },
  "device": {
    "co2Sensor": true
  },
  "verboseLogging": false
}
```

## About manual speed control

The plugin allows full manual speed control from 0% to 100% and everything in between. However, your fan needs to be able to support such speed commands. It is [known](https://github.com/arjenhiemstra/ithowifi/wiki/CO2-sensors#itho-with-built-in-co2--sensor-cve-s-optima-inside) that speed commands send to CVE unit's with a built-in CO2 sensor (like the CVE-S Optima Inside) are overruled by the internal speed control of the fan. This means you can't have fine grained control over your fan speed, and are limited to "low", "medium" and "high" speed settings.

If you have such a device with a built-in CO2 sensor, please add the `device` configuration option to your config.json file and set the `co2Sensor` option to `true`. Or use the Homebridge UI to set that option. The plugin will then automatically map the speed in the Home App to the respective virtual remote commands, which will allow you to control the fan speed in 3 steps. The mapping is as follows:
| Home App speed | Virtual remote command | HomeKit Active state |
| -------------- | ---------------------- | -------------------- |
| 0% | low | inactive |
| 33% | low | active |
| 67% | medium/auto | active |
| 100% | high | active |

You can also remove the CO2 sensor from the device itself. Just unplug it from the internal board. This will allow you to use the full manual speed control, but you don't receive any Carbon Dioxide reading from this sensor anymore in the Home App for the Air Quality Sensor. Make sure you have removed the `device` configuration option completely.

## Troubleshooting

If you have any issues with the plugin, please enable the `verboseLogging` configuration option in the Homebridge plugin and check the Homebridge logs for any errors and debug messages.

Feel free to [open an issue on GitHub](https://github.com/jvandenaardweg/homebridge-itho-daalderop/issues) if you have any questions or problems.
