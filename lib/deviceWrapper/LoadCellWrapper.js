var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class LoadCellWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
        
        this.device.on(tinkerforge.BrickletLoadCell.CALLBACK_WEIGHT, this.valueChanged.bind(this));
        this.setCallbackInterval(200);
    }

    setCallbackInterval(intervalInMs) {
        this.device.setWeightCallbackPeriod(intervalInMs);
    }

}

exports.LoadCellWrapper = LoadCellWrapper;