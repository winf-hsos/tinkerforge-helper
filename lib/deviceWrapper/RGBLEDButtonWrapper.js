var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class RGBLEDButtonWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
    }

    setColor(r, g, b) {
        return this.device.setColor(r, g, b);
    }
}

exports.RGBLEDButtonWrapper = RGBLEDButtonWrapper;