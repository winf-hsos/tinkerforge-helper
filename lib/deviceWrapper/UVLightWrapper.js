var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class UVLightWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
        
        this.device.on(tinkerforge.BrickletUVLight.CALLBACK_UV_LIGHT, this.valueChanged.bind(this));
        this.setCallbackInterval(1000);
    }

    setCallbackInterval(intervalInMs) {
        this.device.setUVLightCallbackPeriod(intervalInMs);
    }

}

exports.UVLightWrapper = UVLightWrapper;