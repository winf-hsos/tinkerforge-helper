var { DeviceManager } = require('../lib/DeviceManager.js');

var dm = new DeviceManager();
dm.initialize().then(start).catch(handleError);

function start() {

    var humiditySensor = dm.get("Dge");
    humiditySensor.setCallbackInterval(250);
    //humiditySensor.registerListener(newHumidtyOrTemperatureValue);

    var accelerometerSensor = dm.getByDeviceIdentifier(250);
    //accelerometerSensor.registerListener(acclerationChanged);

    //dm.get("Dov").setColor(0, 255, 0);

    var rgbButton = dm.getByDeviceIdentifier(282);
    rgbButton.setColor(0, 255, 255);
}

function newHumidtyOrTemperatureValue(valueObj) {
    //    console.log(valueObj);   
}

function acclerationChanged(valueObj) {
    console.dir(valueObj);
}

function handleError(err) {
    console.error(err);
}