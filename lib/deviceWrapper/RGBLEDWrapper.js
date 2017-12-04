var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class RGBLEDWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
    }
}

exports.RGBLEDWrapper = RGBLEDWrapper;