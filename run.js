var { DeviceManager } = require('./lib/DeviceManager.js');
var moment = require('moment');
var tinkerforge = require('tinkerforge');

// Get the loggers
var log4js = require('log4js');
var logger = log4js.getLogger();
var sensorsLogger = log4js.getLogger('sensors');

var dm = new DeviceManager();

/* Initialize Device Manager and start
 * when finished */
dm.initialize().then(start).catch(handleError);

function start() {

    var co2Sensor = dm.get("CVW");
    co2Sensor.setCallbackInterval(500);
    co2Sensor.registerLogger(sensorsLogger);
    co2Sensor.registerListener(co2Changed);

    var temperatureSensor = dm.get("zta");
    temperatureSensor.setCallbackInterval(500);
    temperatureSensor.registerLogger(sensorsLogger);

    var ambientLightSensor = dm.get("yBJ");
    ambientLightSensor.setCallbackInterval(500);
    ambientLightSensor.registerLogger(sensorsLogger);

    var barometerSensor = dm.get("vNL");
    barometerSensor.setCallbackInterval(1000);
    barometerSensor.registerLogger(sensorsLogger);

    var uvLightSensor = dm.get("xnC");
    uvLightSensor.setCallbackInterval(1000);
    uvLightSensor.registerLogger(sensorsLogger);

}

function co2Changed(co2) {
    console.log(co2);
}

function handleError(err) {
    logger.error(err);

}