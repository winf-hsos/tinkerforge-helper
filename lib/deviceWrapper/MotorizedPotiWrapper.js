var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class MotorizedPotiWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);

        this.device.on(tinkerforge.BrickletMotorizedLinearPoti.CALLBACK_POSITION, this.valueChanged.bind(this));
        this.device.on(tinkerforge.BrickletMotorizedLinearPoti.CALLBACK_POSITION_REACHED, this.valueChanged.bind(this));
        
        this.device.setPositionCallbackConfiguration(50, true, 'x', 0, 0);
    }

    setMotorPosition(position) {
        this.device.setMotorPosition(position,
            tinkerforge.BrickletMotorizedLinearPoti.DRIVE_MODE_SMOOTH,
            false);
    }
}

exports.MotorizedPotiWrapper = MotorizedPotiWrapper;