var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class AmbientLightV2Wrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
        
        this.device.on(tinkerforge.BrickletAmbientLightV2.CALLBACK_ILLUMINANCE, this.valueChanged.bind(this));
        this.setCallbackInterval(500);
    }

    setCallbackInterval(intervalInMs) {
        this.device.setIlluminanceCallbackPeriod(intervalInMs);
    }

}

exports.AmbientLightV2Wrapper = AmbientLightV2Wrapper;