var { PubNubConnector } = require('../lib/pubNubConnector/PubNubConnector.js');
var { DeviceManager } = require('../lib/DeviceManager.js');

var dm = new DeviceManager();
var pubnub = new PubNubConnector();

/* Initialize Device Manager and PubNub.
 * Call function start() when both are finished */
Promise.all([dm.initialize(), pubnub.initialize()]).then(start);

/* This function executes the example */
function start() {

    console.log("Started...");
    var temperatureSensor = dm.get("zta");
    temperatureSensor.setCallbackInterval(5000);
    temperatureSensor.registerListener(handleTemperatureValue);

    var co2Sensor = dm.get("CVW");
    co2Sensor.setCallbackInterval(4000);
    co2Sensor.registerListener(handleCo2Value);

    var lightSensor = dm.get("yBJ");
    lightSensor.setCallbackInterval(1000);
    lightSensor.registerListener(handleLightValue);

    var barometerSensor = dm.get("vNL");
    barometerSensor.setCallbackInterval(10000);
    barometerSensor.registerListener(handleAirPressureValue);

    var tiltSensor = dm.get("pv8");
    tiltSensor.registerListener(handleTilt);
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
