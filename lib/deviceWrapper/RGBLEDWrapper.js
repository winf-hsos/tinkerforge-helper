var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class RGBLEDWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
    }

    setColor(r, g, b) {
        return this.device.setRGBValue(r, g, b);
    }

    off() {
        return this.device.setRGBValue(0, 0, 0);
    }

    white() {
        return this.setColor(255, 255, 255);
    }

}

exports.RGBLEDWrapper = RGBLEDWrapper;