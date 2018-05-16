var log4js = require('log4js');
var logger = log4js.getLogger();

exports.log = function(message) {
    logger.info(message);
}

exports.warn = function(message) {
    logger.warn(message);
}

exports.error = function(message) {
    logger.error(message);
}

/* DEVICES */
exports.button = {};
exports.display = {};
exports.nfc = {};
exports.poti = {};

/* WORKSTATION */
exports.workstation = {};

exports.inputQueue = {};
exports.outputQueue = {};
exports.processingQueue = {};

/* GAME */
exports.time = 0.0;
exports.gameId = -1;
