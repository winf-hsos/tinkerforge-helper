var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class HumidityWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
        
        this.device.on(tinkerforge.BrickletHumidity.CALLBACK_HUMIDITY, this.valueChanged.bind(this));
        this.setCallbackInterval(500);
    }

    setCallbackInterval(intervalInMs) {
        this.device.setHumidityCallbackPeriod(intervalInMs);
    }

}

exports.HumidityWrapper = HumidityWrapper;