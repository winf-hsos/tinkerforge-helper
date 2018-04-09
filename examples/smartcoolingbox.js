var { DeviceManager } = require('../lib/DeviceManager.js');
var log4js = require('log4js');

// Get the loggers
var logger = log4js.getLogger();

// Get the device manager to access the sensors etc.
var dm = new DeviceManager('192.168.178.27', 4223);
dm.initialize().then(startSmartCoolingBox).catch(handleError);

// Create global variables to hold on to devices
var temperatureHumiditySensor, accelerometer, lightSensor, rgbButton, rgbLight, nfcReader, oledDisplay;

/* This is where the smart cooling box starts */
function startSmartCoolingBox() {
    logger.info("Start sensor experiment...");

    // Get a hold to the devices and store objects in variables
    temperatureHumiditySensor = dm.getByDeviceIdentifier(283);
    accelerometer = dm.getByDeviceIdentifier(250);
    lightSensor = dm.getByDeviceIdentifier(259);
    rgbButton = dm.getByDeviceIdentifier(282);
    rgbLight = dm.getByDeviceIdentifier(271);
    nfcReader = dm.getByDeviceIdentifier(286);
    oledDisplay = dm.getByDeviceIdentifier(263);


    //temperatureHumiditySensor.registerListener(temperatureHumidityChanged);
    //accelerometer.registerListener(accelerationChanged);
    //lightSensor.registerListener(lightChanged);
    //rgbButton.setColor(255, 0, 0);
    rgbButton.registerListener(buttonChanged);
    rgbButton.white();

    //rgbLight.setColor(0, 255, 0);
    oledDisplay.write(0, 0, "Smart Cooling Box V0.1");

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

function temperatureHumidityChanged(valueObject) {
    if (valueObject.value.type == "humidity") {
        console.log(valueObject);
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