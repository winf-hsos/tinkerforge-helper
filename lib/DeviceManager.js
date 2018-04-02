/* Initialize logger */
var log4js = require('log4js');
log4js.configure({
  appenders: {
    sensorFile: { type: 'file', filename: 'sensors.log', layout: { type: 'messagePassThrough' } },
    application: { type: 'console' }
  },
  categories: {
    default: { appenders: ['application'], level: 'debug' },
    sensors: { appenders: ['sensorFile'], level: 'info' }
  }
});

var logger = log4js.getLogger();
logger.level = 'debug';

var consts = require('./Helper.js').consts;
var log = require('./Helper.js').log;
var tinkerforge = require('tinkerforge');

var { AccelerometerWrapper } = require('./deviceWrapper/AccelerometerWrapper.js');
var { AmbientLightV2Wrapper } = require('./deviceWrapper/AmbientLightV2Wrapper.js');
var { BarometerWrapper } = require('./deviceWrapper/BarometerWrapper.js');
var { CO2Wrapper } = require('./deviceWrapper/CO2Wrapper.js');
var { DistanceIRWrapper } = require('./deviceWrapper/DistanceIRWrapper.js');
var { DistanceUSWrapper } = require('./deviceWrapper/DistanceUSWrapper.js');
var { RGBLEDWrapper } = require('./deviceWrapper/RGBLEDWrapper.js');
var { RGBLEDButtonWrapper } = require('./deviceWrapper/RGBLEDButtonWrapper.js');
var { TemperatureWrapper } = require('./deviceWrapper/TemperatureWrapper.js');
var { TiltWrapper } = require('./deviceWrapper/TiltWrapper.js');
var { UVLightWrapper } = require('./deviceWrapper/UVLightWrapper.js');
var { LoadCellWrapper } = require('./deviceWrapper/LoadCellWrapper.js');
var { HumidityWrapper } = require('./deviceWrapper/HumidityWrapper.js');
var { HumidityV2Wrapper } = require('./deviceWrapper/HumidityV2Wrapper.js');

class DeviceManager {

  constructor(host = 'localhost', port = 4223) {
    this.host = host;
    this.port = port;
    this.ipcon = {};

    // The eletronic devices
    this.master;
    this.devices = new Map();
    this.listeners = new Map();

    this._resetTriggered = false;

  }

  reset() {
    var _this = this;

    return new Promise((resolve, reject) => {
      if (this.master) {

        this.master.setResponseExpected(243, true);
        var responseExp = this.master.getResponseExpected(243);
        this.master.reset();

        var waitForResetInterval = setInterval(() => {
          this.master.getIdentity(function (uid, connectedUid, position, hardwareVersion, firmwareVersion,
            deviceIdentifier) {

            clearInterval(waitForResetInterval);
            _this._resetTriggered = true;
            resolve();
          });

        }, 500);

      }
      else {
        reject("No master found. Initialize first");
      }
    })
  }

  initialize() {
    var _this = this;
    return new Promise((resolve, reject) => {

      return _this._enumerate().then(() => {
        _this.ipcon.on(tinkerforge.IPConnection.CALLBACK_ENUMERATE, _this._registerDevice.bind(_this));
        _this.reset().then(() => {
          setTimeout(() => {
            resolve();
          }, 2000);

        }).catch(this.handleError)
      })
    })
  }

  _enumerate() {
    var _this = this;

    return new Promise((resolve, reject) => {

      // Create connection and connect to brickd
      this.ipcon = new tinkerforge.IPConnection();
      this.ipcon.connect(this.host, this.port);

      this.ipcon.on(tinkerforge.IPConnection.CALLBACK_CONNECTED,
        function (connectReason) {

          if (_this._resetTriggered === false) {
            _this.ipcon.on(tinkerforge.IPConnection.CALLBACK_ENUMERATE, _this._registerMaster.bind(_this));
          }

          // Trigger Enumerate
          _this.ipcon.enumerate();

          setTimeout(() => {
            resolve(_this);
          }, 2000);

        })

    });

  }

  get(uid) {
    if (this.devices.has(uid))
      return this.devices.get(uid);
    else return null;
  }

  /* Returns a specific device by the Tinkerforge
   * device identifier. If more than one exists, 
   * an array is returned */
  getByDeviceIdentifier(deviceIdentifier) {
    var result = [];

    this.devices.forEach((value, key, map) => {
      if (typeof value.deviceIdentifier != "undefined" && value.deviceIdentifier == deviceIdentifier) {
        result.push(value);
      }
    });

    if (result.length == 0)
      return null;
    else if (result.length == 1)
      return result[0];
    else return result;

  }

  _registerMaster(uid, connectedUid, position, hardwareVersion, firmwareVersion,
    deviceIdentifier, enumerationType) {

    if (deviceIdentifier == 13) {

      var device = new tinkerforge.BrickMaster(uid, this.ipcon);
      // The master brick has no connectedUid
      if (connectedUid == 0) {
        this.master = device;
      }
    }
  }

