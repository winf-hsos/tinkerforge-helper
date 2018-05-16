var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class PiezoSpeakerWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
    }

    beep(ms, frequency) {
        this.device.beep(ms, frequency);
    }
}

exports.PiezoSpeakerWrapper = PiezoSpeakerWrapper;