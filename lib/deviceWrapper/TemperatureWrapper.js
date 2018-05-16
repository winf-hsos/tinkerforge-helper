var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class TemperatureWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
        
        this.device.on(tinkerforge.BrickletTemperature.CALLBACK_TEMPERATURE, this.valueChanged.bind(this));
        this.device.setTemperatureCallbackPeriod(1000);
    }

    setCallbackInterval(intervalInMs) {
        this.device.setTemperatureCallbackPeriod(intervalInMs);
    }

}

exports.TemperatureWrapper = TemperatureWrapper;