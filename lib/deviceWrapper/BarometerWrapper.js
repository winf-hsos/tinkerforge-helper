var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class BarometerWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
        
        this.device.on(tinkerforge.BrickletBarometer.CALLBACK_AIR_PRESSURE, this.valueChanged.bind(this));
        this.setCallbackInterval(1000);
    }

    setCallbackInterval(intervalInMs) {
        this.device.setAirPressureCallbackPeriod(intervalInMs);
    }

}

exports.BarometerWrapper = BarometerWrapper;