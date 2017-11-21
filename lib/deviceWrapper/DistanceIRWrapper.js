var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class DistanceIRWrapper extends Wrapper {

    constructor(device) {
        super(device);
        
        this.device.on(tinkerforge.BrickletDistanceIR.CALLBACK_DISTANCE, this.valueChanged.bind(this));
        this.setCallbackInterval(200);
    }

    setCallbackInterval(intervalInMs) {
        this.device.setDistanceCallbackPeriod(intervalInMs);
    }

}

exports.DistanceIRWrapper = DistanceIRWrapper;