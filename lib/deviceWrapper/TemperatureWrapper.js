var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class TemperatureWrapper extends Wrapper {

    constructor(device) {
        super(device);
        
        this.device.on(tinkerforge.BrickletTemperature.CALLBACK_TEMPERATURE, this.valueChanged.bind(this));
        this.setCallbackInterval(500);
    }

    setCallbackInterval(intervalInMs) {
        this.device.setTemperatureCallbackPeriod(intervalInMs);
    }

}

exports.TemperatureWrapper = TemperatureWrapper;