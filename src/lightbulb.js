"use strict";
var sprintf  = require('yow/sprintf');
var isString = require('yow/is').isString;
var isNumber = require('yow/is').isNumber;
var Device   = require('./device.js');

module.exports = class Lightbulb extends Device {

    constructor(platform, device) {
        super(platform, device);

        this.log('Creating new lightbulb %s (%s)...', this.name, this.id);
        this.lightbulb = new this.Service.Lightbulb(this.name, this.uuid);

        this.addService('lightbulb', this.lightbulb);
        this.addCharacteristics();
    }

    deviceChanged(device) {
        super.deviceChanged();

        this.updatePower();
        this.updateBrightness();
    }

    addCharacteristics() {
        this.enablePower();
        this.enableBrightness();
        this.enableStatus();
    }

    enableBrightness() {
        var light = this.device.lightList[0];
        var brightness = this.lightbulb.addCharacteristic(this.Characteristic.Brightness);

        brightness.updateValue(this.brightness = light.dimmer);

        brightness.on('get', (callback) => {
            callback(null, this.brightness);
        });

        brightness.on('set', (value, callback) => {
            this.setBrightness(value, callback);
        });

        this.log('Enabled brightness on %s. Brightness is initially %s%%.', this.name, this.brightness);

    }

    enableStatus() {
        var alive = this.lightbulb.addCharacteristic(this.Characteristic.StatusActive);

        alive.updateValue(this.device.alive);

        this.lightbulb.getCharacteristic(this.Characteristic.StatusActive).on('get', (callback) => {
            this.log('Light %s in now %s.', this.name, this.device.alive ? 'ALIVE' : 'DEAD');
            callback(null, this.device.alive);
        });
    }

    setBrightness(value, callback) {
        this.log('Setting brightness to %s on lightbulb \'%s\'', value, this.name);
        this.brightness = value;

        this.platform.gateway.operateLight(this.device, {
                dimmer: this.brightness
            })
            .then(() => {
                if (callback)
                    callback();
            });
    }

    updateBrightness() {
        var light = this.device.lightList[0];
        var brightness = this.lightbulb.getCharacteristic(this.Characteristic.Brightness);

        this.brightness = light.dimmer;

        this.log('Updating brightness to %s on lightbulb \'%s\'', this.brightness, this.name);
        brightness.updateValue(this.brightness);

    }


    enablePower() {
        var light = this.device.lightList[0];
        var power = this.lightbulb.getCharacteristic(this.Characteristic.On);

        power.updateValue(this.power = light.onOff);

        power.on('get', (callback) => {
            callback(null, this.power);
        });

        power.on('set', (value, callback) => {
            this.setPower(value, callback);
        });

        this.log('Enabled power on %s. Power is initially %s.', this.name, this.power ? 'ON' : 'OFF');
    }

    setPower(value, callback) {
        this.log('Setting power to %s on lightbulb \'%s\'', value ? 'ON' : 'OFF', this.name);
        this.power = value;

        this.platform.gateway.operateLight(this.device, {
                onOff: this.power
            })
            .then(() => {
                if (callback)
                    callback();
            })
            .catch((error) => {
                this.log(error);
            });

    }

    updatePower() {
        var light = this.device.lightList[0];
        var power = this.lightbulb.getCharacteristic(this.Characteristic.On);

        this.power = light.onOff;

        this.log('Updating power to %s on lightbulb \'%s\'', this.power ? 'ON' : 'OFF', this.name);
        power.updateValue(this.power);
    }



};
