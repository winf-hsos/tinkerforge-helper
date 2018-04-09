var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class OLEDDisplayWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
    }

    write(x, y, text) {
        return this.device.writeLine(x, y, text);
    }

    clear() {
        return this.device.clearDisplay();
    }
}

exports.OLEDDisplayWrapper = OLEDDisplayWrapper;