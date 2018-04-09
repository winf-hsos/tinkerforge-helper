var { DeviceManager } = require('../lib/DeviceManager.js');
var log4js = require('log4js');

// Get the logger
var logger = log4js.getLogger();

// Get the device manager to access the sensors etc.
var dm = new DeviceManager();
dm.initialize().then(startTemplate).catch(handleError);


/* This is where the action begins... */
function startTemplate() {
    logger.info("Starting template...");
}

/* This is called when an error occurs */
function handleError(err) {
    console.error(err);
}