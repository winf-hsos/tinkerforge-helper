var { PubNubConnector } = require('../lib/pubNubConnector/PubNubConnector.js');
var { DeviceManager } = require('../lib/DeviceManager.js');

var dm = new DeviceManager();

// Replace your keys here
var pubnub = new PubNubConnector('', '');


/* Initialize Device Manager and PubNub.
 * Call function start() when both are finished */
Promise.all([dm.initialize(), pubnub.initialize()]).then(start);

var led;

/* This function executes the example */
function start() {

    console.log("Started...");

    // 216 is Temperature Sensor
    var temperatureSensor = dm.getByDeviceIdentifier(216)
    temperatureSensor.setCallbackInterval(1000);
    temperatureSensor.registerListener(handleTemperatureValue);

    led = dm.getByDeviceIdentifier(271);

}

/* If a new temperature is reported from the sensor
 * this function is called */
function handleTemperatureValue(value) {

    console.log(value);

    // We want to publish the new value to PubNub
    pubnub.publish(value.value, "temperature_channel", function (status, response) {
        if (status.statusCode == 200) {
            // Blink green when a value is published
            led.device.setRGBValue(0, 255, 0);

        } else
            // Blink red when a problem occurs
            led.device.setRGBValue(255, 0, 0);

        setTimeout(() => {
            led.device.setRGBValue(0, 0, 0);
        }, 250);
    });
}