var chalk = require('chalk');

var consts = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success'
}

var log = function log(message, type = "info") {

    switch (type) {
        case consts.INFO:
            console.log(chalk.white(message));
            break;
        case consts.SUCCESS:
            console.log(chalk.green(message));
            break;
        default:
            console.log(chalk.white(message));
    }
}

exports.log = log;
exports.consts = consts;