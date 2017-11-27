var { DeviceManager } = require('../lib/DeviceManager.js');
var log4js = require('log4js');
var logger = log4js.getLogger();

var dm = new DeviceManager();

/* Initialize Device Manager and start
 * when finished */
dm.initialize().then(start).catch(handleError);

var led;
var oled;
var beeper;
var scale;
var temperature;
var humidity;

var previousDistanceValue;

function start() {

    // Get the sensor object from the Device Manager
    var distanceIRSensor = dm.get("xtX");
    distanceIRSensor.setCallbackInterval(250);
    distanceIRSensor.registerListener(newIRDistanceValue);

    led = dm.get("AU1");
    led.setRGBValue(0, 255, 0);

    oled = dm.get("BjN");
    beeper = dm.get("C88");

    scale = dm.get("B1U");
    scale.setCallbackInterval(200);
    scale.registerListener(newScaleValue);

    temperature = dm.get("zFJ");
    temperature.setCallbackInterval(500);
    temperature.registerListener(newTemperatureValue);

    humidity = dm.get("CdA");
    humidity.setCallbackInterval(500);
    humidity.registerListener(newHumidityValue);
}

function newTemperatureValue(valueObj) {
    console.log(valueObj.value);
    oled.writeLine(4, 0, "TEMPERATURE: " + valueObj.value / 100 + " C    ");
}

function newHumidityValue(valueObj) {
    oled.writeLine(6, 0, "LUFTFEUCHTIGK.: " + valueObj.value / 10 + " %    ");
}

function newScaleValue(valueObj) {
    console.log(valueObj.value);
    oled.writeLine(2, 0, "GEWICHT: " + valueObj.value + " g      ");
}

function newIRDistanceValue(valueObj) {

    /*
    console.log(valueObj.time);
    console.log(valueObj.value);
    */
    oled.writeLine(0, 0, 'FUELLSTAND: ' + valueObj.value / 10 + " cm   ");

    if (valueObj.value > 300) {
        led.setRGBValue(255, 0, 0);

        if (previousDistanceValue < 300)
            beeper.beep(1000, 2500);
    }
    else {
        if (previousDistanceValue > 300)
            beeper.beep(1000, 1000);

        led.setRGBValue(0, 255, 0);
    }

    previousDistanceValue = valueObj.value;
}

function handleError(err) {
    logger.error(err);
}