var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class CO2Wrapper extends Wrapper {

    constructor(device) {
        super(device);
        
        this.device.on(tinkerforge.BrickletCO2.CALLBACK_CO2_CONCENTRATION, this.valueChanged.bind(this));
        this.setCallbackInterval(1000);
    }

    setCallbackInterval(intervalInMs) {
        this.device.setCO2ConcentrationCallbackPeriod(intervalInMs);
    }

}

exports.CO2Wrapper = CO2Wrapper;