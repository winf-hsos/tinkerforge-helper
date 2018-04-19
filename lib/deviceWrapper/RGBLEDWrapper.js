var tinkerforge = require('tinkerforge');
var { Wrapper } = require('./Wrapper.js');

class RGBLEDWrapper extends Wrapper {

    constructor(device, uid, deviceIdentifier) {
        super(device, uid, deviceIdentifier);
    }

    setColor(r, g, b) {
        this.stopBlink();
        return this.device.setRGBValue(r, g, b);
    }

    off() {
        this.stopBlink();
        return this.device.setRGBValue(0, 0, 0);
    }

    blink(r, g, b, speed = 500) {
        this.blinkStatus = 0;
        this.blinkInterval = setInterval(() => {

            if (this.blinkStatus == 0) {
                this.device.setRGBValue(0, 0, 0);
                this.blinkStatus = 1;
            }
            else { this.device.setRGBValue(r, g, b); this.blinkStatus = 0; }
        }, speed);
    }

    stopBlink() {
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
        }
    }

    white() {
        return this.setColor(255, 255, 255);
    }

}

exports.RGBLEDWrapper = RGBLEDWrapper;