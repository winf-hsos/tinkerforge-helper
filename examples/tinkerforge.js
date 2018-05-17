var { DeviceManager } = require('../lib/DeviceManager.js');
var dm = new DeviceManager('localhost', 4223);

// Intialize the device manager and run startTest when done
dm.initialize().then(startTest).catch(handleError);

// Declare four variables, one for each device
var light;
var temperature;
var buttons;

function startTest() {
    light = dm.getByDeviceIdentifier(271);
    temperature = dm.getByDeviceIdentifier(216);
    speaker = dm.getByDeviceIdentifier(242);
    buttons = dm.getByDeviceIdentifier(230);

    //light.blink(0, 255, 100, 100);
}

function handleError(error) {
    console.error(error);
}