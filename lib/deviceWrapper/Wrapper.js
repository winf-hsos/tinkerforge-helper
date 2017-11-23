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
            var valueObj = {
                uid: this.uid,
                deviceIdentifier: this.deviceIdentifier,
                time: moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss:SSS'),
                value: value
            };

            this.listener.forEach((listener) => {
                listener(valueObj);
            });

            this.logger.forEach((logger) => {
                logger.info(this._formatValue(valueObj));
            });
        }
    }

    _formatValue(valueObj) {
        var time = moment(new Date().getTime());
        var logEntry = valueObj.time + ";" + valueObj.uid + ";" + valueObj.deviceIdentifier + ";" + valueObj.value;
        return logEntry;
    }

}

exports.Wrapper = Wrapper;