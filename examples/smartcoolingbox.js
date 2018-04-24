var { DeviceManager } = require('../lib/DeviceManager.js');
var { SmartCoolingBoxPubNubWrapper } = require('../lib/pubNubConnector/SmartCoolingBoxPubNubWrapper.js');

var log4js = require('log4js');

// Get the loggers
var logger = log4js.getLogger();

// Get the device manager to access the sensors etc.
var dm = new DeviceManager('localhost', 4223);
var pubnub = new SmartCoolingBoxPubNubWrapper('pub-c-da11d0a7-08c7-421b-81bb-850fc4e390a1', 'sub-c-efadf9a2-cfcb-11e7-9f31-2ae01b29664a');

Promise.all([
    dm.initialize(),
    pubnub.initialize()]).then(startSmartCoolingBox).catch(handleError);

// Create global variables to hold on to devices
var temperatureHumiditySensor, accelerometer, lightSensor, rgbButton, rgbLight, nfcReader, oledDisplay;

/* The ID of this box, set accordingly */
var boxId = 5;

/* We keep track of what items are in the box with a Map */
var items = new Map();

/* This is where the smart cooling box starts */
function startSmartCoolingBox() {
    logger.info("Start smart cooling box...");

    // Get a hold to the devices and store objects in variables
    temperatureHumiditySensor = dm.getByDeviceIdentifier(283);
    accelerometer = dm.getByDeviceIdentifier(250);
    lightSensor = dm.getByDeviceIdentifier(259);
    rgbButton = dm.getByDeviceIdentifier(282);
    rgbLight = dm.getByDeviceIdentifier(271);
    nfcReader = dm.getByDeviceIdentifier(286);
    oledDisplay = dm.getByDeviceIdentifier(263);

    temperatureHumiditySensor.registerListener(temperatureHumidityChanged);
    accelerometer.registerListener(accelerationChanged);
    lightSensor.registerListener(lightChanged);
    rgbButton.registerListener(buttonChanged);

    //rgbButton.setColor(255, 0, 0);
    //rgbButton.white();

    //rgbLight.setColor(0, 255, 0);

    // nfcReader.scan(productScanned);
    // nfcReader.setIdle();

    oledDisplay.write(0, 0, "Smart Cooling Box V0.1");

    /*
    oledDisplay.clearLine(3);
    oledDisplay.clearDisplay();
    */
}

function productScanned(valueObject) {

    // Get the informatio about the scanned item
    var productColor = valueObject.type;
    var productId = valueObject.id;

    // Write the ID to the display
    var colorText = productColor == 1 ? "GREEN" : productColor == 2 ? "BLUE" : "RED";
    oledDisplay.write(2, 0, "Scanned item: " + productId + " (" + colorText + ")  ");
}

function temperatureHumidityChanged(valueObject) {

    /* Take only temperature into account for now */
    if (valueObject.value.type == "temperature") {

    }
}

function accelerationChanged(valueObject) {
    var thresholdInG = 1200;
    var accelerationInG = Math.max(Math.abs(valueObject.value.x), Math.abs(valueObject.value.y), Math.abs(valueObject.value.z));
}

function lightChanged(valueObject) {

}

function buttonChanged(valueObject) {

    /* Button was pressed */
    if (valueObject.value == "RELEASED") {
    }
}


function handleError(err) {
    logger.error(err);
}