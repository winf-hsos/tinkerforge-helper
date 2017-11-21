var consts = require('./Helper.js').consts;
var log = require('./Helper.js').log;
var tinkerforge = require('tinkerforge');

var { DistanceIRWrapper } = require('./deviceWrapper/DistanceIRWrapper.js');
var { DistanceUSWrapper } = require('./deviceWrapper/DistanceUSWrapper.js');
var { TemperatureWrapper } = require('./deviceWrapper/TemperatureWrapper.js');
var { CO2Wrapper } = require('./deviceWrapper/CO2Wrapper.js');

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
        log("No master found. Initialize first", consts.ERROR);
        resolve();
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
          }, 1500);

        })
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
          }, 1500);

        })

    });

  }

  get(uid) {
    if (this.devices.has(uid))
      return this.devices.get(uid);
    else return null;
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
        deviceWrapper = new DistanceIRWrapper(device);
        break;
      case 271:
        deviceName = "RGB LED Bricklet";
        device = new tinkerforge.BrickletRGBLED(uid, this.ipcon);
        break;
      case 216:
        deviceName = "Temperature Bricklet";
        device = new tinkerforge.BrickletTemperature(uid, this.ipcon);
        deviceWrapper = new TemperatureWrapper(device);
        break;
      case 229:
        deviceName = "Distance US Bricklet";
        device = new tinkerforge.BrickletDistanceUS(uid, this.ipcon);
        deviceWrapper = new DistanceUSWrapper(device);
        break;
      case 230:
        deviceName = "Dual Button Bricklet";
        device = new tinkerforge.BrickletDualButton(uid, this.ipcon);
        break;
      case 239:
        deviceName = "Tilt Bricklet";
        device = new tinkerforge.BrickletTilt(uid, this.ipcon);
        break;
      case 242:
        deviceName = "Piezo Speaker Bricklet";
        device = new tinkerforge.BrickletPiezoSpeaker(uid, this.ipcon);
        break;
      case 243:
        deviceName = "Color Bricklet";
        device = new tinkerforge.BrickletColor(uid, this.ipcon);
        break;
      case 253:
        deviceName = "Load Cell Bricklet";
        device = new tinkerforge.BrickletLoadCell(uid, this.ipcon);
        break;
      case 262:
        deviceName = "CO2 Bricklet";
        device = new tinkerforge.BrickletCO2(uid, this.ipcon);
        deviceWrapper = new CO2Wrapper(device);
        break;
      case 263:
        deviceName = "OLED 128x64 Bricklet";
        device = new tinkerforge.BrickletOLED128x64(uid, this.ipcon);
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
        log("Found >" + deviceName + " (" + deviceIdentifier + "/" + uid + ")<" + " at Master Brick with UID >" + connectedUid + "< at position >" + position + "<", "success");
      }
      else {
        log("Found >" + deviceName + " (" + uid + ")<", "success");
      }
    }


  }

  disconnect() {
    this.ipcon.disconnect();
  }

}
exports.DeviceManager = DeviceManager;
