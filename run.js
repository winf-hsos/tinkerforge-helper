var { DeviceManager } = require('./lib/DeviceManager.js');
var moment = require('moment');
var tinkerforge = require('tinkerforge');

// Get the loggers
var log4js = require('log4js');
var logger = log4js.getLogger();
var sensorsLogger = log4js.getLogger('sensors');

var { SQLServerConnector } = require('./lib/sqlConnector/SQLServerConnector.js');

var dm = new DeviceManager();
var sqlConnector = new SQLServerConnector();

var values = [];

/* Initialize Device Manager and start
 * when finished */
dm.initialize().then(start).catch(handleError);

function start() {

    var co2Sensor = dm.get("CVW");
    co2Sensor.setCallbackInterval(1000);
    //co2Sensor.registerLogger(sensorsLogger);
    co2Sensor.registerListener(newSensorValue);

    var temperatureSensor = dm.get("zta");
    temperatureSensor.setCallbackInterval(1000);
    //temperatureSensor.registerLogger(sensorsLogger);
    temperatureSensor.registerListener(newSensorValue);

    var barometerSensor = dm.get("vNL");
    barometerSensor.setCallbackInterval(1000);
    //barometerSensor.registerLogger(sensorsLogger);
    barometerSensor.registerListener(newSensorValue);

    var ambientLightSensor = dm.get("yBJ");
    ambientLightSensor.setCallbackInterval(1000);
    //ambientLightSensor.registerLogger(sensorsLogger);    
    ambientLightSensor.registerListener(newSensorValue);

    var uvLightSensor = dm.get("xnC");
    uvLightSensor.setCallbackInterval(1000);
    //uvLightSensor.registerLogger(sensorsLogger);
    uvLightSensor.registerListener(newSensorValue);


    sqlConnector.initialize().then(() => {

        setInterval(() => {
            logger.info("Inserting >" + values.length + "< new values...");
            sqlConnector.bulkInsertValues(values);
            values = [];
        }, 5000);

    });

    /*
   

    var ambientLightSensor = dm.get("yBJ");
    ambientLightSensor.setCallbackInterval(500);
    ambientLightSensor.registerLogger(sensorsLogger);

    var barometerSensor = dm.get("vNL");
    barometerSensor.setCallbackInterval(1000);
    barometerSensor.registerLogger(sensorsLogger);

    var uvLightSensor = dm.get("xnC");
    uvLightSensor.setCallbackInterval(1000);
    uvLightSensor.registerLogger(sensorsLogger);
    */

}

function newSensorValue(valueObj) {
    values.push(valueObj);
}

function handleError(err) {
    logger.error(err);
}