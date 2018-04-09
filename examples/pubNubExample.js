var { PubNubConnector } = require('../lib/pubNubConnector/PubNubConnector.js');
var { DeviceManager } = require('../lib/DeviceManager.js');

var dm = new DeviceManager();
var pubnub = new PubNubConnector('pub-c-da11d0a7-08c7-421b-81bb-850fc4e390a1', 'sub-c-efadf9a2-cfcb-11e7-9f31-2ae01b29664a');

/* Initialize Device Manager and PubNub.
 * Call function start() when both are finished */
Promise.all([dm.initialize(), pubnub.initialize()]).then(start);

/* This function executes the example */
function start() {

    console.log("Started...");
    var temperatureSensor = dm.get("zta");
    temperatureSensor.setCallbackInterval(60000);
    temperatureSensor.registerListener(handleTemperatureValue);

    var co2Sensor = dm.get("CVW");
    co2Sensor.setCallbackInterval(60000);
    co2Sensor.registerListener(handleCo2Value);
/*
    var lightSensor = dm.get("yBJ");
    lightSensor.setCallbackInterval(1000);
    lightSensor.registerListener(handleLightValue);

    var barometerSensor = dm.get("vNL");
    barometerSensor.setCallbackInterval(10000);
    barometerSensor.registerListener(handleAirPressureValue);

    var tiltSensor = dm.get("pv8");
    tiltSensor.device.enableTiltStateCallback();
    tiltSensor.registerListener(handleTilt);
    */
}

/* If a new air pressure value is reported from the sensor
 * this function is called */
function handleAirPressureValue(value) {
    // We want to publish the new value to PubNub
    pubnub.publish(value.value, "air_pressure_channel");
}

/* If a new temperature is reported from the sensor
 * this function is called */
function handleTemperatureValue(value) {
    // We want to publish the new value to PubNub
    pubnub.publish(value.value, "temperature_channel");
}

/* If a new light value is reported from the sensor
 * this function is called */
function handleLightValue(value) {
    // We want to publish the new value to PubNub
    pubnub.publish(value.value, "light_channel");
}

/* If a new CO2 value is reported from the sensor
 * this function is called */
function handleCo2Value(value) {
    // We want to publish the new value to PubNub
    pubnub.publish(value.value, "co2_channel");

}

/* If any changes to the tilt sensor occur
 * this function is called with the current state:
 * 0 = Closed, 1 = Open, 2 = Vibrating
*/
function handleTilt(state) {

    console.log("Tilt changed");

    // If tilt indicates vibration
    if (state.value == 2) {
        var alert = { alert: "Warning: Device is moving!" };
        pubnub.publish(alert, "alert_channel");
    }

    // If tilt indicates it is open
    if (state.value == 1) {
        var alert = { alert: "Warning: Device is upside down!" };
        pubnub.publish(alert, "alert_channel");
    }
}
