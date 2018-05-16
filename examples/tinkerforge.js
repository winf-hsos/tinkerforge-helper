var { DeviceManager } = require('../lib/DeviceManager.js');
var dm = new DeviceManager('localhost', 4223);

// Intialize the device manager and run startTest when done
dm.initialize().then(startTest).catch(handleError);

// Declare four variables, one for each device
var light;
var temperature;
var speaker;
var buttons;

var frequency = 1000;

function startTest() {
    light = dm.getByDeviceIdentifier(271);
    temperature = dm.getByDeviceIdentifier(216);
    speaker = dm.getByDeviceIdentifier(242);
    buttons = dm.getByDeviceIdentifier(230);

    light.blink(0, 255, 100, 100);



    //beepWithFrequency();

    function done() {
        console.log("Beep ended");
    }

    buttons.registerListener(buttonChanged);
    buttons.bothOn();

    speaker.beep(1000, 6000);


    setTimeout(() => {
        light.off();
        buttons.bothOff();
    }, 10000);
}

function buttonChanged(valueObj) {
    console.dir(valueObj); 


}

function temperatureChanged(valueObj) {
    console.dir(valueObj);
}

function beepOff() {
    speaker.beep(0, 0);
}

function handleError(error) {
    console.error(error);
}