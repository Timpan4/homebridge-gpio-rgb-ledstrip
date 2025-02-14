"use strict";

var Service, Characteristic, isOn;

// const piblaster = require('pi-blaster.js');
const converter = require('color-convert');
const fs = require('fs');
// const Gpio = require('pigpio').Gpio;
const axios = require('axios').default;
const request = require('request');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-gpio-rgb-ledstrip', 'SmartLedStrip', SmartLedStripAccessory);
}
//sleep function
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}

function SmartLedStripAccessory(log, config) {
  this.log = log;
  // this.log(config);  used for debugging
  this.name = config['name'];

  this.rPin = config['rPin'];
  this.gPin = config['gPin'];
  this.bPin = config['bPin'];
  this.ip = config['ip'];

  this.enabled = true;

  try {
    if (!this.rPin)
      throw new Error("rPin not set!")
    if (!this.gPin)
      throw new Error("gPin not set!")
    if (!this.bPin)
      throw new Error("bPin not set!")
  } catch (err) {
    this.log("An error has been thrown! " + err);
    this.log("homebridge-gpio-rgb-ledstrip won't work until you fix this problem");
    this.enabled = false;
  }

}

SmartLedStripAccessory.prototype = {

  getServices: function () {

    if (this.enabled) {
      let informationService = new Service.AccessoryInformation();

      informationService
        .setCharacteristic(Characteristic.Manufacturer, 'Tim')
        .setCharacteristic(Characteristic.Model, 'GPIO-RGB-LedStrip')
        .setCharacteristic(Characteristic.SerialNumber, '06-06-00');

      let smartLedStripService = new Service.Lightbulb(this.name);

      smartLedStripService
        .getCharacteristic(Characteristic.On)
        .on('change', this.toggleState.bind(this));

      smartLedStripService
        .addCharacteristic(new Characteristic.Brightness())
        .on('change', this.toggleState.bind(this));

      smartLedStripService
        .addCharacteristic(new Characteristic.Hue())
        .on('change', this.toggleState.bind(this));

      smartLedStripService
        .addCharacteristic(new Characteristic.Saturation())
        .on('change', this.toggleState.bind(this));

      this.informationService = informationService;
      this.smartLedStripService = smartLedStripService;

      this.log("SmartLedStrip has been successfully initialized!");

      return [informationService, smartLedStripService];
    } else {
      this.log("SmartLedStrip has not been initialized, please check your logs..");
      return [];
    }

  },

  isOn: function () {
    return this.smartLedStripService.getCharacteristic(Characteristic.On).value;
  },

  getBrightness: function () {
    return this.smartLedStripService.getCharacteristic(Characteristic.Brightness).value;
  },

  getHue: function () {
    return this.smartLedStripService.getCharacteristic(Characteristic.Hue).value;
  },

  getSaturation: function () {
    return this.smartLedStripService.getCharacteristic(Characteristic.Saturation).value;
  },

  toggleState: function () {
    if (this.enabled) {

      let brightness = this.getBrightness();
      this.log("Hello")

      //fade in effect when turning on
      if (this.isOn() && !isOn) {
        this.log("Turning on");
        this.updateRGB(this.getHue(), this.getSaturation(), brightness, this.rPin, this.gPin, this.bPin, 1, this.ip);
        isOn = true;
        return;
      }



      this.log(brightness);
      // if () {
      //   this.updateRGB(this.getHue(), this.getSaturation(), brightness, this.rPin, this.gPin, this.bPin, 0);
      // }

      // fade out effect when turning off
      if (!this.isOn() || brightness != 0) {
        this.log("Turning off");
        this.updateRGB(this.getHue(), this.getSaturation(), brightness, this.rPin, this.gPin, this.bPin, 0, this.ip);
        isOn = false;
        // let rgb = converter.hsv.rgb([this.getHue(), this.getSaturation(), brightness]);
        // this.updateRGB(0, 0, 0);
        return;
      }
    }

  },

  updateRGB: function (h, s, b, rPin, gPin, bPin, onOFF, ip) {
    let log = this;
    this.log("Trying to send request");
    request.post(
      ip,
      {
        json: {
          rPin: rPin,
          gPin: gPin,
          bPin: bPin,
          h: h,
          s: s,
          b: b,
          onOFF: onOFF
        },
      },
      (error, res, body) => {
        if (error) {
          console.error(error)
          return
        }
        console.log(`statusCode: ${res.statusCode}`)
        console.log(body)
      }
    );
    // axios.post('/update', {
    //   rPin: rPin,
    //   gPin: gPin,
    //   bPin: bPin,
    //   red: red,
    //   green: green,
    //   blue: blue
    // }).then(function (response) {
    //   log.log(response);
    // }).catch(function (error) {
    //   log.log(error);
    // });
  }

}
