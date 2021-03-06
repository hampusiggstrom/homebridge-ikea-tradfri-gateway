"use strict";

var Events           = require('events');
var Path             = require('path');
var isObject         = require('yow/is').isObject;
var isString         = require('yow/is').isString;
var isFunction       = require('yow/is').isFunction;
var sprintf          = require('yow/sprintf');
var isString         = require('yow/is').isString;
var Timer            = require('yow/timer');

var Outlet             = require('./outlet.js');
var Lightbulb          = require('./lightbulb.js');
var WarmWhiteLightbulb = require('./warm-white-lightbulb.js');
var RgbLightbulb       = require('./rgb-lightbulb.js');
var Gateway            = require('./gateway.js');
var Ikea               = require('node-tradfri-client');


var Accessory, Service, Characteristic, UUIDGen;


module.exports = class Platform extends Gateway {

    constructor(log, config, homebridge) {

        Accessory = homebridge.platformAccessory;
        Service = homebridge.hap.Service;
        Characteristic = homebridge.hap.Characteristic;
        UUIDGen = homebridge.hap.uuid;

        super(log, config);

        this.homebridge = homebridge;
        this.devices = {};

        this.homebridge.on('didFinishLaunching', () => {
            this.log('didFinishLaunching');
        });
    }

    deviceUpdated(device) {
        var item = this.devices[device.instanceId];

        if (item != undefined) {
            item.device = device;
            item.deviceChanged();
        }
    }

    groupUpdated(group) {
    }


    setup() {
        for (var id in this.gateway.devices) {
            var device = this.gateway.devices[id];

                    this.log(device.type);


            if (device.type === Ikea.AccessoryTypes.lightbulb) {

                var spectrum = device.lightList[0]._spectrum;
                var bulb = undefined;

                this.log('Creating accessory \'%s\'... (spectrum %s)', device.name, spectrum);

                switch(spectrum) {
                    case 'white': {
                        bulb = new WarmWhiteLightbulb(this, device);
                        break;
                    }
                    case 'rgbw':
                    case 'rgb': {
                        bulb = new RgbLightbulb(this, device);
                        break;
                    }
                    default: {
                        bulb = new Lightbulb(this, device);
                        break;
                    }
                }

                this.devices[device.instanceId] = bulb;
            } else if (device.type === Ikea.AccessoryTypes.plug) {
                this.devices[device.instanceId] = new Outlet(this, device);;
            }

        }

        return Promise.resolve();

    }

    accessories(callback) {

        this.connect().then(() => {
            return this.setup();
        })
        .then(() => {
            var accessories = [];

            for (var id in this.devices) {
                accessories.push(this.devices[id]);
            }

            callback(accessories);
        })
        .catch((error) => {
            // Display error and make sure to stop.
            // If we just return an empty array, all our automation
            // rules and scenarios will be removed from the Home App.
            console.log(error);
            process.exit(1);
            throw error;
        })


    }


}
