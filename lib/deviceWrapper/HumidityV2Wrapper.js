var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class HumidityV2Wrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
        
        this.device.on(tinkerforge.BrickletHumidityV2.CALLBACK_HUMIDITY, this.humidityValueChanged.bind(this));
        this.device.on(tinkerforge.BrickletHumidityV2.CALLBACK_TEMPERATURE, this.temperatureValueChanged.bind(this));
        this.setCallbackInterval(500);
    }
    
    humidityValueChanged(value, err) {
        return super.valueChanged({ "humidity" : value}, err);
    }
   
    temperatureValueChanged(value, err) {
        return super.valueChanged({ "temperature" : value}, err);
    }

    setCallbackInterval(intervalInMs) {
        this.device.setHumidityCallbackConfiguration(intervalInMs, false, 'x', 0, 0);
        this.device.setTemperatureCallbackConfiguration(intervalInMs, false, 'x', 0, 0);        
    }

}

exports.HumidityV2Wrapper = HumidityV2Wrapper;