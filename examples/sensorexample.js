var { DeviceManager } = require('../lib/DeviceManager.js');

var dm = new DeviceManager();
dm.initialize().then(startExperiment).catch(handleError);


function startExperiment() {
    console.log("Start sensor experiment...");
}

function handleError(err) {
    console.error(err);
}