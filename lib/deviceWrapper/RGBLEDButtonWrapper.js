var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class RGBLEDButtonWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);

        this.device.on(tinkerforge.BrickletRGBLEDButton.CALLBACK_BUTTON_STATE_CHANGED, this.buttonStateChanged.bind(this));
    }

    setColor(r, g, b) {
        return this.device.setColor(r, g, b);
    }

    off() {
        return this.setColor(0, 0, 0);
    }

    buttonStateChanged(value, err) {
        return super.valueChanged(value == 0 ? "PRESSED" : "RELEASED", err);
    }
}

exports.RGBLEDButtonWrapper = RGBLEDButtonWrapper;