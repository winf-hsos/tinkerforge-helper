var { DeviceManager } = require('./lib/DeviceManager.js');

var dm = new DeviceManager();

/* Initialize Device Manager and start
 * when finished */
dm.initialize().then(start);

function start() {

    var distanceIRBricklet = dm.get("xue");
    distanceIRBricklet.registerListener(distanceChangedIR);
    distanceIRBricklet.setCallbackInterval(200);

    var distanceUSBricklet = dm.get("zod");
    distanceUSBricklet.registerListener(distanceChangedUS);
    distanceUSBricklet.setCallbackInterval(200);
}

function distanceChangedIR(distance) {
    console.log("IR: " + distance / 10.0);
}

function distanceChangedUS(distance) {
    console.log("US : " + distance / 10.0);
}