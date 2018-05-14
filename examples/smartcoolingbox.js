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

    nfcReader.scan(productScanned);
    // nfcReader.setIdle();

    oledDisplay.write(0, 0, "Smart Cooling Box V0.1");

    /*
    oledDisplay.clearLine(3);
    oledDisplay.clearDisplay();
    */
}

var items = new Map();

function productScanned(valueObject) {

    // Get the informatio about the scanned item
    var productColor = valueObject.type;
    var productId = valueObject.id;

    /* Check if this item is in the map */
    if (items.has(productId)) {
        // TAKEOUT
        // Remove item from box
        items.delete(productId);

        // Update counter on display
        var numItems = items.size;
        oledDisplay.clearLine(3);
        oledDisplay.write(3, 0, "Number items in box: " + numItems);

        // Notify cloud dashboard
        pubnub.notifyItemRemoved(boxId, productId, items.values());

        console.log("Item " + productId + " is already in the box.")
    }
    else {
        items.set(productId, { id: productId, type: productColor });

        // Update display
        var numItems = items.size;
        pubnub.notifyItemAdded(boxId, productId, items.values());
        oledDisplay.write(3, 0, "Number items in box: " + numItems);

        console.log("Item " + productId + " was put in the box.")
    }

    setTimeout(() => {
        nfcReader.scan(productScanned);
    }, 3000)

    // Write the ID to the display
    var colorText = productColor == 1 ? "GREEN" : productColor == 2 ? "BLUE" : "RED";
    oledDisplay.write(2, 0, "Scanned item: " + productId + " (" + colorText + ")  ");
}

var temperatureExceededMode = false;
var timeOfTemperatureThresholdExceeded = -1;
var timeSinceTemperatureThresholdExceeded = -1;

function temperatureHumidityChanged(valueObject) {

    /* Take only temperature into account for now */
    if (valueObject.value.type == "temperature") {

        var threshold = 700;
        var temperature = valueObject.value.value;

        //console.log("Temperature: " + temperature);

        if (temperature > threshold && items.size > 0) {

            // Memorize time of exceeding
            if (timeOfTemperatureThresholdExceeded == -1)
                timeOfTemperatureThresholdExceeded = new Date().getTime();

            timeSinceTemperatureThresholdExceeded = new Date().getTime() - timeOfTemperatureThresholdExceeded;

            if (temperatureExceededMode == false && timeSinceTemperatureThresholdExceeded >= 10000) {

                rgbLight.setColor(255, 0, 0);
                oledDisplay.write(4, 0, "Temperatur zu hoch!");
                console.log("Temperature too high for 10 seconds");
                pubnub.notifyTemperatureExceeded(boxId, temperature);
                temperatureExceededMode = true;
            }
        }
        else if (temperatureExceededMode) {
            // TODO: Kein Fehler
            timeOfTemperatureThresholdExceeded = -1;
            rgbLight.setColor(0, 255, 0);
            temperatureExceededMode = false;
            oledDisplay.clearLine(4);
            pubnub.notifyTemperatureNormal(boxId, temperature);
        }

    }
}

var concussionMode = false;

function accelerationChanged(valueObject) {
    var thresholdInG = 2000;
    var accelerationInG = Math.max(Math.abs(valueObject.value.x), Math.abs(valueObject.value.y), Math.abs(valueObject.value.z));

    //console.log("Current acceleration: " + accelerationInG);

    if (accelerationInG > thresholdInG) {
        console.log("Concussion detected above threshold: " + accelerationInG);

        if (concussionMode == false) {
            rgbButton.off();
            rgbButton.blink(255, 20, 147);
            pubnub.notifyConcussionDetected(boxId, accelerationInG);
            concussionMode = true;
        }

        oledDisplay.write(7, 0, "Concussion: " + accelerationInG / 1000 + "G");

    }
}

var lightExceededMode = false;
var timeOfThresholdExceeded = -1;
var timeSinceThresholdExceeded = -1;

function lightChanged(valueObject) {
    var thresholdLux = 10000;
    var lightchange = valueObject.value;

    //Reset LED & Clear display

    if (lightchange > thresholdLux && items.size > 0) {

        // Memorize time of exceeding
        if (timeOfThresholdExceeded == -1)
            timeOfThresholdExceeded = new Date().getTime();

        timeSinceThresholdExceeded = new Date().getTime() - timeOfThresholdExceeded;

        if (lightExceededMode == false && timeSinceThresholdExceeded >= 20000) {
            rgbLight.blink(255, 255, 255);
            oledDisplay.write(4, 0, "Lichteinfall! Bitte Box schliessen!");
            console.log("Too much light for 20 seconds!");
            pubnub.notifyLightExceeded(boxId, lightchange);
            lightExceededMode = true;
        }

    }
    else if (lightExceededMode) {
        // TODO: Kein Fehler
        timeOfThresholdExceeded = -1;
        rgbLight.off();
        lightExceededMode = false;
        oledDisplay.clearLine(4);
        pubnub.notifyLightNormal(boxId, lightchange);
    }
}

function buttonChanged(valueObject) {

    /* Button was pressed */
    if (valueObject.value == "RELEASED") {
        concussionMode = false;
        rgbButton.off();
        oledDisplay.clearLine(7);

    }
}


function handleError(err) {
    logger.error(err);
}