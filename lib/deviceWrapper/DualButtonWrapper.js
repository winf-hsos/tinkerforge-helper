var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class DualButtonWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);

        this.device.on(tinkerforge.BrickletDualButton.CALLBACK_STATE_CHANGED, this.buttonStateChanged.bind(this));
    }

    autoToggleOn() {
        this.device.setLEDState(0, 0);
    }

    autoToggleOff() {
        this.device.setLEDState(1, 1);
    }

    bothOn() {
        this.device.setLEDState(2, 2);
    }

    bothOff() {
        this.device.setLEDState(3, 3);
    }

    buttonStateChanged(buttonL, buttonR, ledL, ledR, err) {
        var valueObj = {
            leftButton: buttonL === tinkerforge.BrickletDualButton.BUTTON_STATE_PRESSED ? "PRESSED" : "RELEASED",
            rightButton: buttonR === tinkerforge.BrickletDualButton.BUTTON_STATE_PRESSED ? "PRESSED" : "RELEASED",
            leftLed: ledL,
            rightLed: ledR
        }

        return super.valueChanged(valueObj, err);
    }
}

exports.DualButtonWrapper = DualButtonWrapper;