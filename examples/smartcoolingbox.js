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
    //accelerometer.registerListener(accelerationChanged);
    //lightSensor.registerListener(lightChanged);
    //rgbButton.setColor(255, 0, 0);
    rgbButton.registerListener(buttonChanged);
    rgbButton.white();

    //rgbLight.setColor(0, 255, 0);
    oledDisplay.write(0, 0, "Smart Cooling Box V0.1");

    /*
    setTimeout(() => { oledDisplay.clearLine(3); }, 3000);
    setTimeout(() => { oledDisplay.clearDisplay(); }, 5000);
    */
}

function productScanned(valueObject) {

    var productColor = valueObject.type;
    var productId = valueObject.id;

    logger.info("Product ID: " + productId + " | Product Type: " + (productColor == 1 ? "GREEN" : (productColor == 2 ? "BLUE" : "RED")));

    // Write the ID to the display
    oledDisplay.write(2, 0, "ID: " + productId + "    ");

    switch (productColor) {
        case '1':
            rgbLight.setColor(0, 255, 0);
            rgbButton.setColor(0, 255, 0);
            break;
        case '2':
            rgbLight.setColor(0, 0, 255);
            rgbButton.setColor(0, 0, 255);
            break;
        case '3':
            rgbLight.setColor(255, 0, 0);
            rgbButton.setColor(255, 0, 0);
            break;
    }

    nfcReader.setIdle();

    setTimeout(() => {
        rgbButton.white();
        rgbLight.off();
    }, 5000);
}

var temperatureExceededMode = false;
function temperatureHumidityChanged(valueObject) {

    if (valueObject.value.type == "temperature") {
        var temperature = valueObject.value.value / 100;
      

        if (temperature > 27.00) {
            if (!temperatureExceededMode) {
                temperatureExceededMode = true;
                console.log("Notify temperature exceeded: " + temperature);
                pubnub.notifyTemperatureExceeded(boxId, temperature);
            }
        }
        else {
            if (temperatureExceededMode) {
                temperatureExceededMode = false;
                console.log("Notify temperature normal again: " + temperature)
                pubnub.notifyTemperatureNormal(boxId, temperature);
            }
        }
    }
}

function accelerationChanged(valueObject) {
    var thresholdInG = 1200;
    var accelerationInG = Math.max(Math.abs(valueObject.value.x), Math.abs(valueObject.value.y), Math.abs(valueObject.value.z));

    if (accelerationInG > thresholdInG) {
        console.log("Concussion detected!: " + accelerationInG + " G");
    }
}

function lightChanged(valueObject) {
    console.log(valueObject);
}

function buttonChanged(valueObject) {

    if (valueObject.value == "RELEASED") {
        rgbButton.blink(255, 255, 255);
        nfcReader.scan(productScanned);
    }
}

function handleError(err) {
    logger.error(err);
}