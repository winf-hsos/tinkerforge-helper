var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class OLEDDisplayWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
    }

    write(x, y, text) {
        return this.device.writeLine(x, y, text);
    }

    clearLine(lineNumber) {
        var clearString = "";

        for (var i = 0; i <= 25; i++) {
            clearString += " ";
        }
        this.write(lineNumber, 0, clearString);
    }

    clearDisplay() {
        for (var i = 0; i <= 7; i++) {
            this.clearLine(i);
        }
    }
}

exports.OLEDDisplayWrapper = OLEDDisplayWrapper;