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

It is required to have installed and configured the [WiFi Add-on module](https://github.com/arjenhiemstra/ithowifi) for your fan unit. More info about this module and for a complete list on what mechanical ventilation models models are supported, please take a look at [Arjan Hiemstra's GitHub repository](https://github.com/arjenhiemstra/ithowifi) or this forum thread on Tweakers.net (Dutch): [Itho Daalderop WiFi Add-on module](https://gathering.tweakers.net/forum/list_messages/1892019).

### MQTT

Using the MQTT API is optional, the plugin will use the HTTP API by default. Using MQTT is recommended as it is more reliable and faster than the HTTP API.
If you want to use the MQTT API, you will need to install and configure a MQTT broker on your local network. I recommend using [Mosquitto](https://mosquitto.org/).
The IP address of the MQTT broker is required to configure the plugin in Homebridge and in the WiFi Add-on module.

## Getting started

1. Go to your Homebridge UI and click on "Plugins"
2. Search for `Itho Daalderop` and select the plugin `Homebridge Itho Daalderop` from `@jvandenaardweg` and click "Install"
3. On the plugin Settings, configure the API settings, choose between using MQTT or the HTTP API and fill in the required settings. Click Save.
4. Click the little QR code icon for the plugin and enable the bridge. Save it and restart Homebridge.
5. After restarting Homebridge, click the QR code icon again and scan the QR code with your iPhone using the Home App. This will add the plugin bridge to your Home App.
6. Your Mechanical Ventilation unit should now be available to configure in the Home App
