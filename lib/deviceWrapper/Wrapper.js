var moment = require('moment');

class Wrapper {
    constructor(device, uid, deviceIdentifier) {
        //console.log(uid + "/" + deviceIdentifier);

        this.device = device;
        this.uid = uid;
        this.deviceIdentifier = deviceIdentifier;

        this.listener = [];
        this.logger = [];
    }

    getUID() {
        return new Promise((resolve, reject) => {
            this.device.getIdentity((uid, connectedUid, position, hardwareVersion, firmwareVersion, deviceIdentifier) => {
                resolve(uid);
            });
        })
    }

    getDeviceIdentifier() {
        return new Promise((resolve, reject) => {
            this.device.getIdentity((uid, connectedUid, position, hardwareVersion, firmwareVersion, deviceIdentifier) => {
                resolve(deviceIdentifier);
            });
        })
    }

    registerLogger(logger) {
        this.logger.push(logger);
    }

    registerListener(callback) {
        this.listener.push(callback);
    }

    removeListener(callback) {
        var deleteIndex = -1;
        this.listener.forEach((listener, index) => {
            if (listener === callback)
                deleteIndex = index;
        });

        this.listener.splice(deleteIndex, 1);
    }

    valueChanged(value, err) {
        if (err)
            console.log(err)
        else {
            this.listener.forEach((listener) => {
                listener(value);
            });

            this.logger.forEach((logger) => {
                logger.info(this._formatValue(value));
            });
        }
    }

    _formatValue(value) {
        var time = moment(new Date().getTime());
        var logEntry = time.format('YYYY-MM-DD HH:mm:ss') + ";" + this.uid + ";" + this.deviceIdentifier + ";" + value;
        return logEntry;
    }

}

exports.Wrapper = Wrapper;