  _registerDevice(uid, connectedUid, position, hardwareVersion, firmwareVersion,
    deviceIdentifier, enumerationType) {

    var deviceName;
    var device;
    var deviceWrapper = null;

    switch (deviceIdentifier) {
      case 13:
        // Master Brick 2.1
        deviceName = "Master Brick 2.1";
        device = new tinkerforge.BrickMaster(uid, this.ipcon);

        // The master brick has no connectedUid
        if (connectedUid == 0) {
          this.master = device;
        }

        break;
      case 25:
        deviceName = "Distance IR Bricklet";
        device = new tinkerforge.BrickletDistanceIR(uid, this.ipcon);
        deviceWrapper = new DistanceIRWrapper(device, uid, deviceIdentifier);
        break;
      case 27:
        deviceName = "Humidity Bricklet";
        device = new tinkerforge.BrickletHumidity(uid, this.ipcon);
        deviceWrapper = new HumidityWrapper(device, uid, deviceIdentifier);
        break;
      case 216:
        deviceName = "Temperature Bricklet";
        device = new tinkerforge.BrickletTemperature(uid, this.ipcon);
        deviceWrapper = new TemperatureWrapper(device, uid, deviceIdentifier);
        break;
      case 221:
        deviceName = "Barometer Bricklet";
        device = new tinkerforge.BrickletBarometer(uid, this.ipcon);
        deviceWrapper = new BarometerWrapper(device, uid, deviceIdentifier);
        break;
      case 229:
        deviceName = "Distance US Bricklet";
        device = new tinkerforge.BrickletDistanceUS(uid, this.ipcon);
        deviceWrapper = new DistanceUSWrapper(device, uid, deviceIdentifier);
        break;
      case 230:
        deviceName = "Dual Button Bricklet";
        device = new tinkerforge.BrickletDualButton(uid, this.ipcon);
        break;
      case 239:
        deviceName = "Tilt Bricklet";
        device = new tinkerforge.BrickletTilt(uid, this.ipcon);
        deviceWrapper = new TiltWrapper(device, uid, deviceIdentifier);
        break;
      case 242:
        deviceName = "Piezo Speaker Bricklet";
        device = new tinkerforge.BrickletPiezoSpeaker(uid, this.ipcon);
        break;
      case 243:
        deviceName = "Color Bricklet";
        device = new tinkerforge.BrickletColor(uid, this.ipcon);
        break;
      case 250:
        deviceName = "Accelerometer Bricklet";
        device = new tinkerforge.BrickletAccelerometer(uid, this.ipcon);
        deviceWrapper = new AccelerometerWrapper(device, uid, deviceIdentifier);
        break;
      case 253:
        deviceName = "Load Cell Bricklet";
        device = new tinkerforge.BrickletLoadCell(uid, this.ipcon);
        deviceWrapper = new LoadCellWrapper(device, uid, deviceIdentifier);
        break;
      case 259:
        deviceName = "Ambient Light 2.0 Bricklet";
        device = new tinkerforge.BrickletAmbientLightV2(uid, this.ipcon);
        deviceWrapper = new AmbientLightV2Wrapper(device, uid, deviceIdentifier);
        break;
      case 262:
        deviceName = "CO2 Bricklet";
        device = new tinkerforge.BrickletCO2(uid, this.ipcon);
        deviceWrapper = new CO2Wrapper(device, uid, deviceIdentifier);
        break;
      case 263:
        deviceName = "OLED 128x64 Bricklet";
        device = new tinkerforge.BrickletOLED128x64(uid, this.ipcon);
        break;
      case 265:
        deviceName = "UV Light Bricklet";
        device = new tinkerforge.BrickletUVLight(uid, this.ipcon);
        deviceWrapper = new UVLightWrapper(device, uid, deviceIdentifier);
        break;
      case 271:
        deviceName = "RGB LED Bricklet";
        device = new tinkerforge.BrickletRGBLED(uid, this.ipcon);
        deviceWrapper = new RGBLEDWrapper(device, uid, deviceIdentifier);
        break;
      case 276:
        deviceName = "GPS 2.0 Bricklet";
        device = new tinkerforge.BrickletGPSV2(uid, this.ipcon);
        break;
      case 282:
        deviceName = "RGB Button Bricklet";
        device = new tinkerforge.BrickletRGBLEDButton(uid, this.ipcon);
        deviceWrapper = new RGBLEDButtonWrapper(device, uid, deviceIdentifier);
        break;
      case 283:
        deviceName = "Humidity 2.0 Bricklet";
        device = new tinkerforge.BrickletHumidityV2(uid, this.ipcon);
        deviceWrapper = new HumidityV2Wrapper(device, uid, deviceIdentifier);
        break;
      case 286:
        deviceName = "NFC Bricklet";
        device = new tinkerforge.BrickletNFC(uid, this.ipcon);
        break;
      default:
        deviceName = "Unknown";
        break;
    }

    if (this._resetTriggered === true) {


      if (deviceWrapper !== null) {
        this.devices.set(uid, deviceWrapper);
      }
      else {
        this.devices.set(uid, device);
      }

      if (deviceIdentifier != 13) {
        logger.info("Found >" + deviceName + " (" + deviceIdentifier + "/" + uid + ")<" + " at Master Brick with UID >" + connectedUid + "< at position >" + position + "<");
      }
      else {
        logger.info("Found >" + deviceName + " (" + uid + ")<");
      }
    }


  }

  handleError(error) {
    logger.error(error);
  }

  disconnect() {
    this.ipcon.disconnect();
  }

}
exports.DeviceManager = DeviceManager;
