var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class LinearPotiWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);


        this.device.on(tinkerforge.BrickletLinearPoti.CALLBACK_POSITION, this.valueChanged.bind(this));
        this.device.setPositionCallbackPeriod(50);
    }

}

exports.LinearPotiWrapper = LinearPotiWrapper;