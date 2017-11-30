var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class TiltWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
        
        this.device.on(tinkerforge.BrickletTilt.CALLBACK_TILT_STATE, this.valueChanged.bind(this));
        this.device.enableTiltStateCallback();
    }
/*
    valueChanged(value, err) {
        if (err)
            console.log(err)
        else {
           console.log(value);
        }
    }
    */
}

exports.TiltWrapper = TiltWrapper;